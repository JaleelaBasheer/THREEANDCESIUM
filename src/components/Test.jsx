// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { openDB } from "idb";
// import "./App.css";

// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );
//   const rendererRef = useRef(null);
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );
//   const [isVisible, setIsVisible] = useState(true);
//   const [db, setDb] = useState(null);
//   const [boundingBoxes, setBoundingBoxes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loadingProgress, setLoadingProgress] = useState(0);
//   const [contextLost, setContextLost] = useState(false);

//   const raycasterRef = useRef(new THREE.Raycaster());
//   const mouseRef = useRef(new THREE.Vector2());

//   const highlightedBoundingBoxHelper = useRef(null);

//   useEffect(() => {
//     const initDB = async () => {
//       try {
//         const database = await openDB("fbx-files-db", 1, {
//           upgrade(db) {
//             if (!db.objectStoreNames.contains("files")) {
//               db.createObjectStore("files", {
//                 keyPath: "id",
//                 autoIncrement: true,
//               });
//             }
//           },
//         });
//         await clearDatabase(database);
//         setDb(database);
//       } catch (error) {
//         console.error("Failed to open or initialize database:", error);
//       }
//     };

//     initDB();

//     rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Handle WebGL context loss
//     rendererRef.current.domElement.addEventListener(
//       "webglcontextlost",
//       handleContextLost,
//       false
//     );
//     rendererRef.current.domElement.addEventListener(
//       "webglcontextrestored",
//       handleContextRestored,
//       false
//     );

//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       rendererRef.current.domElement.removeEventListener(
//         "webglcontextlost",
//         handleContextLost
//       );
//       rendererRef.current.domElement.removeEventListener(
//         "webglcontextrestored",
//         handleContextRestored
//       );
//     };
//   }, []);

//   useEffect(() => {
//     if (db) {
//       loadModelsFromDB(db);
//     }
//   }, [db]);

//   useEffect(() => {
//     console.log("Bounding Boxes:", boundingBoxes);
//     identifyMeshesInCumulativeBoundingBox();
//   }, [boundingBoxes]);

//   const clearDatabase = async (database) => {
//     const tx = database.transaction("files", "readwrite");
//     const store = tx.objectStore("files");
//     await store.clear();
//     await tx.done;
//   };

//   const loadModels = async (files) => {
//     setIsLoading(true);
//     setLoadingProgress(0);

//     const totalFiles = files.length;
//     let loadedFiles = 0;

//     for (const file of files) {
//       const reader = new FileReader();
//       reader.onload = async (event) => {
//         const arrayBuffer = event.target.result;
//         if (db) {
//           await db.put("files", { id: file.name, data: arrayBuffer });
//           console.log(`Stored file: ${file.name}`);
//           loadedFiles++;
//           setLoadingProgress((loadedFiles / totalFiles) * 100);
//           if (loadedFiles === totalFiles) {
//             await loadModelsFromDB(db);
//           }
//         }
//       };
//       reader.readAsArrayBuffer(file);
//     }
//   };

//   const handleContextLost = (event) => {
//     event.preventDefault();
//     setContextLost(true);
//     console.error("WebGL context lost. Try reloading the page.");
//   };

//   const handleContextRestored = () => {
//     setContextLost(false);
//     console.log("WebGL context restored. Reinitializing the scene...");
//     initScene();
//   };

//   const initScene = () => {
//     // Reinitialize your scene, camera, lights, etc.
//     sceneRef.current = new THREE.Scene();
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);
//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     if (db) {
//       loadModelsFromDB(db);
//     }
//   };

//   const loadModelsFromDB = async (database) => {
//     if (!database) {
//       console.error("Database is not initialized.");
//       return;
//     }

//     setIsLoading(true);
//     const loader = new FBXLoader();
//     const tx = database.transaction("files", "readonly");
//     const store = tx.objectStore("files");
//     const allFiles = await store.getAll();

//     let loadedCount = 0;
//     const totalCount = allFiles.length;

//     for (const file of allFiles) {
//       await new Promise((resolve) => {
//         loader.load(
//           URL.createObjectURL(new Blob([file.data])),
//           (object) => {
//             if (object && typeof object.traverse === "function") {
//               console.log("Loaded object:", object);
//               try {
//                 optimizeObject(object);
//                 sceneRef.current.add(object);
//               } catch (error) {
//                 console.error("Error optimizing object:", error);
//               }
//             } else {
//               console.error("Loaded object is invalid:", object);
//             }
//             loadedCount++;
//             setLoadingProgress((loadedCount / totalCount) * 100);
//             resolve();
//           },
//           (xhr) => {
//             console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
//           },
//           (error) => {
//             console.error("Error loading model:", error);
//             resolve();
//           }
//         );
//       });

//       // Give the main thread a break every 5 objects
//       if (loadedCount % 5 === 0) {
//         await new Promise((resolve) => setTimeout(resolve, 0));
//       }
//     }

//     setIsLoading(false);
//     adjustCamera();
//   };

//   const optimizeObject = (object) => {
//     if (!object || typeof object.traverse !== "function") {
//       console.error("Invalid object passed to optimizeObject:", object);
//       return;
//     }

//     object.traverse((child) => {
//       if (child.isMesh) {
//         // Use efficient materials
//         child.material = new THREE.MeshPhongMaterial({
//           color: child.material ? child.material.color : 0xcccccc,
//           map: child.material ? child.material.map : null,
//         });

//         // Enable frustum culling
//         child.frustumCulled = true;

//         // Implement basic LOD
//         if (
//           child.geometry &&
//           child.geometry.attributes.position &&
//           child.geometry.attributes.position.count > 10000
//         ) {
//           const lod = new THREE.LOD();
//           lod.addLevel(child, 0);
//           lod.addLevel(createSimplifiedMesh(child, 0.5), 50);
//           lod.addLevel(createSimplifiedMesh(child, 0.25), 100);
//           object.add(lod);
//           object.remove(child);
//         }
//       }
//     });

//     const boundingBox = new THREE.Box3().setFromObject(object);
//     cumulativeBoundingBox.current.union(boundingBox);
//     setBoundingBoxes((prev) => [...prev, boundingBox]);
//   };

//   const createSimplifiedMesh = (originalMesh, simplificationFactor) => {
//     if (
//       !originalMesh ||
//       !originalMesh.geometry ||
//       !originalMesh.geometry.attributes.position
//     ) {
//       console.error("Invalid mesh passed to createSimplifiedMesh:", originalMesh);
//       return originalMesh;
//     }

//     const geometry = originalMesh.geometry.clone();
//     const positionAttribute = geometry.attributes.position;
//     const vertices = positionAttribute.array;

//     for (let i = 0; i < vertices.length; i += 3) {
//       if (Math.random() > simplificationFactor) {
//         vertices[i] = vertices[i + 1] = vertices[i + 2] = 0;
//       }
//     }

//     geometry.attributes.position.needsUpdate = true;
//     return new THREE.Mesh(geometry, originalMesh.material);
//   };

//   const createBoundingBoxCubes = (updatedBoundingBoxes) => {
//     updatedBoundingBoxes.forEach((boundingBox) => {
//       const helper = new THREE.Box3Helper(boundingBox, 0x90ee90);
//       sceneRef.current.add(helper);
//     });

//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const center = cumulativeBoundingBox.current.getCenter(new THREE.Vector3());

//     const encompassingCube = new THREE.Mesh(
//       new THREE.BoxGeometry(size.x, size.y, size.z),
//       new THREE.MeshBasicMaterial({
//         color: 0x90ee90,
//         wireframe: true,
//       })
//     );

//     encompassingCube.position.copy(center);
//     sceneRef.current.add(encompassingCube);

//     const subBoxes = subdivideBoundingBox(cumulativeBoundingBox.current, 4);
//     subBoxes.forEach((box) => {
//       const helper = new THREE.Box3Helper(box, 0x90ee90);
//       sceneRef.current.add(helper);
//     });
//   };

//   const subdivideBoundingBox = (box, divisions) => {
//     const subBoxes = [];
//     const size = box.getSize(new THREE.Vector3());
//     const step = size.divideScalar(divisions);

//     for (let i = 0; i < divisions; i++) {
//       for (let j = 0; j < divisions; j++) {
//         for (let k = 0; k < divisions; k++) {
//           const min = new THREE.Vector3(
//             box.min.x + i * step.x,
//             box.min.y + j * step.y,
//             box.min.z + k * step.z
//           );
//           const max = new THREE.Vector3(
//             box.min.x + (i + 1) * step.x,
//             box.min.y + (j + 1) * step.y,
//             box.min.z + (k + 1) * step.z
//           );
//           subBoxes.push(new THREE.Box3(min, max));
//         }
//       }
//     }
//     return subBoxes;
//   };

//   const identifyMeshesInCumulativeBoundingBox = () => {
//     const meshesInBoundingBox = [];
//     sceneRef.current.traverse((object) => {
//       if (object.isMesh) {
//         const boundingBox = new THREE.Box3().setFromObject(object);
//         if (cumulativeBoundingBox.current.intersectsBox(boundingBox)) {
//           meshesInBoundingBox.push(object);
//         }
//       }
//     });
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const onFileChange = (event) => {
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
//     setBoundingBoxes([]);
//     loadModels(event.target.files);
//   };

//   const animate = () => {
//     if (!contextLost) {
//       requestAnimationFrame(animate);
//       if (isVisible) {
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//         performRaycasting();
//       }
//     }
//   };

//   const performRaycasting = () => {
//     raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

//     const intersects = raycasterRef.current.intersectObjects(
//       sceneRef.current.children,
//       true
//     );

//     if (intersects.length > 0) {
//       const intersect = intersects[0];
//       const hitMesh = intersect.object;

//       const boundingBox = new THREE.Box3().setFromObject(hitMesh);
//       console.log("Hit mesh details:", hitMesh);
//       console.log("Bounding box:", boundingBox);

//       highlightBoundingBoxHelper(boundingBox);
//     }
//   };

//   const highlightBoundingBoxHelper = (boundingBox) => {
//     if (highlightedBoundingBoxHelper.current) {
//       highlightedBoundingBoxHelper.current.material.color.set(0x90ee90);
//     }

//     const helper = sceneRef.current.children.find(
//       (child) => child.isBox3Helper && child.box.equals(boundingBox)
//     );

//     if (helper) {
//       helper.material.color.set(0xff0000);
//       highlightedBoundingBoxHelper.current = helper;
//     }
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>
//       {isLoading && (
//         <div className="loading-overlay">
//           <progress value={loadingProgress} max="100"></progress>
//           <p>{Math.round(loadingProgress)}% loaded</p>
//         </div>
//       )}
//       {contextLost && (
//         <div className="error-overlay">
//           <p>WebGL context lost. Please try reloading the page.</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FBXViewer;





     
// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { openDB } from "idb";
// import "./App.css";

// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );
//   const rendererRef = useRef(null);
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );
//   // In your initial scene setup
//   sceneRef.current.background = new THREE.Color(0xd3d3d3); // Light gray background
//   const [isVisible, setIsVisible] = useState(true);
//   const [db, setDb] = useState(null);
//   const [boundingBoxes, setBoundingBoxes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loadingProgress, setLoadingProgress] = useState(0);
//   const [contextLost, setContextLost] = useState(false);

//   const raycasterRef = useRef(new THREE.Raycaster());
//   const mouseRef = useRef(new THREE.Vector2());

//   const highlightedBoundingBoxHelper = useRef(null);

//   useEffect(() => {
//     const initDB = async () => {
//       try {
//         const database = await openDB("fbx-files-db", 1, {
//           upgrade(db) {
//             if (!db.objectStoreNames.contains("files")) {
//               db.createObjectStore("files", {
//                 keyPath: "id",
//                 autoIncrement: true,
//               });
//             }
//           },
//         });
//         await clearDatabase(database);
//         setDb(database);
//       } catch (error) {
//         console.error("Failed to open or initialize database:", error);
//       }
//     };

//     initDB();

//     rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     rendererRef.current.domElement.addEventListener(
//       "webglcontextlost",
//       handleContextLost,
//       false
//     );
//     rendererRef.current.domElement.addEventListener(
//       "webglcontextrestored",
//       handleContextRestored,
//       false
//     );

//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       rendererRef.current.domElement.removeEventListener(
//         "webglcontextlost",
//         handleContextLost
//       );
//       rendererRef.current.domElement.removeEventListener(
//         "webglcontextrestored",
//         handleContextRestored
//       );
//     };
//   }, []);

//   useEffect(() => {
//     if (db) {
//       loadModelsFromDB(db);
//     }
//   }, [db]);

//   useEffect(() => {
//     console.log("Bounding Boxes:", boundingBoxes);
//     identifyMeshesInCumulativeBoundingBox();
//   }, [boundingBoxes]);

//   const clearDatabase = async (database) => {
//     const tx = database.transaction("files", "readwrite");
//     const store = tx.objectStore("files");
//     await store.clear();
//     await tx.done;
//   };

//   const loadModels = async (files) => {
//     setIsLoading(true);
//     setLoadingProgress(0);

//     const totalFiles = files.length;
//     let loadedFiles = 0;

//     for (const file of files) {
//       const reader = new FileReader();
//       reader.onload = async (event) => {
//         const arrayBuffer = event.target.result;
//         if (db) {
//           await db.put("files", { id: file.name, data: arrayBuffer });
//           console.log(`Stored file: ${file.name}`);
//           loadedFiles++;
//           setLoadingProgress((loadedFiles / totalFiles) * 100);
//           if (loadedFiles === totalFiles) {
//             await loadModelsFromDB(db);
//           }
//         }
//       };
//       reader.readAsArrayBuffer(file);
//     }
//   };

//   const handleContextLost = (event) => {
//     event.preventDefault();
//     setContextLost(true);
//     console.error("WebGL context lost. Try reloading the page.");
//   };

//   const handleContextRestored = () => {
//     setContextLost(false);
//     console.log("WebGL context restored. Reinitializing the scene...");
//     initScene();
//   };

//   const initScene = () => {
//     sceneRef.current = new THREE.Scene();
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);
//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     if (db) {
//       loadModelsFromDB(db);
//     }
//   };

//   const loadModelsFromDB = async (database) => {
//     if (!database) {
//       console.error("Database is not initialized.");
//       return;
//     }

//     setIsLoading(true);
//     const loader = new FBXLoader();
//     const tx = database.transaction("files", "readonly");
//     const store = tx.objectStore("files");
//     const allFiles = await store.getAll();

//     const totalCount = allFiles.length;
//     let loadedCount = 0;
//     const chunkSize = 5; // Adjust this value based on your needs

//     const loadChunk = async (startIndex) => {
//       const endIndex = Math.min(startIndex + chunkSize, totalCount);
      
//       for (let i = startIndex; i < endIndex; i++) {
//         const file = allFiles[i];
//         await new Promise((resolve) => {
//           loader.load(
//             URL.createObjectURL(new Blob([file.data])),
//             (object) => {
//               if (object && typeof object.traverse === "function") {
//                 console.log("Loaded object:", object);
//                 try {
//                   optimizeObject(object);
//                   sceneRef.current.add(object);
//                 } catch (error) {
//                   console.error("Error optimizing object:", error);
//                 }
//               } else {
//                 console.error("Loaded object is invalid:", object);
//               }
//               loadedCount++;
//               setLoadingProgress((loadedCount / totalCount) * 100);
//               resolve();
//             },
//             (xhr) => {
//               console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
//             },
//             (error) => {
//               console.error("Error loading model:", error);
//               resolve();
//             }
//           );
//         });
//       }

//       // If there are more files to load, schedule the next chunk
//       if (endIndex < totalCount) {
//         setTimeout(() => loadChunk(endIndex), 100); // Add a small delay between chunks
//       } else {
//         setIsLoading(false);
//         adjustCamera();
//       }
//     };

//     // Start loading the first chunk
//     loadChunk(0);
//   };

//   const optimizeObject = (object) => {
//     if (!object || typeof object.traverse !== "function") {
//       console.error("Invalid object passed to optimizeObject:", object);
//       return;
//     }

//     object.traverse((child) => {
//       if (child.isMesh) {
//         // Use efficient materials
//         child.material = new THREE.MeshPhongMaterial({
//           color: child.material ? child.material.color : 0xcccccc,
//           map: child.material ? child.material.map : null,
//         });

//         // Enable frustum culling
//         child.frustumCulled = true;

//         // Implement LOD (Level of Detail)
//         if (child.geometry && child.geometry.attributes.position) {
//           const vertexCount = child.geometry.attributes.position.count;
//           if (vertexCount > 10000) {
//             const lod = new THREE.LOD();

//             // Original high-detail mesh
//             lod.addLevel(child, 0);

//             // Medium detail
//             const mediumDetailMesh = createSimplifiedMesh(child, 0.5);
//             lod.addLevel(mediumDetailMesh, 50);

//             // Low detail
//             const lowDetailMesh = createSimplifiedMesh(child, 0.25);
//             lod.addLevel(lowDetailMesh, 100);

//             // Replace the original mesh with the LOD object
//             object.add(lod);
//             object.remove(child);
//           }
//         }

//         // Optimize geometry
//         if (child.geometry) {
//           child.geometry.computeBoundingSphere();
//           child.geometry.computeBoundingBox();
//         }
//       }
//     });

//     // Compute bounding box for the entire object
//     const boundingBox = new THREE.Box3().setFromObject(object);
//     cumulativeBoundingBox.current.union(boundingBox);
//     setBoundingBoxes((prev) => [...prev, boundingBox]);
//   };

//   const createSimplifiedMesh = (originalMesh, simplificationFactor) => {
//     if (!originalMesh || !originalMesh.geometry || !originalMesh.geometry.attributes.position) {
//       console.error("Invalid mesh passed to createSimplifiedMesh:", originalMesh);
//       return originalMesh;
//     }

//     const geometry = originalMesh.geometry.clone();
//     const positionAttribute = geometry.attributes.position;
//     const vertices = positionAttribute.array;

//     for (let i = 0; i < vertices.length; i += 3) {
//       if (Math.random() > simplificationFactor) {
//         vertices[i] = vertices[i + 1] = vertices[i + 2] = 0;
//       }
//     }

//     geometry.attributes.position.needsUpdate = true;
//     return new THREE.Mesh(geometry, originalMesh.material);
//   };

//   const createBoundingBoxCubes = (updatedBoundingBoxes) => {
//     updatedBoundingBoxes.forEach((boundingBox) => {
//       const helper = new THREE.Box3Helper(boundingBox, 0x90ee90);
//       sceneRef.current.add(helper);
//     });

//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const center = cumulativeBoundingBox.current.getCenter(new THREE.Vector3());

//     const encompassingCube = new THREE.Mesh(
//       new THREE.BoxGeometry(size.x, size.y, size.z),
//       new THREE.MeshBasicMaterial({
//         color: 0x90ee90,
//         wireframe: true,
//       })
//     );

//     encompassingCube.position.copy(center);
//     sceneRef.current.add(encompassingCube);

//     const subBoxes = subdivideBoundingBox(cumulativeBoundingBox.current, 4);
//     subBoxes.forEach((box) => {
//       const helper = new THREE.Box3Helper(box, 0x90ee90);
//       sceneRef.current.add(helper);
//     });
//   };

//   const subdivideBoundingBox = (box, divisions) => {
//     const subBoxes = [];
//     const size = box.getSize(new THREE.Vector3());
//     const step = size.divideScalar(divisions);

//     for (let i = 0; i < divisions; i++) {
//       for (let j = 0; j < divisions; j++) {
//         for (let k = 0; k < divisions; k++) {
//           const min = new THREE.Vector3(
//             box.min.x + i * step.x,
//             box.min.y + j * step.y,
//             box.min.z + k * step.z
//           );
//           const max = new THREE.Vector3(
//             box.min.x + (i + 1) * step.x,
//             box.min.y + (j + 1) * step.y,
//             box.min.z + (k + 1) * step.z
//           );
//           subBoxes.push(new THREE.Box3(min, max));
//         }
//       }
//     }
//     return subBoxes;
//   };

//   const identifyMeshesInCumulativeBoundingBox = () => {
//     const meshesInBoundingBox = [];
//     sceneRef.current.traverse((object) => {
//       if (object.isMesh) {
//         const boundingBox = new THREE.Box3().setFromObject(object);
//         if (cumulativeBoundingBox.current.intersectsBox(boundingBox)) {
//           meshesInBoundingBox.push(object);
//         }
//       }
//     });
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const onFileChange = (event) => {
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
//     setBoundingBoxes([]);
//     loadModels(event.target.files);
//   };

//   const animate = () => {
//     if (!contextLost) {
//       requestAnimationFrame(animate);
//       if (isVisible) {
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//         performRaycasting();
//       }
//     }
//   };

//   const performRaycasting = () => {
//     raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

//     const intersects = raycasterRef.current.intersectObjects(
//       sceneRef.current.children,
//       true
//     );

//     if (intersects.length > 0) {
//       const intersect = intersects[0];
//       const hitMesh = intersect.object;

//       const boundingBox = new THREE.Box3().setFromObject(hitMesh);
//       console.log("Hit mesh details:", hitMesh);
//       console.log("Bounding box:", boundingBox);

//       highlightBoundingBoxHelper(boundingBox);
//     }
//   };

//   const highlightBoundingBoxHelper = (boundingBox) => {
//     if (highlightedBoundingBoxHelper.current) {
//       highlightedBoundingBoxHelper.current.material.color.set(0x90ee90);
//     }

//     const helper = sceneRef.current.children.find(
//       (child) => child.isBox3Helper && child.box.equals(boundingBox)
//     );

//     if (helper) {
//       helper.material.color.set(0xff0000);
//       highlightedBoundingBoxHelper.current = helper;
//     }
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>
//       {isLoading && (
//         <div className="loading-overlay">
//           <progress value={loadingProgress} max="100"></progress>
//           <p>{Math.round(loadingProgress)}% loaded</p>
//         </div>
//       )}
//       {contextLost && (
//         <div className="error-overlay">
//           <p>WebGL context lost. Please try reloading the page.</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FBXViewer;




  


// 11-08-2024



// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { openDB } from "idb";
// import "./App.css";

// function FBXViewer() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(
//       75,
//       window.innerWidth / window.innerHeight,
//       0.1,
//       1000
//     )
//   );
//   const rendererRef = useRef(null);
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );
//   const [isVisible, setIsVisible] = useState(true);
//   const [db, setDb] = useState(null);
//   const [boundingBoxes, setBoundingBoxes] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loadingProgress, setLoadingProgress] = useState(0);
//   const [contextLost, setContextLost] = useState(false);

//   const raycasterRef = useRef(new THREE.Raycaster());
//   const mouseRef = useRef(new THREE.Vector2());

//   const highlightedBoundingBoxHelper = useRef(null);

//   const [workers, setWorkers] = useState([]);

//   useEffect(() => {
//     const initDB = async () => {
//       try {
//         const database = await openDB("fbx-files-db", 1, {
//           upgrade(db) {
//             if (!db.objectStoreNames.contains("files")) {
//               db.createObjectStore("files", {
//                 keyPath: "id",
//                 autoIncrement: true,
//               });
//             }
//           },
//         });
//         await clearDatabase(database);
//         setDb(database);
//       } catch (error) {
//         console.error("Failed to open or initialize database:", error);
//       }
//     };

//     initDB();

//     rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.setClearColor(0xd3d3d3);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     rendererRef.current.domElement.addEventListener(
//       "webglcontextlost",
//       handleContextLost,
//       false
//     );
//     rendererRef.current.domElement.addEventListener(
//       "webglcontextrestored",
//       handleContextRestored,
//       false
//     );

//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     // Set background color
//     sceneRef.current.background = new THREE.Color(0xd3d3d3);

//     // Initialize Web Workers
//     const workerCount = navigator.hardwareConcurrency || 4;
//     const newWorkers = Array(workerCount).fill().map(() => new Worker(new URL('./fbxLoader.worker.js', import.meta.url), { type: 'module' }));
//     setWorkers(newWorkers);

//     const handleResize = () => {
//       const width = window.innerWidth;
//       const height = window.innerHeight;
//       cameraRef.current.aspect = width / height;
//       cameraRef.current.updateProjectionMatrix();
//       rendererRef.current.setSize(width, height);
//     };

//     window.addEventListener("resize", handleResize);

//     animate();

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       rendererRef.current.domElement.removeEventListener(
//         "webglcontextlost",
//         handleContextLost
//       );
//       rendererRef.current.domElement.removeEventListener(
//         "webglcontextrestored",
//         handleContextRestored
//       );
//       newWorkers.forEach(worker => worker.terminate());
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     if (db) {
//       loadModelsFromDB(db);
//     }
//   }, [db, workers]);

//   useEffect(() => {
//     console.log("Bounding Boxes:", boundingBoxes);
//     identifyMeshesInCumulativeBoundingBox();
//   }, [boundingBoxes]);

//   const clearDatabase = async (database) => {
//     const tx = database.transaction("files", "readwrite");
//     const store = tx.objectStore("files");
//     await store.clear();
//     await tx.done;
//   };

//   const loadModels = async (files) => {
//     setIsLoading(true);
//     setLoadingProgress(0);

//     const totalFiles = files.length;
//     let loadedFiles = 0;

//     for (const file of files) {
//       const reader = new FileReader();
//       reader.onload = async (event) => {
//         const arrayBuffer = event.target.result;
//         if (db) {
//           await db.put("files", { id: file.name, data: arrayBuffer });
//           console.log(`Stored file: ${file.name}`);
//           loadedFiles++;
//           setLoadingProgress((loadedFiles / totalFiles) * 100);
//           if (loadedFiles === totalFiles) {
//             await loadModelsFromDB(db);
//           }
//         }
//       };
//       reader.readAsArrayBuffer(file);
//     }
//   };

//   const handleContextLost = (event) => {
//     event.preventDefault();
//     setContextLost(true);
//     console.error("WebGL context lost. Try reloading the page.");
//   };

//   const handleContextRestored = () => {
//     setContextLost(false);
//     console.log("WebGL context restored. Reinitializing the scene...");
//     initScene();
//   };

//   const initScene = () => {
//     sceneRef.current = new THREE.Scene();
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);
//     controlsRef.current = new OrbitControls(
//       cameraRef.current,
//       rendererRef.current.domElement
//     );
//     if (db) {
//       loadModelsFromDB(db);
//     }
//   };

//   const loadModelsFromDB = async (database) => {
//     if (!database) {
//       console.error("Database is not initialized.");
//       return;
//     }

//     setIsLoading(true);
//     const tx = database.transaction("files", "readonly");
//     const store = tx.objectStore("files");
//     const allFiles = await store.getAll();

//     const totalCount = allFiles.length;
//     let loadedCount = 0;

//     const loadFile = (file, workerIndex) => {
//       return new Promise((resolve) => {
//         const worker = workers[workerIndex];

//         worker.onmessage = (e) => {
//           const { type, object, progress, error, fileName } = e.data;

//           if (type === 'loaded') {
//             if (object) {
//               console.log("Loaded object:", object);
//               try {
//                 const reconstructedObject = reconstructObject(object);
//                 optimizeObject(reconstructedObject);
//                 sceneRef.current.add(reconstructedObject);
//               } catch (error) {
//                 console.error("Error optimizing object:", error);
//               }
//             } else {
//               console.error("Loaded object is invalid:", object);
//             }
//             loadedCount++;
//             setLoadingProgress((loadedCount / totalCount) * 100);
//             resolve();
//           } else if (type === 'progress') {
//             console.log(`${fileName}: ${progress.toFixed(2)}% loaded`);
//           } else if (type === 'error') {
//             console.error(`Error loading ${fileName}:`, error);
//             resolve();
//           }
//         };

//         worker.postMessage({ fileData: file.data, fileName: file.id });
//       });
//     };

//     const chunkSize = workers.length;
//     for (let i = 0; i < allFiles.length; i += chunkSize) {
//       const chunk = allFiles.slice(i, i + chunkSize);
//       await Promise.all(chunk.map((file, index) => loadFile(file, index % workers.length)));
//     }

//     setIsLoading(false);
//     adjustCamera();
//   };

//   function reconstructObject(simplifiedObject) {
//     let object;
  
//     if (simplifiedObject.type === 'Mesh') {
//       const geometry = new THREE.BufferGeometry();
      
//       if (simplifiedObject.geometry.attributes.position) {
//         geometry.setAttribute('position', new THREE.Float32BufferAttribute(simplifiedObject.geometry.attributes.position, 3));
//       } else {
//         console.warn("Position attribute is missing for object:", simplifiedObject.name);
//       }

//       if (simplifiedObject.geometry.attributes.normal) {
//         geometry.setAttribute('normal', new THREE.Float32BufferAttribute(simplifiedObject.geometry.attributes.normal, 3));
//       } else {
//         console.warn("Normal attribute is missing for object:", simplifiedObject.name);
//       }

//       if (simplifiedObject.geometry.attributes.uv) {
//         geometry.setAttribute('uv', new THREE.Float32BufferAttribute(simplifiedObject.geometry.attributes.uv, 2));
//       } else {
//         console.warn("UV attribute is missing for object:", simplifiedObject.name);
//       }

//       if (simplifiedObject.geometry.index) {
//         geometry.setIndex(simplifiedObject.geometry.index);
//       } else {
//         console.warn("Index is missing for object:", simplifiedObject.name);
//       }
  
//       const material = new THREE.MeshPhongMaterial({
//         color: simplifiedObject.material?.color || 0xffffff,
//         map: simplifiedObject.material?.map ? new THREE.TextureLoader().load(simplifiedObject.material.map) : null
//       });
  
//       object = new THREE.Mesh(geometry, material);
//     } else {
//       object = new THREE.Object3D();
//     }
  
//     object.name = simplifiedObject.name;
//     object.position.fromArray(simplifiedObject.position);
//     object.quaternion.fromArray(simplifiedObject.quaternion);
//     object.scale.fromArray(simplifiedObject.scale);
  
//     for (const childData of simplifiedObject.children || []) {
//       const child = reconstructObject(childData);
//       object.add(child);
//     }
  
//     return object;
//   }

//   const optimizeObject = (object) => {
//     if (!object || typeof object.traverse !== "function") {
//       console.error("Invalid object passed to optimizeObject:", object);
//       return;
//     }

//     object.traverse((child) => {
//       if (child.isMesh) {
//         // Enable frustum culling
//         child.frustumCulled = true;

//         // Implement LOD (Level of Detail)
//         if (child.geometry && child.geometry.attributes.position) {
//           const vertexCount = child.geometry.attributes.position.count;
//           if (vertexCount > 10000) {
//             const lod = new THREE.LOD();

//             // Original high-detail mesh
//             lod.addLevel(child, 0);

//             // Medium detail
//             const mediumDetailMesh = createSimplifiedMesh(child, 0.5);
//             lod.addLevel(mediumDetailMesh, 50);

//             // Low detail
//             const lowDetailMesh = createSimplifiedMesh(child, 0.25);
//             lod.addLevel(lowDetailMesh, 100);

//             // Replace the original mesh with the LOD object
//             object.add(lod);
//             object.remove(child);
//           }
//         }

//         // Optimize geometry
//         if (child.geometry) {
//           child.geometry.computeBoundingSphere();
//           child.geometry.computeBoundingBox();
//         }
//       }
//     });

//     // Compute bounding box for the entire object
//     const boundingBox = new THREE.Box3().setFromObject(object);
//     cumulativeBoundingBox.current.union(boundingBox);
//     setBoundingBoxes((prev) => [...prev, boundingBox]);
//   };

//   const createSimplifiedMesh = (originalMesh, simplificationFactor) => {
//     if (!originalMesh || !originalMesh.geometry || !originalMesh.geometry.attributes.position) {
//       console.error("Invalid mesh passed to createSimplifiedMesh:", originalMesh);
//       return originalMesh;
//     }

//     const geometry = originalMesh.geometry.clone();
//     const positionAttribute = geometry.attributes.position;
//     const vertices = positionAttribute.array;

//     for (let i = 0; i < vertices.length; i += 3) {
//       if (Math.random() > simplificationFactor) {
//         vertices[i] = vertices[i + 1] = vertices[i + 2] = 0;
//       }
//     }

//     geometry.attributes.position.needsUpdate = true;
//     return new THREE.Mesh(geometry, originalMesh.material);
//   };

//   const createBoundingBoxCubes = (updatedBoundingBoxes) => {
//     updatedBoundingBoxes.forEach((boundingBox) => {
//       const helper = new THREE.Box3Helper(boundingBox, 0x90ee90);
//       sceneRef.current.add(helper);
//     });

//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const center = cumulativeBoundingBox.current.getCenter(new THREE.Vector3());

//     const encompassingCube = new THREE.Mesh(
//       new THREE.BoxGeometry(size.x, size.y, size.z),
//       new THREE.MeshBasicMaterial({
//         color: 0x90ee90,
//         wireframe: true,
//       })
//     );

//     encompassingCube.position.copy(center);
//     sceneRef.current.add(encompassingCube);

//     const subBoxes = subdivideBoundingBox(cumulativeBoundingBox.current, 4);
//     subBoxes.forEach((box) => {
//       const helper = new THREE.Box3Helper(box, 0x90ee90);
//       sceneRef.current.add(helper);
//     });
//   };

//   const subdivideBoundingBox = (box, divisions) => {
//     const subBoxes = [];
//     const size = box.getSize(new THREE.Vector3());
//     const step = size.divideScalar(divisions);

//     for (let i = 0; i < divisions; i++) {
//       for (let j = 0; j < divisions; j++) {
//         for (let k = 0; k < divisions; k++) {
//           const min = new THREE.Vector3(
//             box.min.x + i * step.x,
//             box.min.y + j * step.y,
//             box.min.z + k * step.z
//           );
//           const max = new THREE.Vector3(
//             box.min.x + (i + 1) * step.x,
//             box.min.y + (j + 1) * step.y,
//             box.min.z + (k + 1) * step.z
//           );
//           subBoxes.push(new THREE.Box3(min, max));
//         }
//       }
//     }
//     return subBoxes;
//   };

//   const identifyMeshesInCumulativeBoundingBox = () => {
//     const meshesInBoundingBox = [];
//     sceneRef.current.traverse((object) => {
//       if (object.isMesh) {
//         const boundingBox = new THREE.Box3().setFromObject(object);
//         if (cumulativeBoundingBox.current.intersectsBox(boundingBox)) {
//           meshesInBoundingBox.push(object);
//         }
//       }
//     });
//   };

//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5;

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const onFileChange = (event) => {
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
//     setBoundingBoxes([]);
//     loadModels(event.target.files);
//   };

//   const animate = () => {
//     if (!contextLost) {
//       requestAnimationFrame(animate);
//       if (isVisible) {
//         controlsRef.current.update();
//         rendererRef.current.render(sceneRef.current, cameraRef.current);
//         performRaycasting();
//       }
//     }
//   };

//   const performRaycasting = () => {
//     raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

//     const intersects = raycasterRef.current.intersectObjects(
//       sceneRef.current.children,
//       true
//     );

//     if (intersects.length > 0) {
//       const intersect = intersects[0];
//       const hitMesh = intersect.object;

//       const boundingBox = new THREE.Box3().setFromObject(hitMesh);
//       console.log("Hit mesh details:", hitMesh);
//       console.log("Bounding box:", boundingBox);

//       highlightBoundingBoxHelper(boundingBox);
//     }
//   };

//   const highlightBoundingBoxHelper = (boundingBox) => {
//     if (highlightedBoundingBoxHelper.current) {
//       highlightedBoundingBoxHelper.current.material.color.set(0x90ee90);
//     }

//     const helper = sceneRef.current.children.find(
//       (child) => child.isBox3Helper && child.box.equals(boundingBox)
//     );

//     if (helper) {
//       helper.material.color.set(0xff0000);
//       highlightedBoundingBoxHelper.current = helper;
//     }
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>
//       {isLoading && (
//         <div className="loading-overlay">
//           <progress value={loadingProgress} max="100"></progress>
//           <p>{Math.round(loadingProgress)}% loaded</p>
//         </div>
//       )}
//       {contextLost && (
//         <div className="error-overlay">
//           <p>WebGL context lost. Please try reloading the page.</p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default FBXViewer;






import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { openDB } from "idb";

function FBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cumulativeBoundingBox = useRef(
    new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    )
  );
  const [isVisible, setIsVisible] = useState(true);
  const [db, setDb] = useState(null);
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const highlightedBoundingBoxHelper = useRef(null);

  const [workers, setWorkers] = useState([]);

  // Frame control variables
  const [lastRenderTime, setLastRenderTime] = useState(0);
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS; // milliseconds per frame

  // FPS tracking variables
  const [fps, setFps] = useState(0);
  const fpsInterval = useRef(null);

  useEffect(() => {

    const initDB = async () => {
      try {
        const database = await openDB("fbx-files-db", 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("files")) {
              db.createObjectStore("files", {
                keyPath: "id",
                autoIncrement: true,
              });
            }
          },
        });
        await clearDatabase(database);
        setDb(database);
      } catch (error) {
        console.error("Failed to open or initialize database:", error);
      }
    };

    initDB();

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setClearColor(0xd3d3d3);
    rendererRef.current.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(rendererRef.current.domElement);

    rendererRef.current.domElement.addEventListener(
      "webglcontextlost",
      handleContextLost,
      false
    );
    rendererRef.current.domElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false
    );

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.1;

    // Set background color
    sceneRef.current.background = new THREE.Color(0xd3d3d3);

    // Initialize Web Workers
    const workerCount = navigator.hardwareConcurrency || 4;
    const newWorkers = Array(workerCount)
      .fill()
      .map(
        () =>
          new Worker(new URL("./fbxLoader.worker.js", import.meta.url), {
            type: "module",
          })
      );
    setWorkers(newWorkers);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    animate();

    // Start FPS tracking
    fpsInterval.current = setInterval(() => {
      const fpsValue = (1000 / frameInterval) | 0;
      setFps(fpsValue);
    }, 1000);

    return () => {
      mountRef.current.removeChild(rendererRef.current.domElement);
      controlsRef.current.dispose();
      rendererRef.current.domElement.removeEventListener(
        "webglcontextlost",
        handleContextLost
      );
      rendererRef.current.domElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored
      );
      newWorkers.forEach((worker) => worker.terminate());
      window.removeEventListener("resize", handleResize);
      clearInterval(fpsInterval.current); // Clear FPS tracking interval
    };
  }, []);

  useEffect(() => {
    if (db) {
      loadModelsFromDB(db);
    }
  }, [db, workers]);

  useEffect(() => {
    console.log("Bounding Boxes:", boundingBoxes);
    identifyMeshesInCumulativeBoundingBox();
  }, [boundingBoxes]);

  const clearDatabase = async (database) => {
    const tx = database.transaction("files", "readwrite");
    const store = tx.objectStore("files");
    await store.clear();
    await tx.done;
  };

  const loadModels = async (files) => {
    setIsLoading(true);
    setLoadingProgress(0);

    const totalFiles = files.length;
    let loadedFiles = 0;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        if (db) {
          await db.put("files", { id: file.name, data: arrayBuffer });
          console.log(`Stored file: ${file.name}`);
          loadedFiles++;
          setLoadingProgress((loadedFiles / totalFiles) * 100);
          if (loadedFiles === totalFiles) {
            await loadModelsFromDB(db);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleContextLost = (event) => {
    event.preventDefault();
    setContextLost(true);
    console.error("WebGL context lost. Try reloading the page.");
  };

  const handleContextRestored = () => {
    setContextLost(false);
    console.log("WebGL context restored. Reinitializing the scene...");
    initScene();
  };

  const initScene = () => {
    sceneRef.current = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);
    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    if (db) {
      loadModelsFromDB(db);
    }
  };

  const loadModelsFromDB = async (database) => {
    if (!database) {
      console.error("Database is not initialized.");
      return;
    }

    setIsLoading(true);
    const tx = database.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const allFiles = await store.getAll();

    const totalCount = allFiles.length;
    let loadedCount = 0;

    const loadFile = (file, workerIndex) => {
      return new Promise((resolve) => {
        const worker = workers[workerIndex];

        worker.onmessage = (e) => {
          const { type, object, progress, error, fileName } = e.data;

          if (type === "loaded") {
            if (object) {
              console.log("Loaded object:", object);
              try {
                const reconstructedObject = reconstructObject(object);
                optimizeObject(reconstructedObject);
                sceneRef.current.add(reconstructedObject);
              } catch (error) {
                console.error("Error optimizing object:", error);
              }
            } else {
              console.error("Loaded object is invalid:", object);
            }
            loadedCount++;
            setLoadingProgress((loadedCount / totalCount) * 100);
            resolve();
          } else if (type === "progress") {
            console.log(`${fileName}: ${progress.toFixed(2)}% loaded`);
          } else if (type === "error") {
            console.error(`Error loading ${fileName}:`, error);
            resolve();
          }
        };

        worker.postMessage({ fileData: file.data, fileName: file.id });
      });
    };

    const chunkSize = workers.length;
    for (let i = 0; i < allFiles.length; i += chunkSize) {
      const chunk = allFiles.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((file, index) => loadFile(file, index % workers.length))
      );
    }

    setIsLoading(false);
    adjustCamera();
  };

  function reconstructObject(simplifiedObject) {
    let object;

    if (simplifiedObject.type === "Mesh") {
      const geometry = new THREE.BufferGeometry();

      if (simplifiedObject.geometry.attributes.position) {
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            simplifiedObject.geometry.attributes.position,
            3
          )
        );
      } else {
        console.warn(
          "Position attribute is missing for object:",
          simplifiedObject.name
        );
      }

      if (simplifiedObject.geometry.attributes.normal) {
        geometry.setAttribute(
          "normal",
          new THREE.Float32BufferAttribute(
            simplifiedObject.geometry.attributes.normal,
            3
          )
        );
      } else {
        console.warn(
          "Normal attribute is missing for object:",
          simplifiedObject.name
        );
      }

      if (simplifiedObject.geometry.attributes.uv) {
        geometry.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(
            simplifiedObject.geometry.attributes.uv,
            2
          )
        );
      } else {
        console.warn("UV attribute is missing for object:", simplifiedObject.name);
      }

      if (simplifiedObject.geometry.index) {
        geometry.setIndex(simplifiedObject.geometry.index);
      } else {
        console.warn("Index is missing for object:", simplifiedObject.name);
      }

      const material = new THREE.MeshPhongMaterial({
        color: simplifiedObject.material?.color || 0xffffff,
        map: simplifiedObject.material?.map
          ? new THREE.TextureLoader().load(simplifiedObject.material.map)
          : null,
      });

      object = new THREE.Mesh(geometry, material);
    } else {
      object = new THREE.Object3D();
    }

    object.name = simplifiedObject.name;
    object.position.fromArray(simplifiedObject.position);
    object.quaternion.fromArray(simplifiedObject.quaternion);
    object.scale.fromArray(simplifiedObject.scale);

    for (const childData of simplifiedObject.children || []) {
      const child = reconstructObject(childData);
      object.add(child);
    }

    return object;
  }

  const optimizeObject = (object) => {
    if (!object || typeof object.traverse !== "function") {
      console.error("Invalid object passed to optimizeObject:", object);
      return;
    }

    object.traverse((child) => {
      if (child.isMesh) {
        // Enable frustum culling
        child.frustumCulled = true;

        // Implement LOD (Level of Detail)
        if (child.geometry && child.geometry.attributes.position) {
          const vertexCount = child.geometry.attributes.position.count;
          if (vertexCount > 10000) {
            const lod = new THREE.LOD();

            // Original high-detail mesh
            lod.addLevel(child, 0);

            // Medium detail
            const mediumDetailMesh = createSimplifiedMesh(child, 0.5);
            lod.addLevel(mediumDetailMesh, 50);

            // Low detail
            const lowDetailMesh = createSimplifiedMesh(child, 0.25);
            lod.addLevel(lowDetailMesh, 100);

            // Replace the original mesh with the LOD object
            object.add(lod);
            object.remove(child);
          }
        }

        // Optimize geometry
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });

    // Compute bounding box for the entire object
    const boundingBox = new THREE.Box3().setFromObject(object);
    cumulativeBoundingBox.current.union(boundingBox);
    setBoundingBoxes((prev) => [...prev, boundingBox]);
  };

  const createSimplifiedMesh = (originalMesh, simplificationFactor) => {
    if (
      !originalMesh ||
      !originalMesh.geometry ||
      !originalMesh.geometry.attributes.position
    ) {
      console.error("Invalid mesh passed to createSimplifiedMesh:", originalMesh);
      return originalMesh;
    }

    const geometry = originalMesh.geometry.clone();
    const positionAttribute = geometry.attributes.position;
    const vertices = positionAttribute.array;

    for (let i = 0; i < vertices.length; i += 3) {
      if (Math.random() > simplificationFactor) {
        vertices[i] = vertices[i + 1] = vertices[i + 2] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    return new THREE.Mesh(geometry, originalMesh.material);
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
      new THREE.MeshBasicMaterial({
        color: 0x90ee90,
        wireframe: true,
      })
    );

    encompassingCube.position.copy(center);
    sceneRef.current.add(encompassingCube);

    const subBoxes = subdivideBoundingBox(cumulativeBoundingBox.current, 4);
    subBoxes.forEach((box) => {
      const helper = new THREE.Box3Helper(box, 0x90ee90);
      sceneRef.current.add(helper);
    });
  };

  const subdivideBoundingBox = (box, divisions) => {
    const subBoxes = [];
    const size = box.getSize(new THREE.Vector3());
    const step = size.divideScalar(divisions);

    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        for (let k = 0; k < divisions; k++) {
          const min = new THREE.Vector3(
            box.min.x + i * step.x,
            box.min.y + j * step.y,
            box.min.z + k * step.z
          );
          const max = new THREE.Vector3(
            box.min.x + (i + 1) * step.x,
            box.min.y + (j + 1) * step.y,
            box.min.z + (k + 1) * step.z
          );
          subBoxes.push(new THREE.Box3(min, max));
        }
      }
    }
    return subBoxes;
  };

  const identifyMeshesInCumulativeBoundingBox = () => {
    const meshesInBoundingBox = [];
    sceneRef.current.traverse((object) => {
      if (object.isMesh) {
        const boundingBox = new THREE.Box3().setFromObject(object);
        if (cumulativeBoundingBox.current.intersectsBox(boundingBox)) {
          meshesInBoundingBox.push(object);
        }
      }
    });
  };

  const adjustCamera = () => {
    const center = new THREE.Vector3();
    cumulativeBoundingBox.current.getCenter(center);
    const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
    const distance = size.length();
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = distance / (2 * Math.tan(fov / 2));
    cameraZ *= 2.5;

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const onFileChange = (event) => {
    cumulativeBoundingBox.current = new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    );
    setBoundingBoxes([]);
    loadModels(event.target.files);
  };

  const animate = (time) => {
    if (!contextLost) {
      requestAnimationFrame(animate);

      // Control the frame rate
      if (time - lastRenderTime >= frameInterval) {
        setLastRenderTime(time);
        if (isVisible) {
          controlsRef.current.update();
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          performRaycasting();
        }
      }
    }
  };

  const performRaycasting = () => {
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(
      sceneRef.current.children,
      true
    );

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const hitMesh = intersect.object;

      const boundingBox = new THREE.Box3().setFromObject(hitMesh);
      console.log("Hit mesh details:", hitMesh);
      console.log("Bounding box:", boundingBox);

      highlightBoundingBoxHelper(boundingBox);
    }
  };

  const highlightBoundingBoxHelper = (boundingBox) => {
    if (highlightedBoundingBoxHelper.current) {
      highlightedBoundingBoxHelper.current.material.color.set(0x90ee90);
    }

    const helper = sceneRef.current.children.find(
      (child) => child.isBox3Helper && child.box.equals(boundingBox)
    );

    if (helper) {
      helper.material.color.set(0xff0000);
      highlightedBoundingBoxHelper.current = helper;
    }
  };

  return (
    <div className="main">
      <div className="canvas-container">
        <input
          className="button"
          type="file"
          multiple
          onChange={onFileChange}
          accept=".fbx"
        />
        <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
        <div className="fps-counter">FPS: {fps}</div>
      </div>
      {isLoading && (
        <div className="loading-overlay">
          <progress value={loadingProgress} max="100"></progress>
          <p>{Math.round(loadingProgress)}% loaded</p>
        </div>
      )}
      {contextLost && (
        <div className="error-overlay">
          <p>WebGL context lost. Please try reloading the page.</p>
        </div>
      )}
    </div>
  );
}

export default FBXViewer;
