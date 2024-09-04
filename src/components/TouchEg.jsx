import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const TouchEg = () => {
  const canvasRef = useRef(null);
  const scene = useRef(new THREE.Scene());
  const camera = useRef(new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000));
  const renderer = useRef(new THREE.WebGLRenderer());
  const cube = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const isTouching = useRef(false);
  const isPanning = useRef(false);
  const isZooming = useRef(false);
  const lastTouchMovement = useRef({ x: 0, y: 0 }); 

  useEffect(() => {
    const rendererInstance = renderer.current;
    const canvas = canvasRef.current;
    const sceneInstance = scene.current;
    const cameraInstance = camera.current;

    rendererInstance.setSize(window.innerWidth, window.innerHeight);
    canvas.appendChild(rendererInstance.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube.current = new THREE.Mesh(geometry, material);
    sceneInstance.add(cube.current);

    cameraInstance.position.z = 5;

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      mouse.current.x = touch.clientX;
      mouse.current.y = touch.clientY;
      isTouching.current = true;
      isZooming.current = true;
      continueCameraMovement();
    };

    const handleTouchEnd = () => {
      isTouching.current = false;
      isPanning.current = false;
      isZooming.current = false;
    };

    const handleTouchMove = (event) => {
      if (!isTouching.current && !isPanning.current && !isZooming.current) return;

      const touch = event.touches[0];
      const movementX = touch.clientX - mouse.current.x;
      const movementY = touch.clientY - mouse.current.y;
      lastTouchMovement.current = { x: movementX, y: movementY };

      const isHorizontal = Math.abs(movementX) > Math.abs(movementY);

      if (isTouching.current) {
        if (isHorizontal) {
          cameraInstance.rotation.y -= movementX * 0.005;
          cameraInstance.rotation.x -= movementY * 0.005;
        } else {
          const zoomSpeed = movementY * 0.01;
          cameraInstance.position.z += zoomSpeed;
        }
      } else if (isPanning.current) {
        cameraInstance.position.x -= movementX * 0.01;
        cameraInstance.position.y += movementY * 0.01;
      }

      mouse.current.x = touch.clientX;
      mouse.current.y = touch.clientY;
    };

    const handleTouchLeave = () => {
      isTouching.current = false;
    };

    const handleTouchCancel = () => {
      isTouching.current = false;
    };

    const handleWheel = (event) => {
      cameraInstance.position.z -= event.deltaY * 0.01;
    };

    const continueCameraMovement = () => {
      if (isTouching.current) {
        requestAnimationFrame(continueCameraMovement);
        const movementY = lastTouchMovement.current.y;
        const zoomSpeed = movementY * 0.01;
        cameraInstance.position.z += zoomSpeed;
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      rendererInstance.render(sceneInstance, cameraInstance);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchleave', handleTouchLeave);
    document.addEventListener('touchcancel', handleTouchCancel);
    document.addEventListener('wheel', handleWheel, { passive: false });

    animate();

    return () => {
      sceneInstance.remove(cube.current);
      geometry.dispose();
      material.dispose();
      rendererInstance.dispose();
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchleave', handleTouchLeave);
      document.removeEventListener('touchcancel', handleTouchCancel);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div ref={canvasRef}></div>
  );
};

export default TouchEg;
