import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function Examplesss() {
  const canvasRef = useRef(null);
  const [cubes, setCubes] = useState([]);
  const camera = useRef(null);
  const scene = useRef(null); // Define scene variable using useRef hook

  useEffect(() => {
    // Initialize scene
    scene.current = new THREE.Scene();
    
    // Initialize camera
    camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.current.position.set(0, 0, 5);

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Initialize controls
    const controls = new OrbitControls(camera.current, renderer.domElement);

    // Add cubes to scene
    const newCubes = [
      createCube(scene.current, 0x00ff00, new THREE.Vector3(2, 0, 0)),
      createCube(scene.current, 0x00fff0, new THREE.Vector3(0, 0, 5)),
      createCube(scene.current, 0xffffff, new THREE.Vector3(5, 0, 0)),
    ];
    setCubes(newCubes);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene.current, camera.current);
      controls.update();
    };
    animate();

  }, []);

  // Function to create a cube and add it to the scene
  const createCube = (scene, color, position) => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    scene.add(mesh);
    return { mesh, boundingBoxCenter: position };
  };

  // Function to handle raycasting when the button is clicked
  const handleRaycasting = () => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0, 0);
    
    // Simulate rays from the camera position in different directions
    const directions = [
      new THREE.Vector3(1, 0, 0),   // Right
      new THREE.Vector3(-1, 0, 0),  // Left
      new THREE.Vector3(0, 1, 0),   // Up
      new THREE.Vector3(0, -1, 0),  // Down
      new THREE.Vector3(0, 0, 1),   // Forward
      new THREE.Vector3(0, 0, -1),  // Backward
    ];

    for (const direction of directions) {
      raycaster.set(camera.current.position, direction);
      const intersects = raycaster.intersectObjects(scene.current.children, true);
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject && clickedObject.position.equals(new THREE.Vector3(0, 0, 0))) {
          scene.current.remove(clickedObject);
          setCubes(prevCubes => prevCubes.filter(cube => cube.mesh !== clickedObject));
        }
      }
    }
  };

  return (
    <div>
      <div ref={canvasRef} />
      <button onClick={handleRaycasting}>Cast Ray</button>
    </div>
  );
}

export default Examplesss;
