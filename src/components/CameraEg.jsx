import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CameraEg = () => {
  const canvasRef = useRef(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000));
  const renderer = useRef(new THREE.WebGLRenderer());
  const cube = useRef(null);
  const orbitControlsRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);
  const isPanning = useRef(false);
  const isZooming = useRef(false);
  const lastMouseMovement = useRef({ x: 0, y: 0 }); 
  const [cubeVisible, setCubeVisible] = useState(true); // State to track cube visibility
  let cameraHelper;

  useEffect(() => {
    const rendererInstance = renderer.current;
    const canvas = canvasRef.current;
    const sceneInstance = scene.current;
    const cameraInstance = camera.current;
    cameraHelper = new THREE.CameraHelper(cameraInstance);
    sceneInstance.add(cameraHelper);

    rendererInstance.setSize(window.innerWidth, window.innerHeight);
    canvas.appendChild(rendererInstance.domElement);

    const geometry = new THREE.BoxGeometry(1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube.current = new THREE.Mesh(geometry, material);
    cube.current.position.set(0, 0, 1);
    sceneInstance.add(cube.current);

    cameraInstance.position.z = 1;
    cameraInstance.lookAt(0, 0, 0);

    // Initialize orbit controls initially
    orbitControlsRef.current = new OrbitControls(cameraInstance, rendererInstance.domElement);
    orbitControlsRef.current.enableDamping = true; // Smooth camera movements
    orbitControlsRef.current.screenSpacePanning = false;
    orbitControlsRef.current.minDistance = 1;
    orbitControlsRef.current.maxDistance = 2000;
    orbitControlsRef.current.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN
    };

    const handleMouseDown = (event) => {
      if (event.button === 0) { // Left mouse button pressed
        isMouseDown.current = true;
        mouse.current.x = event.clientX;
        mouse.current.y = event.clientY;
        isZooming.current = true;
        continueCameraMovement(); // Start camera movement
      } else if (event.button === 1) { // Middle mouse button pressed
        isPanning.current = true;
        mouse.current.x = event.clientX;
        mouse.current.y = event.clientY;
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      isPanning.current = false;
      isZooming.current = false; // Disable zooming
    };

    const handleMouseMove = (event) => {
      if (!isMouseDown.current && !isPanning.current && !isZooming.current) return;

      const movementX = event.clientX - mouse.current.x;
      const movementY = event.clientY - mouse.current.y;
      lastMouseMovement.current = { x: movementX, y: movementY };

      // Determine if the movement is more horizontal or vertical
      const isHorizontal = Math.abs(movementX) > Math.abs(movementY);

      if (isMouseDown.current) { // Left mouse button clicked
        if (isHorizontal) { // Horizontal movement, rotate
          cameraInstance.rotation.y -= movementX * 0.005; // Rotate around Y axis
          cameraInstance.rotation.x -= movementY * 0.005; // Rotate around X axis
        } else { // Vertical movement, zoom in/out
          const zoomSpeed = movementY * 0.1; // Adjust zoom speed based on last recorded mouse movement
          const forwardDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.current.quaternion);
          // Move the camera forward/backward along its local forward direction
          camera.current.position.add(forwardDirection.multiplyScalar(zoomSpeed * 0.01));
        }
      } else if (isPanning.current) { // Middle mouse button clicked
        cameraInstance.position.x -= movementX * 0.01; // Pan left/right
        cameraInstance.position.y += movementY * 0.01; // Pan up/down
      }

      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
    };

    const handleMouseLeave = () => {
      isMouseDown.current = false;
    };

    const handleWheel = (event) => {
      // Zoom in/out along the z-axis
      cameraInstance.position.z -= event.deltaY * 0.01;
    };

    const continueCameraMovement = () => {
      if (isMouseDown.current) {
        requestAnimationFrame(continueCameraMovement);
        // const movementX = lastMouseMovement.current.x;
        const movementY = lastMouseMovement.current.y;
        const zoomSpeed = movementY * 0.1; // Adjust zoom speed based on last recorded mouse movement
        cameraInstance.position.z += zoomSpeed;
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      rendererInstance.render(sceneInstance, cameraInstance);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('wheel', handleWheel);
    document.addEventListener('mouseleave', handleMouseLeave);

    animate();

    return () => {
      sceneInstance.remove(cube.current);
      geometry.dispose();
      material.dispose();
      rendererInstance.dispose();
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (orbitControlsRef.current) {
        orbitControlsRef.current.dispose();
        orbitControlsRef.current = null;
      }
    };
  }, []);

  const enableFlyControls = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.dispose();
      orbitControlsRef.current = null;
    }
  };

  const enableOrbitControls = () => {
    if (!orbitControlsRef.current) {
      orbitControlsRef.current = new OrbitControls(camera.current, renderer.current.domElement);
    }
  };

  const toggleCubeVisibility = () => {
    if (cube.current) {
      setCubeVisible((prev) => !prev);
      cube.current.visible = !cube.current.visible;
    }
  };

  return (
    <div>
      <div ref={canvasRef}>
        <button onClick={enableOrbitControls}>Orbit Control</button>
        <button onClick={enableFlyControls}>Fly Control</button>
        <button onClick={toggleCubeVisibility}>{cubeVisible ? 'Hide' : 'Show'} Cube</button>
      </div>
    </div>
  );
};

export default CameraEg;
