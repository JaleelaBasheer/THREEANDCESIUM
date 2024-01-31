import React, { useRef, useState } from 'react'
import * as THREE from 'three';
import { BoxHelper } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ThreeDCanvas() {
  const containerRef = useRef(null);
  const [model, setModel] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadModel(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadModel = (modelURL) => {
    const loader = new FBXLoader();
    loader.load(modelURL, (fbx) => {

      setModel(fbx);
    });
  };
 

  const renderModel = () => {
    if (model) {
      const scene = new THREE.Scene();
      scene.add(model);
      const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000); 
      camera.position.set(0, 0, 5);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);
      renderer.setClearColor(0xffff00); 
         // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
      
      const boundingBox = new THREE.Box3().setFromObject(model);
      console.log('Bounding Box Min:', boundingBox.min); // Minimum coordinates of the bounding box
      console.log('Bounding Box Max:', boundingBox.max); // Maximum coordinates of the bounding box
      // Calculate the center of the bounding box
      const boundingBoxCenter = new THREE.Vector3();
      boundingBox.getCenter(boundingBoxCenter);

      // Position the camera to focus on the bounding box
      const boundingBoxSize = new THREE.Vector3();
      boundingBox.getSize(boundingBoxSize);
      const maxDimension = Math.max(boundingBoxSize.x, boundingBoxSize.y, boundingBoxSize.z);
     
      camera.position.copy(boundingBoxCenter);
    camera.position.z += maxDimension *2;
    controls.target.copy(boundingBoxCenter);
    controls.update();

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();
      

      return () => {
        // Clean up Three.js resources if needed
        renderer.dispose();
      };
    }
  };

  return (
    <><input type="file" multiple accept=".fbx" onChange={handleFileChange} />
    <div style={{width:'100%',height:'100vh' }} ref={containerRef} />
    {renderModel()}
    

    </>
    
    
  )
}

export default ThreeDCanvas