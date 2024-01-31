import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';

function Cia() {
  let camera, controls, scene, renderer, tiles, light, offsetParent, raycaster, mouse;
  let selectedObject = null;

  const canvasRef = useRef(null);
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuColor, setContextMenuColor] = useState(highlightColor);

  const params = {
    'raycast': NONE,
    'ionAssetId': '2418669',
    'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE',
    'reload': () => {
      reinstantiateTiles();
    }
  };

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
    ionOptions.add(params, 'ionAssetId');
    ionOptions.add(params, 'ionAccessToken');
    ionOptions.add(params, 'reload');
    ionOptions.open();
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

    if (event.button === 2 && intersects.length > 0) {
      const clickedObject = intersects[0].object;

      if (selectedObject) {
        selectedObject.material.color.set(0xffffff);
      }

      selectedObject = clickedObject;
      selectedObject.material.color.set(highlightColor);

      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      const selectedColor = selectedObject.material.color.getHexString();
      setContextMenuColor(`#${selectedColor}`);
    }
  };

  const enableInteractions = () => {
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('contextmenu', handleRightClick);
    renderer.domElement.addEventListener('click', handleClickOutsideContextMenu);
  };

   const handleRightClick = (event) => {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      if (selectedObject) {
        const selectedColor = selectedObject.material.color.getHex();
        setContextMenuColor(`#${selectedColor.toString(16)}`);
      } else {
        setContextMenuColor(highlightColor);
      }
    } else {
      setContextMenuPosition({ x: 0, y: 0 });
    }
  };

  const handleContextMenuColorChange = (color) => {
    setContextMenuColor(color);

    if (selectedObject) {
      const hexColor = new THREE.Color(color).getHex();
      selectedObject.material.color.set(hexColor);
      setHighlightColor(hexColor); // Add this line to update the highlightColor state
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

  const animate = () => {
    requestAnimationFrame(animate);

    if (!tiles) return;

    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);

    camera.updateMatrixWorld();
    tiles.update();

    renderer.render(scene, camera);

    if (controls) {
      controls.update();
    }
  };

  const cleanUp = () => {
    window.removeEventListener('click', handleClickOutsideContextMenu);
  window.removeEventListener('contextmenu', handleRightClick);
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
            top: contextMenuPosition.y,
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
            value={contextMenuColor}
            onInput={(e) => handleContextMenuColorChange(e.target.value)}
          />
        </div>
      );
    }
    return null;
  };
    
  return (
    <div>
      <div>
      {renderContextMenu()}
      <canvas ref={canvasRef}></canvas>
    </div>
      </div>
  )
}

export default Cia