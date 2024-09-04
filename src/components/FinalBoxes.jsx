import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function FinalBoxes() {
  const mountRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;

    workerRef.current = new Worker(new URL('../components/boxWorker.js', import.meta.url));

    const boxes = [];
    const boxPositions = [];
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    for (let i = 0; i < 1000; i++) {
      const box = new THREE.Mesh(boxGeometry, boxMaterial);

      box.position.set(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );

      boxPositions.push(box.position.clone()); // Store position as simple data
      boxes.push(box);
    }

    workerRef.current.onmessage = function (e) {
      const { level1, level2, level3 } = e.data;

      // Handle level 1 boxes (visible)
      level1.forEach(index => {
        const box = boxes[index];
        if (!scene.children.includes(box)) {
          console.log('Adding box to scene:', box.position);
          scene.add(box);
        }
        box.visible = true;
      });

      // Handle level 2 boxes (loaded but hidden)
      level2.forEach(index => {
        const box = boxes[index];
        if (!scene.children.includes(box)) {
            console.log('Adding box at position:', box.position);
          scene.add(box);
        }
        box.visible = false;
      });

      // Handle level 3 boxes (not added yet)
      level3.forEach(index => {
        const box = boxes[index];
        if (scene.children.includes(box)) {
          scene.remove(box);
        }
      });

      // Render the scene
      animate();
    };

    // Send initial data to the worker
    workerRef.current.postMessage({
      boxPositions,
      cameraPosition: camera.position.toArray() // Pass position as array
    });

    camera.position.set(0, 0, 150);
    controls.update();

    // Handle camera movement
    controls.addEventListener('change', () => {
      workerRef.current.postMessage({
        boxPositions,
        cameraPosition: camera.position.toArray() // Pass position as array
      });
    });

    // Render loop
    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      controls.dispose();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return <div ref={mountRef} />;
}

export default FinalBoxes;
