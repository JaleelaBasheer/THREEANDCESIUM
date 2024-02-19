import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

function Egone() {
    const canvasRef = useRef(null);
    const [fbxFile, setFbxFile] = useState(null);
    const [tilesRenderer, setTilesRenderer] = useState(null);
  
    const params = {
        'ionAssetId': '2418668',
        'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE',
    };
    const [offsettable ,setOffsetTable] = useState([
        {x:"0",y:"0",z:"0"},
        {x:"0",y:"0",z:"-0.0002498626708984375"},
        {x:"0",y:"0",z:"-0.07674407958984375"},
        {x:"-0.10449981689453125",y:"0",z:"-0.12424468994140625"},
        {x:"-0.9524993896484375",y:"0",z:"	-0.12424373626708984"},
        {x:"-0.1",y:"0",z:"-0.2287435531616211"},
        { x:"-0.9759979248046875", y:	"0",z:	"-1.044022560119629"},
        {x:	"-1.0810012817382812	", y:"0", z:"	-1.0584220886230469"},
        {x:"-1.1238784790039062",y:"	0",z:	"-1.0584220886230469"},
      {x:	"-1.1100425720214844	",y:"0"	,z:"-1.0361852645874023"},
      {x:"-1.1302337646484375",y:	"0"	,z:"-0.70794677734375"},
      {x:"-1.3862190246582031",y:	"0"	,z:"-0.9760227203369141"},
      
      {x:"-1.9703636169433594",y:	"0",z:	"-0.9760227203369141"},
      {x:"	-1.970367431640625"	,y:"0"	,z:"-0.9760227203369141"},
      {x:	"-1.9905548095703125" , y:	"0"	,z:"-0.9760227203369141"},
      {x:	"1.7041473388671875",	y:"-0.1105194091796875",	z:"-0.9760227203369141"},
      {x:"1.6811447143554688"	,y:"-0.0230255126953125",z:	"-0.9760227203369141"}
      ])
      const [table ,setTable] = useState([
        {x:"0",y:"0",z:"0"},
        {x:"90.00",y:"279.40",z:"31.75"},
        {x:"99.92",y:"286.05",z:"-22.68"},
        {x:"68",y:"296.50",z:"40.48"},
        {x:"100",y:"286.10",z:"	-50.52"},
        {x:"94.40",y:"294",z:"25.24"},
        { x:"161.34", y:	"272.16",z:	"52.36"},
       
      ])
    
      const maxCoordinates = [98.85700225830078, 293.4586181640625, 32.09304428100586];
      const minCoordinates = [94.51111602783203, 292.9325256347656, 29.659000396728516];

    
    useEffect(() => {
       
        let scene, camera, renderer, controls, boundingBox;
        let tiles;
        let fbxObject;

        const initThree = () => {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0xffff00);
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.screenSpacePanning = false;
            controls.minDistance = 1;
            controls.maxDistance = 2000;
            const dirLight = new THREE.DirectionalLight(0xffffff);
            dirLight.position.set(1, 2, 3);
            scene.add(dirLight);
            const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
            scene.add(ambLight);

            // Load FBX file if selected
    if (fbxFile) {
        console.log("entering fbx file")
        const fbxLoader = new FBXLoader();
        fbxLoader.load(URL.createObjectURL(fbxFile), (fbx) => {
            fbxObject = fbx;
            // Create a group to hold both the FBX object and the 3D tiles
            const group = new THREE.Group();
            group.add(fbxObject); // Add FBX object to the group
            scene.add(group); // Add the group to the scene
    //          // Create a cube geometry
    //          console.log("creating cube")
    // const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    // // Create a basic material for the cube
    // const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    // // Create a mesh by combining the geometry and material
    // const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // // Position the cube at (0, 0, 0)
    // cubeMesh.position.set(0, 0, 0);

    // // Add the cube mesh to the group
    // group.add(cubeMesh);
    // scene.add(group)
            // Once FBX file is loaded, load and setup tiles
            // reinstantiateTiles();
            calculateBoundingBox(fbx);
            fitCameraToBoundingBox();                     
            animate();
        });
      
    } 
    else {
        // If no FBX file is loaded, just setup and render the tiles
        reinstantiateTiles();
        animate();
    }
   
//        // Map through the offsettable array and create a cube for each set of coordinates
//        offsettable.forEach((item) => {
//         // Convert coordinates to numbers
//         const x = parseFloat(item.x);
//         const y = parseFloat(item.y);
//         const z = parseFloat(item.z);
//         // Suppose you have a coordinate in Three.js
// const cesiumCoordinate  = new THREE.Vector3(x, y, z);

// // Convert from Three.js coordinate system to Cesium's right-handed coordinate system
// // Convert to Three.js coordinate system
// const threeX = cesiumCoordinate.y; // Swap Y and Z
// const threeY = -cesiumCoordinate.x; // Invert Y-axis
// const threeZ = cesiumCoordinate.z; // Keep Z as is
//  // Apply 180-degree counterclockwise rotation
//  const theta = Math.PI; // 180 degrees in radians
//  const newX = Math.cos(theta) * threeX- Math.sin(theta) * threeY;
//  const newY = Math.sin(theta) * threeX + Math.cos(theta) * threeY;

// // Resulting Three.js coordinate
// const threeCoordinate = { x: threeX, y: threeY, z: threeZ };
// console.log(threeCoordinate)

//         // Create a cube geometry
//         const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

//         // Create a basic material for the cube
//         const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

//         // Create a mesh by combining the geometry and material
//         const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

//         // Position the cube at the specified coordinates
//         cubeMesh.position.set(newX, newY, threeZ);

//         // Add the cube mesh to the scene
//         scene.add(cubeMesh);
//     });
     // Map through the offsettable array and create a cube for each set of coordinates
     table.forEach((item) => {
           
    
        // Create a cube geometry
        const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

        // Create a basic material for the cube
        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        // Create a mesh by combining the geometry and material
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // Position the cube at the specified coordinates
        cubeMesh.position.set(item.x, item.y, item.z);

        // Add the cube mesh to the scene
        scene.add(cubeMesh);
    });
// const cubeGeometry = new THREE.BoxGeometry(maxCoordinates[0] - minCoordinates[0],
//     maxCoordinates[1] - minCoordinates[1],
//      maxCoordinates[2] - minCoordinates[2]

// );

// const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff,transparent: true, opacity: 0.5});
// const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

// // Calculate center position of the cube
// const centerX = (maxCoordinates[0] + minCoordinates[0]) / 2;
// const centerY = (maxCoordinates[1] + minCoordinates[1]) / 2;
// const centerZ = (maxCoordinates[2] + minCoordinates[2]) / 2;
// cubeMesh.position.set(0,0,0);
// scene.add(cubeMesh);
        };


        const calculateBoundingBox = (fbx) => {
            console.log("entering bounding box")
            if (!boundingBox) {
                boundingBox = new THREE.Box3().setFromObject(fbx);
            } else {
                boundingBox.expandByObject(fbx);
            }
        };

        const fitCameraToBoundingBox = () => {
            console.log("Fitting camera to bounding box");
            if (boundingBox) {
                const center = boundingBox.getCenter(new THREE.Vector3());
                const size = boundingBox.getSize(new THREE.Vector3());
                const distance = Math.max(size.x, size.y, size.z) * 2;

                camera.position.copy(center);
                camera.position.z += distance;
                camera.lookAt(center);
                controls.target.copy(center);
                controls.update();
            }
        };

        const setupTiles = () => {
            console.log("entering setuptiles")

            tiles.fetchOptions.mode = 'cors';

            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/');
            const loader = new GLTFLoader(tiles.manager);
            loader.setDRACOLoader(dracoLoader);
            tiles.manager.addHandler(/\.gltf$/, loader);
            scene.add(tiles.group);
        };

        const reinstantiateTiles = () => {
            if (tiles) {
                console.log("remove tiles")
                scene.remove(tiles.group);
                tiles.dispose();
                tiles = null;
            }
            console.log("entering")

            tiles = new CesiumIonTilesRenderer(params.ionAssetId, params.ionAccessToken);
            tiles.onLoadTileSet = () => {
                const sphere = new THREE.Sphere();

                tiles.getBoundingSphere(sphere);
                const position = sphere.center.clone();
                const distanceToEllipsoidCenter = position.length();

                const surfaceDirection = position.normalize();
                const up = new THREE.Vector3(0, 0, 1);
                const rotationToNorthPole = rotationBetweenDirections(surfaceDirection, up);

                tiles.group.quaternion.x = rotationToNorthPole.x;
                tiles.group.quaternion.y = rotationToNorthPole.y;
                tiles.group.quaternion.z = rotationToNorthPole.z;
                tiles.group.quaternion.w = rotationToNorthPole.w;

                tiles.group.position.z = -distanceToEllipsoidCenter;

                setupTiles();
            };

            setupTiles();
        };

        const rotationBetweenDirections = (dir1, dir2) => {
            const rotation = new THREE.Quaternion();
            const a = new THREE.Vector3().crossVectors(dir1, dir2);
            rotation.x = a.x;
            rotation.y = a.y;
            rotation.z = a.z;
            rotation.w = 1 + dir1.clone().dot(dir2);
            rotation.normalize();

            return rotation;
        };

        const animate = () => {
            requestAnimationFrame(animate);

            if (tiles) {
                tiles.setCamera(camera);
                tiles.setResolutionFromRenderer(camera, renderer);
                 tiles.update();
            }        
            camera.updateMatrixWorld();
            renderer.render(scene, camera);
            controls.update();
        };
        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', onWindowResize, false);

        initThree();

        return () => {
            window.removeEventListener('resize', onWindowResize);
        };
    }, [fbxFile,offsettable]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        setFbxFile(file);
    };

    return (
        <div>
            <input type="file" onChange={handleFileUpload} accept=".fbx" />
            <canvas ref={canvasRef} />
        </div>
    );
}

export default Egone;
