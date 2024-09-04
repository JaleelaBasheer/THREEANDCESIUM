// /* eslint-disable no-restricted-globals */
// // fbxWorker.js

// self.onmessage = async (event) => {
//     const { type, file, dbName, storeName } = event.data;
  
//     if (type === "processFile") {
//       const reader = new FileReader();
  
//       reader.onload = async (e) => {
//         const arrayBuffer = e.target.result;
  
//         // Open IndexedDB and store the file
//         const openRequest = indexedDB.open(dbName, 1);
  
//         openRequest.onupgradeneeded = (event) => {
//           const db = event.target.result;
//           if (!db.objectStoreNames.contains(storeName)) {
//             db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
//           }
//         };
  
//         openRequest.onsuccess = (event) => {
//           const db = event.target.result;
//           const tx = db.transaction(storeName, "readwrite");
//           const store = tx.objectStore(storeName);
  
//           store.put({ id: file.name, data: arrayBuffer });
  
//           tx.oncomplete = () => {
//             self.postMessage({ type: "fileStored", fileName: file.name });
//           };
  
//           tx.onerror = (error) => {
//             self.postMessage({ type: "error", error });
//           };
//         };
  
//         openRequest.onerror = (error) => {
//           self.postMessage({ type: "error", error });
//         };
//       };
  
//       reader.readAsArrayBuffer(file);
//     }
//   };

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Octree } from 'three/examples/jsm/math/Octree';

const ThreeBoxes = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000));
  const rendererRef = useRef(new THREE.WebGLRenderer());
  const controlsRef = useRef(null);
  const smallBoxesRef = useRef([]);
  const octreeRef = useRef(new Octree());

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    // Renderer setup
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Camera setup
    camera.position.set(5000, 5000, 5000);
    camera.lookAt(0, 0, 0);

    // Controls setup
    controlsRef.current = new OrbitControls(camera, renderer.domElement);

    // Generate small boxes
    generateBoxes(scene, octreeRef.current, 400, 0xff0000, 1000, 0, 400); // Red boxes in 0-400m depth
    generateBoxes(scene, octreeRef.current, 1000, 0x00ff00, 2000, 400, 1000); // Green boxes in 400-1000m depth
    generateBoxes(scene, octreeRef.current, 10000, 0x0000ff, 5000, 1000, 10000); // Blue boxes in 1000-10000m depth

    // Handle window resize
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controlsRef.current.update();
      updateSceneBasedOnFrustum(camera, scene, octreeRef.current, smallBoxesRef.current);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const generateBoxes = (scene, octree, depth, color, count, minDepth, maxDepth) => {
    const smallBoxes = [];
    for (let i = 0; i < count; i++) {
      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(boxGeometry, material);

      // Randomly position boxes within the depth range
      mesh.position.set(
        Math.random() * 10000 - 5000, // Center around 0
        Math.random() * 10000 - 5000, // Center around 0
        Math.random() * (maxDepth - minDepth) + minDepth
      );

      smallBoxes.push(mesh);
      scene.add(mesh);
      octree.add(mesh); // Add to Octree
    }
    smallBoxesRef.current = [...smallBoxesRef.current, ...smallBoxes];
  };

  const updateSceneBasedOnFrustum = (camera, scene, octree, smallBoxes) => {
    const frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    smallBoxes.forEach((box) => {
      if (frustum.intersectsObject(box)) {
        const depth = box.position.z;
        if (depth >= 0 && depth <= 400) {
          box.visible = true; // Priority 1
        } else if (depth > 400 && depth <= 1000) {
          box.visible = true; // Priority 2
        } else if (depth > 1000) {
          box.visible = true; // Priority 3
        }
      } else {
        box.visible = false; // Unload if outside frustum
      }
    });

    // Optional: Update Octree for more efficient spatial management
    const objectsInFrustum = octree.search(camera.position, camera.far, true);
    objectsInFrustum.forEach((object) => {
      if (object.object.visible) {
        // Perform occlusion check (if you implement occlusion logic)
        // object.object.visible = false if occluded
      }
    });
  };

  return <div ref={mountRef} />;
};

export default ThreeBoxes;
