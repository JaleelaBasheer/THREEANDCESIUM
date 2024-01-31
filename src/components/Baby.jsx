import React , { useEffect, useRef } from 'react'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


function Baby() {
  const canvasRef = useRef();
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const loader = new GLTFLoader();
    const ionAssetId = '2411888'; // Replace with your Cesium Ion Asset ID
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5ZGEyZDQ0Mi02NzA4LTQ3MTAtYTAyYy0wNTVkZDkwOTg4YTYiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQyNjk2MjJ9.iClpw_NRHInYUgd7vrVzDpI4Con7Zm7EAvqOevrGU0E'; // Replace with your Cesium Ion Access Token

    fetch(`https://api.cesium.com/v1/assets/${ionAssetId}/endpoint?access_token=${accessToken}`)
      .then((response) => response.json())
      .then((data) => {
        // Load 3D Tiles using Three.js GLTFLoader
        loader.load(
          data.url, // URL from Cesium Ion API
          (gltf) => {
            scene.add(gltf.scene);
          },
          undefined,
          (error) => {
            console.error('Error loading 3D Tiles:', error);
          }
        );
      })
      .catch((error) => {
        console.error('Error fetching tileset:', error);
      });

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
  </div>
  )
}

export default Baby