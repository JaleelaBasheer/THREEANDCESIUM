import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ThreeJs() {
    const canvasRef = useRef(null);
    let camera, controls, scene, renderer, light, raycaster, mouse;
    const [labels, setLabels] = useState([]);
    const [showLabels, setShowLabels] = useState(true);
    const [cumulativeCenter, setCumulativeCenter] = useState(new THREE.Vector3());
    const [offsetTable, setOffsetTable] = useState([]);
    const [objectoffsetTable, setobjectoffsetTable] = useState([]);
    const [objectCenter, setobjectCenter] = useState([]);
    const [meshcenter, setmeshcenter] = useState([]);
    const [objectMeshAssociations, setObjectMeshAssociations] = useState([]);
    const [objectAssociations, setObjectAssociations] = useState([]);
    const [loadingProgress, setLoadingProgress] = useState(0); // State for loading progress

    let cumulativeBoundingBox = new THREE.Box3(); // Initialize cumulative bounding box
    let cumulativeBoundingBoxObject = new THREE.Box3(); // Initialize cumulative bounding box
   let offsetsobject =[]
   let offsets=[];
    const loadFBXFiles = (files) => {
        if (!files) return;
        const fbxLoader = new FBXLoader();
        const totalFiles = files.length;
        let loadedFiles = 0;

        const loadedLabels = [];
        const loadedObjects = [];
        const loadedOffsets = [];
        const loadedOffsetsobject = [];
        const fileCenter = [];
        const singlemeshcenter = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(file);
            console.log(URL.createObjectURL(file));

            fbxLoader.load(
                URL.createObjectURL(file),
                (object) => {
                    console.log('Loaded FBX object:', object);
                    loadedObjects.push({ object, filename: file.name });

                    object.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            setObjectMeshAssociations((prevAssociations) => [
                                ...prevAssociations,
                                { objectName: file.name, mesh: child },
                            ]);

                            const boundingBox = calculateBoundingBox(child);
                            const center = new THREE.Vector3();
                            const meshescenter = boundingBox.getCenter(center);
                            singlemeshcenter.push(meshescenter);
                            console.log(`File ${i + 1} - Mesh Bounding Box Center:`, center.toArray());
                            cumulativeBoundingBox.union(boundingBox);
                            cumulativeCenter.subVectors(cumulativeBoundingBox.getCenter(new THREE.Vector3()), center);

                            const minCoordinates = cumulativeBoundingBox.min.toArray();
                            const maxCoordinates = cumulativeBoundingBox.max.toArray();

                            const centerX = (minCoordinates[0] + maxCoordinates[0]) / 2;
                            const centerY = (minCoordinates[1] + maxCoordinates[1]) / 2;
                            const centerZ = (minCoordinates[2] + maxCoordinates[2]) / 2;

                            const cumulativecenter = new THREE.Vector3(centerX, centerY, centerZ);

                            setCumulativeCenter(new THREE.Vector3(centerX, centerY, centerZ));

                            const offset = boundingBox.getCenter(new THREE.Vector3()).sub(cumulativecenter);

                            loadedOffsets.push(offset);
                            offsets.push(offset);
                        }
                    });

                    const boundingBoxobject = calculateBoundingBox(object);
                    console.log(`File ${i + 1} - Bounding Box Min Coordinates:`, boundingBoxobject.min.toArray());
                    console.log(`File ${i + 1} - Bounding Box Max Coordinates:`, boundingBoxobject.max.toArray());
                    const center = new THREE.Vector3();
                    const objectfilecenter = boundingBoxobject.getCenter(center);
                    console.log(`File ${i + 1} - Bounding Box Center:`, objectfilecenter.toArray());
                    cumulativeBoundingBoxObject.union(boundingBoxobject);
                    const cumulativeCenterObject = cumulativeBoundingBoxObject.getCenter(new THREE.Vector3());
                    const offsetObject = center.clone().sub(cumulativeCenterObject);
                    scene.add(object);
                    fileCenter.push(objectfilecenter);
                    loadedOffsetsobject.push(offsetObject);
                    offsetsobject.push(offsetObject);

                    // Update the progress
                    loadedFiles++;
                    setLoadingProgress((loadedFiles / totalFiles) * 100);

                    if (loadedFiles === totalFiles) {
                        setObjectAssociations(loadedObjects);
                        setOffsetTable(loadedOffsets);
                        setobjectoffsetTable(loadedOffsetsobject);
                        setmeshcenter(singlemeshcenter);
                        setobjectCenter(fileCenter);
                        setLabels(loadedLabels);
                        updateCameraAndControls();
                        initControls();
                        initLight();
                        onWindowResize();
                        window.addEventListener('resize', onWindowResize, false);
                        animate();
                    }
                },
                (xhr) => {
                    // Update progress during loading
                    const progress = (xhr.loaded / xhr.total) * 100;
                    setLoadingProgress(progress);
                },
                (error) => {
                    console.error('Error loading FBX:', error);
                }
            );
        }
    };

    const calculateBoundingBox = (object) => {
        const boundingBox = new THREE.Box3().setFromObject(object);
        return boundingBox;
    };

    const updateCameraAndControls = () => {
        const center = cumulativeBoundingBox.getCenter(new THREE.Vector3());
        const size = cumulativeBoundingBox.getSize(new THREE.Vector3());
        const distance = Math.max(size.x, size.y, size.z) * 2;

        camera.position.copy(center);
        camera.position.y += distance;

        if (controls) {
            controls.target.copy(center);
            controls.update();
        }
    };

    const initControls = () => {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Smooth camera movements
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 2000;
    };

    const initLight = () => {
        light = new THREE.PointLight(0xffffff, 1);
        camera.add(light);
        scene.add(camera); // Add camera to the scene to allow light movement with the camera
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
            renderer.render(scene, camera);
        }

        if (controls) {
            controls.update();
        }
    };

    useEffect(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
        camera.position.set(0, 5, 0);
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xFF0000);
        document.body.appendChild(renderer.domElement);

        return () => {
            window.removeEventListener('resize', onWindowResize);
            if (renderer) {
                renderer.dispose();
            }
        };
    }, [cumulativeCenter, labels, offsetTable, objectoffsetTable, objectCenter]);

    return (
        <div>
            <input
                className="myinput"
                type="file"
                multiple
                onChange={(e) => loadFBXFiles(e.target.files)}
                accept=".fbx"
            />
            <div style={{ position: 'relative' }}>
                <canvas ref={canvasRef}></canvas>
                {/* Display loading progress */}
                {loadingProgress < 100 && (
                    <div className="loading-overlay">
                        <div className="loading-bar" style={{ width: `${loadingProgress}%` }}></div>
                        <div className="loading-text">Loading: {Math.round(loadingProgress)}%</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ThreeJs;
