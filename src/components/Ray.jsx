import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
import { getAllOffset } from '../services/AllApis';
import { Card, Form,FloatingLabel, Row, Button } from 'react-bootstrap'
import { getALl, getAllComment, getallobject } from '../services/AllApis';



function Ray({ ionAccessToken: initialIonAccessToken }) {
  const canvasRef = useRef(null);
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [ionAssetId, setIonAssetId] = useState('2480864');
  const [ionAccessToken, setIonAccessToken] = useState(initialIonAccessToken);
  const [assetList, setAssetList] = useState([]);
  const [scenes, setScenes] = useState(null);
  const [allfilestable,setallfilestable] = useState([]);
  const [objecttable ,setobjecttable] = useState([]);  
  const [size, setSize] = useState([1, 1, 1]);
  const [position, setPosition] = useState([0, 0, 0]);
  const [color, setColor] = useState('#00ff00');
  const [name, setName] = useState('Cube');
  let  controls, controls2D, tiles, light, offsetParent,css2dRenderer;
  const [viewMode, setViewMode] = useState('plan'); // State to track the view mode
  const [zoomFit, setZoomFit] = useState('zoomout'); // State to track the view mode
  const [storedBoundingBoxMax,setstoredBoundingBoxMax] =useState(new THREE.Vector3()) ;
  const [storedBoundingBoxMin,setstoredBoundingBoxMin] =useState(new THREE.Vector3()) ;
  const [personControl,setPersonControl]= useState(false);



  const params = {
    'raycast': NONE,
    'ionAssetId': ionAssetId,
    'ionAccessToken': ionAccessToken,
    // 'reload': () => {
    //   reinstantiateTiles();
    // },
  };

  const camera = useRef(null)
  const scene =useRef(null)
  const raycaster = useRef(null);
  const mouse = useRef(null)
  const renderer = useRef(null)
  useEffect(()=>{
		const getallobjectTable = async ()=>{
		  const response = await getALl()
		  if(response.status===200){
			setobjecttable(response.data);
		  }
		  else{
			alert("Cannot fetch mesh data!!!")
		  }
	  
		}
		const getallfiletable = async()=>{
		  const response = await getallobject()
		  if(response.status ===200){
			// console.log(response.data);
	         setallfilestable(response.data);
		  }
		  else{
			alert("Cannot fetch file data")
		  }
		}

	
		getallfiletable();  
	   getallobjectTable();
	   
	  },[])
  

 

  useEffect(() => {  
    const setupTiles = () => {
      tiles.fetchOptions.mode = 'cors';
  
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        'https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/'
      );
  
      const loader = new GLTFLoader(tiles.manager);
      loader.setDRACOLoader(dracoLoader);
  
      tiles.manager.addHandler(/\.gltf$/, loader);
      scene.current.add(tiles.group);
    };
    
  
    const reinstantiateTiles = () => {
      if (tiles) {
        scene.current.remove(tiles.group);
        tiles.dispose();
        tiles = null;
      }
  
      tiles = new CesiumIonTilesRenderer(params.ionAssetId, params.ionAccessToken);
      console.log(tiles);
      tiles.onLoadTileSet = () => {
        // createLabels() 
        const sphere = new THREE.Sphere();
        tiles.getBoundingSphere(sphere);
  
        const position = sphere.center.clone();
        const distanceToEllipsoidCenter = position.length();
  
        const surfaceDirection = position.normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const rotationToNorthPole = rotationBetweenDirections(surfaceDirection, up);
  
        tiles.group.quaternion.x = rotationToNorthPole.x;
        tiles.group.quaternion.y = rotationToNorthPole.y;
        tiles.group.quaternion.z = rotationToNorthPole.z;
        tiles.group.quaternion.w = rotationToNorthPole.w;
  
        tiles.group.position.y = -distanceToEllipsoidCenter;
      
        
  
      
      };
  
      setupTiles();
  
    };
  
    
  
    const rotationBetweenDirections = (dir1, dir2) => {
      const rotation = new THREE.Quaternion();
      const a = new THREE.Vector3().crossVectors(dir1, dir2);
      rotation.x = a.x;
      rotation.y = a.y;
      rotation.z = a.z;
      rotation.w = 1 + dir1.clone().dot(dir2);
      rotation.normalize();
  
      return rotation;
       };
  
      
  
    const init = () => {
      scene.current = new THREE.Scene();
      setScenes(scene);
      renderer.current = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current ,alpha:true});
      renderer.current.setClearColor(0xffff00);  //color yellow
      document.body.appendChild(renderer.current.domElement);
      renderer.current.domElement.tabIndex = 1;
  
      camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 4000);
      camera.current.position.set(0,0,600);
      camera.current.lookAt(0,0,0);
      // Create a camera axis object
const axisHelper = new THREE.AxesHelper(100); // Adjust the size as needed
scene.current.add(axisHelper);
     
      
  document.body.appendChild(renderer.current.domElement);
  
  
       controls = new OrbitControls(camera.current,renderer.current.domElement);
  
      controls.enableDamping = true;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 2000;
  
      light = new THREE.PointLight(0xffff00, 1);
      camera.current.add(light);
      scene.current.add(camera.current);
  
      const dirLight = new THREE.DirectionalLight(0xffffff);
      dirLight.position.set(1, 2, 3);
      scene.current.add(dirLight);
  
      const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.current.add(ambLight);
  
      offsetParent = new THREE.Group();
      scene.current.add(offsetParent);
  
      raycaster.current = new THREE.Raycaster();
  mouse.current = new THREE.Vector2();
  
       // Set up initial view mode
       switchViewMode(viewMode);
  
      enableInteractions();
  
      reinstantiateTiles();
  
  
      onWindowResize();
      window.addEventListener('resize', onWindowResize, false);
  
      
    };

    let selectedObject = null;
  
  
    const onMouseMove = (event) => {
        mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
     
   
    };
    let clickedCoordinates = null;
    let highlightedObject = null;
    const onMouseClick = (event) => {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      console.log(canvasRect);
  
      // Calculate mouse position relative to the canvas
      const mouseX = event.clientX - canvasRect.left;
      const mouseY = event.clientY - canvasRect.top;
  
      // Convert mouse coordinates to normalized device coordinates
      const mouseNormalizedX = (mouseX / canvasRect.width) * 2 - 1;
      const mouseNormalizedY = -(mouseY / canvasRect.height) * 2 + 1;
  
      // Set up the raycaster
      raycaster.current.setFromCamera({ x: mouseNormalizedX, y: mouseNormalizedY }, camera.current);
  
      // Perform raycasting and get intersections
      const intersects = raycaster.current.intersectObjects( scene.current.children, true);
      // Set up the raycaster
      // raycaster.setFromCamera(mouse, camera);
      console.log(raycaster.current);
      
      // const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length>0) {
          const clickedObject = intersects[0].object;
          console.log(clickedObject)
  
          const intersectionPoint = intersects[0].point;
          console.log('Intersection Point:', intersectionPoint);
  
          const intersectionPointX=intersectionPoint.x
          const intersectionPointY=intersectionPoint.y
          const intersectionPointZ=intersectionPoint.z
    
    
          selectedObject= clickedObject ;
          highlightObject(selectedObject);
  
          
    
          const center = new THREE.Vector3();
          console.log("enter click events")
          
      
      // Assuming 'selectedObject' is the object you want to get the bounding box for
      const box = new THREE.Box3().setFromObject(clickedObject);
      
      // 'box' now contains the bounding box information
      const min = box.min; // Minimum coordinates of the bounding box
      const max = box.max; // Maximum coordinates of the bounding box
      console.log("min",min);
    console.log("max",max);
      
      // Dimensions of the bounding box
      const width = max.x - min.x;
      const height = max.y - min.y;
      const depth = max.z - min.z;
      // Calculate the center of the bounding box
      const centerX = (max.x + min.x) / 2;
      const centerY = (max.y + min.y) / 2;
      const centerZ = (max.z + min.z) / 2;
      console.log("center calculated",centerX,centerY,centerZ)
      
      // Set camera position to focus on the clicked object
      box.getCenter(center);
       // Store the bounding box center coordinates of the selected object
       clickedCoordinates = center;
       console.log("clickedCoordinates",clickedCoordinates)
       console.log("Bounding Box Center:", center);
       const threshold = 0.001;
    // Check if the center is (0,0,0)
    if (Math.abs(center.x) < threshold  && center.y === 0 && center.z === 0) {
    // Hide the object
    clickedObject.visible = false;
  }
      // Cesium coordinates
    const cesiumX = center.x;
    const cesiumY = center.y;
    const cesiumZ = center.z;
    
    
    // Convert Cesium Z-up to Three.js Y-up
    const threeJSX = cesiumX;
    const threeJSY = -cesiumZ; // Negate Z
    const threeJSZ = cesiumY; // Swap Y and Z
    console.log("three coordinate",threeJSX,threeJSY,threeJSZ);
      const toleranceX = 0.1; // You can adjust this value as needed
      const toleranceY = 0.1; 
      const toleranceZ = 0.1; 
  
      const clickedObjectInfo = allfilestable.find((obj) =>
      Math.abs(obj.coOrdinateX - threeJSX) <toleranceX &&
      Math.abs(obj.coOrdinateY - threeJSY) <toleranceY &&
      Math.abs(obj.coOrdinateZ - threeJSZ) <toleranceZ
      
    );
        console.log(clickedObjectInfo)
        
        // If the corresponding object is found, log its file ID and filename
        if (clickedObjectInfo) {
        console.log("File ID:", clickedObjectInfo.fileid);
        console.log("Filename:", clickedObjectInfo.fileName);
        const filename =clickedObjectInfo.fileName
        const fileId = clickedObjectInfo.fileid;
        const selectedObjectsInfo = objecttable.filter((obj) => obj.fileid === fileId);
      
      if (selectedObjectsInfo.length > 0) {
        // Log all objects in the object table that have the same file ID
        console.log('All objects with the same file ID:', selectedObjectsInfo);
      } else {
        console.log('No objects found in objecttable with the same file ID.');
      }
        } else {
        console.log("No object found in objecttable for the clicked bounding box center.");
        }
      } 
      else {
        console.log("no click events")
       
      }
    };
    const highlightObject=(object) =>{
      // Check if there's a previously highlighted object
      if (highlightedObject !== null) {
        // Reset the previously highlighted object to its original material
        highlightedObject.material = highlightedObject.originalMaterial;
      }
    
      // Create a highlight material
      const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
      // Store the original material of the object if not already stored
      if (!object.originalMaterial) {
        object.originalMaterial = object.material;
      }
    
      // Apply the highlight material to the object
      object.material = highlightMaterial;
    
      // Update the highlightedObject reference
      highlightedObject = object;
    }

   
  
  // Button to trigger raycasting
//   <button onClick={handleRaycasting}>Cast Ray</button>
  
  
    const enableInteractions = () => {
        renderer.current.domElement.addEventListener('mousemove', onMouseMove);
        renderer.current.domElement.addEventListener('click', onMouseClick);
     
    };
    const disableInteractions=()=>{
      renderer.current.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.current.domElement.removeEventListener('click', onMouseClick);
    }
  
    const onWindowResize = () => {
        camera.current.aspect = window.innerWidth / window.innerHeight;
        camera.current.updateProjectionMatrix();
        renderer.current.setSize(window.innerWidth, window.innerHeight);
        renderer.current.setPixelRatio(window.devicePixelRatio);
    };
    const render = () => {
      tiles.setCamera(camera.current);
      tiles.setResolutionFromRenderer(camera.current, renderer.current);
    
      camera.current.updateMatrixWorld();
      tiles.update();
    
   
      renderer.current.render( scene.current, camera.current);
  
     }
      
    
  
    const animate = () => {
      requestAnimationFrame(animate);
      handleRaycasting()
      if (!tiles) return;
  
      tiles.setCamera(camera.current);
      tiles.setResolutionFromRenderer(camera.current, renderer.current);
  
      camera.current.updateMatrixWorld();
      // Update camera position based on moveState
      const speed = 1;
      if (moveState.forward) camera.current.position.z -= speed;
      if (moveState.backward) camera.current.position.z += speed;
      if (moveState.left) camera.current.position.x -= speed;
      if (moveState.right) camera.current.position.x += speed;
      if (moveState.up) camera.current.position.y += speed;
      if (moveState.down) camera.current.position.y -= speed;
      // tiles.update();
  
      render(); // Trigger a re-render    
      if (controls.current ) {
        controls.current.update();
      }
    };
  
    const cleanUp = () => {
        // renderer.current.domElement.removeEventListener('mousemove', onMouseMove);
        // renderer.current.domElement.removeEventListener('click', onMouseClick);
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
    };
  
    const handleCreateBox = () => {
      if(scenes){
        console.log("enter handle create box")
  // Create BoxGeometry
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  console.log(size[0], size[1], size[2])
  
  // Create MeshBasicMaterial
  const material = new THREE.MeshBasicMaterial({ color: color }); // Green color
  console.log(position[0], position[1], position[2])
  
  // Create Mesh
  const box = new THREE.Mesh(geometry, material);
  // Position the cube at the specified coordinates
  box.position.set(position[0], position[1], position[2]);
  
  
  // Add the box to the scene
  scene.current.add(box);
      }
      else {
        console.error('Scene is not initialized');
      }
      
    };
      

        // Set up custom fly controls
        const moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };

       

        function onKeyDown(event) {
            handleKeyEvent(event.keyCode, true);
        }

        function onKeyUp(event) {
            handleKeyEvent(event.keyCode, false);
        }
       
        function handleKeyEvent(keyCode, isPressed) {
          const speed = 1;
            switch (keyCode) {
              case 87: // W (forward)
              camera.current.position.z -= speed;
              break;
          case 83: // S (backward)
              camera.current.position.z += speed;
              break;
          case 65: // A (left)
              camera.current.rotation.y += Math.PI / 180; // Rotate left by 1 degree
              break;
          case 68: // D (right)
              camera.current.rotation.y -= Math.PI / 180; // Rotate right by 1 degree
              break;
          case 32: // Space (up)
              camera.current.position.y += speed;
              break;
          case 16: // Shift (down)
              camera.current.position.y -= speed;
              break;
            }
        }

    
    init();      
    animate();
    return () => {
      cleanUp();
    };
  }, [viewMode,ionAccessToken,ionAssetId,size,position,color]);
  
 
  useEffect(()=>{
    const fetchAssetDetails = async () => {
      try {
        const response = await fetch(`https://api.cesium.com/v1/assets`, {
          headers: {
            Authorization: `Bearer ${ionAccessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
        setAssetList(data.items);
         
        } else {
          console.error('Error fetching asset details:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching asset details:', error.message);
      }
    };
    fetchAssetDetails();
  },[assetList,ionAssetId])
     // Function to handle asset selection
     const handleAssetSelection = (e) => {
      const selectedId = e.target.value;
      // Get all IDs in assetList
      const allIds = assetList.map(asset => asset.id);
      const selectedAsset = assetList.find(asset => asset.id===parseInt(selectedId));
      setIonAssetId(selectedAsset.id);
  };
 // Switch view mode between plan and side
 const switchViewMode = (mode) => {
  setViewMode(mode);
  if (mode === 'plan') {
    console.log("Enter plan mode")
    // Plan view settings
    // camera.position.set(0, 600, 0);
    // camera.lookAt(0, 0, 0);
    camera.current.up.set(0, 1, 0); 
    controls.autoRotate = false;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.update()
  } else if (mode === 'side') {
    console.log("Enter side mode")

    // Side view settings
    // camera.position.set(600, 0, 0);
    // camera.lookAt(0, 0, 0);
    camera.current.up.set(1, 0, 0); 
    
    controls.autoRotate = false;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.update()

  }
};
// Function to handle raycasting
const handleRaycasting = () => {
     // Set up the raycaster
     raycaster.current.setFromCamera(mouse.current, camera.current);

     let objectRemoved = false;
     const boundingBox = new THREE.Box3();
       
       // Perform raycasting and get intersections
       const intersects = raycaster.current.intersectObjects(scene.current.children, true);
       
       // Check if there are intersections
       if (intersects.length > 0) {
           // Loop through all intersected objects
           for (const intersect of intersects) {
               const clickedObject = intersect.object;
   
               // Get the bounding box of the clicked object
               const boundingBox = new THREE.Box3().setFromObject(clickedObject);
               
               // Calculate the center of the bounding box
               const boundingBoxCenter = new THREE.Vector3();
               boundingBox.getCenter(boundingBoxCenter);
               
               // Define the threshold for "nearly zero"
               const threshold = 0.0001;
     
               // Check if the distance from the center to the origin is within the threshold
               if (Math.abs(boundingBoxCenter.x) < threshold && 
                   boundingBoxCenter.y===0 && 
           boundingBoxCenter.z===0 ) {
                   // Remove the object from the scene
           const removalGroup = new THREE.Group();
                    scene.current.add(removalGroup);
   
   // Assuming 'clickedObject' is the object you want to remove
   // clickedObject.visible = false; // Hide the object
   removalGroup.add(clickedObject); // Add the object to the removal group
   
   // Later, when you want to remove the object completely
   // You can call remove() on its parent
   removalGroup.remove(clickedObject);
   
   // Make sure to dispose the object's geometry and material to free up memory
   clickedObject.geometry.dispose();
   clickedObject.material.dispose();
                   // clickedObject.visible = false;
                   console.log('Object with bounding box center nearly zero removed.');
           objectRemoved = true; // Set the flag to true
                   break; // Exit the loop after removing the object
               }
           }
       if (objectRemoved) {
               // Recalculate the bounding box of the remaining objects
               boundingBox.makeEmpty(); // Reset the bounding box
               // Traverse through the scene's children again to calculate the bounding box
               scene.current.traverse((object) => {
                   if (object.type === 'Mesh' && object.visible) {
                       // Ensure only visible meshes are considered
                       // Update the bounding box with each mesh in the scene
                       boundingBox.expandByObject(object);
                   }
               });
   
               // Log the bounding box dimensions
               console.log('Bounding Box:', boundingBox.min, boundingBox.max);
         const center = new  THREE.Vector3()
         boundingBox.getCenter(center)
         console.log(center);
         setstoredBoundingBoxMax(boundingBox.max)
       setstoredBoundingBoxMin(boundingBox.min)
               
               objectRemoved = false; // Reset the flag
           }
           
    }
  };

  const handlePersonControl =()=>{
    if(personControl){
        controls.current.dispose();
        controls.current = null;		
        // disableInteractions()
      
          // Create a cube as the player
          var geometry = new THREE.BoxGeometry(200);
          var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
          var player = new THREE.Mesh(geometry, material);
          scene.current.add(player);
    
         
          // Set camera position
          camera.current.position.set(0, 0, 600);
          camera.current.lookAt(player.position);
    
          // Variables for movement
          var moveForward = false;
          var rotateLeft = false;
          var prevX = 0;
          var prevY = 0;
    
         // Event listeners for mouse input
       const handleMouseDown = (event) => {
        if (event.button === 0) {
          rotateLeft = true;
          prevX = event.clientX;
          prevY = event.clientY;
        }
      };
    
      const handleMouseMove = (event) => {
        if (rotateLeft) {
          var movementX = event.clientX - prevX;
          var movementY = event.clientY - prevY;
          player.rotation.y -= movementX * 0.002;
          player.position.x -= movementY * 0.01 * Math.sin(player.rotation.y);
          player.position.z -= movementY * 0.01 * Math.cos(player.rotation.y);
          prevX = event.clientX;
          prevY = event.clientY;
        }
      };
    
      const handleMouseUp = (event) => {
        if (event.button === 0) {
          rotateLeft = false;
        }
      };
    
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    
      //  Cleanup function to remove event listeners
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);	
      }
    }
  }
    
  
 

  return (
    <>
    <div>
      <div>
        {/* Buttons to switch between plan view and side view */}
        <button onClick={() => switchViewMode('plan')}>Plan View</button>
      <button onClick={() => switchViewMode('side')}>Side View</button>
      <select onChange={handleAssetSelection}>
                <option value="">Select Asset</option>
                {assetList.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}-{asset.id}</option>
                ))}
            </select>
            </div>
     
      <button className="btn btn-primary" sx={{ width: '100%' }} data-bs-toggle="modal" data-bs-target="#staticBackdrop" >
        Create Box
      </button>
      <button type="button" class="btn btn-success ms-3" >Person Control</button>
      <button type="button" class="btn btn-warning ms-3" >Zoom Fit</button>
      <button type="button" class="btn btn-light ms-3">Zoom Out</button>
      <button type="button" class="btn btn-dark ms-3" >front view</button>


            <div >
                <canvas ref={canvasRef}></canvas>
                {/* Additional CSS-rendered content goes here */}
            </div>
      {/* <label>Change Color</label>
      <input
        type="color"
        value={highlightColor}
        onChange={onColorInputChange} 
      /> */}     
    </div>
     {/*modal for create box */}
 <div class="modal fade mt-5" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true"> 

<div className="modal-dialog">
  <div class="modal-content">
    <div class="modal-header">
      <h1 class="modal-title fs-5" id="staticBackdropLabel">Create Box</h1>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
   <Card className="shadow border rounded p-2 mt-3">
      
  <Form>
  <Row>
  <FloatingLabel controlId="floatingInputSize" label="Size" className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Size" name="Size" value={size.join(',')}
          onChange={(e) => setSize(e.target.value.split(',').map(parseFloat))} />
  </FloatingLabel>


  <FloatingLabel controlId="floatingInputPosition" label="Position"  className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Position" name="Position" value={position.join(',')} onChange={(e) => setPosition(e.target.value.split(',').map(parseFloat))}/>
  </FloatingLabel>

  <FloatingLabel controlId="floatingInputColor" label="Color"  className="mb-3 col-lg-6">
  <Form.Control  placeholder="Color" name="Color"
       type="color" value={color} onChange={(e) => setColor(e.target.value)} /> 
  </FloatingLabel>

  <FloatingLabel controlId="floatingInputName" label="Name"  className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Name" name="Name" value={name} onChange={(e) => setName(e.target.value)}/>
  </FloatingLabel>


  </Row>

  </Form>

  </Card>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
      {/* <button type="button" onClick={handleCreateBox()}  class="btn btn-success">Create</button> */}
    </div>
  </div>
</div>
</div> 

    </>
  );
}

export default Ray;
