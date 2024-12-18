// ThreeJSSetup.js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

camera.position.z = 5;
renderer.setSize(window.innerWidth, window.innerHeight);

export { scene, camera, renderer };
