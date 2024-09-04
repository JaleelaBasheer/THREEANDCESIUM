import React, { useRef } from 'react';
import * as THREE from 'three';

function Person() {
    const sphereRef = useRef(null);

    // Initialize scene, camera, renderer
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a cube as the camera (hidden)
    var cubeGeometry = new THREE.BoxGeometry();
    var cubeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    var cameraCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cameraCube);

    // Create a sphere
    var sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereRef.current = sphere; // Store reference to the sphere
    scene.add(sphere);

    // Set initial position for sphere
    sphere.position.set(1, 0, 0);

    // Set camera position and look at the sphere
    camera.position.set(0, 1.5, 5);
    camera.lookAt(cameraCube.position);

    // Variables for movement
    var rotateLeft = false;
    var panMiddle = false;
    var prevX = 0;
    var prevY = 0;

    // Event listeners for mouse input
    document.addEventListener('mousedown', function(event) {
        if (event.button === 0) {
            rotateLeft = true;
            prevX = event.clientX;
            prevY = event.clientY;
        } else if (event.button === 1) {
            panMiddle = true;
            prevX = event.clientX;
            prevY = event.clientY;
        }
    });

    document.addEventListener('mousemove', function(event) {
        if (rotateLeft) {
            var movementX = event.clientX - prevX;
            var movementY = event.clientY - prevY;
            cameraCube.rotation.y -= movementX * 0.02;
            cameraCube.position.x -= movementY * 0.1 * Math.sin(cameraCube.rotation.y);
            cameraCube.position.z -= movementY * 0.1 * Math.cos(cameraCube.rotation.y);
            sphere.position.copy(cameraCube.position); // Update sphere's position
            camera.lookAt(sphere.position);
            prevX = event.clientX;
            prevY = event.clientY;
        } else if (panMiddle) {
            var movementX = event.clientX - prevX;
            var movementY = event.clientY - prevY;
            cameraCube.position.x -= movementX * 0.01;
            cameraCube.position.y += movementY * 0.01;
            sphere.position.copy(cameraCube.position); // Update sphere's position
            camera.lookAt(sphere.position);
            prevX = event.clientX;
            prevY = event.clientY;
        }
    });

    document.addEventListener('mouseup', function(event) {
        if (event.button === 0) {
            rotateLeft = false;
        } else if (event.button === 1) {
            panMiddle = false;
        }
    });

    // Render loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();

    return (
        <div></div>
    );
}

export default Person;
