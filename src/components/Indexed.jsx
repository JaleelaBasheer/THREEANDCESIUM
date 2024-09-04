// import React, { useRef, useEffect, useState } from 'react';
// import * as BABYLON from '@babylonjs/core';
// import '@babylonjs/loaders'; // Make sure to include loaders if you use external assets
// import { openDatabase, addScene, getScene } from './database';
// function Indexed() {
//     const canvasRef = useRef(null);
//     const [scene, setScene] = useState(null);
//     const [engine, setEngine] = useState(null);
  
//     useEffect(() => {
//       openDatabase().then(() => {
//         const engine = new BABYLON.Engine(canvasRef.current, true);
//         const scene = new BABYLON.Scene(engine);
//         const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
//         camera.setPosition(new BABYLON.Vector3(0, 0, -10));
//         camera.attachControl(canvasRef.current, true);
        
//         const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
  
//         engine.runRenderLoop(() => {
//           scene.render();
//         });
  
//         window.addEventListener('resize', () => {
//           engine.resize();
//         });
  
//         setScene(scene);
//         setEngine(engine);
  
//         return () => {
//           window.removeEventListener('resize', () => {
//             engine.resize();
//           });
//           scene.dispose();
//           engine.dispose();
//         };
//       });
//     }, []);
  
//     const handleFileChange = (event) => {
//       const files = event.target.files;
  
//       Array.from(files).forEach(file => {
//         const reader = new FileReader();
//         reader.onload = async () => {
//           const data = reader.result;
//           await BABYLON.SceneLoader.Append('', data, scene, (loadedScene) => {
//             // Adjust camera to focus on the loaded scene
//             if (scene.activeCamera) {
//               scene.activeCamera.attachControl(canvasRef.current, true);
//             }
//           });
          
//           // Store scene data in IndexedDB
//           const sceneData = { name: file.name, data: data };
//           const sceneId = await addScene(sceneData);
//           console.log(`Scene added with ID: ${sceneId}`);
//         };
//         reader.readAsDataURL(file);
//       });
//     };
  
//     const loadSceneFromDB = async (id) => {
//       const sceneData = await getScene(id);
//       if (sceneData) {
//         BABYLON.SceneLoader.Append('', sceneData.data, scene, (loadedScene) => {
//           if (scene.activeCamera) {
//             scene.activeCamera.attachControl(canvasRef.current, true);
//           }
//         });
//       }
//     };
  
//     return (
//       <div>
//         <input 
//           type="file" 
//           multiple 
//           accept=".babylon,.gltf,.glb" 
//           onChange={handleFileChange} 
//         />
//         <button onClick={() => loadSceneFromDB(20)}>Load Scene from DB</button> {/* Example button to load a scene by ID */}
//         <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100vh - 40px)' }} />
//       </div>
//     );
//   };

// export default Indexed



