import React, { useRef, useEffect,useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class FreeCameraMouseControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        this.buttons = [];
        this.angularSensibility = 2000.0;
        this.speed = 1.0;
        
        this.offsetX = 0;
        this.offsetY = 0;
        this.previousPosition = null;
        this.direction = new THREE.Vector3(0, 0, 0);
        this.transformedDirection = new THREE.Vector3();
        this._cameraTransformMatrix = new THREE.Matrix4();
        
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        
        this.enabled = true;
        this.attachControl();
    }
    
    attachControl() {
        this.domElement.addEventListener('mousedown', this._onMouseDown, false);
        document.addEventListener('mouseup', this._onMouseUp, false);
        document.addEventListener('mousemove', this._onMouseMove, false);
    }
    
    detachControl() {
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('mousemove', this._onMouseMove);
        this.buttons = [];
        this.previousPosition = null;
    }
    
    _onMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        this.domElement.focus();
        
        this.buttons.push(event.button);
        this.previousPosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
    
    _onMouseUp(event) {
        if (!this.enabled) return;
        
        const buttonIndex = this.buttons.indexOf(event.button);
        if (buttonIndex !== -1) {
            this.buttons.splice(buttonIndex, 1);
        }
        
        this.previousPosition = null;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    _onMouseMove(event) {
        if (!this.enabled || !this.previousPosition) return;
        
        this.offsetX = event.clientX - this.previousPosition.x;
        this.offsetY = event.clientY - this.previousPosition.y;
        
        this.previousPosition.x = event.clientX;
        this.previousPosition.y = event.clientY;
    }
    
    update() {
        if (!this.enabled || !this.previousPosition) return;
        
        // Left mouse button - Rotate and move forward/backward
        if (this.buttons.indexOf(0) !== -1) {
            this.camera.rotation.y -= this.offsetX / (1 *this.angularSensibility);
            this.direction.set(0, 0, this.offsetY * this.speed / 300);
        }
        
        // Right mouse button - Pan camera
        if (this.buttons.indexOf(1) !== -1) {
            this.direction.set(
                this.offsetX * this.speed / 500,
                -this.offsetY * this.speed / 500,
                0
            );
        }
        
        if (this.buttons.indexOf(0) !== -1 || this.buttons.indexOf(1) !== -1) {
            // Transform direction based on camera rotation
            this._cameraTransformMatrix.makeRotationFromQuaternion(this.camera.quaternion);
            this.direction.applyMatrix4(this._cameraTransformMatrix);
            this.camera.position.add(this.direction);
        }
    }
    
    dispose() {
        this.detachControl();
    }

    updateCameraSpecialSettings(distance) {
        // Set mouse wheel/pinch sensitivity based on distance
        this.speed = distance ; // Adjust this factor as needed
        this.angularSensibility = Math.max(2000, distance * 10);
    }
}


function SampleTest() {
    const canvasRef = useRef(null);
    const flyControlsRef = useRef(null);
    const orbitControlsRef = useRef(null);
    const [activeControl, setActiveControl] = useState('fly'); // 'fly' or 'orbit'
    let camera, scene, renderer;

    const toggleControls = (controlType) => {
        if (controlType === 'fly') {
            if (orbitControlsRef.current) {
                orbitControlsRef.current.enabled = false;
            }
            if (flyControlsRef.current) {
                flyControlsRef.current.enabled = true;
            }
            setActiveControl('fly');
        } else {
            if (flyControlsRef.current) {
                flyControlsRef.current.enabled = false;
            }
            if (orbitControlsRef.current) {
                orbitControlsRef.current.enabled = true;
            }
            setActiveControl('orbit');
        }
    };

    const loadFBXFiles = (files) => {
        if (!files) return;
        const fbxLoader = new FBXLoader();
        const loadedObjects = [];

        while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        
        initLight();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            fbxLoader.load(
                URL.createObjectURL(file),
                (object) => {
                    loadedObjects.push({ object, filename: file.name });
                    scene.add(object);
                    updateCameraAndControls();
                },
                undefined,
                (error) => {
                    console.error("Error loading FBX:", error);
                }
            );
        }
    };

    const updateCameraAndControls = () => {
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const distance = Math.max(size.x, size.y, size.z) * 2;

        camera.position.copy(center);
        camera.position.z += distance;
        camera.lookAt(center);

        const camDistance = camera.position.distanceTo(center);
        camera.near = Math.max(0.1, camDistance / 100);
        camera.far = camDistance * 4;
        camera.updateProjectionMatrix();

        // Update fly controls settings
        if (flyControlsRef.current) {
            flyControlsRef.current.updateCameraSpecialSettings(distance);
        }

        // Update orbit controls settings
        if (orbitControlsRef.current) {
            orbitControlsRef.current.target.copy(center);
            orbitControlsRef.current.minDistance = distance / 10;
            orbitControlsRef.current.maxDistance = distance * 2;
            orbitControlsRef.current.update();
        }
    };

    const initLight = () => {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        scene.add(directionalLight);
    };

    const onWindowResize = () => {
        if (camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        if (renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    };

    const animate = () => {
        requestAnimationFrame(animate);
        if (renderer && scene && camera) {
            if (activeControl === 'fly' && flyControlsRef.current) {
                flyControlsRef.current.update();
            }
            if (activeControl === 'orbit' && orbitControlsRef.current) {
                orbitControlsRef.current.update();
            }
            renderer.render(scene, camera);
        }
    };

    useEffect(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            4000
        );
        camera.position.set(0, 5, 10);

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000);

        // Initialize both controls
        flyControlsRef.current = new FreeCameraMouseControls(camera, renderer.domElement);
        orbitControlsRef.current = new OrbitControls(camera, renderer.domElement);
        
        // Set initial control state
        toggleControls(activeControl);

        initLight();
        window.addEventListener("resize", onWindowResize);
        animate();

        return () => {
            window.removeEventListener("resize", onWindowResize);
            if (flyControlsRef.current) {
                flyControlsRef.current.dispose();
            }
            if (orbitControlsRef.current) {
                orbitControlsRef.current.dispose();
            }
            if (renderer) {
                renderer.dispose();
            }
        };
    }, []);

    return (
        <div className="relative">
            <div className="absolute top-4 left-4 z-10 flex gap-4">
                <button
                    className={`px-4 py-2 rounded ${
                        activeControl === 'fly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => toggleControls('fly')}
                >
                    Fly Camera
                </button>
                <button
                    className={`px-4 py-2 rounded ${
                        activeControl === 'orbit' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => toggleControls('orbit')}
                >
                    Orbit Camera
                </button>
            </div>
            <canvas ref={canvasRef} />
            <input
                type="file"
                multiple
                onChange={(e) => loadFBXFiles(e.target.files)}
                accept=".fbx"
                className="absolute bottom-4 left-4"
            />
        </div>
    );
}

export default SampleTest;