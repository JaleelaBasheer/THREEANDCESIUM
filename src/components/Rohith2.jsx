import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { openDB } from "idb";

function FBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controlsRef = useRef(null);
  const [db, setDb] = useState(null);
  const cumulativeBoundingBoxRef = useRef(new THREE.Box3());
  const loadedMeshesRef = useRef([]);
  const frustumRef = useRef(new THREE.Frustum());
  const frustumMatrixRef = useRef(new THREE.Matrix4());

  useEffect(() => {
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

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);
    // Set up camera
    cameraRef.current.position.set(0, 0, 5);
    cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.1;

    animate();

    return () => {
      mountRef.current.removeChild(rendererRef.current.domElement);
      controlsRef.current.dispose();
    };
  }, []);
  let fileCount = 0;
  let loadedFiles = 0;

  const loadModel = async (file) => {
    fileCount++;
    const loader = new FBXLoader();
    const reader = new FileReader();

    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;

      if (db) {
        await db.put("files", { id: file.name, data: arrayBuffer });
        console.log(`Stored file: ${file.name}`);
        loadModelFromDB(db, file.name);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const loadModelFromDB = async (database, fileName) => {
    const loader = new FBXLoader();
    const tx = database.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const file = await store.get(fileName);

    if (file) {
      const arrayBuffer = file.data;

      loader.load(
        URL.createObjectURL(new Blob([arrayBuffer])),
        (object) => {
          const lod = new THREE.LOD();

          // Low-quality version as wireframe, keeping original color
          const lowQualityMesh = object.clone();
          lowQualityMesh.traverse((child) => {
            if (child.isMesh) {
              const originalMaterial = child.material.clone();
              originalMaterial.wireframe = true;
              child.material = originalMaterial;
            }
          });
          lod.addLevel(lowQualityMesh, 50); // Display wireframe at a distance of 50 units

          // Medium-quality version (same geometry, reduced material quality)
          const mediumQualityMesh = object.clone();
          mediumQualityMesh.traverse((child) => {
            if (child.isMesh) {
              const originalMaterial = child.material.clone();
              originalMaterial.flatShading = true;
              child.material = originalMaterial;
            }
          });
          lod.addLevel(mediumQualityMesh, 25); // Display medium-quality at a distance of 25 units

          // High-quality version (original geometry and material)
          object.traverse((child) => {
            if (child.isMesh) {
              child.material = child.material.clone(); // Use original material for high-quality
              loadedMeshesRef.current.push(child);
            }
          });
          lod.addLevel(object, 10); // Display high-quality when close (within 10 units)

          sceneRef.current.add(lod);  // Add LOD object to the scene

          // updateCumulativeBoundingBox(lod);
          // adjustCamera(); // Adjust camera after loading each model
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }
    loadedFiles++;
    if (loadedFiles === fileCount) {
      console.log(fileCount);
      adjustCameraToAllObjects();
    }
  };
  const adjustCameraToAllObjects = () => {
    const box = new THREE.Box3().setFromObject(sceneRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
  
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;
  
    
    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    cameraRef.current.updateProjectionMatrix();
  };


  const updateCumulativeBoundingBox = (object) => {
    cumulativeBoundingBoxRef.current.expandByObject(object);
  };

  const adjustCamera = () => {
    const box = cumulativeBoundingBoxRef.current;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Zoom out a little so object fits in view

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.near = 0.1; // Near clipping plane
    cameraRef.current.far = cameraZ * 10; // Far clipping plane based on object size
    cameraRef.current.updateProjectionMatrix();

    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const updateVisibleMeshes = () => {
    frustumMatrixRef.current.multiplyMatrices(cameraRef.current.projectionMatrix, cameraRef.current.matrixWorldInverse);
    frustumRef.current.setFromProjectionMatrix(frustumMatrixRef.current);

    loadedMeshesRef.current.forEach((mesh) => {
      mesh.visible = frustumRef.current.intersectsObject(mesh);
    });
  };

  const onFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        loadModel(file);
      });
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    controlsRef.current.update();
    updateVisibleMeshes();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  return (
    <div className="main">
      <div className="canvas-container">
        <div className="btn"> <input className="button" type="file" multiple onChange={onFileChange} accept=".fbx" /></div>
       
        <div ref={mountRef} style={{ width: "100%", height: "100vh" }}></div>
      </div>
    </div>
  );
}

export default FBXViewer;