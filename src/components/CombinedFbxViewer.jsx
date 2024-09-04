import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { openDB } from "idb";

function CombinedFBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const [db, setDb] = useState(null);
  const cumulativeBoundingBoxRef = useRef(new THREE.Box3());
  const loadedMeshesRef = useRef([]);
  const frustumRef = useRef(new THREE.Frustum());
  const frustumMatrixRef = useRef(new THREE.Matrix4());
  const flyModeCameraPosition = useRef(new THREE.Vector3());
  const mouse = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const isPanning = useRef(false);
  const isZooming = useRef(false);
  const lastMouseMovement = useRef({ x: 0, y: 0 });
  const [flySpeed, setFlySpeed] = useState(0.1);
  const [flyRotationSpeed, setFlyRotationSpeed] = useState(0.1);
  const octreeRef = useRef(new THREE.Group());

  const meshQueues = useRef({
    inFrustum: [],
    priority1: [],
    priority2: [],
    unloaded: []
  });

  const workersRef = useRef({
    loader: null
  });

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
    setupScene();
    setupWorkers();
    enablefycontrols();

    return () => {
      disableflycontrols();
      Object.values(workersRef.current).forEach(worker => worker && worker.terminate());
    };
  }, []);

  useEffect(() => {
    enablefycontrols();
    return () => disableflycontrols();
  }, [flySpeed, flyRotationSpeed]);

  const setupScene = () => {
    cameraRef.current.position.set(0, 0, 100);
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setClearColor(0xffff00);
    mountRef.current.appendChild(rendererRef.current.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    sceneRef.current.add(octreeRef.current);

    animate();
  };

  const setupWorkers = () => {
    const worker = new Worker(new URL("./meshLoader.js", import.meta.url), { type: "module" });
    worker.onmessage = handleWorkerMessage;
    workersRef.current.loader = worker;
  };


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

 

  const createBoundingBox = (object) => {
    const box = new THREE.Box3().setFromObject(object);
  };

  const updateCumulativeBoundingBox = () => {
    cumulativeBoundingBoxRef.current.makeEmpty();
    loadedMeshesRef.current.forEach((mesh) => {
      cumulativeBoundingBoxRef.current.expandByObject(mesh);
    });
  };

  const adjustCamera = () => {
    const box = cumulativeBoundingBoxRef.current;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
  };

  const handleWorkerMessage = (e) => {
    const { action, meshData } = e.data;
    const mesh = loadedMeshesRef.current.find(m => m.userData.customID === meshData.id);
    if (mesh) {
      if (action === 'loaded') {
        mesh.visible = true;
        const priority = mesh.userData.currentPriority;
        const index = meshQueues.current[priority].findIndex(m => m.userData.customID === meshData.id);
        if (index !== -1) meshQueues.current[priority].splice(index, 1);
      }
      updateVisibleMeshes();
    }
  };

  const updateVisibleMeshes = () => {
    frustumMatrixRef.current.multiplyMatrices(cameraRef.current.projectionMatrix, cameraRef.current.matrixWorldInverse);
    frustumRef.current.setFromProjectionMatrix(frustumMatrixRef.current);
  
    loadedMeshesRef.current.forEach((mesh) => {
      const isInFrustum = frustumRef.current.intersectsObject(mesh);
      const currentPriority = mesh.userData.currentPriority || 'unloaded';
      let newPriority;
  
      if (isInFrustum) {
        newPriority = 'inFrustum';
      } else {
        newPriority = determinePriority(mesh);
      }
  
      if (currentPriority !== newPriority) {
        // Remove from current queue
        const currentIndex = meshQueues.current[currentPriority].findIndex(m => m.userData.customID === mesh.userData.customID);
        if (currentIndex !== -1) meshQueues.current[currentPriority].splice(currentIndex, 1);
  
        // Add to new queue
        meshQueues.current[newPriority].push(mesh);
        mesh.userData.currentPriority = newPriority;
      }
    });
  
    processQueues();
    // logMeshQueues(); // New function to log mesh queues
  };

  const logMeshQueues = () => {
    console.log("inFrustum:", meshQueues.current.inFrustum.map(m => m.userData.customID));
    console.log("priority1:", meshQueues.current.priority1.map(m => m.userData.customID));
    console.log("priority2:", meshQueues.current.priority2.map(m => m.userData.customID));
  };


  const determinePriority = (mesh) => {
    const distance = mesh.position.distanceTo(cameraRef.current.position);
    if (distance < 5) return 'priority1';
    return 'priority2';
  };

  const processQueues = () => {
    const priorities = ['inFrustum', 'priority1', 'priority2'];
    priorities.forEach(priority => {
      while (meshQueues.current[priority].length > 0) {
        const meshToLoad = meshQueues.current[priority][0];
        if (!meshToLoad.visible) {
          workersRef.current.loader.postMessage({
            action: 'load',
            meshData: { id: meshToLoad.userData.customID, priority }
          });
          break;
        } else {
          meshQueues.current[priority].shift();
        }
      }
    });
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
          updateVisibleMeshes();
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    updateVisibleMeshes();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  // Fly controls
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
                    const rotationAngle = -movementX * rotationSpeed * horizontalSensitivity * flyRotationSpeed *tileSizeFactor;

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
      </div>
    </div>
  );
}

export default CombinedFBXViewer;