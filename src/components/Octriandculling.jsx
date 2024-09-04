import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier";
import { Octree } from 'three/examples/jsm/math/Octree';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { openDB } from "idb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
import Stats from "stats.js";

function FBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controlsRef = useRef(null);
  const cumulativeBoundingBox = useRef(new THREE.Box3(
    new THREE.Vector3(Infinity, Infinity, Infinity),
    new THREE.Vector3(-Infinity, -Infinity, -Infinity)
  ));
  const [isVisible, setIsVisible] = useState(true);
  const [db, setDb] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const octreeRef = useRef(null);
  const capsuleRef = useRef(new Capsule(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 0.5));

  const highlightedBoundingBoxHelper = useRef(null);
  const statsRef = useRef(new Stats());

  useEffect(() => {
    const initDB = async () => {
      const database = await openDB("fbx-files-db", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("files")) {
            db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
          }
        },
      });
      await clearDatabase(database);
      setDb(database);
      await loadModelsFromDB(database);
    };

    initDB();

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setClearColor(0xd3d3d3);
    rendererRef.current.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(rendererRef.current.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.1;

    statsRef.current.showPanel(0);
    document.body.appendChild(statsRef.current.dom);
    statsRef.current.dom.classList.add("stats");

    window.addEventListener('resize', onWindowResize, false);
    rendererRef.current.domElement.addEventListener('mousemove', onMouseMove, false);

    animate();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      rendererRef.current.domElement.removeEventListener('mousemove', onMouseMove);
      mountRef.current.removeChild(rendererRef.current.domElement);
      controlsRef.current.dispose();
      document.body.removeChild(statsRef.current.dom);
    };
  }, []);

  useEffect(() => {
    console.log("Bounding Boxes:", boundingBoxes);
    identifyMeshesInCumulativeBoundingBox();
  }, [boundingBoxes]);

  const onWindowResize = () => {
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };

  const onMouseMove = (event) => {
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const clearDatabase = async (database) => {
    const tx = database.transaction("files", "readwrite");
    const store = tx.objectStore("files");
    await store.clear();
    await tx.done;
  };

  const loadModels = async (files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target.result;
        const arrayBuffer = result;

        if (db) {
          await db.put("files", { id: file.name, data: arrayBuffer });
          console.log(`Stored file: ${file.name}`);
          loadModelsFromDB(db);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const loadModelsFromDB = async (database) => {
    const tx = database.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const allFiles = await store.getAll();

    const loadModelBatch = async (startIndex, batchSize) => {
      for (let i = startIndex; i < Math.min(startIndex + batchSize, allFiles.length); i++) {
        const file = allFiles[i];
        await loadSingleModel(file);
      }
      if (startIndex + batchSize < allFiles.length) {
        setTimeout(() => loadModelBatch(startIndex + batchSize, batchSize), 100);
      } else {
        octreeRef.current = new Octree().fromGraphNode(sceneRef.current);
      }
    };

    loadModelBatch(0, 5); // Load 5 models at a time
  };

  const loadSingleModel = (file) => {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      const arrayBuffer = file.data;

      loader.load(
        URL.createObjectURL(new Blob([arrayBuffer])),
        (object) => {
          object.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: child.material.color,
                map: child.material.map,
              });
            }
          });

          const lod = createLOD(object);
          const boundingBox = new THREE.Box3().setFromObject(lod);
          cumulativeBoundingBox.current.union(boundingBox);
          sceneRef.current.add(lod);

          setBoundingBoxes((prev) => {
            const updatedBoundingBoxes = [...prev, boundingBox];
            createBoundingBoxCubes(updatedBoundingBoxes);
            return updatedBoundingBoxes;
          });

          resolve();
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
          reject(error);
        }
      );
    });
  };

  const createLOD = (object) => {
    const lod = new THREE.LOD();
    const modifier = new SimplifyModifier();

    const highDetailObject = object.clone();
    const mediumDetailObject = object.clone();
    const lowDetailObject = object.clone();

    mediumDetailObject.traverse((child) => {
      if (child.isMesh) {
        const count = Math.floor(child.geometry.attributes.position.count * 0.5);
        child.geometry = modifier.modify(child.geometry, count);
        child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      }
    });

    lowDetailObject.traverse((child) => {
      if (child.isMesh) {
        const count = Math.floor(child.geometry.attributes.position.count * 0.1);
        child.geometry = modifier.modify(child.geometry, count);
        child.material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
      }
    });

    lod.addLevel(highDetailObject, 0);
    lod.addLevel(mediumDetailObject, 50);
    lod.addLevel(lowDetailObject, 100);

    return lod;
  };

  const createBoundingBoxCubes = (updatedBoundingBoxes) => {
    updatedBoundingBoxes.forEach((boundingBox) => {
      const helper = new THREE.Box3Helper(boundingBox, 0x90ee90);
      sceneRef.current.add(helper);
    });

    const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
    const center = cumulativeBoundingBox.current.getCenter(new THREE.Vector3());

    const encompassingCube = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshStandardMaterial({
        color: 0x90ee90,
        wireframe: true,
      })
    );

    encompassingCube.position.copy(center);
    encompassingCube.name = "boundingBox";
    sceneRef.current.add(encompassingCube);
  };

  const identifyMeshesInCumulativeBoundingBox = () => {
    sceneRef.current.traverse((child) => {
      if (child.isMesh && child.name !== "boundingBox") {
        const childBoundingBox = new THREE.Box3().setFromObject(child);

        if (cumulativeBoundingBox.current.containsBox(childBoundingBox)) {
          console.log("Mesh within cumulative bounding box:", child);
        }
      }
    });
  };

  const animate = () => {
    requestAnimationFrame(animate);
    controlsRef.current.update();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    statsRef.current.update();
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    sceneRef.current.traverse((child) => {
      if (child.name !== "boundingBox") {
        child.visible = !isVisible;
      }
    });
  };
  const onFileChange = (event) => {
    cumulativeBoundingBox.current = new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    );
    setBoundingBoxes([]);
    loadModels(event.target.files);
  };

  return (
      <div className="canvas-container" style={{position:'relative',  overflow:'hidde'}}>
        <input
          className="button"
          type="file"
          multiple
          onChange={onFileChange}
          accept=".fbx" style={{position:'absolute'}}
        />
        <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
      </div>
     
  )
}
  export default FBXViewer;