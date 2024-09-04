import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

function ThreeCanvas() {
  const canvasRef = useRef(null);
  const [fbxFileName, setFbxFileName] = useState('');

  useEffect(() => {
    // Set the FBX file name
    setFbxFileName('CA-202001_HO.fbx'); // Assuming the file name is "Piping1.fbx"
  }, []);

  useEffect(() => {
    if (fbxFileName) {
      renderFBXModel(fbxFileName);
    }
  }, [fbxFileName]);

  const renderFBXModel = (fileName) => {
    console.log("FBX file name:", fileName);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0xffff00); // Black background

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    // Add Axes Helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const loader = new FBXLoader();

    // Construct the file URL
    const url = `models/Sample_3D_Fbx/${fileName}`;

    console.log("Loading FBX from URL:", url);

    loader.load(url, 
      (object) => {
        console.log(object);
        if (object.children.length === 0) {
          console.error('Error: Loaded object has no children.');
          return;
        }
        console.log("FBX object loaded:", object);

      // Ensure object is centered and scaled appropriately
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log('Bounding Box Center:', center);
      console.log('Bounding Box Size:', size);

      object.position.sub(center); // Center the object
      const maxAxis = Math.max(size.x, size.y, size.z);
      object.scale.multiplyScalar(1.0 / maxAxis); // Scale uniformly

      // Adjust camera position based on the object size
      camera.position.set(center.x, center.y, center.z + maxAxis * 2);
      camera.lookAt(center);
      camera.updateProjectionMatrix(); 
      camera.near = 0.1; // Adjust as needed
      camera.far = 10000; // Adjust as needed

      scene.add(object);
      console.log("FBX object loaded:", object);
      console.log("FBX object position:", object.position);
      console.log("FBX object scale:", object.scale);
      // Add BoxHelper to visualize the bounding box
      const boxHelper = new THREE.BoxHelper(object, 0xff0000);
      console.log("BoxHelper created:", boxHelper);
      scene.add(boxHelper);

      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      animate();
    }, 
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, 
    (error) => {
      console.error('An error occurred while loading the FBX file.', error);
    });
  };

  return (
    <div style={{ width: '100%', height: '100vh', zIndex: '1', position: 'absolute' }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default ThreeCanvas;
