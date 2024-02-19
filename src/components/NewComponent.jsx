import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Label from './Label';
import { getAllOffset } from '../services/AllApis';


function NewComponent() {
  let camera, controls, scene, renderer, tiles,offsetParent, css2dRenderer;
  let selectedObject = null;
  const raycaster = new THREE.Raycaster(); // Initialize raycaster
  const mouse = new THREE.Vector2(); // Initialize mouse
  const canvasRef = useRef(null);
  const [offsettable ,setOffsetTable] = useState([])
  
  const params = {
    'raycast': NONE,
    'ionAssetId': '2454078',
    'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE',
    'reload': () => {
      reinstantiateTiles();
    }
  };

  const [table ,setTable] = useState([
     {x:"0",y:"0",z:"0"},
    {x:"90.00",y:"279.40",z:"31.75"},
    {x:"99.92",y:"286.0",z:"-22.67"},
    {x:"68",y:"296.50",z:"40.48"},
    {x:"100",y:"286.10",z:"	-50.52"},
    {x:"94.40",y:"294",z:"25.24"},
    { x:"161.34", y:	"272.16",z:	"52.36"},
   
  ])
    const [viewMode, setViewMode] = useState('plan'); // State to track the view mode

  const ionAssetId = '2454078';
  const ionAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE';

  // useEffect(() => {
  //   console.log(offsetTable)
  //   const fetchAssetDetails = async () => {
  //     try {
  //       const response = await fetch(`https://api.cesium.com/v1/assets`, {
  //         headers: {
  //           Authorization: `Bearer ${ionAccessToken}`,
  //         },
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         console.log(data);
  //         setAssetList(data);
  //       } else {
  //         console.error('Error fetching asset details:', response.statusText);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching asset details:', error.message);
  //     }
  //   };

  //   fetchAssetDetails();
  // }, [ionAccessToken, ionAssetId]);
// Array to hold references to label objects
   

  // const onClick = (event) => {
  //   event.preventDefault();
  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //   raycaster.setFromCamera(mouse, camera);
  //   const intersects = raycaster.intersectObjects(scene.children, true);

   
  //   if (intersects.length > 0) {
  //     console.log('Object clicked');
  //     const intersect = intersects[0];
  //     const index = labels.findIndex(label => label.element === intersect.object.element);

  //     if (index !== -1) {
  //         showLabel(index); // Show the label for the clicked object
  //     }
  // } else {
  //     console.log("No objects clicked");
  // }
  // };


   // Fetch offset data
   
   
  //  const getalloffset = async () => {
  //   try {
  //     const response = await getAllOffset();
  //     if (response.status === 200) {
  //       setOffsetTable(response.data);
  //       console.log(response.data)
  //     } else {
  //       alert("Cannot fetch data");
  //     }
  //   } catch (error) {
  //     console.error('Error fetching offset data:', error.message);
  //     alert("Cannot fetch data");
  //   }
  // };

  // useEffect for component initialization and data fetching

  const init = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0,400,0);
    camera.lookAt(0,0,0);
    scene.add(camera)
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(0x6dc5db);
		renderer.setAnimationLoop(animate());     // document.body.appendChild(renderer.domElement)
     css2dRenderer = new CSS2DRenderer(); // Initialize CSS2DRenderer
     css2dRenderer.setSize(window.innerWidth, window.innerHeight);
     css2dRenderer.domElement.style.position = 'absolute';
     css2dRenderer.domElement.style.top = 0;
     // Append CSS2DRenderer's DOM element to the container holding the canvas
     canvasRef.current.parentElement.appendChild(css2dRenderer.domElement); 

     controls = new OrbitControls(camera,css2dRenderer.domElement);

    controls.enableDamping = true;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 2000;



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

    // const gui = new GUI();
    // gui.width = 300;

    // const ionOptions = gui.addFolder('myasset');
    // ionOptions.add(params, 'ionAssetId');
    // ionOptions.add(params, 'ionAccessToken');
    // ionOptions.add(params, 'reload');
    // ionOptions.open();
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


// const createLabels = () => {
//   if (offsettable.length > 0 && offsettable[0]?.offsetTable) {
//     console.log(offsettable);
//     console.log(offsettable[0].offsetTable);
//     console.log(offsettable[0].offsetTable[0]);
//     setgetData(offsettable[0].offsetTable[0]);

//     if (scene) {
//       offsettable[0].offsetTable[0].forEach((item) => {
//         const labelDiv = document.createElement('div');
//         labelDiv.className = 'label';
//         labelDiv.innerHTML = '<i class="fa-solid fa-circle-dot" style="font-size: 5px"></i>'; // Note the corrected HTML syntax
//         labelDiv.style.color = '#ffffff';
//         const labelObject = new CSS2DObject(labelDiv);
//         labelObject.position.set(item.offset[0], item.offset[1], item.offset[2]);

//         if (scene) {
//           scene.add(labelObject);
//         }
//       });
//     }
//   } else {
//     console.warn('Offset data is not available.');
//   }
// };

const createLabels = () => {
      console.log(offsettable);
      console.log(offsettable[0].offsetTable);
      console.log(offsettable[0].offsetTable[0]);
  offsettable[1].offsetTable[0].forEach((item) => {
     // Convert coordinates to numbers
     const x = parseFloat(item.offset[0]);
     const y = parseFloat(item.offset[1]);
     const z = parseFloat(item.offset[2]);
     // Suppose you have a coordinate in Three.js
const cesiumCoordinate  = new THREE.Vector3(x, y, z);

// Convert from Three.js coordinate system to Cesium's right-handed coordinate system
// Convert to Three.js coordinate system
const threeX = cesiumCoordinate.y; // Swap Y and Z
const threeY = -cesiumCoordinate.x; // Invert Y-axis
const threeZ = cesiumCoordinate.z; // Keep Z as is
// Apply 180-degree counterclockwise rotation
const theta = Math.PI; // 180 degrees in radians
const newX = Math.cos(theta) * threeX+Math.sin(theta) * threeY;
const newY = -Math.sin(theta) * threeX + Math.cos(theta) * threeY;


// Resulting Three.js coordinate
const threeCoordinate = { x: threeX, y: threeY, z: threeZ };
console.log(threeCoordinate)
   
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.innerHTML = '<i class="fa-solid fa-circle-dot" style="font-size: 5px"></i>';
    labelDiv.style.color = '#ffffff';
    const labelObject = new CSS2DObject(labelDiv);
    // Set position of the label in world coordinates
    const position = new THREE.Vector3(newX, newY, threeZ);
    labelObject.position.copy(position);
    // Add label to the scene
    scene.add(labelObject);
  });
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


 // Switch view mode between plan and side
 const switchViewMode = (mode) => {
  setViewMode(mode);
  if (mode === 'plan') {
    // Plan view settings
    camera.position.set(0, 600, 0);
    camera.lookAt(0, 0, 0);
    controls.autoRotate = false;
    controls.enablePan = true;
    controls.enableRotate = true;
  } else if (mode === 'side') {
    // Side view settings
    camera.position.set(600, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.autoRotate = false;
    controls.enablePan = true;
    controls.enableRotate = true;
  }
};


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
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

const onMouseClick = () => {
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);
  console.log("mouse click")

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;

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
    if (selectedObject) {
      selectedObject.material.color.set(0xffffff);
      selectedObject = null;
    }
  }
};


const enableInteractions = () => {
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', onMouseClick);
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
  if (controls) {
    controls.update();
  }
};

const cleanUp = () => {
  renderer.domElement.removeEventListener('mousemove', onMouseMove);
  renderer.domElement.removeEventListener('click', onMouseClick);
};

//  useEffect(()=>{
//   getalloffset();
//   },[])


   useEffect(() => {
      init(); 
      table.forEach((item) => {
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
            cubeMesh.position.set(newX, newY, newZ);
    
            // Add the cube mesh to the scene
            scene.add(cubeMesh); 
      });
       
      animate();
    
    return () => {
        cleanUp();
    };
        
  }, [offsettable]);

 

  return (
    <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
       
    </div>
  );
}

export default NewComponent;
