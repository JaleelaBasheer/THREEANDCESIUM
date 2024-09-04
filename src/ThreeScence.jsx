import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const ThreeScene = () => {
    const mountRef = useRef(null);
    const cameraRef = useRef(null);
    const isMouseDown = useRef(false);
    const isPanning = useRef(false);
    const isZooming = useRef(false);
    const mouse = useRef({ x: 0, y: 0 });
    const lastMouseMovement = useRef({ x: 0, y: 0 });
    const continueTranslation = useRef(false);
    const continueRotation = useRef(false);
    const flySpeed = useRef(1);
    const translationSpeed = useRef(1);
    const rotationSpeed = useRef(0.01);
    const horizontalSensitivity = useRef(0.01);
    const verticalSensitivity = useRef(0.01);
    const previousMousePosition = useRef({ x: 0, y: 0 });

    const storeCameraPosition = useCallback(() => {
        // Assuming this function stores camera position
    }, []);

    const handleMouseDown = (event) => {
        const mouseEvent = event.touches ? event.touches[0] : event;
        if (mouseEvent.button === 0) { // Left mouse button pressed
            isMouseDown.current = true;
            mouse.current.x = mouseEvent.clientX;
            mouse.current.y = mouseEvent.clientY;
            isZooming.current = true;
            continueTranslation.current = true; // Enable automatic translation
            continueRotation.current = true; // Enable automatic rotation
        } else if (event.button === 1) { // Middle mouse button pressed
            isPanning.current = true;
            continueTranslation.current = true; // Enable automatic translation
            mouse.current.x = mouseEvent.clientX;
            mouse.current.y = mouseEvent.clientY;
        }
    };

    const handleMouseUp = () => {
        isMouseDown.current = false;
        isPanning.current = false;
        isZooming.current = false;
        lastMouseMovement.current = { x: 0, y: 0 };
    };

    const handleMouseMove = (event) => {
        event.preventDefault();
        const mouseEvent = event.touches ? event.touches[0] : event;
        if (!isMouseDown.current && !isPanning.current && !isZooming.current) return;

        const movementX = mouseEvent.clientX - mouse.current.x;
        const movementY = mouseEvent.clientY - mouse.current.y;

        lastMouseMovement.current = { x: movementX, y: movementY };
        if (isMouseDown.current) {
            const rotationAngleX = movementX * 0.01;
            const rotationAngleY = movementY * 0.01;

            // Rotate the camera around the object (assuming objectPosition is defined)
            const objectPosition = new THREE.Vector3(0, 0, 0); // Replace with your object's position
            const relativeCameraPosition = new THREE.Vector3().copy(cameraRef.current.position).sub(objectPosition);

            // Horizontal rotation around Y axis
            relativeCameraPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngleX);
            
            // Vertical rotation around camera's local X axis
            const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraRef.current.quaternion).normalize();
            relativeCameraPosition.applyAxisAngle(cameraRight, rotationAngleY);

            cameraRef.current.position.copy(relativeCameraPosition.add(objectPosition));

            // Update camera lookAt to always point towards the object
            cameraRef.current.lookAt(objectPosition);

            previousMousePosition.current = {
                x: event.clientX,
                y: event.clientY,
            };
        } else if (isPanning.current) {
            continueCameraMovement(movementX, movementY);
        }

        mouse.current.x = mouseEvent.clientX;
        mouse.current.y = mouseEvent.clientY;
    };

    const handleWheel = (event) => {
        const rotationAngle = -event.deltaY * 0.001;

        // Get the camera's up vector
        let cameraUp = new THREE.Vector3(0, 1, 0); // Assuming Y-axis is up
        cameraUp.applyQuaternion(cameraRef.current.quaternion);

        // Create a quaternion representing the rotation around the camera's up vector
        let quaternion = new THREE.Quaternion().setFromAxisAngle(cameraUp, rotationAngle);

        cameraRef.current.applyQuaternion(quaternion);
        storeCameraPosition(); // Assuming this function stores camera position
    };

    const continueCameraMovement = () => {
        const adjustedTranslationSpeed = flySpeed.current * translationSpeed.current;
        if (isMouseDown.current && (continueTranslation.current || continueRotation.current)) {
            requestAnimationFrame(continueCameraMovement);
            const movementX = lastMouseMovement.current.x;
            const movementY = lastMouseMovement.current.y;
            const tileSizeFactor = 0.1; // Implement this function to calculate the factor based on tile size

            // Horizontal movement: rotate around Y axis
            const horizontalRotationAngle = -movementX * rotationSpeed.current * horizontalSensitivity.current * tileSizeFactor;
            let cameraUp = cameraRef.current.up.clone().normalize();
            let horizontalQuaternion = new THREE.Quaternion().setFromAxisAngle(cameraUp, horizontalRotationAngle);
            cameraRef.current.applyQuaternion(horizontalQuaternion);

            // Vertical movement: rotate around X axis
            const verticalRotationAngle = -movementY * rotationSpeed.current * verticalSensitivity.current * tileSizeFactor;
            let cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraRef.current.quaternion).normalize();
            let verticalQuaternion = new THREE.Quaternion().setFromAxisAngle(cameraRight, verticalRotationAngle);
            cameraRef.current.applyQuaternion(verticalQuaternion);

            storeCameraPosition();
        } else if (isPanning.current && continueTranslation.current) {
            requestAnimationFrame(continueCameraMovement);
            const tileSizeFactor = 0.1;
            const movementY = lastMouseMovement.current.y;
            const movementX = lastMouseMovement.current.x;
            const adjustedHorizontalSensitivity = horizontalSensitivity.current * tileSizeFactor * 0.001;
            const adjustedVerticalSensitivity = verticalSensitivity.current * tileSizeFactor * 0.001;

            // Calculate movement speed based on mouse movement and sensitivity
            const moveSpeedX = movementX * adjustedHorizontalSensitivity;
            const moveSpeedY = movementY * adjustedVerticalSensitivity;

            const isHorizontal = Math.abs(movementX) > Math.abs(movementY);
            const isVertical = Math.abs(movementY) > Math.abs(movementX);

            if (isHorizontal) {
                // Move the camera along its local x axis
                cameraRef.current.translateX(moveSpeedX);
            } else if (isVertical) {
                // Move the camera along its local y axis
                cameraRef.current.translateY(-moveSpeedY);
            }

            storeCameraPosition();
        }
    };

    useEffect(() => {
        // Set up scene, camera, renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraRef.current = camera; // Store camera reference
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Create a function to add a cube at a specific position
        const addCube = (x, y, z, color) => {
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({ color });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(x, y, z);
            scene.add(cube);
        };

        // Add some cubes to the scene
        addCube(0, 0, 0, 0x00ff00); // Green cube at origin
        addCube(2, 2, -5, 0xff0000); // Red cube at (2, 2, -5)
        addCube(-2, -2, 5, 0x0000ff); // Blue cube at (-2,
        addCube(3, -3, 2, 0xffff00); // Yellow cube at (3, -3, 2)

        // Add the object around which the camera will rotate
        const objectPosition = new THREE.Vector3(0, 0, 0); // Example position
        const objectGeometry = new THREE.BoxGeometry();
        const objectMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        const object = new THREE.Mesh(objectGeometry, objectMaterial);
        object.position.copy(objectPosition);
        scene.add(object);

        camera.position.z = 10;

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        // Add event listeners
        mountRef.current.addEventListener('mousedown', handleMouseDown);
        mountRef.current.addEventListener('mouseup', handleMouseUp);
        mountRef.current.addEventListener('mousemove', handleMouseMove);
        mountRef.current.addEventListener('wheel', handleWheel);

        animate();

        // Clean up on component unmount
        return () => {
            mountRef.current.removeChild(renderer.domElement);
            mountRef.current.removeEventListener('mousedown', handleMouseDown);
            mountRef.current.removeEventListener('mouseup', handleMouseUp);
            mountRef.current.removeEventListener('mousemove', handleMouseMove);
            mountRef.current.removeEventListener('wheel', handleWheel);
        };
    }, [handleMouseDown, handleMouseUp, handleMouseMove, handleWheel]);

    return <div ref={mountRef} />;
};

export default ThreeScene;
