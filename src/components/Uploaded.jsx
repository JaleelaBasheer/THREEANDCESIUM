import React , { useRef, useEffect, useState } from 'react'
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { openDB } from 'idb';

function Uploaded() {
    const mountRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
    const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
    const controlsRef = useRef(null);
    const [db, setDb] = useState(null);
    const cumulativeBoundingBoxRef = useRef(new THREE.Box3());
    const cumulativeBoundingBoxHelperRef = useRef(null);
    const loadedMeshesRef = useRef([]);
    const frustumRef = useRef(new THREE.Frustum());
    const frustumMatrixRef = useRef(new THREE.Matrix4());
    const flyModeCameraPosition = useRef(new THREE.Vector3());
    const orbitControlsTargets = useRef(new THREE.Vector3()); 
    const mouse = useRef({ x: 0, y: 0 });
    const isMouseDown = useRef(false);
    const isPanning = useRef(false);
    const isZooming = useRef(false);
    const lastMouseMovement = useRef({ x: 0, y: 0 });
    const [flySpeed, setFlySpeed] = useState(0.1); 
    const [flyrotationSpeed, setflyrotationSpeed] = useState(.1); 
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [selectedFiles,setSelectedFiles] = useState([]);
    const [workers, setWorkers] = useState({
      priority1: null,
      priority2: null,
      priority3: null
    });
  
    const meshQueues = useRef({
      priority1: [],
      priority2: [],
      priority3: [],
      unloaded: []
    });

    const workersRef = useRef({
      priority1: null,
      priority2: null,
      priority3: null
    });
  
    useEffect(() => {
         
      enablefycontrols();
  
  // Cleanup function to remove event listeners
  return () => {
      disableflycontrols();
  };
  }, [ flySpeed, flyrotationSpeed]);
  
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
      cameraRef.current.position.set(0,0,100)
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.setClearColor(0xffff00);
      mountRef.current.appendChild(rendererRef.current.domElement);
  
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      sceneRef.current.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 0);
      sceneRef.current.add(directionalLight);
        // Add the octree group to the scene
  
      // controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
      // controlsRef.current.enableDamping = true;
      // controlsRef.current.dampingFactor = 0.1;
  
      animate();
      const priority1Worker = new Worker(new URL("../components/priorityWorkers.js", import.meta.url), { type: "module" });
      const priority2Worker = new Worker(new URL("../components/priorityWorkers.js", import.meta.url), { type: "module" });
      const priority3Worker = new Worker(new URL("../components/priorityWorkers.js", import.meta.url), { type: "module" });
    
      setWorkers({
        priority1: priority1Worker,
        priority2: priority2Worker,
        priority3: priority3Worker
      });
    
      // Update the workersRef immediately
      workersRef.current = {
        priority1: priority1Worker,
        priority2: priority2Worker,
        priority3: priority3Worker
      };
    
      // Set up message handlers for workers
      priority1Worker.onmessage = handleWorkerMessage;
      priority2Worker.onmessage = handleWorkerMessage;
      priority3Worker.onmessage = handleWorkerMessage;
    
      return () => {
        // Terminate workers on cleanup
        priority1Worker.terminate();
        priority2Worker.terminate();
        priority3Worker.terminate();
      };
    },[]);
    const loadModel = async (file) => {
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
                setLoadingProgress(prev => prev + 1);
              object.traverse((child) => {
                if (child.isMesh) {
                  child.visible = false;
                  child.userData.customID = THREE.MathUtils.generateUUID();
                  child.userData.currentPriority = 'unloaded';
                  loadedMeshesRef.current.push(child);
                  meshQueues.current.unloaded.push(child);
                  

                }
              });
              sceneRef.current.add(object);
                createBoundingBox(object);
                    updateCumulativeBoundingBox();
                    adjustCamera();
                processQueues();
            },
            undefined,
            (error) => {
              console.error("Error loading model:", error);
            }
          );
        }
      };
    const createBoundingBox = (object) => {
        const box = new THREE.Box3().setFromObject(object);
       
      };
    
      const updateCumulativeBoundingBox = () => {
        cumulativeBoundingBoxRef.current.makeEmpty();
        loadedMeshesRef.current.forEach((mesh) => {
          cumulativeBoundingBoxRef.current.expandByObject(mesh);
        });
    
        // if (cumulativeBoundingBoxHelperRef.current) {
        //   sceneRef.current.remove(cumulativeBoundingBoxHelperRef.current);
        // }
    
        // cumulativeBoundingBoxHelperRef.current = new THREE.Box3Helper(cumulativeBoundingBoxRef.current, 0xff0000);
        // sceneRef.current.add(cumulativeBoundingBoxHelperRef.current);
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
       
      };
      const handleWorkerMessage = (e) => {
        const { action, meshData } = e.data;
        const mesh = loadedMeshesRef.current.find(m => m.userData.customID === meshData.id);
        if (mesh) {
          if (action === 'loaded') {
            mesh.visible = true;
            // Remove from priority queue as it's now loaded
            const priority = mesh.userData.currentPriority;
            const index = meshQueues.current[priority].findIndex(m => m.userData.customID === meshData.id);
            if (index !== -1) meshQueues.current[priority].splice(index, 1);
          } else if (action === 'unloaded') {
            mesh.visible = false;
            // Remove from unloaded queue as it's now unloaded
            const index = meshQueues.current.unloaded.findIndex(m => m.userData.customID === meshData.id);
            if (index !== -1) meshQueues.current.unloaded.splice(index, 1);
          }
          updateVisibleMeshes();
        }
      };
      const processQueues = () => {
        const priorities = ['priority1', 'priority2', 'priority3', 'unloaded'];
        const maxProcessPerPriority = 5; // Increase this number to process more meshes per frame
      
        priorities.forEach(priority => {
          const worker = workersRef.current[priority];
          if (worker) {
            let processedCount = 0;
            while (meshQueues.current[priority].length > 0 && processedCount < maxProcessPerPriority) {
              const mesh = meshQueues.current[priority][0];
              if (priority === 'unloaded') {
                if (mesh.visible) {
                  worker.postMessage({
                    action: 'unload',
                    meshData: { id: mesh.userData.customID }
                  });
                  processedCount++;
                }
                meshQueues.current[priority].shift();
              } else {
                if (!mesh.visible) {
                  worker.postMessage({
                    action: 'load',
                    meshData: { id: mesh.userData.customID }
                  });
                  processedCount++;
                }
                meshQueues.current[priority].shift();
              }
            }
          }
        });
      };
      const updateVisibleMeshes = () => {
        frustumMatrixRef.current.multiplyMatrices(cameraRef.current.projectionMatrix, cameraRef.current.matrixWorldInverse);
        frustumRef.current.setFromProjectionMatrix(frustumMatrixRef.current);
      
        loadedMeshesRef.current.forEach((mesh) => {
          const newPriority = determinePriority(mesh);
          const currentPriority = mesh.userData.currentPriority || 'unloaded';
      
          if (frustumRef.current.intersectsObject(mesh)) {
            if (currentPriority !== newPriority) {
              // Remove from current queue and add to new queue
              if (currentPriority !== 'unloaded') {
                const index = meshQueues.current[currentPriority].findIndex(m => m.userData.customID === mesh.userData.customID);
                if (index !== -1) meshQueues.current[currentPriority].splice(index, 1);
              }
              meshQueues.current[newPriority].push(mesh);
              mesh.userData.currentPriority = newPriority;
            }
          } else if (currentPriority !== 'unloaded') {
            // Mesh is out of frustum, move to unloaded queue
            const index = meshQueues.current[currentPriority].findIndex(m => m.userData.customID === mesh.userData.customID);
            if (index !== -1) meshQueues.current[currentPriority].splice(index, 1);
            meshQueues.current.unloaded.push(mesh);
            mesh.userData.currentPriority = 'unloaded';
          }
        });
      
        if (workersRef.current.priority1 && workersRef.current.priority2 && workersRef.current.priority3) {
          processQueues();
        }
      };
    
      const determinePriority = (mesh) => {
        const distance = mesh.position.distanceTo(cameraRef.current.position);
        if (distance < 100) return 'priority1';
        if (distance < 500) return 'priority2';
        return 'priority3';
      };
    
      const animate = () => {
        requestAnimationFrame(animate);
        updateVisibleMeshes();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };
    
      let continueTranslation = false;
      let continueRotation = false;
      let translationDirection = 0;
      let rotationDirection = 0;
      let translationSpeed = 5; // Initial translation speed
      let rotationSpeed = 0.001; // Initial rotation speed
    // Define sensitivity constants
      const horizontalSensitivity = 1.1; // Adjust as needed
      const verticalSensitivity = 1.1; // Adjust as needed
    
      // mouse events functions on fly control
    
      const handleMouseDown = (event) => {
            // event.preventDefault();
            const mouseEvent = event.touches ? event.touches[0] : event;
            if (mouseEvent.button === 0) { // Left mouse button pressed
                
                isMouseDown.current = true;
                mouse.current.x = mouseEvent.clientX;
                mouse.current.y = mouseEvent.clientY;
                isZooming.current = true;
                continueTranslation = true; // Enable automatic translation
                continueRotation = true; // Enable automatic rotation
                translationDirection = lastMouseMovement.current.y > 0 ? 1 : -1; // Set translation direction based on last mouse movement
                rotationDirection = lastMouseMovement.current.x > 0 ? 1 : -1; // Set rotation direction based on last mouse movement
            } else if (event.button === 1) { // Middle mouse button pressed
                console.log("middlebutton pressed")
                isPanning.current = true;
                continueTranslation = true; // Enable automatic translation
                mouse.current.x = mouseEvent.clientX;
                mouse.current.y = mouseEvent.clientY;
            }
        };
    
        const handleMouseUp = () => {
            isMouseDown.current = false;
            isPanning.current = false;
            isZooming.current = false;    
            lastMouseMovement.current = { x: 0, y: 0 };
        };
    
        const handleMouseMove = (event) => {
            event.preventDefault();
    
            const mouseEvent = event.touches ? event.touches[0] : event;
            if (!isMouseDown.current && !isPanning.current && !isZooming.current) return;
        
            const movementX = mouseEvent.clientX - mouse.current.x;
            const movementY = mouseEvent.clientY - mouse.current.y;
        
            lastMouseMovement.current = { x: movementX, y: movementY };
            if (isMouseDown.current) { // Left mouse button clicked
                const isHorizontal = Math.abs(movementX) > Math.abs(movementY);
                if (isHorizontal) { // Horizontal movement, rotate around Y axis
                    continueCameraMovement(); 
                } else  { // Vertical movement, forward/backward
                    continueCameraMovement(); // Adjust with factors
                }
            } else if (isPanning.current) { // Middle mouse button clicked
    
                continueCameraMovement(movementX, movementY); // Adjust with factors
            }
        
            mouse.current.x = mouseEvent.clientX;
            mouse.current.y = mouseEvent.clientY;
        };
        
        const handleWheel = (event) => {
        const rotationAngle = -event.deltaY * 0.001;
    
        // Get the camera's up vector
        let cameraUp = new THREE.Vector3(1, 0, 0); // Assuming Y-axis is up
        cameraUp.applyQuaternion(cameraRef.current.quaternion);
    
        // Create a quaternion representing the rotation around the camera's up vector
        let quaternion = new THREE.Quaternion().setFromAxisAngle(cameraUp, rotationAngle);
    
        cameraRef.current.applyQuaternion(quaternion);
        storeCameraPosition(); // Assuming this function stores camera position
    
        };
    
        const continueCameraMovement = () => {
            const adjustedTranslationSpeed = flySpeed * translationSpeed ;
            if (isMouseDown.current && (continueTranslation || continueRotation)) {
                
                    requestAnimationFrame(continueCameraMovement);
                    const movementX = lastMouseMovement.current.x;
                    const movementY = lastMouseMovement.current.y;
                    const tileSizeFactor =10; // Implement this function to calculate the factor based on tile size
                    const isHorizontal = Math.abs(movementX) > Math.abs(movementY);
                    if(isHorizontal){
                        const rotationAngle = -movementX * rotationSpeed * horizontalSensitivity * flyrotationSpeed *tileSizeFactor;
    
                        // Get the camera's up vector
                        let cameraUp = cameraRef.current.up.clone().normalize();
                        
                        // Create a quaternion representing the rotation around the camera's up vector
                        let quaternion = new THREE.Quaternion().setFromAxisAngle(cameraUp, rotationAngle);
                        
                        cameraRef.current.applyQuaternion(quaternion);
                        storeCameraPosition();
    
                    }
                    else {
                        const zoomSpeed = movementY * 0.01; // Adjust zoom speed based on last recorded mouse movement
    
                        const forwardDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(cameraRef.current.quaternion);
                    // Move the camera forward/backward along its local forward direction
                    cameraRef.current.position.add(forwardDirection.multiplyScalar(zoomSpeed * adjustedTranslationSpeed * tileSizeFactor));
                    storeCameraPosition();
    
                    }			
            }
            
            else if (isPanning.current && (continueTranslation)) {
                requestAnimationFrame(continueCameraMovement);
                const tileSizeFactor = 0.1;
                const movementY = lastMouseMovement.current.y;
                const movementX = lastMouseMovement.current.x;
            const adjustedHorizontalSensitivity = horizontalSensitivity * tileSizeFactor;
            const adjustedVerticalSensitivity = verticalSensitivity * tileSizeFactor;
    
                // Calculate movement speed based on mouse movement and sensitivity
                const moveSpeedX = movementX * adjustedHorizontalSensitivity;
                const moveSpeedY = movementY * adjustedVerticalSensitivity;
               
                const isHorizontal = Math.abs(movementX) > Math.abs(movementY);
                const isVertical = Math.abs(movementY) > Math.abs(movementX);
            
                if (isHorizontal) {
                    // Move the camera along its local x axis
                    cameraRef.current.translateX(moveSpeedX);
                    storeCameraPosition()
                } else if (isVertical) {
                    // Move the camera along its local y axis
                    cameraRef.current.translateY(-moveSpeedY);
                    storeCameraPosition()
    
                }
    
    
            }
        };
        const storeCameraPosition = () => {
        const { position,} = cameraRef.current;
        flyModeCameraPosition.current.copy(position);
        // console.log('Camera position stored:', position);
        // const { position, quaternion } = cameraRef.current;
        // flyModeCameraPosition.current.copy(position);
        // orbitControlsTargets.current.copy(controlsRef.current.target);
        // // Optionally, you can save this state to a database or local storage.
        // console.log('Camera position stored:', position);
        };
    
      // enablefycontrols
    const enablefycontrols=()=>{
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        
    }
    // disableflycontrols
    const disableflycontrols=()=>{
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);    
    }
    const onFileChange = (event) => {
        const files = event.target.files;
        setSelectedFiles(event.target.files);
        if(files.length>0){
            
        }
        if (files.length > 0) {
          Array.from(files).forEach((file) => {
            loadModel(file);
          });
        }
      };
      return (
        <div className="main">
        <div className="canvas-container" style={{position:'relative',width:'100%',height:'100vh',overflow:'hidden'}}>
          <input style={{position:'absolute',top:'10px',left:'10px'}} className="button" type="file" multiple onChange={onFileChange} accept=".fbx" />
          <div ref={mountRef} style={{ width: "100%", height: "100vh" }}></div>
          {loadingProgress > 0 && loadingProgress < selectedFiles.length && (
        <div style={{position: 'absolute', bottom: '20px', left: '20px', background: 'white', padding: '10px'}}>
          Loading progress: {loadingProgress} /{ selectedFiles.length}
        </div>
      )}
        </div>
      </div>
      );
    }
    
    export default Uploaded;