import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { openDB } from "idb";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Custom Octree implementation
class Octree {
  constructor(center, size) {
    this.center = center;
    this.size = size;
    this.objects = [];
    this.children = null;
  }

  add(object) {
    if (!this.contains(object.position)) return false;

    if (this.children === null) {
      this.objects.push(object);
      if (this.objects.length > 8 && this.size > 2) {
        this.subdivide();
      }
    } else {
      for (let child of this.children) {
        if (child.add(object)) break;
      }
    }
    return true;
  }

  remove(object) {
    if (this.children === null) {
      const index = this.objects.indexOf(object);
      if (index !== -1) {
        this.objects.splice(index, 1);
        return true;
      }
    } else {
      for (let child of this.children) {
        if (child.remove(object)) return true;
      }
    }
    return false;
  }

  subdivide() {
    this.children = [];
    const newSize = this.size / 2;
    for (let i = 0; i < 8; i++) {
      const newCenter = new THREE.Vector3(
        this.center.x + (i & 1 ? newSize / 2 : -newSize / 2),
        this.center.y + (i & 2 ? newSize / 2 : -newSize / 2),
        this.center.z + (i & 4 ? newSize / 2 : -newSize / 2)
      );
      this.children.push(new Octree(newCenter, newSize));
    }

    for (let object of this.objects) {
      for (let child of this.children) {
        if (child.add(object)) break;
      }
    }
    this.objects = [];
  }

  contains(point) {
    return (
      Math.abs(point.x - this.center.x) <= this.size / 2 &&
      Math.abs(point.y - this.center.y) <= this.size / 2 &&
      Math.abs(point.z - this.center.z) <= this.size / 2
    );
  }

  intersectRay(ray, intersects = []) {
    if (!this.intersectsRay(ray)) return intersects;

    if (this.children === null) {
      for (let object of this.objects) {
        if (
          ray.intersectBox(new THREE.Box3().setFromObject(object), new THREE.Vector3())
        ) {
          intersects.push(object);
        }
      }
    } else {
      for (let child of this.children) {
        child.intersectRay(ray, intersects);
      }
    }
    return intersects;
  }

  intersectsRay(ray) {
    const bbox = new THREE.Box3().setFromCenterAndSize(
      this.center,
      new THREE.Vector3(this.size, this.size, this.size)
    );
    return ray.intersectsBox(bbox);
  }
}
function FBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(
    new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  );
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const [db, setDb] = useState(null);
  const loadedMeshesRef = useRef([]);
  const controlsRef = useRef(null);
  const frustumRef = useRef(new THREE.Frustum());
  const frustumMatrixRef = useRef(new THREE.Matrix4());
  const raycaster = new THREE.Raycaster();
  const octreeRef = useRef(null);
  const [flySpeed, setFlySpeed] = useState(1);
  const [flyRotationSpeed, setFlyRotationSpeed] = useState(1);
  const [workers, setWorkers] = useState({
    priority1: null,
    priority2: null,
    priority3: null,
    priority4: null,
  });

  const meshQueues = useRef({
    priority1: [],
    priority2: [],
    priority3: [],
    unloaded: [],
  });

  useEffect(() => {
    // Initialize DB
    const initDB = async () => {
      const database = await openDB("fbx-files-db", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("files")) {
            db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
          }
        },
      });
      setDb(database);
    };
    initDB();

    // Renderer setup
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setClearColor(0xff0000);
    mountRef.current.appendChild(rendererRef.current.domElement);

    // Camera and scene setup
    cameraRef.current.position.z = 5;
    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    // controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    // controlsRef.current.enableDamping = true; // for smooth orbiting
    // controlsRef.current.dampingFactor = 0.05;
    // controlsRef.current.screenSpacePanning = false;
    // controlsRef.current.maxPolarAngle = Math.PI / 2;

    // Initialize Octree
    octreeRef.current = new Octree(new THREE.Vector3(0, 0, 0), 40);

    // Start animation loop
    animate();

    // Cleanup on component unmount
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize Workers
    const newWorkers = {
      priority1: new Worker(new URL("./modelLoader.worker.js", import.meta.url), {
        type: "module",
      }),
      priority2: new Worker(new URL("./modelLoader.worker.js", import.meta.url), {
        type: "module",
      }),
      priority3: new Worker(new URL("./modelLoader.worker.js", import.meta.url), {
        type: "module",
      }),
      priority4: new Worker(new URL("./modelLoader.worker.js", import.meta.url), {
        type: "module",
      }),
    };

    setWorkers(newWorkers);

    // Handle worker messages
    Object.entries(newWorkers).forEach(([priority, worker]) => {
      worker.onmessage = (e) => handleWorkerMessage(e, priority);
    });

    return () => {
      // Cleanup workers on component unmount
      Object.values(newWorkers).forEach((worker) => worker.terminate());
    };
  }, []);

  const handleWorkerMessage = (e, priority) => {
    const { type, data } = e.data;
    if (type === "meshLoaded") {
      const mesh = loadedMeshesRef.current.find((m) => m.userData.customID === data.id);
      if (mesh) {
        mesh.visible = true;
        updateMeshPriority(mesh);
        processQueues();
      }
    }
  };

  const updateMeshPriority = (mesh) => {
    const distance = mesh.position.distanceTo(cameraRef.current.position);
    let newPriority;

    if (distance < 2) newPriority = "priority1";
    else if (distance < 100) newPriority = "priority2";
    else newPriority = "unloaded";

    // Move mesh to appropriate queue
    Object.entries(meshQueues.current).forEach(([priority, queue]) => {
      const index = queue.findIndex((m) => m.userData.customID === mesh.userData.customID);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    });

    meshQueues.current[newPriority].push(mesh);
  };

  const loadModel = async (file) => {
    const loader = new FBXLoader();
    const reader = new FileReader();

    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;

      if (db) {
        await db.put("files", { id: file.name, data: arrayBuffer });
        console.log(`Stored file: ${file.name}`);
        loadModelFromDB(file.name);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const loadModelFromDB = async (fileName) => {
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const file = await store.get(fileName);

    if (file) {
      const loader = new FBXLoader();
      const arrayBuffer = file.data;

      loader.load(
        URL.createObjectURL(new Blob([arrayBuffer])),
        (object) => {
          removeTexturesFromMaterials(object);
          object.traverse((child) => {
            if (child.isMesh) {
              child.visible = false;
              child.userData.customID = THREE.MathUtils.generateUUID();
              loadedMeshesRef.current.push(child);
              meshQueues.current.unloaded.push(child);
              octreeRef.current.add(child);
            }
          });
          updateMeshPriorities();
          sceneRef.current.add(object);
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }
  };

  const removeTexturesFromMaterials = (object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            material.map = null;
            material.needsUpdate = true;
          });
        } else {
          child.material.map = null;
          child.needsUpdate = true;
        }
      }
    });
  };

  const updateMeshPriorities = () => {
    loadedMeshesRef.current.forEach((mesh) => updateMeshPriority(mesh));
  };

  const performOcclusionCulling = () => {
    // Update the frustum
    frustumMatrixRef.current.multiplyMatrices(
      cameraRef.current.projectionMatrix,
      cameraRef.current.matrixWorldInverse
    );
    frustumRef.current.setFromProjectionMatrix(frustumMatrixRef.current);
  
    loadedMeshesRef.current.forEach((mesh) => {
      // Initially hide the mesh
      mesh.visible = false;
  
      // Check if the mesh's bounding box intersects the camera's frustum
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      if (frustumRef.current.intersectsBox(boundingBox)) {
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // Cast a ray from the camera to the center of the bounding box
        raycaster.set(cameraRef.current.position, center.sub(cameraRef.current.position).normalize());
  
        const intersects = raycaster.intersectObject(mesh);
  
        // Check if the ray actually hits this mesh first
        if (intersects.length > 0 && intersects[0].object === mesh) {
          mesh.visible = true;
        }
      }
    });
  };
  
  

  const animate = () => {
    requestAnimationFrame(animate);
    // if (controlsRef.current) {
    //   controlsRef.current.update();
    // }
  
    performOcclusionCulling();

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const processQueues = () => {
    const { priority1, priority2, priority3, unloaded } = meshQueues.current;

    if (priority1.length > 0) workers.priority1.postMessage(priority1.shift());
    else if (priority2.length > 0) workers.priority2.postMessage(priority2.shift());
    else if (priority3.length > 0) workers.priority3.postMessage(priority3.shift());
    else if (unloaded.length > 0) workers.priority4.postMessage(unloaded.shift());
  };
let loadedFilesCount =0;
  const handleFiles = (files) => {
    const fbxLoader = new FBXLoader();
    const cumulativeBox = new THREE.Box3();
    for (const file of files) {
      console.log(loadedFilesCount);
      fbxLoader.load(URL.createObjectURL(file), (object) => {
        const box = new THREE.Box3().setFromObject(object);

        // Update cumulative bounding box
        if (cumulativeBox.isEmpty()) {
          cumulativeBox.copy(box);
        } else {
          cumulativeBox.union(box);
        }

        loadedFilesCount++;
        // Update progress

        // After all files are loaded, log the final cumulative bounding box
        if (loadedFilesCount === files.length) {
          console.log(files.length)
          console.log(cumulativeBox)
          const center = cumulativeBox.getCenter(new THREE.Vector3());
          const size = cumulativeBox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.5; // Zoom out a little so object fits in view

          cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
          cameraRef.current.lookAt(center);
          // controlsRef.current.target.copy(center);
          // controlsRef.current.update();
        }
      })
      loadModel(file);
    }
  };

  return (
    <div>
      <div ref={mountRef}></div>
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={flySpeed}
        onChange={(e) => setFlySpeed(Number(e.target.value))}
      />
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.1"
        value={flyRotationSpeed}
        onChange={(e) => setFlyRotationSpeed(Number(e.target.value))}
      />
      <input
        type="file"
        accept=".fbx"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />
    </div>
  );
}

export default FBXViewer;
