import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
import { getAllOffset } from '../services/AllApis';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Card, Form,FloatingLabel, Row, Button } from 'react-bootstrap'



function New({ ionAccessToken: initialIonAccessToken }) {
  const canvasRef = useRef(null);
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [ionAssetId, setIonAssetId] = useState('2454078');
  const [ionAccessToken, setIonAccessToken] = useState(initialIonAccessToken);
  const [assetList, setAssetList] = useState([]);
  const [offsettable ,setOffsetTable] = useState([])  
  const [scenes, setScenes] = useState(null);
  const [table ,setTable] = useState([
    {x:"0",y:"0",z:"0"},
    {x:"90.00",y:"279.40",z:"31.75"},
    {x:"99.92",y:"286.0",z:"-22.67"},
    {x:"68",y:"296.50",z:"40.48"},
    {x:"100",y:"286.10",z:"	-50.52"},
    {x:"94.40",y:"294",z:"25.24"},
    { x:"161.34", y:	"272.16",z:	"52.36"},
   
  ])
   // Define variable for creating box
   const [size, setSize] = useState([1, 1, 1]);
   const [position, setPosition] = useState([0, 0, 0]);
   const [color, setColor] = useState('#00ff00');
   const [name, setName] = useState('Cube');

  let camera, controls, scene, renderer, tiles, light, offsetParent, raycaster, mouse,css2dRenderer;
  const [viewMode, setViewMode] = useState('plan'); // State to track the view mode
  const params = {
    'raycast': NONE,
    'ionAssetId': ionAssetId,
    'ionAccessToken': ionAccessToken,
    'reload': () => {
      reinstantiateTiles();
    },
  };

  // Set the new size of the canvas
const innerWidth = 800;
const innerHeight = 600;
   const getalloffset = async () => {
    try {
      const response = await getAllOffset();
      if (response.status === 200) {
        setOffsetTable(response.data);
        console.log(response.data)
      } else {
        alert("Cannot fetch data");
      }
    } catch (error) {
      console.error('Error fetching offset data:', error.message);
      alert("Cannot fetch data");
    }
  };

  const setupTiles = () => {
    tiles.fetchOptions.mode = 'cors';

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/'
    );

    const loader = new GLTFLoader(tiles.manager);
    loader.setDRACOLoader(dracoLoader);

    tiles.manager.addHandler(/\.gltf$/, loader);
    scene.add(tiles.group);
  };
  

  const reinstantiateTiles = () => {
    if (tiles) {
      scene.remove(tiles.group);
      tiles.dispose();
      tiles = null;
    }

    tiles = new CesiumIonTilesRenderer(params.ionAssetId, params.ionAccessToken);
    tiles.onLoadTileSet = () => {
      createLabels() 
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
     // Set the new size of the canvas
const innerWidth = 600;
const innerHeight = 600;
    scene = new THREE.Scene();
    setScenes(scene);
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current ,alpha:true});
    renderer.setClearColor(0xffff00);  //color yellow
    document.body.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 1;
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(60, innerWidth  / innerHeight , .1, 4000);
    camera.position.set(0,600,0);
    camera.lookAt(0,0,0);

    css2dRenderer = new CSS2DRenderer(); // Initialize CSS2DRenderer
    css2dRenderer.setSize(innerWidth , innerHeight );
    css2dRenderer.domElement.style.position = 'absolute';
    css2dRenderer.domElement.style.top = '0';    
    document.body.appendChild(css2dRenderer.domElement);

    controls = new OrbitControls(camera,renderer.domElement);
    controls = new OrbitControls(camera,css2dRenderer.domElement);
    controls.enableDamping = true;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 2000;

    light = new THREE.PointLight(0xffff00, 1);
    camera.add(light);
    scene.add(camera);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambLight);

    offsetParent = new THREE.Group();
    scene.add(offsetParent);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

     // Set up initial view mode
    switchViewMode(viewMode);

    enableInteractions();

    reinstantiateTiles();

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    // const gui = new GUI();
    // gui.width = 300;

    // const ionOptions = gui.addFolder('myasset');
    // ionOptions.add(params, 'ionAssetId').onFinishChange(reinstantiateTiles);

    // // Display all asset IDs in a dropdown
    // const assetDropdown = ionOptions.add(params, 'ionAssetId', assetList.map(asset => asset.id));
    // assetDropdown.onFinishChange(reinstantiateTiles);

    // ionOptions.add(params, 'ionAccessToken');
    // ionOptions.add(params, 'reload');
    // ionOptions.open();
  };

  // Switch view mode between plan and side
  const switchViewMode = (mode) => {
    setViewMode(mode);
    if (mode === 'plan') {
      console.log("Enter plan mode")
      // Plan view settings
      camera.position.set(0, 600, 0);
      camera.lookAt(0, 0, 0);
      controls.autoRotate = false;
      controls.enablePan = true;
      controls.enableRotate = true;
    } else if (mode === 'side') {
      console.log("Enter side mode")

      // Side view settings
      camera.position.set(600, 0, 0);
      camera.lookAt(0, 0, 0);
      controls.autoRotate = false;
      controls.enablePan = true;
      controls.enableRotate = true;
    }
  };

const createLabels = () => {
 
  table.forEach((item) => {
  const x = parseFloat(item.x);
        const y = parseFloat(item.y);
        const z = parseFloat(item.z);
// Create a vector representing the original coordinates
const originalVector = new THREE.Vector3(x, y, z);

// Define the angle of rotation (90 degrees in radians)
const angle =- Math.PI/2 ;

// Create a rotation matrix around the x-axis
const rotationMatrix = new THREE.Matrix4().makeRotationX(angle);

// Apply the rotation matrix to the original vector
const rotatedVector = originalVector.applyMatrix4(rotationMatrix);

// Extract the new coordinates
const newX = rotatedVector.x;
const newY = rotatedVector.y;
const newZ = rotatedVector.z;
const vector = new THREE.Vector3(newX,newY,newZ)

  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  labelDiv.innerHTML = '<i class="fa-solid fa-circle-dot" style="font-size: 5px"></i>';
  labelDiv.style.color = '#ffffff';
  const labelObject = new CSS2DObject(labelDiv);
  labelObject.position.set(newX,newY,newZ);
  // Add label to the scene
  scene.add(labelObject); 
});
};

  let selectedObject = null;

  const setHighlight = (color) => {
    if (selectedObject) {
    
      // const hexColor = new THREE.Color(color).getHex();
      // selectedObject.material.color.set(hexColor);
      // setHighlightColor(color);    
    }
  };

  const onColorInputChange = (e) => {
    setHighlight(e.target.value);
  };

  const onMouseMove = (event) => {
    mouse.x = (event.clientX / innerWidth ) * 2 - 1;
    mouse.y = -(event.clientY / innerHeight ) * 2 + 1;
   
 
  };
 
  const onMouseClick = () => {
    raycaster.setFromCamera(mouse, camera);
  
    const intersects = raycaster.intersectObjects(scene.children, true);
    
  
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
       console.log('Clicked object:', clickedObject);
        // Access the position of the clicked object
        const { x, y, z } = clickedObject.position;
        console.log('Coordinates of clicked object:', x, y, z);
  
      if (selectedObject !== clickedObject) {
        if (selectedObject) {
          selectedObject.material.color.set(0xffffff);
        }
  
        selectedObject = clickedObject;
        selectedObject.visible = false;
  
        // // Update the color of the selected object based on the input color
        // const hexColor = new THREE.Color(highlightColor).getHex();
        // selectedObject.material.color.set(hexColor);
      }
    } else {
      console.log("no click events")
      if (selectedObject) {
        selectedObject.material.color.set(0xffffff);
        selectedObject = null;
      }
    }
  };
  

  const enableInteractions = () => {
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    css2dRenderer.domElement.addEventListener('mousemove', onMouseMove);
    css2dRenderer.domElement.addEventListener('click', onMouseClick);
  };

  const onWindowResize = () => {
     // Set the new size of the canvas
    camera.aspect = innerWidth  / innerHeight ;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth , innerHeight );
    // renderer.setPixelRatio(window.devicePixelRatio);
    css2dRenderer.setSize(innerWidth , innerHeight );
  };
  const render = () => {
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);
  
    camera.updateMatrixWorld();
    tiles.update();

    css2dRenderer.render(scene, camera);
    renderer.render(scene, camera);

   }  

  const animate = () => {
    requestAnimationFrame(animate);

    if (!tiles) return;

    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);

    camera.updateMatrixWorld();
    tiles.update();

    render(); // Trigger a re-render    
    if (controls) {
      controls.update();
    }
  };

  const cleanUp = () => {
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.domElement.removeEventListener('click', onMouseClick);
    css2dRenderer.domElement.removeEventListener('mousemove', onMouseMove);
    css2dRenderer.domElement.removeEventListener('click', onMouseClick);
  };

  useEffect(() => {  
  // getalloffset();
     
    init();
    
          // Map through the offsettable array and create a cube for each set of coordinates
          table.forEach((item) => {
                    // Convert coordinates to numbers
        const x =item.x;
        const y = item.y;
        const z = item.z;
 // Create a vector representing the original coordinates
 const originalVector = new THREE.Vector3(x, y, z);

 // Define the angle of rotation (90 degrees in radians)
 const angle =- Math.PI/2 ;

 // Create a rotation matrix around the x-axis
 const rotationMatrix = new THREE.Matrix4().makeRotationX(angle);

 // Apply the rotation matrix to the original vector
 const rotatedVector = originalVector.applyMatrix4(rotationMatrix);

 // Extract the new coordinates
 const newX = rotatedVector.x;
 const newY = rotatedVector.y;
 const newZ = rotatedVector.z;

           
    
            // Create a cube geometry
            const cubeGeometry = new THREE.BoxGeometry(5,5,5);
    
            // Create a basic material for the cube
            const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
            // Create a mesh by combining the geometry and material
            const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
            
    
            // Position the cube at the specified coordinates
            cubeMesh.position.set((newX), (newY), (newZ));
              // cubeMesh.position.set((item.x), (item.y), (item.z));
    
            // Add the cube mesh to the scene
            scene.add(cubeMesh);
        });

//  // Create a vector representing the original coordinates
//  const originalVector = new THREE.Vector3(99.92,286.0,-22.67);

//  // Define the angle of rotation (90 degrees in radians)
//  const angle =- Math.PI/2 ;

//  // Create a rotation matrix around the x-axis
//  const rotationMatrix = new THREE.Matrix4().makeRotationX(angle);

//  // Apply the rotation matrix to the original vector
//  const rotatedVector = originalVector.applyMatrix4(rotationMatrix);

//  // Extract the new coordinates
//  const newX = rotatedVector.x;
//  const newY = rotatedVector.y;
//  const newZ = rotatedVector.z;

                    // // Create a cube geometry
                    // const cubeGeometry = new THREE.BoxGeometry(5,5,5);
    
                    // // Create a basic material for the cube
                    // const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
                    // // Create a mesh by combining the geometry and material
                    // const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    
            
                    // // Position the cube at the specified coordinates
                    // // cubeMesh.position.set((newX), (newY), (newZ));
                    //   cubeMesh.position.set(0,0,0);
            
                    // // Add the cube mesh to the scene
                    // scene.add(cubeMesh);
       
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
 

  return (
    <>
    <div className="row">
      {/* <div className="col-lg-5">
        <button onClick={() => switchViewMode('plan')}>Plan View</button>
      <button onClick={() => switchViewMode('side')}>Side View</button>
      <select onChange={handleAssetSelection}>
                <option value="">Select Asset</option>
                {assetList.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}-{asset.id}</option>
                ))}
            </select>
      </div>  */}
      <div className="col-lg-1"></div>        
      <div className="col-lg-6">
      <canvas  ref={canvasRef}></canvas>
      </div>
      {/* <label>Change Color</label>
      <input
        type="color"
        value={highlightColor}
        onChange={onColorInputChange} 
      /> */}     
    </div>
  

    </>
  );
}

export default New;
