import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';




function NewComponent() {
  let camera, controls, scene, renderer, tiles,offsetParent, css2dRenderer;
  let selectedObject = null;
  const raycaster = new THREE.Raycaster(); // Initialize raycaster
  const mouse = new THREE.Vector2(); // Initialize mouse
  const canvasRef = useRef(null);
  const [offsettable ,setOffsetTable] = useState([])
  const mouse1 = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const isPanning = useRef(false);
  const isZooming = useRef(false);

  
  const params = {
    'raycast': NONE,
    'ionAssetId': '2480864',
    'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE',
    'reload': () => {
      reinstantiateTiles();
    }
  };

  
    const lastMouseMovement = useRef({ x: 0, y: 0 }); 

  const init = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0,0,100);
    camera.lookAt(0,0,0);
    scene.add(camera)
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(0x6dc5db);
		// renderer.setAnimationLoop(animate()); 
    // renderer.setAnimationLoop(animate);

    // document.body.appendChild(renderer.domElement)
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambLight);

    offsetParent = new THREE.Group();
    scene.add(offsetParent); 

    enableInteractions();
    reinstantiateTiles();
   
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

  };

  const setupTiles = () => {
    tiles.fetchOptions.mode = 'cors';

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/');
    const loader = new GLTFLoader(tiles.manager);
    loader.setDRACOLoader(dracoLoader);
    tiles.manager.addHandler(/\.gltf$/, loader);
    scene.add(tiles.group);
    // offsetParent.add(tiles.group);
   
    
  };


  const reinstantiateTiles = () => {
    if (tiles) {
      scene.remove(tiles.group);
      tiles.dispose();
      tiles = null;
    }

    tiles = new CesiumIonTilesRenderer(params.ionAssetId, params.ionAccessToken);
    tiles.onLoadTileSet = () => {

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

      setupTiles();       

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

  
  const handleMouseDown = (event) => {
    onMouseClick(event);

      if (event.button === 0) { // Left mouse button pressed
        isMouseDown.current = true;
        mouse1.current.x = event.clientX;
        mouse1.current.y = event.clientY;
        isZooming.current =true;
        continueCameraMovement(); 
      } else if (event.button === 1) { // Middle mouse button pressed
        isPanning.current = true;
        mouse1.current.x = event.clientX;
        mouse1.current.y = event.clientY;
      }
   
  
  };

  const handleMouseUp = () => {
      isMouseDown.current = false;
      isPanning.current = false;
      isZooming.current = false; // Disable zooming
       
  
  };

  const handleMouseMove = (event) => {
    if (!isMouseDown.current && !isPanning.current && !isZooming.current) return;
  
    const movementX = event.clientX - mouse1.current.x;
    const movementY = event.clientY - mouse1.current.y;
    console.log('Camera Rotation X:', camera.rotation.x, 'Camera Rotation Y:', camera.rotation.y);  
      if (isMouseDown.current) { // Left mouse button clicked
        // Determine if the movement is more horizontal or vertical
        const isHorizontal = Math.abs(movementX) > Math.abs(movementY);
        if (isHorizontal) { // Horizontal movement, rotate around Y axis
          camera.rotation.y -= movementX * 0.005;
        } else { // Vertical movement, zoom in/out
          const zoomSpeed = movementY * 0.1; // Adjust zoom speed based on mouse movement
          camera.position.z += zoomSpeed;
        }
        
      } else if (isPanning.current) { // Middle mouse button clicked
        // Pan left/right and up/down
        camera.position.x -= movementX * 0.2;
        camera.position.y += movementY * 0.2;
      }
  
    mouse1.current.x = event.clientX;
    mouse1.current.y = event.clientY;
  };
  

  const handleWheel = (event) => {
 // Zoom in/out along the z-axis
 camera.position.z -= event.deltaY * 0.1;
    
    
  };

  const continueCameraMovement = () => {
  
    if (isMouseDown.current) {
      requestAnimationFrame(continueCameraMovement);
      const movementY = lastMouseMovement.current.y ;
    const moveSpeed = movementY * 0.1; // Adjust movement speed based on last mouse movement
    camera.position.z += moveSpeed;
    }
    
  };


const onMouseClick = (event) => {
  const canvasRect = canvasRef.current.getBoundingClientRect();

  // Calculate mouse position relative to the canvas
  const mouseX = event.clientX - canvasRect.left;
  const mouseY = event.clientY - canvasRect.top;

  // Convert mouse coordinates to normalized device coordinates
  const mouseNormalizedX = (mouseX / canvasRect.width) * 2 - 1;
  const mouseNormalizedY = -(mouseY / canvasRect.height) * 2 + 1;

  // Set up the raycaster
  raycaster.setFromCamera({ x: mouseNormalizedX, y: mouseNormalizedY }, camera);

  // Perform raycasting and get intersections
  const intersects = raycaster.intersectObjects(scene.children, true);	
  // Set up the raycaster
  // raycaster.setFromCamera(mouse, camera);
  console.log(raycaster);	
  
  if (intersects.length>0) {
    const clickedObject = intersects[0].object;
    console.log(clickedObject)

    if (selectedObject !== clickedObject) {
      if (selectedObject) {
        console.log(selectedObject);
        selectedObject.material.color.set(0xff0000);
      }

      selectedObject = clickedObject;
      // selectedObject.material.color.set(0xffffff);
      // selectedObject.visible = false;

      // // Update the color of the selected object based on the input color
      // const hexColor = new THREE.Color(highlightColor).getHex();
      // selectedObject.material.color.set(hexColor);
    }
  } else {
    if (selectedObject) {
      selectedObject.material.color.set(0xffffff);
      selectedObject = null;
    }
  }
};


const enableInteractions = () => {
  // renderer.domElement.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('wheel', handleWheel);
  // renderer.domElement.addEventListener('click', onMouseClick);
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
};
const render = () => {
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);

  camera.updateMatrixWorld();
  tiles.update();

  renderer.render(scene, camera);
};


const animate = () => {
  requestAnimationFrame(animate);

  if (!tiles) return;

  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);

  camera.updateMatrixWorld();
  tiles.update();


  render(); // Trigger a re-render    
};

// Start the animation loop
animate();


const cleanUp = () => {
  scene.remove(tiles);
  renderer.dispose();
 
};


   useEffect(() => {
      init(); 

   
    return () => {
        cleanUp();
         
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
    };
        
  }, []);



  

  return (
<div style={{ position: 'relative', overflow: 'hidden' }}>
  <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
  

</div>
  );
}

export default NewComponent;
