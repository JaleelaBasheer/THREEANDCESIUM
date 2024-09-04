import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Cube = (props) => {
  const mesh = useRef();

  // Use useEffect to initialize the Three.js scene once on component mount
  useEffect(() => {
    // Geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Material
    const material = new THREE.MeshStandardMaterial({ color: 'orange' });

    // Mesh
    const cube = new THREE.Mesh(geometry, material);
    mesh.current = cube;

    // Clean-up function to dispose of the cube geometry and material when the component unmounts
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // UseFrame equivalent in plain Three.js (animate function)
  const animate = () => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.01;
      mesh.current.rotation.y += 0.01;
    }
  };

  // Request animation frame loop
  const render = () => {
    animate();
    requestAnimationFrame(render);
  };

  // Start animation loop on component mount
  useEffect(() => {
    render();
  }, []);

  return null; // Return null because Three.js manages rendering directly
};

export default Cube;
