import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { scene, camera, renderer } from './ThreeJSsetup';

const ComponentB = () => {
  const mountRef = useRef(null);
  const sphereRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const sphere = new THREE.Mesh(geometry, material);
    sphereRef.current = sphere;
    scene.add(sphere);

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
        scene.remove(sphereRef.current);
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

export default ComponentB;
