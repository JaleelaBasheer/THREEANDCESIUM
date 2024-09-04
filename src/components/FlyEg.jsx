import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

function FlyEg() {
    const canvasRef = useRef(null); // Reference to the canvas element

    useEffect(() => {
        // Create a scene
        const scene = new THREE.Scene();

        // Create a camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5; // Set the camera position

        // Create a renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Create trackball controls
        const controls = new TrackballControls(camera, renderer.domElement);
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            // RIGHT: THREE.MOUSE.PAN
        };
        // Create a cube geometry
        const geometry = new THREE.BoxGeometry();

        // Create a basic material with a specific color
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        // Create a mesh by combining the geometry and material
        const cube = new THREE.Mesh(geometry, material);

        // Add the cube to the scene
        scene.add(cube);

        // Render the scene
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
            controls.update(); // Update trackball controls
        }
        animate();

        // Handle window resizing
        function handleResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }

        window.addEventListener('resize', handleResize);

        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose(); // Dispose of the renderer
        };
    }, []);

    return (
        <div>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

export default FlyEg;
