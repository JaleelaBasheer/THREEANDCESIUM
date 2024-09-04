// import React, { useRef, useEffect, useState } from 'react';
// import * as BABYLON from '@babylonjs/core';
// import '@babylonjs/loaders';
// import { openDatabase, addScene, getScene,clearDatabase} from './database';

// const BabylonViewer = () => {
//   const canvasRef = useRef(null);
//   const [scene, setScene] = useState(null);
//   const [engine, setEngine] = useState(null);
//   const [boundingBoxes, setBoundingBoxes] = useState([]); // State for storing bounding boxes
//    let camera
//   useEffect(() => {
//     // Clear the database on refresh
//     clearDatabase();

//     // Open the IndexedDB and initialize Babylon.js engine and scene
//     openDatabase().then(() => {
//       const engine = new BABYLON.Engine(canvasRef.current, true);
//       const scene = new BABYLON.Scene(engine);

//       // Set up the camera
//        camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 100, new BABYLON.Vector3(0, 0, 0), scene);
//       camera.setPosition(new BABYLON.Vector3(0, 0, -10));
//       camera.attachControl(canvasRef.current, true);

//       // Set up the light
//       new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

//       // Start the render loop
//       engine.runRenderLoop(() => {
//         scene.render();
//       });

//       // Handle window resize
//       window.addEventListener('resize', () => {
//         engine.resize();
//       });

//       // Set state
//       setScene(scene);
//       setEngine(engine);

//       // Clean up on unmount
//       return () => {
//         window.removeEventListener('resize', () => {
//           engine.resize();
//         });
//         scene.dispose();
//         engine.dispose();
//       };
//     });
//   }, []);

//   const handleFileChange = (event) => {
//     const files = event.target.files;

//     Array.from(files).forEach(file => {
//       const reader = new FileReader();
//       reader.onload = async () => {
//         const data = reader.result;
//         const sceneData = { name: file.name, data: data };

//         // Store scene data in IndexedDB and wait for completion
//         const sceneId = await addScene(sceneData);
//         console.log(`Scene added with ID: ${sceneId}`);

//         // Load the scene from DB after storing
//         const sceneDataFromDB = await getScene(sceneId);
//         if (sceneDataFromDB) {
//           BABYLON.SceneLoader.Append('', sceneDataFromDB.data, scene, (loadedScene) => {
//             let minVector = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
//             let maxVector = new BABYLON.Vector3(-Number.MIN_VALUE, -Number.MIN_VALUE, -Number.MIN_VALUE);

//             // Calculate bounding box for each mesh and update cumulative bounding box
//             loadedScene.meshes.forEach(mesh => {
//               const boundingInfo = mesh.getBoundingInfo();
//               const boundingBox = boundingInfo.boundingBox;
//               console.log(`Bounding Box for mesh ${mesh.name}:, boundingBox`);

//               minVector = BABYLON.Vector3.Minimize(minVector, boundingBox.minimumWorld);
//               maxVector = BABYLON.Vector3.Maximize(maxVector, boundingBox.maximumWorld);
//             });

//             const cumulativeBoundingBox = new BABYLON.BoundingBox(minVector, maxVector);
//             console.log('Cumulative Bounding Box:', cumulativeBoundingBox);

//             // Store the cumulative bounding box in state
//             setBoundingBoxes(prevBoundingBoxes => [...prevBoundingBoxes, cumulativeBoundingBox]);

//             // Create a cube based on the cumulative bounding box
//             const boundingBoxSize = maxVector.subtract(minVector);
//             const boundingBoxCenter = minVector.add(boundingBoxSize.scale(0.5));

//             const box = BABYLON.MeshBuilder.CreateBox("boundingBox", {
//               height: boundingBoxSize.y,
//               width: boundingBoxSize.x,
//               depth: boundingBoxSize.z
//             }, scene);

//             box.position = boundingBoxCenter;
//             box.isVisible = true; // Make sure the box is visible

//             // Add material to the box for better visibility
//             const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
//             boxMaterial.wireframe = true; // Show as wireframe
//             boxMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green color
//             box.material = boxMaterial;

//             // Adjust camera to focus on the loaded scene
//             if (scene.activeCamera) {
//               scene.activeCamera.attachControl(canvasRef.current, true);
//               camera.setTarget(boundingBoxCenter);
//               const radius = boundingBoxSize.length() * 1.5; // Adjust the multiplier as needed
//               camera.radius = radius;
//             }
//           });
//         }
//       };
//       reader.readAsDataURL(file);
//     });
//   };

//   return (
//     <div>
//       <input
//         type="file"
//         multiple
//         accept=".babylon,.gltf,.glb"
//         onChange={handleFileChange}
//       />
//       <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100vh - 40px)' }} />
//       <div>
//         <h3>Cumulative Bounding Boxes</h3>
//         <ul>
//           {boundingBoxes.map((box, index) => (
//             <li key={index}>
//               Min: ({box.minimum.x.toFixed(2)}, {box.minimum.y.toFixed(2)}, {box.minimum.z.toFixed(2)}), 
//               Max: ({box.maximum.x.toFixed(2)}, {box.maximum.y.toFixed(2)}, {box.maximum.z.toFixed(2)})
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default BabylonViewer;