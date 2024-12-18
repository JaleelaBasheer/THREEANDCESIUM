import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { openDB } from "idb";
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
    for (let i = 0; i < 8; i++) {
      const newSize = this.size / 2;
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
    return Math.abs(point.x - this.center.x) <= this.size / 2 &&
           Math.abs(point.y - this.center.y) <= this.size / 2 &&
           Math.abs(point.z - this.center.z) <= this.size / 2;
  }

  intersectRay(ray, intersects = []) {
    if (!this.intersectsRay(ray)) return intersects;

    if (this.children === null) {
      for (let object of this.objects) {
        if (ray.intersectBox(new THREE.Box3().setFromObject(object), new THREE.Vector3())) {
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
    const bbox = new THREE.Box3().setFromCenterAndSize(this.center, new THREE.Vector3(this.size, this.size, this.size));
    return ray.intersectsBox(bbox);
  }
}
function FBXViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controlsRef = useRef(null);
  const [db, setDb] = useState(null);
  const cumulativeBoundingBoxRef = useRef(new THREE.Box3());
  const cumulativeBoundingBoxRef1 = useRef(new THREE.Box3());

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
  const [flySpeed, setFlySpeed] = useState(1); 
  const [flyrotationSpeed, setflyrotationSpeed] = useState(1); 
  const [tileSize,setTileSize] = useState();
  const [loadingProgress, setLoadingProgress] = useState(0); 
  const [loading,setLoading] =useState(false);
  const octreeRef = useRef(null);
  
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

  rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  rendererRef.current.setClearColor(0xffff00);
  mountRef.current.appendChild(rendererRef.current.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  sceneRef.current.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 0);
  sceneRef.current.add(directionalLight);

  animate();

  return () => {
    mountRef.current.removeChild(rendererRef.current.domElement);
  };
}, []);

useEffect(() => {
  // Initialize workers
  const newWorkers = {
    priority1: new Worker(new URL("./modelLoader.worker.js", import.meta.url), { type: "module" }),
    priority2: new Worker(new URL("./modelLoader.worker.js", import.meta.url), { type: "module" }),
    priority3: new Worker(new URL("./modelLoader.worker.js", import.meta.url), { type: "module" }),
    priority4: new Worker(new URL("./modelLoader.worker.js", import.meta.url), { type: "module" }),
  };

  setWorkers(newWorkers);

  // Set up message handlers for workers
  Object.entries(newWorkers).forEach(([priority, worker]) => {
    worker.onmessage = (e) => handleWorkerMessage(e, priority);
  });

  // Call processQueues after workers are initialized
  processQueues();

  return () => {
    Object.values(newWorkers).forEach((worker) => worker.terminate());
  };
}, []);

  const handleWorkerMessage = (e, priority) => {
    const { type, data } = e.data;
    if (type === 'meshLoaded') {
      // Handle loaded mesh
      const mesh = loadedMeshesRef.current.find(m => m.id === data.id);
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

    if (distance < 2) newPriority = 'priority1';
    else if (distance < 100) newPriority = 'priority2';
    // else if (distance < 500) newPriority = 'priority3';
    else newPriority = 'unloaded';

    // Move mesh to appropriate queue
    Object.entries(meshQueues.current).forEach(([priority, queue]) => {
      const index = queue.findIndex(m => m.id === mesh.id);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    });

    meshQueues.current[newPriority].push(mesh);
  };

 // Raycaster for occlusion culling
 const raycaster = new THREE.Raycaster();


 // Initialize Octree
 octreeRef.current = new Octree(new THREE.Vector3(0, 0, 0), 40);
 const removeTexturesFromMaterials = (object) => {
  object.traverse((child) => {
    if (child.isMesh) {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.map = null; // Remove texture map
            material.needsUpdate = true;
          });
        } else {
          child.material.map = null; // Remove texture map
          child.material.needsUpdate = true;
        }
      }
    }

  });
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
          removeTexturesFromMaterials(object);
          object.traverse((child) => {
            if (child.isMesh) {
              child.visible = false;
              // Instead of reassigning `id`, store a custom unique ID in userData or another custom property
              child.userData.customID = THREE.MathUtils.generateUUID();
              loadedMeshesRef.current.push(child);
              meshQueues.current.unloaded.push(child);
              octreeRef.current.add(child);

            }
          });
          updateMeshPriorities();
          sceneRef.current.add(object);
          // createBoundingBox(object);
          // updateCumulativeBoundingBox();
          
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }
  };
  
// Occlusion culling function
const performOcclusionCulling = () => {
  const cameraPosition = cameraRef.current.position;
  const direction = new THREE.Vector3();

  loadedMeshesRef.current.forEach((mesh) => {
    mesh.visible = false; // Hide all initially
    direction.subVectors(mesh.position, cameraPosition).normalize();
    raycaster.set(cameraPosition, direction);

    const intersects = octreeRef.current.intersectRay(raycaster.ray);
    if (intersects.length > 0 && intersects[0] === mesh) {
      mesh.visible = true;
    }
  });
};

const handleCulling = () => {
  const camera = cameraRef.current;

  frustumMatrixRef.current.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustumRef.current.setFromProjectionMatrix(frustumMatrixRef.current);

  loadedMeshesRef.current.forEach((mesh) => {
    const isInsideFrustum = frustumRef.current.intersectsBox(
      new THREE.Box3().setFromObject(mesh)
    );
    const distance = mesh.position.distanceTo(camera.position);
    console.log("distance",distance)

    if (isInsideFrustum && distance < 500) {
      mesh.visible = true;
      raycaster.set(camera.position, mesh.position.clone().normalize());

      const intersects = octreeRef.current.intersectRay(raycaster.ray);

      mesh.visible = intersects.length === 0;
    } else {
      mesh.visible = false;
    }
  });
};
  const updateMeshPriorities = () => {
    loadedMeshesRef.current.forEach(updateMeshPriority);
    processQueues();
  };

  const processQueues = () => {
    Object.entries(meshQueues.current).forEach(([priority, queue]) => {
      if (priority !== 'unloaded' && queue.length > 0) {
        const mesh = queue.shift();
        console.log(mesh);
  
        // Check if the worker exists before posting a message
        if (workers[priority]) {
          workers[priority].postMessage({ type: 'loadMesh', data: { id: mesh.id, priority } });
        } else {
          console.error(`Worker for ${priority} not initialized.`);
        }
      }
    });
  };

  const createBoundingBox = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    // const helper = new THREE.Box3Helper(box, 0xffff00);
    // sceneRef.current.add(helper);
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


  const updateVisibleMeshes = () => {
    frustumMatrixRef.current.multiplyMatrices(cameraRef.current.projectionMatrix, cameraRef.current.matrixWorldInverse);
    frustumRef.current.setFromProjectionMatrix(frustumMatrixRef.current);
  
    loadedMeshesRef.current.forEach((mesh) => {
      const isVisible = frustumRef.current.intersectsObject(mesh);
      if (isVisible) {
        if (!sceneRef.current.children.includes(mesh)) {
          sceneRef.current.add(mesh);
        }
        mesh.visible = true;
        updateMeshPriority(mesh);
      } else {
        if (sceneRef.current.children.includes(mesh)) {
          sceneRef.current.remove(mesh);
        }
        mesh.visible = false;
      }
    });
  
    processQueues();
  };
  

  const onFileChange = (event) => {
    const fbxLoader = new FBXLoader();
    const files = event.target.files;
    const cumulativeBox = new THREE.Box3();

    if (files.length > 0) {
      setLoading(true);
      let loadedFilesCount = 0;

      Array.from(files).forEach((file) => {
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
          setLoadingProgress(Math.round((loadedFilesCount / files.length) * 100));

          // After all files are loaded, log the final cumulative bounding box
          if (loadedFilesCount === files.length) {
            const center = cumulativeBox.getCenter(new THREE.Vector3());
            const size = cumulativeBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = cameraRef.current.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; // Zoom out a little so object fits in view

            cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
            cameraRef.current.lookAt(center);

            // Remove progress bar after loading
            setLoading(false);
            setLoadingProgress(0);
          }
        });

        loadModel(file);
      });
    }
  };
  

  const animate = () => {
    requestAnimationFrame(animate);
    // controlsRef.current.update();
      updateVisibleMeshes();
      // performOcclusionCulling();
      // handleCulling();
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
    
    // document.addEventListener('wheel', handleWheel);
}
// disableflycontrols
const disableflycontrols=()=>{
	document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);    
    // document.removeEventListener('wheel', handleWheel);
}

  return (
    <div className="main">
      <div className="canvas-container" style={{position:'relative',width:'100%',height:'100vh',overflow:'hidden'}}>
        <input style={{position:'absolute',top:'10px',left:'10px'}} className="button" type="file" multiple onChange={onFileChange} accept=".fbx" />
        <div ref={mountRef} style={{ width: "100%", height: "100vh" }}></div>
        {loading && (
        <div style={{width:'100%',position:'absolute', height:'100vh'}}>
          <p>Loading: {loadingProgress}%</p>
        </div>
      )}
      </div>
    </div>
  );
}

export default FBXViewer;