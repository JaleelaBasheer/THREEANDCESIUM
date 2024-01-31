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
import { Box3 ,Plane, Vector3 } from 'three';



function NewComponent() {
  let camera, controls, scene, renderer, tiles, offsetParent, raycaster, mouse, css2dRenderer,cameraHelper;
  let selectedObject = null;

  const canvasRef = useRef(null);
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [assetList, setAssetList] = useState([]);
  const [labels, setLabels] = useState([]);
  const [labelsVisible, setLabelsVisible] = useState(false);   // Assuming offsetTable contains the coordinates from the offset table
   const offsetTable = [
    { objectname:"CA-202001_HO",x: 0, y: 0, z: 0 }, // Example coordinates, replace with actual data
    { objectname:"PL-202003_HO",x:6.63,y:11.24, z:3.40},
    { objectname:"PL-202005_HO",x: 7.14,y: 3.60, z: 1.82 },
    {objectname:"PL-202006_HO",x:	6.12,y:9.52,z:	3.53},
    {objectname:"PL-202008_HO",x:4.36,y:10.99,z:0.85},
    {objectname:"PL-202050_HO",x:11.81,y:0.07,z:-1.18},
    {objectname:"PL-202051_HO",x:12.58,y:-0.92,z:-1.30},
    {	objectname:"PL-202052_HO",x: 12.42,y: -2.57,z:-0.14},
    {	objectname:"PL-202002_HO",x: -.07,y: 3.57,z:-3.23},
    {	objectname:"	PL-202004_HO",x: -1.05,y: 11.17,z:1.76},
    // {	objectname:"PL-202052_HO",x: 9.85,y: -3,z:-1.98}


  ];
  const [clippingPlane] = useState(new Plane(new Vector3(0, 0, -1), 0));

  
  const params = {
    'raycast': NONE,
    'ionAssetId': '2420609',
    'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE',
    'reload': () => {
      reinstantiateTiles();
    }
  };
  const ionAssetId = '2420609';
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

  useEffect(() => {
    if (labelsVisible) {
      createLabels();
    }
    if (renderer) {
      renderer.clippingPlanes = [clippingPlane];
      renderer.localClippingEnabled = true; // Enable local clipping if needed
    }
  }, [renderer, clippingPlane,labelsVisible]);

  const setupTiles = () => {
    tiles.fetchOptions.mode = 'cors';

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/');
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
      const sphere = new THREE.Sphere();
      tiles.getBoundingSphere(sphere);
      console.log(tiles.getBoundingSphere(sphere))

      const position = sphere.center.clone();
      console.log(position)

      const distanceToEllipsoidCenter = position.length();
      console.log(distanceToEllipsoidCenter)


      const surfaceDirection = position.normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const rotationToNorthPole = rotationBetweenDirections(surfaceDirection, up);

      tiles.group.quaternion.x = rotationToNorthPole.x;
      tiles.group.quaternion.y = rotationToNorthPole.y;
      tiles.group.quaternion.z = rotationToNorthPole.z;
      tiles.group.quaternion.w = rotationToNorthPole.w;

      tiles.group.position.y = -distanceToEllipsoidCenter;
      setupTiles();
      // Create spheres based on the offset table data
      createLabels();

    };
       setupTiles();
  };
  
  const createLabels = () => {
      offsetTable.forEach((labelInfo) => {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'label';
        labelDiv.textContent = labelInfo.objectname;
        labelDiv.style.color = '#ffffff';
        const labelObject = new CSS2DObject(labelDiv);
        labelObject.position.set(labelInfo.x, labelInfo.y, labelInfo.z);
  
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

  const init = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, 0, 5);
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xff0000);
    // document.body.appendChild(renderer.domElement)
    css2dRenderer = new CSS2DRenderer(); // Initialize CSS2DRenderer
    css2dRenderer.setSize(window.innerWidth, window.innerHeight);
    css2dRenderer.domElement.style.position = 'absolute';
    css2dRenderer.domElement.style.top = 0;
    // Append CSS2DRenderer's DOM element to the container holding the canvas
    canvasRef.current.parentElement.appendChild(css2dRenderer.domElement); 
    renderer.clippingPlanes = [clippingPlane];
    controls = new OrbitControls(camera, css2dRenderer.domElement);
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

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

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

  const setHighlight = (color) => {
    if (selectedObject) {
      const hexColor = new THREE.Color(color).getHex();
      selectedObject.material.color.set(hexColor);
    }
  };

  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const onMouseClick = (event) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (event.button === 0) {
        console.log('Left-click');
        if (selectedObject) {
          selectedObject.material.color.set(0xffffff);
        }

        selectedObject = clickedObject;
        selectedObject.material.color.set(highlightColor);
        

      // bounding box of clicked object
       // Calculate bounding box coordinates
       const boundingBox = new Box3().setFromObject(selectedObject);
       const center = boundingBox.getCenter(new THREE.Vector3());
       const size = boundingBox.getSize(new THREE.Vector3());
       const minCoordinates = boundingBox.min.clone();
       const maxCoordinates = boundingBox.max.clone();
      //  console.log("Bounding Box Min Coordinates:", minCoordinates);
      //  console.log("Bounding Box Max Coordinates:", maxCoordinates);
       console.log("Bounding Box center:", center);    
      }
      if (event.button === 2) {
        console.log('Right-click');
        setContextMenuPosition({ x: event.clientX, y: event.clientY });

        raycaster.setFromCamera({ x: mouse.x, y: mouse.y + 0.1 }, camera);

        const intersectsAbove = raycaster.intersectObjects(scene.children, true);

        if (intersectsAbove.length > 0) {
          selectedObject = intersectsAbove[0].object;
        } else {
          setContextMenuPosition({ x: 0, y: 0 });
          selectedObject = null;
        }
      }
    } else {
      if (selectedObject && event.button === 0) {
        console.log('Clicked outside of any object');
        selectedObject.material.color.set(0xffffff);
        selectedObject = null;
      }
    }
  };
 
  const handleAddCommentButton = () => {
    const labelText = 'Label for ';
    const existingComment = labels.find(label => label.text === labelText)?.comment || '';
    const newComment = window.prompt(`Add a comment for "${labelText}":`, existingComment);
    if (newComment !== null) {
      setLabels((prevLabels) => [
        ...prevLabels,
        {
          position: { x: contextMenuPosition.x, y: contextMenuPosition.y },
          text: labelText,
          comment: newComment,
        },
      ]);
    }
    setContextMenuPosition({ x: 0, y: 0 });
  };

  const enableInteractions = () => {
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('click', handleClickOutsideContextMenu);
  };

  const handleContextMenu = (event) => {
    if (selectedObject) {
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleContextMenuColorChange = (color) => {
    setHighlightColor(color);

    if (selectedObject) {
      const hexColor = new THREE.Color(color).getHex();
      selectedObject.material.color.set(hexColor);
    }
  };

  const handleClickOutsideContextMenu = () => {
    if (contextMenuPosition.x !== 0 && contextMenuPosition.y !== 0) {
      setContextMenuPosition({ x: 0, y: 0 });
    }
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  const onCommentClick = (labelText, existingComment) => {
    const newComment = window.prompt(`Add a comment for "${labelText}":`, existingComment);
    console.log(`Comment for "${labelText}":`, newComment);
  };

  const renderLabels = () => {
    return labels.map((label, index) => (
      <Label
        key={index}
        position={label.position}
        text={label.text}
        onCommentClick={(labelText, existingComment) =>
          onCommentClick(labelText, existingComment)
        }
      />
    ));
  };

  const animate = () => {
    requestAnimationFrame(animate);

    if (!tiles) return;

    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);

    camera.updateMatrixWorld();
    tiles.update();
     // Update clipping plane position or orientation
     clippingPlane.constant += 0.01; // Example: Move the clipping plane along the z-axis

    if (renderer && scene && camera ) {
 
      renderer.render(scene, camera);
    }
    if (css2dRenderer && scene && camera ) {
 
      css2dRenderer.render(scene, camera);
    }

    if (controls) {
      controls.update();
    }
  };

  const cleanUp = () => {
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.domElement.removeEventListener('click', onMouseClick);
    renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    renderer.domElement.removeEventListener('click', handleClickOutsideContextMenu);
  };
 


  useEffect(() => {
    init();

    animate();

    return () => {
      cleanUp();
    };
  }, [highlightColor]);

  const renderContextMenu = () => {
    if (contextMenuPosition.x !== 0 && contextMenuPosition.y !== 0) {
      return (
        <div
          style={{
            position: 'absolute',
            top: contextMenuPosition.y-30,
            left: contextMenuPosition.x,
            background: '#fff',
            padding: '5px',
            boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)',
            zIndex: 1000,
          }}
        >
          <label> Select Highlight Color: </label>
          <input
            type="color"
            value={highlightColor}
            onInput={(e) => handleContextMenuColorChange(e.target.value)}
          />
          <button onClick={() => handleAddCommentButton()}>Add Comment</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* {renderContextMenu()}
      {renderLabels()} */}
      {/* <button onClick={toggleLabels}>Populate Tags</button>      */}
        <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default NewComponent;
