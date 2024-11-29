// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";
// import pako from "pako";

// function FbxToGltf() {
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

//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );

//   const [isVisible, setIsVisible] = useState(true);
//   const [fileSizes, setFileSizes] = useState([]);
//   const [saveDirectory, setSaveDirectory] = useState(null);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [convertedModels, setConvertedModels] = useState([]);
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);
//   const [boundingBoxData, setBoundingBoxData] = useState({
//     cumulativeBox: null,
//     center: null,
//     size: null,
//   });
//   const [progress, setProgress] = useState(0);
  
//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     // rendererRef.current.setClearColor(0xd3d3d3); // Light grey background color
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding; // Use sRGB encoding for correct color management
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     // Add lighting
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

//     const handleResize = () => {
//       const width = window.innerWidth;
//       const height = window.innerHeight;
//       rendererRef.current.setSize(width, height);
//       cameraRef.current.aspect = width / height;
//       cameraRef.current.updateProjectionMatrix();
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     rendererRef.current.setClearColor(backgroundColor);
//   }, [backgroundColor]);

//   const selectSaveDirectory = async () => {
//     try {
//       const dirHandle = await window.showDirectoryPicker();
//       setSaveDirectory(dirHandle);
//     } catch (err) {
//       console.error("Error selecting directory:", err);
//     }
//   };

  
//   const onFileChange = async (event) => {
//     const loader = new FBXLoader();
//     const files = Array.from(event.target.files);
    
//     const totalFiles = files.length;
//     let cumulativeBox = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );

//     for (const [index, file] of files.entries()) {
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });

//         // Compute bounding box for each file
//         const boundingBox = new THREE.Box3().setFromObject(fbxObject);
//         cumulativeBox.union(boundingBox); // Update cumulative bounding box
//       } catch (error) {
//         console.error("Error loading FBX file:", error);
//       }

//       // Update progress after each file is processed
//       const progressPercentage = Math.round(((index + 1) / totalFiles) * 100);
//       setProgress(progressPercentage);  // Update progress
//     }

//     // Calculate center and size of the cumulative bounding box
//     const center = cumulativeBox.getCenter(new THREE.Vector3());
//     const size = cumulativeBox.getSize(new THREE.Vector3());

//     // Store the data in the state
//     setBoundingBoxData({
//       cumulativeBox,
//       center,
//       size,
//     });
    
//     // Calculate camera distance
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 1.5; // Adjust multiplier to ensure all models are visible

//     // Update camera position and controls
//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();

//     // Reset progress after processing is done
//     setSelectedFiles(files);
//     setProgress(0);  // Reset progress bar after completion
//   };


//   const processModels = async () => {
//     const loader = new FBXLoader();
//     const objects = [];
//     const newFileSizes = [];
//     const newConvertedModels = [];
  
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
  
//     for (const file of selectedFiles) {
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });
  
//         // Remove colors, textures, and materials as before
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
//             if (child.geometry.attributes.color) child.geometry.deleteAttribute("color");
//             if (child.geometry.attributes.uv) child.geometry.deleteAttribute("uv");
//             if (child.geometry.attributes.normal) child.geometry.deleteAttribute("normal");
//           }
//         });
  
//         // Convert FBX to GLTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => resolve(JSON.stringify(result)),
//             { binary: false, includeCustomExtensions: false, forceIndices: true, truncateDrawRange: true },
//             (error) => reject(error)
//           );
//         });
  
//         // Compress the GLB data using pako
//         const glbCompressedData = pako.gzip(gltfData);

//         const glbGzipBlob = new Blob([glbCompressedData], { type: "application/gzip" });
  
//         // Add the GLTF object to the scene
//         await loadGzippedGLTF(glbGzipBlob);
  
//         const boundingBox = new THREE.Box3().setFromObject(fbxObject);
//         cumulativeBoundingBox.current.union(boundingBox);
  
//         newFileSizes.push({
//           name: file.name,
//           fbxSize: file.size,
//           gltfSize: glbGzipBlob.size,
//         });
  
//         newConvertedModels.push({
//           fileName: file.name.replace(".fbx", ".glb.gz"),
//           data: glbGzipBlob,
//         });
//       } catch (error) {
//         console.error("Error processing model:", error);
//       }
//     }
  
//     // adjustCamera();
//     setFileSizes(newFileSizes);
//     setConvertedModels(newConvertedModels);
//   };
  

//   const saveConvertedModels = async () => {
//     if (!saveDirectory) {
//       alert("Please select a save directory first.");
//       return;
//     }

//     if (convertedModels.length === 0) {
//       alert(
//         "No models have been processed yet. Please process models before saving."
//       );
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, {
//           create: true,
//         });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(
//       `Saving complete!\n${successCount} files saved successfully.\n${failCount} files failed to save.`
//     );
//   };
//   const loadGzippedGLTF = async (file) => {
//     const gltfLoader = new GLTFLoader();
  
//     try {
//       // Fetch the gzipped file
//       const response = await fetch(URL.createObjectURL(file));
//       const gzippedData = await response.arrayBuffer();
  
//       // Decompress the gzipped GLB data
//       const decompressedData = pako.ungzip(new Uint8Array(gzippedData));
//       console.log(decompressedData)
  
//       // Parse and load the GLTF model
//       gltfLoader.parse(
//         decompressedData.buffer,
//         "",
//         (gltf) => {
//           const gltfObject = gltf.scene;
//           sceneRef.current.add(gltfObject);
//           // adjustCamera();
//         },
//         (error) => {
//           console.error("Error loading gzipped GLB:", error);
//         }
//       );
//     } catch (error) {
//       console.error("Failed to load gzipped GLB:", error);
//     }
//   };
  
//   const adjustCamera = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {
//       // Only update controls and render if visible
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse(function (object) {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   const resetCameraView = () => {
//     const center = new THREE.Vector3();
//     cumulativeBoundingBox.current.getCenter(center);
//     const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
//     const distance = size.length();
//     const fov = cameraRef.current.fov * (Math.PI / 180);
//     let cameraZ = distance / (2 * Math.tan(fov / 2));
//     cameraZ *= 2.5; // Adjust to ensure all models are visible

//     cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
//     cameraRef.current.lookAt(center);
//     controlsRef.current.target.copy(center);
//     controlsRef.current.update();
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <button onClick={selectSaveDirectory}>Select Save Directory</button>
//         <input
//           className="button"
//           type="file"
//           multiple
//           onChange={onFileChange}
//           accept=".fbx"
//         />
//          {/* Progress Bar */}
//       {progress > 0 && (
//         <div style={{ margin: '10px 0', width: '100%', backgroundColor: '#e0e0e0' }}>
//           <div
//             style={{
//               width: `${progress}%`,
//               backgroundColor: '#76c7c0',
//               height: '10px',
//               transition: 'width 0.2s',
//             }}
//           ></div>
//         </div>
//       )}
//         <button onClick={processModels}>Process Models</button>
//         <button onClick={saveConvertedModels}>Save Converted Models</button>
//         <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
//       </div>

//       <div className="button-container">
//         <button
//           className="custom-button hide-show"
//           onClick={() => toggleVisibility(true)}
//         >
//           <FontAwesomeIcon icon={faEye} />
//         </button>
//         <button
//           className="custom-button"
//           onClick={() => toggleVisibility(false)}
//         >
//           <FontAwesomeIcon icon={faEyeSlash} />
//         </button>
//         <button className="custom-button fit-view" onClick={resetCameraView}>
//           <FontAwesomeIcon icon={faSearch} />
//         </button>
//         <input
//           type="color"
//           value={"#" + backgroundColor.toString(16).padStart(6, "0")}
//           onChange={(e) =>
//             setBackgroundColor(parseInt(e.target.value.slice(1), 16))
//           }
//         />
//       </div>

//       <div className="file-sizes">
//         {fileSizes.map((file, index) => (
//           <div key={index}>
//             <p>{file.name}</p>
//             <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
//             <p>glTF size: {(file.gltfSize / 1024 / 1024).toFixed(2)} MB</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FbxToGltf;

// ----------------------------------------------------
// import React, { useEffect, useRef, useState } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";

// function FbxToGltf() {
//   const mountRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(
//     new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
//   );
//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const controlsRef = useRef(null);
//   const cumulativeBoundingBox = useRef(
//     new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     )
//   );

//   const [isVisible, setIsVisible] = useState(true);
//   const [fileSizes, setFileSizes] = useState([]);
//   const [saveDirectory, setSaveDirectory] = useState(null);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [convertedModels, setConvertedModels] = useState([]);
//   const [backgroundColor, setBackgroundColor] = useState(0x000000);

//   useEffect(() => {
//     rendererRef.current.setSize(window.innerWidth, window.innerHeight);
//     rendererRef.current.outputEncoding = THREE.sRGBEncoding;
//     mountRef.current.appendChild(rendererRef.current.domElement);

//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     sceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 1, 0);
//     sceneRef.current.add(directionalLight);

//     controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
//     controlsRef.current.enableDamping = true;
//     controlsRef.current.dampingFactor = 0.1;

//     animate();

//     const handleResize = () => {
//       const width = window.innerWidth;
//       const height = window.innerHeight;
//       rendererRef.current.setSize(width, height);
//       cameraRef.current.aspect = width / height;
//       cameraRef.current.updateProjectionMatrix();
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       mountRef.current.removeChild(rendererRef.current.domElement);
//       controlsRef.current.dispose();
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   useEffect(() => {
//     rendererRef.current.setClearColor(backgroundColor);
//   }, [backgroundColor]);

//   const selectSaveDirectory = async () => {
//     try {
//       const dirHandle = await window.showDirectoryPicker();
//       setSaveDirectory(dirHandle);
//     } catch (err) {
//       console.error("Error selecting directory:", err);
//     }
//   };

//   const onFileChange = (event) => {
//     setSelectedFiles(Array.from(event.target.files));
    
//   };

//   const processModels = async () => {
//     const loader = new FBXLoader();
//     const objects = [];
//     const newFileSizes = [];
//     const newConvertedModels = [];
  
//     cumulativeBoundingBox.current = new THREE.Box3(
//       new THREE.Vector3(Infinity, Infinity, Infinity),
//       new THREE.Vector3(-Infinity, -Infinity, -Infinity)
//     );
  
//     for (const file of selectedFiles) {
//       try {
//         const fbxObject = await new Promise((resolve, reject) => {
//           loader.load(
//             URL.createObjectURL(file),
//             (object) => resolve(object),
//             undefined,
//             (error) => reject(error)
//           );
//         });
  
//         // Remove colors, textures, and materials
//         fbxObject.traverse((child) => {
//           if (child.isMesh) {
//             child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
//             if (child.geometry.attributes.color) {
//               child.geometry.deleteAttribute("color");
//             }
//             if (child.geometry.attributes.uv) {
//               child.geometry.deleteAttribute("uv");
//             }
//             if (child.geometry.attributes.normal) {
//               child.geometry.deleteAttribute("normal");
//             }
//           }
//         });
  
//         // Convert FBX to GLTF
//         const gltfData = await new Promise((resolve, reject) => {
//           const exporter = new GLTFExporter();
//           exporter.parse(
//             fbxObject,
//             (result) => resolve(JSON.stringify(result)),
//             { binary: false },
//             (error) => reject(error)
//           );
//         });
  
//         // Load GLTF for rendering
//         const gltfLoader = new GLTFLoader();
//         const gltfObject = await new Promise((resolve, reject) => {
//           gltfLoader.parse(gltfData, "", (gltf) => resolve(gltf.scene), reject);
//         });
  
//         // Add GLTF object to the scene
//         sceneRef.current.add(gltfObject);
//         objects.push(gltfObject);
  
//         const boundingBox = new THREE.Box3().setFromObject(gltfObject);
//         cumulativeBoundingBox.current.union(boundingBox);
  
//         const gltfBlob = new Blob([gltfData], { type: "application/json" });
  
//         newFileSizes.push({ name: file.name, fbxSize: file.size, gltfSize: gltfBlob.size });
//         newConvertedModels.push({ fileName: file.name.replace(".fbx", ".gltf"), data: gltfBlob });
//       } catch (error) {
//         console.error("Error processing model:", error);
//       }
//     }
  
//     adjustCamera();
//     setFileSizes(newFileSizes);
//     setConvertedModels(newConvertedModels);
//   };
  

//   const saveConvertedModels = async () => {
//     if (!saveDirectory) {
//       alert("Please select a save directory first.");
//       return;
//     }

//     if (convertedModels.length === 0) {
//       alert("No models have been processed yet.");
//       return;
//     }

//     let successCount = 0;
//     let failCount = 0;

//     for (const model of convertedModels) {
//       try {
//         const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
//         const writable = await newHandle.createWritable();
//         await writable.write(model.data);
//         await writable.close();
//         successCount++;
//       } catch (error) {
//         console.error("Error saving file:", model.fileName, error);
//         failCount++;
//       }
//     }

//     alert(`Saving complete!\n${successCount} files saved.\n${failCount} files failed.`);
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

//   const animate = () => {
//     requestAnimationFrame(animate);
//     if (isVisible) {
//       controlsRef.current.update();
//       rendererRef.current.render(sceneRef.current, cameraRef.current);
//     }
//   };

//   const toggleVisibility = (visible) => {
//     setIsVisible(visible);
//     sceneRef.current.traverse((object) => {
//       if (object instanceof THREE.Mesh) {
//         object.visible = visible;
//       }
//     });
//   };

//   return (
//     <div className="main">
//       <div className="canvas-container">
//         <div ref={mountRef} className="three-canvas"></div>
//       </div>
//       <div className="controls-container">
//         <div>
//           <input type="file" onChange={onFileChange} accept=".fbx" multiple />
//           <button onClick={processModels}>Convert</button>
//           <button onClick={selectSaveDirectory}>Select Save Directory</button>
//           <button onClick={saveConvertedModels}>Save Converted Models</button>
//           <button onClick={() => toggleVisibility(!isVisible)}>
//             <FontAwesomeIcon icon={isVisible ? faEye : faEyeSlash} />
//           </button>
//         </div>
//         <div>
//           <label>Background Color: </label>
//           <input
//             type="color"
//             value={`#${backgroundColor.toString(16).padStart(6, "0")}`}
//             onChange={(e) => setBackgroundColor(parseInt(e.target.value.slice(1), 16))}
//           />
//         </div>
//         {fileSizes.length > 0 && (
//           <div className="file-size-summary">
//             <h3>File Size Summary</h3>
//             <ul>
//               {fileSizes.map((file) => (
//                 <li key={file.name}>
//                   {file.name}: FBX Size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB, GLTF Size:{" "}
//                   {(file.gltfSize / 1024 / 1024).toFixed(2)} MB
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default FbxToGltf;

// --------------------------------------------------------
import React, { useEffect, useRef, useState,useCallback } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
import JSZip from 'jszip';
import pako from 'pako';
// Custom Octree class
class Octree {
  constructor(center, size) {
    this.center = center;
    this.size = size;
    this.children = [];
    this.objects = [];
    this.divided = false;
    this.boundingBox = new THREE.Box3().setFromCenterAndSize(this.center, new THREE.Vector3(this.size, this.size, this.size));
  }

  subdivide() {
    const { x, y, z } = this.center;
    const newSize = this.size / 2;
    const offset = newSize / 2;

    this.children = [
      new Octree(new THREE.Vector3(x - offset, y - offset, z - offset), newSize),
      new Octree(new THREE.Vector3(x + offset, y - offset, z - offset), newSize),
      new Octree(new THREE.Vector3(x - offset, y + offset, z - offset), newSize),
      new Octree(new THREE.Vector3(x + offset, y + offset, z - offset), newSize),
      new Octree(new THREE.Vector3(x - offset, y - offset, z + offset), newSize),
      new Octree(new THREE.Vector3(x + offset, y - offset, z + offset), newSize),
      new Octree(new THREE.Vector3(x - offset, y + offset, z + offset), newSize),
      new Octree(new THREE.Vector3(x + offset, y + offset, z + offset), newSize),
    ];
    this.divided = true;
  }

  insert(object) {
    if (!this.containsPoint(object.position)) return false;

    if (this.objects.length < 8 && !this.divided) {
      this.objects.push(object);
      return true;
    }

    if (!this.divided) this.subdivide();

    for (const child of this.children) {
      if (child.insert(object)) return true;
    }

    return false;
  }

  containsPoint(point) {
    return (
      point.x >= this.center.x - this.size / 2 &&
      point.x < this.center.x + this.size / 2 &&
      point.y >= this.center.y - this.size / 2 &&
      point.y < this.center.y + this.size / 2 &&
      point.z >= this.center.z - this.size / 2 &&
      point.z < this.center.z + this.size / 2
    );
  }

  intersectsFrustum(frustum) {
    return frustum.intersectsBox(this.boundingBox);
  }

  getVisibleOctants(frustum) {
    let count = 0;
    if (this.intersectsFrustum(frustum)) {
      count = 1;
      if (this.divided) {
        for (const child of this.children) {
          count += child.getVisibleOctants(frustum);
        }
      }
    }
    return count;
  }
}

function FbxToGlbWithOctree() {
  const [boundingBox, setBoundingBox] = useState(null);
  const containerRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }))
  const octreeRef = useRef(null);
  const controlsRef = useRef(null);
  const [meshOctreeRelations, setMeshOctreeRelations] = useState({});
  const [nodeZipRelations, setNodeZipRelations] = useState({});
  const [visibleOctants, setVisibleOctants] = useState(0);
  const [totalOctants, setTotalOctants] = useState(0);
  const [fileSizes, setFileSizes] = useState([]);
  const [convertedModels, setConvertedModels] = useState([]);

  const [isWebGLAvailable, setIsWebGLAvailable] = useState(true);
  const animationFrameId = useRef(null);

  const initializeRenderer = useCallback(() => {
    const renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x00ffff);
    return renderer;
  }, []);

  useEffect(() => {
    const renderer = initializeRenderer();
    rendererRef.current = renderer;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      controls.update();

      // Update the frustum
      camera.updateMatrixWorld();
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      // frustum.setFromProjectionMatrix(projScreenMatrix);

      // // Perform frustum culling
      // if (octreeRef.current) {
      //   const visibleCount = octreeRef.current.getVisibleOctants(frustum);
      //   setVisibleOctants(visibleCount);
      // }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Handle context loss
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      containerRef.current.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      renderer.dispose();
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [initializeRenderer]);

  const handleContextLost = (event) => {
    event.preventDefault();
    cancelAnimationFrame(animationFrameId.current);
    setIsWebGLAvailable(false);
    console.log("WebGL context lost. Trying to restore...");
  };

  const handleContextRestored = () => {
    console.log("WebGL context restored.");
    const newRenderer = initializeRenderer();
    rendererRef.current = newRenderer;
    containerRef.current.appendChild(newRenderer.domElement);
    setIsWebGLAvailable(true);
    // Re-setup the scene, camera, and controls here if necessary
  };
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    // Clear existing objects from the scene
    while(sceneRef.current.children.length > 0){ 
      sceneRef.current.remove(sceneRef.current.children[0]); 
    }

    const loader = new FBXLoader();
    let cumulativeBox = new THREE.Box3();
    let hasItems = false;
    const meshBoundingBoxes = [];
    const meshFileRelations = {};
    const serializedGeometries = {};
    const newFileSizes = [];
    const newConvertedModels = [];

    for (const file of files) {
      try {
        const fbxObject = await loadFile(file, loader);
        const glbData = await convertToGLB(fbxObject);
        const glbObject = await loadGLB(glbData);

        glbObject.traverse((child) => {
          if (child.isMesh) {
            const box = new THREE.Box3().setFromObject(child);
            meshBoundingBoxes.push(box);
            meshFileRelations[box.uuid] = file.name;
            serializedGeometries[box.uuid] = serializeGeometry(child.geometry);
            
            if (hasItems) {
              cumulativeBox.union(box);
            } else {
              cumulativeBox.copy(box);
              hasItems = true;
            }
          }
        });

        sceneRef.current.add(glbObject);

        const glbBlob = new Blob([glbData], { type: "model/gltf-binary" });
        newFileSizes.push({ name: file.name, fbxSize: file.size, glbSize: glbBlob.size });
        newConvertedModels.push({ fileName: file.name.replace(".fbx", ".glb"), data: glbBlob });
      } catch (error) {
        console.error('Error processing loaded object:', error);
      }
    }

    if (hasItems) {
      updateBoundingBox(cumulativeBox);
      const octree = createOctree(cumulativeBox, meshBoundingBoxes);
      positionCamera(cumulativeBox);
      createBoundingBoxMeshes(meshBoundingBoxes);
      createCumulativeBoundingBoxMesh(cumulativeBox);
      visualizeOctree(octree);
      const relations = relateMeshesToOctree(octree, meshBoundingBoxes);
      setMeshOctreeRelations(relations);
      await createAndStoreGzipFiles(octree, meshFileRelations, serializedGeometries);
    }

    setFileSizes(newFileSizes);
    setConvertedModels(newConvertedModels);
  };

  const loadFile = (file, loader) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const blob = new Blob([arrayBuffer], { type: file.type });
        const objectUrl = URL.createObjectURL(blob);

        loader.load(
          objectUrl,
          (object) => resolve(object),
          (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
          (error) => reject(error)
        );
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const convertToGLB = (fbxObject) => {
    return new Promise((resolve, reject) => {
      // Remove colors, textures, and materials
      fbxObject.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
          if (child.geometry.attributes.color) {
            child.geometry.deleteAttribute("color");
          }
          if (child.geometry.attributes.uv) {
            child.geometry.deleteAttribute("uv");
          }
          if (child.geometry.attributes.normal) {
            child.geometry.deleteAttribute("normal");
          }
        }
      });
  
      const exporter = new GLTFExporter();
      exporter.parse(
        fbxObject,
        (result) => resolve(result),
        (error) => reject(error),
        { binary: true }
      );
    });
  };

  const loadGLB = (glbData) => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.parse(glbData, "", (gltf) => resolve(gltf.scene), reject);
    });
  };

  const serializeGeometry = (geometry) => {
    return {
      vertices: Array.from(geometry.attributes.position.array),
      normals: geometry.attributes.normal ? Array.from(geometry.attributes.normal.array) : null,
      uvs: geometry.attributes.uv ? Array.from(geometry.attributes.uv.array) : null,
      indices: geometry.index ? Array.from(geometry.index.array) : null,
    };
  };

  const createOctree = (box, meshBoundingBoxes) => {
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
    const octree = new Octree(center, size);

    meshBoundingBoxes.forEach(meshBox => {
      const meshCenter = new THREE.Vector3();
      meshBox.getCenter(meshCenter);
      octree.insert({ position: meshCenter, boxUuid: meshBox.uuid });
    });

    octreeRef.current = octree;
    console.log(`Added ${meshBoundingBoxes.length} objects to the Octree`);
    
    // Count total octants
    const countOctants = (node) => {
      let count = 1;
      if (node.divided) {
        node.children.forEach(child => {
          count += countOctants(child);
        });
      }
      return count;
    };
    setTotalOctants(countOctants(octree));

    return octree;
  };

  const relateMeshesToOctree = (octree, meshBoundingBoxes) => {
    const relations = {}; // A dictionary to store which mesh belongs to which octant
  
    const assignToOctant = (node, meshBox) => {
      if (node.intersectsFrustum(meshBox)) {
        if (node.divided) {
          for (const child of node.children) {
            assignToOctant(child, meshBox);
          }
        } else {
          // If this node is not subdivided, assign the mesh to this node's octant
          if (!relations[node.boundingBox.uuid]) {
            relations[node.boundingBox.uuid] = [];
          }
          relations[node.boundingBox.uuid].push(meshBox.uuid);
        }
      }
    };
  
    meshBoundingBoxes.forEach((meshBox) => {
      assignToOctant(octree, meshBox);
    });
  
    return relations;
  };
  

  const createAndStoreGzipFiles = async (octree, meshFileRelations, serializedGeometries) => {
    const db = await openIndexedDB();
    const nodeGzipRelations = {};

    const createGzipForNode = async (node, depth) => {
      const nodeId = `node_${depth}_${node.center.toArray().join('_')}`;
      const nodeData = {};

      node.objects.forEach(obj => {
        const fileName = meshFileRelations[obj.boxUuid];
        if (fileName) {
          const geometryJson = JSON.stringify(serializedGeometries[obj.boxUuid]);
          nodeData[fileName] = geometryJson;
        }
      });

      const jsonString = JSON.stringify(nodeData);
      const gzippedData = pako.gzip(jsonString);
      const gzipBlob = new Blob([gzippedData], { type: 'application/gzip' });

      await storeGzipInIndexedDB(db, nodeId, gzipBlob);

      nodeGzipRelations[nodeId] = { node, depth };

      if (node.divided) {
        await Promise.all(node.children.map(child => createGzipForNode(child, depth + 1)));
      }
    };

    await createGzipForNode(octree, 0);
    setNodeZipRelations(nodeGzipRelations);
    db.close();
  };

  // Update the openIndexedDB function
  const openIndexedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OctreeGzipDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('gzips', { keyPath: 'nodeId' });
      };
    });
  };

  // Update the store function
  const storeGzipInIndexedDB = (db, nodeId, gzipBlob) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['gzips'], 'readwrite');
      const store = transaction.objectStore('gzips');
      const request = store.put({ nodeId, gzipBlob });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };


  const updateBoundingBox = (box) => {
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    setBoundingBox({ center, size });
  };

  const positionCamera = (box) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
    const center = new THREE.Vector3();
    box.getCenter(center);

    camera.position.set(center.x, center.y, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
  };

  const createBoundingBoxMeshes = (boxes) => {
    boxes.forEach((box) => {
      const mesh = createBoundingBoxMesh(box, 0x00ff00, 0.5);
      sceneRef.current.add(mesh);
    });
  };

  const createCumulativeBoundingBoxMesh = (box) => {
    const mesh = createBoundingBoxMesh(box, 0xffff00, 1);
    sceneRef.current.add(mesh);
  };

  const createBoundingBoxMesh = (box, color, opacity = 1) => {
    const size = new THREE.Vector3();
    box.getSize(size);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: color, 
      wireframe: true, 
      transparent: true, 
      opacity: opacity 
    });
    const mesh = new THREE.Mesh(geometry, material);

    const center = box.getCenter(new THREE.Vector3());
    mesh.position.set(center.x, center.y, center.z);
    mesh.scale.set(size.x, size.y, size.z);

    return mesh;
  };

  const visualizeOctree = (octree) => {
    if (!octree) return;

    const maxDepth = getMaxDepth(octree);

    const visualizeNode = (node, depth = 0) => {
      const color = getColorForDepth(depth, maxDepth);
      const mesh = createBoundingBoxMesh(node.boundingBox, color, 0.3);
      sceneRef.current.add(mesh);

      if (node.divided) {
        node.children.forEach(child => {
          visualizeNode(child, depth + 1);
        });
      }
    };

    visualizeNode(octree);
  };

  const getMaxDepth = (node) => {
    if (!node.divided) return 0;
    return 1 + Math.max(...node.children.map(getMaxDepth));
  };

  const getColorForDepth = (depth, maxDepth) => {
    const hue = (depth / maxDepth) * 0.8; // Use 80% of the hue spectrum
    return new THREE.Color().setHSL(hue, 1, 0.5);
  };

  const saveConvertedModels = async () => {
    if (convertedModels.length === 0) {
      alert("No models have been processed yet.");
      return;
    }

    for (const model of convertedModels) {
      const blob = model.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = model.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    alert(`Saving complete! ${convertedModels.length} files saved.`);
  };

  return (
    <div>
      <h1>FBX to GLB Converter with Octree Visualization</h1>
      <input type="file" accept=".fbx" multiple onChange={handleFileUpload} />
      <button onClick={saveConvertedModels}>Save Converted Models</button>
      {boundingBox && (
        <div>
          <p>Cumulative Center: {`x: ${boundingBox.center.x.toFixed(2)}, y: ${boundingBox.center.y.toFixed(2)}, z: ${boundingBox.center.z.toFixed(2)}`}</p>
          <p>Cumulative Size: {`x: ${boundingBox.size.x.toFixed(2)}, y: ${boundingBox.size.y.toFixed(2)}, z: ${boundingBox.size.z.toFixed(2)}`}</p>
          <p>Visible Octants: {visibleOctants}</p>
          <p>Total Octants: {totalOctants}</p>
          <p>Octants Outside Frustum: {totalOctants - visibleOctants}</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
      <div>
        {fileSizes.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>FBX Size</th>
                <th>GLB Size</th>
              </tr>
            </thead>
            <tbody>
              {fileSizes.map(({ name, fbxSize, glbSize }) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{(fbxSize / 1024 / 1024).toFixed(2)} MB</td>
                  <td>{(glbSize / 1024 / 1024).toFixed(2)} MB</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default FbxToGlbWithOctree;

// ------------------------------------------
// import React, { useEffect, useRef, useState, useCallback } from "react";
// import * as THREE from "three";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";
// import pako from 'pako';

// // Custom Octree class
// class Octree {
//   constructor(center, size) {
//     this.center = center;
//     this.size = size;
//     this.children = [];
//     this.objects = [];
//     this.divided = false;
//     this.boundingBox = new THREE.Box3().setFromCenterAndSize(this.center, new THREE.Vector3(this.size, this.size, this.size));
//   }

//   subdivide() {
//     const { x, y, z } = this.center;
//     const newSize = this.size / 2;
//     const offset = newSize / 2;

//     this.children = [
//       new Octree(new THREE.Vector3(x - offset, y - offset, z - offset), newSize),
//       new Octree(new THREE.Vector3(x + offset, y - offset, z - offset), newSize),
//       new Octree(new THREE.Vector3(x - offset, y + offset, z - offset), newSize),
//       new Octree(new THREE.Vector3(x + offset, y + offset, z - offset), newSize),
//       new Octree(new THREE.Vector3(x - offset, y - offset, z + offset), newSize),
//       new Octree(new THREE.Vector3(x + offset, y - offset, z + offset), newSize),
//       new Octree(new THREE.Vector3(x - offset, y + offset, z + offset), newSize),
//       new Octree(new THREE.Vector3(x + offset, y + offset, z + offset), newSize),
//     ];
//     this.divided = true;
//   }

//   insert(object) {
//     if (!this.containsPoint(object.position)) return false;

//     if (this.objects.length < 8 && !this.divided) {
//       this.objects.push(object);
//       return true;
//     }

//     if (!this.divided) this.subdivide();

//     for (const child of this.children) {
//       if (child.insert(object)) return true;
//     }

//     return false;
//   }

//   containsPoint(point) {
//     return (
//       point.x >= this.center.x - this.size / 2 &&
//       point.x < this.center.x + this.size / 2 &&
//       point.y >= this.center.y - this.size / 2 &&
//       point.y < this.center.y + this.size / 2 &&
//       point.z >= this.center.z - this.size / 2 &&
//       point.z < this.center.z + this.size / 2
//     );
//   }

//   intersectsFrustum(frustum) {
//     return frustum.intersectsBox(this.boundingBox);
//   }

//   getVisibleOctants(frustum) {
//     let count = 0;
//     if (this.intersectsFrustum(frustum)) {
//       count = 1;
//       if (this.divided) {
//         for (const child of this.children) {
//           count += child.getVisibleOctants(frustum);
//         }
//       }
//     }
//     return count;
//   }
// }

// function FbxToGlbWithOctree() {
//   const [boundingBox, setBoundingBox] = useState(null);
//   const containerRef = useRef(null);
//   const sceneRef = useRef(new THREE.Scene());
//   const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
//   const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
//   const octreeRef = useRef(null);
//   const controlsRef = useRef(null);
//   const [meshOctreeRelations, setMeshOctreeRelations] = useState({});
//   const [nodeGzipRelations, setNodeGzipRelations] = useState({});
//   const [visibleOctants, setVisibleOctants] = useState(0);
//   const [totalOctants, setTotalOctants] = useState(0);
//   const [fileSizes, setFileSizes] = useState([]);
//   const [convertedModels, setConvertedModels] = useState([]);
//   const [frustumCulledCount, setFrustumCulledCount] = useState(0);
//   const [frustumUnculledCount, setFrustumUnculledCount] = useState(0);
//   const [occlusionCulledCount, setOcclusionCulledCount] = useState(0);
//   const [occlusionUnculledCount, setOcclusionUnculledCount] = useState(0);
//   const [totalMeshes, setTotalMeshes] = useState(0);
//   const [isWebGLAvailable, setIsWebGLAvailable] = useState(true);
//   const animationFrameId = useRef(null);
//   const frustumRef = useRef(new THREE.Frustum());
//   const projScreenMatrixRef = useRef(new THREE.Matrix4());
//   const frameCountRef = useRef(0);
//   const FRAMES_BETWEEN_CULLING = 10;

//   const initializeRenderer = useCallback(() => {
//     const renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance", antialias: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.setClearColor(0x00ffff);
//     return renderer;
//   }, []);

//   useEffect(() => {
//     const renderer = initializeRenderer();
//     rendererRef.current = renderer;
//     const camera = cameraRef.current;
//     const scene = sceneRef.current;

//     containerRef.current.appendChild(renderer.domElement);

//     const controls = new OrbitControls(camera, renderer.domElement);
//     controlsRef.current = controls;

//     const animate = () => {
//       animationFrameId.current = requestAnimationFrame(animate);
//       controls.update();

//       frameCountRef.current++;

//       if (frameCountRef.current % FRAMES_BETWEEN_CULLING === 0) {
//         // updateFrustum();
//         updateCullingStats(); // Add this line to update culling stats
//         // if (octreeRef.current) {
//         //   const visibleCount = performFrustumCulling(octreeRef.current, frustumRef.current);
//         //   setVisibleOctants(visibleCount);
//         // }
//       }

//       renderer.render(scene, camera);
//     };

//     animate();

//     const handleResize = () => {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//     };
//     window.addEventListener('resize', handleResize);

//     renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
//     renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

//     return () => {
//       containerRef.current.removeChild(renderer.domElement);
//       window.removeEventListener('resize', handleResize);
//       renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
//       renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
//       controls.dispose();
//       renderer.dispose();
//       cancelAnimationFrame(animationFrameId.current);
//     };
//   }, [initializeRenderer]);

//   const handleContextLost = (event) => {
//     event.preventDefault();
//     cancelAnimationFrame(animationFrameId.current);
//     setIsWebGLAvailable(false);
//     console.log("WebGL context lost. Trying to restore...");
//   };

//   const handleContextRestored = () => {
//     console.log("WebGL context restored.");
//     const newRenderer = initializeRenderer();
//     rendererRef.current = newRenderer;
//     containerRef.current.appendChild(newRenderer.domElement);
//     setIsWebGLAvailable(true);
//   };

//   const updateFrustum = useCallback(() => {
//     const camera = cameraRef.current;
//     camera.updateMatrixWorld();
//     projScreenMatrixRef.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
//     frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current);
//   }, []);

//   const performFrustumCulling = useCallback((octree, frustum) => {
//     let visibleCount = 0;

//     const traverseOctree = (node) => {
//       if (!node.intersectsFrustum(frustum)) {
//         return;
//       }

//       visibleCount++;

//       if (node.divided) {
//         for (const child of node.children) {
//           traverseOctree(child);
//         }
//       } else {
//         node.objects.forEach(obj => {
//           // Implement your rendering logic here
//           // For example: obj.visible = true;
//         });
//       }
//     };

//     traverseOctree(octree);
//     return visibleCount;
//   }, []);

//   const handleFileUpload = async (event) => {
//     const files = event.target.files;
//     if (!files.length) return;

//     while(sceneRef.current.children.length > 0){ 
//       sceneRef.current.remove(sceneRef.current.children[0]); 
//     }

//     const loader = new FBXLoader();
//     let cumulativeBox = new THREE.Box3();
//     let hasItems = false;
//     const meshBoundingBoxes = [];
//     const meshFileRelations = {};
//     const serializedGeometries = {};
//     const newFileSizes = [];
//     const newConvertedModels = [];

//     for (const file of files) {
//       try {
//         const fbxObject = await loadFile(file, loader);
//         const glbData = await convertToGLB(fbxObject);
//         const glbObject = await loadGLB(glbData);

//         glbObject.traverse((child) => {
//           if (child.isMesh) {
//             const box = new THREE.Box3().setFromObject(child);
//             meshBoundingBoxes.push(box);
//             meshFileRelations[box.uuid] = file.name;
//             serializedGeometries[box.uuid] = serializeGeometry(child.geometry);
            
//             if (hasItems) {
//               cumulativeBox.union(box);
//             } else {
//               cumulativeBox.copy(box);
//               hasItems = true;
//             }
//           }
//         });

//         const glbBlob = new Blob([glbData], { type: "model/gltf-binary" });
//         newFileSizes.push({ name: file.name, fbxSize: file.size, glbSize: glbBlob.size });
//         newConvertedModels.push({ fileName: file.name.replace(".fbx", ".glb"), data: glbBlob });
//       } catch (error) {
//         console.error('Error processing loaded object:', error);
//       }
//     }

//     if (hasItems) {
//       updateBoundingBox(cumulativeBox);
//       const octree = createOctree(cumulativeBox, meshBoundingBoxes);
//       octreeRef.current = octree;
//       positionCamera(cumulativeBox);
//       createBoundingBoxMeshes(meshBoundingBoxes);
//       createCumulativeBoundingBoxMesh(cumulativeBox);
//       visualizeOctree(octree);
//       const relations = relateMeshesToOctree(octree, meshBoundingBoxes);
//       setMeshOctreeRelations(relations);
//       await createAndStoreGzipFiles(octree, meshFileRelations, serializedGeometries);

//       // updateFrustum();
//       const visibleCount = performFrustumCulling(octree, frustumRef.current);
//       setVisibleOctants(visibleCount);
//     }

//     setFileSizes(newFileSizes);
//     setConvertedModels(newConvertedModels);
//   };

//   const loadFile = (file, loader) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const arrayBuffer = e.target.result;
//         const blob = new Blob([arrayBuffer], { type: file.type });
//         const objectUrl = URL.createObjectURL(blob);

//         loader.load(
//           objectUrl,
//           (object) => resolve(object),
//           (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
//           (error) => reject(error)
//         );
//       };
//       reader.readAsArrayBuffer(file);
//     });
//   };

//   const convertToGLB = (fbxObject) => {
//     return new Promise((resolve, reject) => {
//       fbxObject.traverse((child) => {
//         if (child.isMesh) {
//           child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
//           if (child.geometry.attributes.color) {
//             child.geometry.deleteAttribute("color");
//           }
//           if (child.geometry.attributes.uv) {
//             child.geometry.deleteAttribute("uv");
//           }
//           if (child.geometry.attributes.normal) {
//             child.geometry.deleteAttribute("normal");
//           }
//         }
//       });
  
//       const exporter = new GLTFExporter();
//       exporter.parse(
//         fbxObject,
//         (result) => resolve(result),
//         (error) => reject(error),
//         { binary: true }
//       );
//     });
//   };

//   const loadGLB = (glbData) => {
//     return new Promise((resolve, reject) => {
//       const loader = new GLTFLoader();
//       loader.parse(glbData, "", (gltf) => resolve(gltf.scene), reject);
//     });
//   };

//   const serializeGeometry = (geometry) => {
//     return {
//       vertices: Array.from(geometry.attributes.position.array),
//       normals: geometry.attributes.normal ? Array.from(geometry.attributes.normal.array) : null,
//       uvs: geometry.attributes.uv ? Array.from(geometry.attributes.uv.array) : null,
//       indices: geometry.index ? Array.from(geometry.index.array) : null,
//     };
//   };

//   const createOctree = (box, meshBoundingBoxes) => {
//     const center = new THREE.Vector3();
//     box.getCenter(center);
//     const size = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
//     const octree = new Octree(center, size);

//     meshBoundingBoxes.forEach(meshBox => {
//       const meshCenter = new THREE.Vector3();
//       meshBox.getCenter(meshCenter);
//       octree.insert({ position: meshCenter, boxUuid: meshBox.uuid });
//     });

//     console.log(`Added ${meshBoundingBoxes.length} objects to the Octree`);
    
//     const countOctants = (node) => {
//       let count = 1;
//       if (node.divided) {
//         node.children.forEach(child => {
//           count += countOctants(child);
//         });
//       }
//       return count;
//     };
//     setTotalOctants(countOctants(octree));

//     return octree;
//   };
//   const relateMeshesToOctree = (octree, meshBoundingBoxes) => {
//     const relations = {};

//     const traverse = (node, depth = 0) => {
//       node.objects.forEach(obj => {
//         if (!relations[obj.boxUuid]) {
//           relations[obj.boxUuid] = [];
//         }
//         relations[obj.boxUuid].push({ node, depth });
//       });

//       if (node.divided) {
//         node.children.forEach(child => traverse(child, depth + 1));
//       }
//     };

//     traverse(octree);
//     return relations;
//   };

//   const createAndStoreGzipFiles = async (octree, meshFileRelations, serializedGeometries) => {
//     const db = await openIndexedDB();
//     const nodeGzipRelations = {};

//     const createGzipForNode = async (node, depth) => {
//       const nodeId = `node_${depth}_${node.center.toArray().join('_')}`;
//       const nodeData = {};

//       node.objects.forEach(obj => {
//         const fileName = meshFileRelations[obj.boxUuid];
//         if (fileName) {
//           const geometryJson = JSON.stringify(serializedGeometries[obj.boxUuid]);
//           nodeData[fileName] = geometryJson;
//         }
//       });

//       const jsonString = JSON.stringify(nodeData);
//       const gzippedData = pako.gzip(jsonString);
//       const gzipBlob = new Blob([gzippedData], { type: 'application/gzip' });

//       await storeGzipInIndexedDB(db, nodeId, gzipBlob);

//       nodeGzipRelations[nodeId] = { node, depth };

//       if (node.divided) {
//         await Promise.all(node.children.map(child => createGzipForNode(child, depth + 1)));
//       }
//     };

//     await createGzipForNode(octree, 0);
//     setNodeGzipRelations(nodeGzipRelations);
//     db.close();
//   };

//   const openIndexedDB = () => {
//     return new Promise((resolve, reject) => {
//       const request = indexedDB.open('OctreeGzipDB', 1);
//       request.onerror = () => reject(request.error);
//       request.onsuccess = () => resolve(request.result);
//       request.onupgradeneeded = (event) => {
//         const db = event.target.result;
//         db.createObjectStore('gzips', { keyPath: 'nodeId' });
//       };
//     });
//   };

//   const storeGzipInIndexedDB = (db, nodeId, gzipBlob) => {
//     return new Promise((resolve, reject) => {
//       const transaction = db.transaction(['gzips'], 'readwrite');
//       const store = transaction.objectStore('gzips');
//       const request = store.put({ nodeId, gzipBlob });
//       request.onerror = () => reject(request.error);
//       request.onsuccess = () => resolve();
//     });
//   };

//   const updateBoundingBox = (box) => {
//     const center = new THREE.Vector3();
//     const size = new THREE.Vector3();
//     box.getCenter(center);
//     box.getSize(size);
//     setBoundingBox({ center, size });
//   };

//   const positionCamera = (box) => {
//     const camera = cameraRef.current;
//     const controls = controlsRef.current;
//     const size = new THREE.Vector3();
//     box.getSize(size);
//     const maxDim = Math.max(size.x, size.y, size.z);
//     const fov = camera.fov * (Math.PI / 180);
//     const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
//     const center = new THREE.Vector3();
//     box.getCenter(center);

//     camera.position.set(center.x, center.y, center.z + cameraZ);
//     camera.lookAt(center);
//     controls.target.copy(center);
//     controls.update();
//   };

//   const createBoundingBoxMeshes = (boxes) => {
//     boxes.forEach((box) => {
//       const mesh = createBoundingBoxMesh(box, 0x00ff00, 0.5);
//       sceneRef.current.add(mesh);
//     });
//   };

//   const createCumulativeBoundingBoxMesh = (box) => {
//     const mesh = createBoundingBoxMesh(box, 0xffff00, 1);
//     sceneRef.current.add(mesh);
//   };

//   const createBoundingBoxMesh = (box, color, opacity = 1) => {
//     const size = new THREE.Vector3();
//     box.getSize(size);

//     const geometry = new THREE.BoxGeometry(1, 1, 1);
//     const material = new THREE.MeshBasicMaterial({ 
//       color: color, 
//       wireframe: true, 
//       transparent: true, 
//       opacity: opacity 
//     });
//     const mesh = new THREE.Mesh(geometry, material);

//     const center = box.getCenter(new THREE.Vector3());
//     mesh.position.set(center.x, center.y, center.z);
//     mesh.scale.set(size.x, size.y, size.z);

//     return mesh;
//   };

//   const visualizeOctree = (octree) => {
//     if (!octree) return;

//     const maxDepth = getMaxDepth(octree);

//     const visualizeNode = (node, depth = 0) => {
//       const color = getColorForDepth(depth, maxDepth);
//       const mesh = createBoundingBoxMesh(node.boundingBox, color, 0.3);
//       sceneRef.current.add(mesh);

//       if (node.divided) {
//         node.children.forEach(child => {
//           visualizeNode(child, depth + 1);
//         });
//       }
//     };

//     visualizeNode(octree);
//   };

//   const getMaxDepth = (node) => {
//     if (!node.divided) return 0;
//     return 1 + Math.max(...node.children.map(getMaxDepth));
//   };

//   const getColorForDepth = (depth, maxDepth) => {
//     const hue = (depth / maxDepth) * 0.8;
//     return new THREE.Color().setHSL(hue, 1, 0.5);
//   };

//   const saveConvertedModels = async () => {
//     if (convertedModels.length === 0) {
//       alert("No models have been processed yet.");
//       return;
//     }

//     for (const model of convertedModels) {
//       const blob = model.data;
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = model.fileName;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     }

//     alert(`Saving complete! ${convertedModels.length} files saved.`);
//   };

//   const updateCullingStats = useCallback(() => {
//     const camera = cameraRef.current;
//     const frustum = new THREE.Frustum();
//     const cameraViewProjectionMatrix = new THREE.Matrix4();

//     // Update camera matrices
//     camera.updateMatrixWorld();
//     cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
//     frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

//     let frustumCulled = 0;
//     let frustumUnculled = 0;
//     let occlusionCulled = 0;
//     let occlusionUnculled = 0;
//     const objectsToCheck = [];

//     // Traverse scene and perform frustum culling
//     sceneRef.current.traverse((child) => {
//       if (child.isMesh) {
//         const boundingBox = new THREE.Box3().setFromObject(child);

//         // Frustum culling
//         if (frustum.intersectsBox(boundingBox)) {
//           frustumUnculled++;
//           objectsToCheck.push(child); // Save for occlusion check
//         } else {
//           frustumCulled++;
//           child.visible = false; // Hide objects outside the frustum
//         }
//       }
//     });

//     // Perform raycasting for occlusion culling
//     const raycaster = new THREE.Raycaster();
//     objectsToCheck.forEach((obj) => {
//       // Compute the bounding sphere for more accurate raycasting
//       obj.geometry.computeBoundingSphere();
//       const boundingSphere = obj.geometry.boundingSphere;
//       const direction = boundingSphere.center.clone().sub(camera.position).normalize();

//       // Set ray from the camera to the object's bounding sphere center
//       raycaster.set(camera.position, direction);

//       // Perform raycasting against all objects within the frustum
//       const intersects = raycaster.intersectObjects(objectsToCheck, true);

//       if (intersects.length > 0) {
//         // Check if any object is blocking the current object
//         const closestIntersect = intersects[0];

//         if (closestIntersect.object !== obj && closestIntersect.distance < boundingSphere.center.distanceTo(camera.position)) {
//           // An object is blocking this one, mark it occluded
//           obj.visible = false;
//           occlusionCulled++;
//         } else {
//           // No object blocking this one, mark it visible
//           obj.visible = true;
//           occlusionUnculled++;
//         }
//       } else {
//         // No intersections, make the object visible
//         obj.visible = true;
//         occlusionUnculled++;
//       }
//     });

//     // Update stats
//     setFrustumCulledCount(frustumCulled);
//     setFrustumUnculledCount(frustumUnculled);
//     setOcclusionCulledCount(occlusionCulled);
//     setOcclusionUnculledCount(occlusionUnculled);
//     setTotalMeshes(frustumCulled + frustumUnculled); // Total meshes
//   }, []);


//   return (
//     <div>
//       <h1>FBX to GLB Converter with Octree Visualization</h1>
//       <input type="file" accept=".fbx" multiple onChange={handleFileUpload} />
//       <button onClick={saveConvertedModels}>Save Converted Models</button>
//       {!isWebGLAvailable && (
//         <p style={{ color: 'red' }}>WebGL context lost. Please refresh the page.</p>
//       )}
//       {boundingBox && (
//         <div>
//           <p>Cumulative Center: {`x: ${boundingBox.center.x.toFixed(2)}, y: ${boundingBox.center.y.toFixed(2)}, z: ${boundingBox.center.z.toFixed(2)}`}</p>
//           <p>Cumulative Size: {`x: ${boundingBox.size.x.toFixed(2)}, y: ${boundingBox.size.y.toFixed(2)}, z: ${boundingBox.size.z.toFixed(2)}`}</p>
//           <p>Visible Octants: {visibleOctants}</p>
//           <p>Total Octants: {totalOctants}</p>
//           <p>Octants Outside Frustum: {totalOctants - visibleOctants}</p>
//           <p>Frustum Culled: {frustumCulledCount}</p>
//           <p>Frustum Unculled: {frustumUnculledCount}</p>
//           <p>Occlusion Culled: {occlusionCulledCount}</p>
//           <p>Occlusion Unculled: {occlusionUnculledCount}</p>
//           <p>Total Meshes: {totalMeshes}</p>
//         </div>
//       )}
//       <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
//       <div>
//         {fileSizes.length > 0 && (
//           <table>
//             <thead>
//               <tr>
//                 <th>File Name</th>
//                 <th>FBX Size</th>
//                 <th>GLB Size</th>
//               </tr>
//             </thead>
//             <tbody>
//               {fileSizes.map(({ name, fbxSize, glbSize }) => (
//                 <tr key={name}>
//                   <td>{name}</td>
//                   <td>{(fbxSize / 1024 / 1024).toFixed(2)} MB</td>
//                   <td>{(glbSize / 1024 / 1024).toFixed(2)} MB</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }

// export default FbxToGlbWithOctree;

// -------------
