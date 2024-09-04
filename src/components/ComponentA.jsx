import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { scene, camera, renderer } from './ThreeJSsetup';

const ComponentA = () => {
  const mountRef = useRef(null);
  const cubeRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
      
      // Set up OrbitControls
      controlsRef.current = new OrbitControls(camera, renderer.domElement);
      controlsRef.current.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      controlsRef.current.dampingFactor = 0.25;
      controlsRef.current.screenSpacePanning = false;
      controlsRef.current.minDistance = 1;
      controlsRef.current.maxDistance = 500;
      controlsRef.current.maxPolarAngle = Math.PI / 2;

      animate();
    }

    return () => {
      scene.remove(cubeRef.current);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const animate = () => {
    requestAnimationFrame(animate);
   
    controlsRef.current.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render(scene, camera);
  };

  return <div ref={mountRef} />;
};

export default ComponentA;
