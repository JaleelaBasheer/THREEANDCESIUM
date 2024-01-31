import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';

function New({ ionAccessToken: initialIonAccessToken }) {
  const canvasRef = useRef(null);
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [ionAssetId, setIonAssetId] = useState('');
  const [ionAccessToken, setIonAccessToken] = useState(initialIonAccessToken);
  const [assetList, setAssetList] = useState([]);
  

  let camera, controls, scene, renderer, tiles, light, offsetParent, raycaster, mouse;

  const params = {
    'raycast': NONE,
    'ionAssetId': ionAssetId,
    'ionAccessToken': ionAccessToken,
    'reload': () => {
      reinstantiateTiles();
    },
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
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
    renderer.setClearColor(0xffff00);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = 1;

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, 0, 5);

    controls = new OrbitControls(camera, renderer.domElement);
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

    enableInteractions();

    reinstantiateTiles();

    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    const gui = new GUI();
    gui.width = 300;

    const ionOptions = gui.addFolder('myasset');
    ionOptions.add(params, 'ionAssetId').onFinishChange(reinstantiateTiles);

    // Display all asset IDs in a dropdown
    const assetDropdown = ionOptions.add(params, 'ionAssetId', assetList.map(asset => asset.id));
    assetDropdown.onFinishChange(reinstantiateTiles);

    ionOptions.add(params, 'ionAccessToken');
    ionOptions.add(params, 'reload');
    ionOptions.open();
  };

  let selectedObject = null;

  const setHighlight = (color) => {
    if (selectedObject) {
      const hexColor = new THREE.Color(color).getHex();
      selectedObject.material.color.set(hexColor);
      setHighlightColor(color);    
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
  
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
  
      if (selectedObject !== clickedObject) {
        if (selectedObject) {
          selectedObject.material.color.set(0xffffff);
        }
  
        selectedObject = clickedObject;
  
        // Update the color of the selected object based on the input color
        const hexColor = new THREE.Color(highlightColor).getHex();
        selectedObject.material.color.set(hexColor);
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

  useEffect(() => {
    const fetchAssetDetails = async () => {
      try {
        const response = await fetch(`https://api.cesium.com/v1/assets`, {
          headers: {
            Authorization: `Bearer ${ionAccessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setAssetList(data);
        } else {
          console.error('Error fetching asset details:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching asset details:', error.message);
      }
    };

    fetchAssetDetails();
    init();
    animate();

    return () => {
      cleanUp();
    };
  }, [ionAccessToken]);

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      <label>Change Color</label>
      <input
        type="color"
        value={highlightColor}
        onChange={onColorInputChange} 
      />
    </div>
  );
}

export default New;
