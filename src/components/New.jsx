// <<<<<<< HEAD
// // import React, { useState, useEffect, useRef } from 'react';
// // // import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
// // import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// // import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// // import * as THREE from 'three';
// // import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// // import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
// // import { FlyOrbitControls } from './FlyOrbitControls.js';
// // // import dat from 'dat.gui'; // Import dat.GUI
// // import Stats from 'three/examples/jsm/libs/stats.module'; // Import Stats
// // // import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'; // Import BufferGeometryUtils
// // import {
// // 	DebugTilesRenderer as TilesRenderer,
// // 	NONE,
// // 	SCREEN_ERROR,
// // 	GEOMETRIC_ERROR,
// // 	DISTANCE,
// // 	DEPTH,
// // 	RELATIVE_DEPTH,
// // 	IS_LEAF,
// // 	RANDOM_COLOR,
// // } from  '3d-tiles-renderer';

// // function New({ ionAccessToken: initialIonAccessToken }) {
// //   const canvasRef = useRef(null);
// //   const [ionAssetId, setIonAssetId] = useState('2480864');
// //   const [ionAccessToken, setIonAccessToken] = useState(initialIonAccessToken);
// //   const [assetList, setAssetList] = useState([]);
// //   const ALL_HITS = 1;
// //   const FIRST_HIT_ONLY = 2;
  
// //   const hashUrl = window.location.hash.replace( /^#/, '' );
// //   let camera, controls, scene, renderer, tiles, cameraHelper;
// //   let thirdPersonCamera, thirdPersonRenderer, thirdPersonControls;
// //   let secondRenderer, secondCameraHelper, secondControls, secondCamera;
// //   let orthoCamera, orthoCameraHelper;
// //   let raycaster, mouse, rayIntersect, lastHoveredElement;
// //   let offsetParent;
// //   let statsContainer, stats;
// =======
// import React, { useState, useEffect, useRef } from 'react';
// import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
// import { getAllOffset } from '../services/AllApis';
// import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
// import { Card, Form,FloatingLabel, Row, Button } from 'react-bootstrap'



// function New({ ionAccessToken: initialIonAccessToken }) {
//   const canvasRef = useRef(null);
//   const [highlightColor, setHighlightColor] = useState('#ff0000');
//   const [ionAssetId, setIonAssetId] = useState('2454078');
//   const [ionAccessToken, setIonAccessToken] = useState(initialIonAccessToken);
//   const [assetList, setAssetList] = useState([]);
//   const [offsettable ,setOffsetTable] = useState([])  
//   const [scenes, setScenes] = useState(null);
//   const [table ,setTable] = useState([
//     {x:"0",y:"0",z:"0"},
//     {x:"90.00",y:"279.40",z:"31.75"},
//     {x:"99.92",y:"286.0",z:"-22.67"},
//     {x:"68",y:"296.50",z:"40.48"},
//     {x:"100",y:"286.10",z:"	-50.52"},
//     {x:"94.40",y:"294",z:"25.24"},
//     { x:"161.34", y:	"272.16",z:	"52.36"},
   
//   ])
//    // Define variable for creating box
//    const [size, setSize] = useState([1, 1, 1]);
//    const [position, setPosition] = useState([0, 0, 0]);
//    const [color, setColor] = useState('#00ff00');
//    const [name, setName] = useState('Cube');

//   let camera, controls, scene, renderer, tiles, light, offsetParent, raycaster, mouse,css2dRenderer;
//   const [viewMode, setViewMode] = useState('plan'); // State to track the view mode
//   const params = {
//     'raycast': NONE,
//     'ionAssetId': ionAssetId,
//     'ionAccessToken': ionAccessToken,
//     'reload': () => {
//       reinstantiateTiles();
//     },
//   };

//   // Set the new size of the canvas
// const innerWidth = 800;
// const innerHeight = 600;
//    const getalloffset = async () => {
//     try {
//       const response = await getAllOffset();
//       if (response.status === 200) {
//         setOffsetTable(response.data);
//         console.log(response.data)
//       } else {
//         alert("Cannot fetch data");
//       }
//     } catch (error) {
//       console.error('Error fetching offset data:', error.message);
//       alert("Cannot fetch data");
//     }
//   };
// >>>>>>> a6f781ee03de8e307f2e7adac21544b70879cfc6

// //     const params = {
// //     'raycast': NONE,
// //     'ionAssetId': ionAssetId,
// //     'ionAccessToken': ionAccessToken,
    
// //   };
// //   useEffect(() => {  
// //     function rotationBetweenDirections( dir1, dir2 ) {

// //       const rotation = new THREE.Quaternion();
// //       const a = new THREE.Vector3().crossVectors( dir1, dir2 );
// //       rotation.x = a.x;
// //       rotation.y = a.y;
// //       rotation.z = a.z;
// //       rotation.w = 1 + dir1.clone().dot( dir2 );
// //       rotation.normalize();
    
// <<<<<<< HEAD
// //       return rotation;
    
// //     }
    
// //     function setupTiles() {
    
// //       tiles.fetchOptions.mode = 'cors';
    
// //       // Note the DRACO compression files need to be supplied via an explicit source.
// //       // We use unpkg here but in practice should be provided by the application.
// //       const dracoLoader = new DRACOLoader();
// //       dracoLoader.setDecoderPath( 'https://unpkg.com/three@0.123.0/examples/js/libs/draco/gltf/' );
    
// //       const loader = new GLTFLoader( tiles.manager );
// //       loader.setDRACOLoader( dracoLoader );
    
// //       tiles.manager.addHandler( /\.gltf$/, loader );
// //       offsetParent.add( tiles.group );
    
// //     }
    
// //     function isInt( input ) {
    
// //       return ( typeof input === 'string' ) ? ! isNaN( input ) && ! isNaN( parseFloat( input ) ) && Number.isInteger( parseFloat( input ) ) : Number.isInteger( input );
    
// //     }
    
// //     function reinstantiateTiles() {
    
// //       let url = hashUrl || '../data/tileset.json';
    
// //       if ( hashUrl ) {
    
// //         params.ionAssetId = isInt( hashUrl ) ? hashUrl : '';
    
// //       }
    
// //       if ( tiles ) {
    
// //         offsetParent.remove( tiles.group );
// //         tiles.dispose();
    
// //       }
    
// //       if ( params.ionAssetId ) {
    
// //         url = new URL( `https://api.cesium.com/v1/assets/${params.ionAssetId}/endpoint` );
// //         url.searchParams.append( 'access_token', params.ionAccessToken );
    
// //         fetch( url, { mode: 'cors' } )
// //           .then( ( res ) => {
    
// //             if ( res.ok ) {
    
// //               return res.json();
    
// //             } else {
    
// //               return Promise.reject( `${res.status} : ${res.statusText}` );
    
// //             }
    
// //           } )
// //           .then( ( json ) => {
    
// //             url = new URL( json.url );
// //             const version = url.searchParams.get( 'v' );
    
// //             tiles = new TilesRenderer( url.toString() );
// //             tiles.fetchOptions.headers = {};
// //             tiles.fetchOptions.headers.Authorization = `Bearer ${json.accessToken}`;
    
// //             tiles.preprocessURL = uri => {
    
// //               uri = new URL( uri );
// //               if ( /^http/.test( uri.protocol ) ) {
    
// //                 uri.searchParams.append( 'v', version );
    
// //               }
// //               return uri.toString();
    
// //             };
    
// //             tiles.onLoadTileSet = () => {
    
// //               const box = new THREE.Box3();
// //               const sphere = new THREE.Sphere();
// //               const matrix = new THREE.Matrix4();
    
// //               let position;
// //               let distanceToEllipsoidCenter;
    
// //               if ( tiles.getOrientedBounds( box, matrix ) ) {
    
// //                 position = new THREE.Vector3().setFromMatrixPosition( matrix );
// //                 distanceToEllipsoidCenter = position.length();
    
// //               } else if ( tiles.getBoundingSphere( sphere ) ) {
    
// //                 position = sphere.center.clone();
// //                 distanceToEllipsoidCenter = position.length();
    
// //               }
    
// //               const surfaceDirection = position.normalize();
// //               const up = new THREE.Vector3( 0, 1, 0 );
// //               const rotationToNorthPole = rotationBetweenDirections( surfaceDirection, up );
    
// //               tiles.group.quaternion.x = rotationToNorthPole.x;
// //               tiles.group.quaternion.y = rotationToNorthPole.y;
// //               tiles.group.quaternion.z = rotationToNorthPole.z;
// //               tiles.group.quaternion.w = rotationToNorthPole.w;
    
// //               tiles.group.position.y = - distanceToEllipsoidCenter;
    
// //             };
    
// //             setupTiles();
    
// //           } )
// //           .catch( err => {
    
// //             console.error( 'Unable to get ion tileset:', err );
    
// //           } );
    
// //       } else {
    
// //         tiles = new TilesRenderer( url );
    
// //         setupTiles();
    
// //       }
    
// //     }
    
// //     function init() {
    
// //       scene = new THREE.Scene();
    
// //       // primary camera view
// //       renderer = new THREE.WebGLRenderer( { antialias: true } );
// //       renderer.setPixelRatio( window.devicePixelRatio );
// //       renderer.setSize( window.innerWidth, window.innerHeight );
// //       renderer.setClearColor( 0x151c1f );
// //       renderer.outputEncoding = THREE.sRGBEncoding;
    
// //       document.body.appendChild( renderer.domElement );
// //       renderer.domElement.tabIndex = 1;
    
// //       camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
// //       camera.position.set( 400, 400, 400 );
// //       cameraHelper = new THREE.CameraHelper( camera );
// //       scene.add( cameraHelper );
    
// //       orthoCamera = new THREE.OrthographicCamera();
// //       orthoCameraHelper = new THREE.CameraHelper( orthoCamera );
// //       scene.add( orthoCameraHelper );
    
// //       // secondary camera view
// //       secondCamera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
// //       secondCamera.position.set( 400, 400, - 400 );
// //       secondCamera.lookAt( 0, 0, 0 );
    
// //       secondRenderer = new THREE.WebGLRenderer( { antialias: true } );
// //       secondRenderer.setPixelRatio( window.devicePixelRatio );
// //       secondRenderer.setSize( window.innerWidth, window.innerHeight );
// //       secondRenderer.setClearColor( 0x151c1f );
// //       secondRenderer.outputEncoding = THREE.sRGBEncoding;
    
// //       document.body.appendChild( secondRenderer.domElement );
// //       secondRenderer.domElement.style.position = 'absolute';
// //       secondRenderer.domElement.style.right = '0';
// //       secondRenderer.domElement.style.top = '0';
// //       secondRenderer.domElement.style.outline = '#0f1416 solid 2px';
// //       secondRenderer.domElement.tabIndex = 1;
    
// //       secondControls = new FlyOrbitControls( secondCamera, secondRenderer.domElement );
// //       secondControls.screenSpacePanning = false;
// //       secondControls.minDistance = 1;
// //       secondControls.maxDistance = 2000;
    
// //       secondCameraHelper = new THREE.CameraHelper( secondCamera );
// //       scene.add( secondCameraHelper );
    
// //       // Third person camera view
// //       thirdPersonCamera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 4000 );
// //       thirdPersonCamera.position.set( 50, 40, 40 );
// //       thirdPersonCamera.lookAt( 0, 0, 0 );
    
// //       thirdPersonRenderer = new THREE.WebGLRenderer( { antialias: true } );
// //       thirdPersonRenderer.setPixelRatio( window.devicePixelRatio );
// //       thirdPersonRenderer.setSize( window.innerWidth, window.innerHeight );
// //       thirdPersonRenderer.setClearColor( 0x0f1416 );
// //       thirdPersonRenderer.outputEncoding = THREE.sRGBEncoding;
    
// //       document.body.appendChild( thirdPersonRenderer.domElement );
// //       thirdPersonRenderer.domElement.style.position = 'fixed';
// //       thirdPersonRenderer.domElement.style.left = '5px';
// //       thirdPersonRenderer.domElement.style.bottom = '5px';
// //       thirdPersonRenderer.domElement.tabIndex = 1;
    
// //       thirdPersonControls = new FlyOrbitControls( thirdPersonCamera, thirdPersonRenderer.domElement );
// //       thirdPersonControls.screenSpacePanning = false;
// //       thirdPersonControls.minDistance = 1;
// //       thirdPersonControls.maxDistance = 2000;
    
// //       // controls
// //       controls = new FlyOrbitControls( camera, renderer.domElement );
// //       controls.screenSpacePanning = false;
// //       controls.minDistance = 1;
// //       controls.maxDistance = 2000;
    
// //       // lights
// //       const dirLight = new THREE.DirectionalLight( 0xffffff );
// //       dirLight.position.set( 1, 2, 3 );
// //       scene.add( dirLight );
    
// //       const ambLight = new THREE.AmbientLight( 0xffffff, 0.2 );
// //       scene.add( ambLight );
    
// //       offsetParent = new THREE.Group();
// //       scene.add( offsetParent );
    
// //       // Raycasting init
// //       raycaster = new THREE.Raycaster();
// //       mouse = new THREE.Vector2();
    
// //       rayIntersect = new THREE.Group();
    
// //       const rayIntersectMat = new THREE.MeshBasicMaterial( { color: 0xe91e63 } );
// //       const rayMesh = new THREE.Mesh( new THREE.CylinderGeometry( 0.25, 0.25, 6 ), rayIntersectMat );
// //       rayMesh.rotation.x = Math.PI / 2;
// //       rayMesh.position.z += 3;
// //       rayIntersect.add( rayMesh );
    
// //       const rayRing = new THREE.Mesh( new THREE.BufferGeometry( 1.5, 0.2, 16, 100 ), rayIntersectMat );
// //       rayIntersect.add( rayRing );
// //       scene.add( rayIntersect );
// //       rayIntersect.visible = false;
    
// //       reinstantiateTiles();
    
// //       onWindowResize();
// //       window.addEventListener( 'resize', onWindowResize, false );
// //       renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
// //       renderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
// //       renderer.domElement.addEventListener( 'mouseup', onMouseUp, false );
// //       renderer.domElement.addEventListener( 'mouseleave', onMouseLeave, false );
    
// //       secondRenderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
// //       secondRenderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
// //       secondRenderer.domElement.addEventListener( 'mouseup', onMouseUp, false );
// //       secondRenderer.domElement.addEventListener( 'mouseleave', onMouseLeave, false );
    
    
// //       // GUI
// //       // const gui = new dat.GUI();
// //       // gui.width = 300;
    
// //       // const ionOptions = gui.addFolder( 'Ion' );
// //       // ionOptions.add( params, 'ionAssetId' );
// //       // ionOptions.add( params, 'ionAccessToken' );
// //       // ionOptions.add( params, 'reload' );
// //       // ionOptions.open();
    
// //       // const tileOptions = gui.addFolder( 'Tiles Options' );
// //       // tileOptions.add( params, 'loadSiblings' );
// //       // tileOptions.add( params, 'stopAtEmptyTiles' );
// //       // tileOptions.add( params, 'displayActiveTiles' );
// //       // tileOptions.add( params, 'errorTarget' ).min( 0 ).max( 50 );
// //       // tileOptions.add( params, 'errorThreshold' ).min( 0 ).max( 1000 );
// //       // tileOptions.add( params, 'maxDepth' ).min( 1 ).max( 100 );
// //       // tileOptions.add( params, 'up', [ '+Y', '+Z', '-Z' ] );
    
// //       // const debug = gui.addFolder( 'Debug Options' );
// //       // debug.add( params, 'displayBoxBounds' );
// //       // debug.add( params, 'colorMode', {
    
// //       //   NONE,
// //       //   SCREEN_ERROR,
// //       //   GEOMETRIC_ERROR,
// //       //   DISTANCE,
// //       //   DEPTH,
// //       //   RELATIVE_DEPTH,
// //       //   IS_LEAF,
// //       //   RANDOM_COLOR,
    
// //       // } );
    
// //       const exampleOptions = gui.addFolder( 'Example Options' );
// //       exampleOptions.add( params, 'resolutionScale' ).min( 0.01 ).max( 2.0 ).step( 0.01 ).onChange( onWindowResize );
// //       exampleOptions.add( params, 'orthographic' );
// //       exampleOptions.add( params, 'showThirdPerson' );
// //       exampleOptions.add( params, 'showSecondView' ).onChange( onWindowResize );
// //       exampleOptions.add( params, 'enableUpdate' ).onChange( v => {
    
// //         tiles.parseQueue.autoUpdate = v;
// //         tiles.downloadQueue.autoUpdate = v;
    
// //         if ( v ) {
    
// //           tiles.parseQueue.scheduleJobRun();
// //           tiles.downloadQueue.scheduleJobRun();
    
// //         }
    
// //       } );
// //       exampleOptions.add( params, 'raycast', { NONE, ALL_HITS, FIRST_HIT_ONLY } );
// //       exampleOptions.add( params, 'enableCacheDisplay' );
// //       exampleOptions.add( params, 'enableRendererStats' );
    
// //       gui.open();
    
// //       statsContainer = document.createElement( 'div' );
// //       document.getElementById( 'info' ).appendChild( statsContainer );
    
// //       // Stats
// //       stats = new Stats();
// //       stats.showPanel( 0 );
// //       document.body.appendChild( stats.dom );
    
// //     }
    
// //     function onWindowResize() {
    
// //       thirdPersonCamera.aspect = window.innerWidth / window.innerHeight;
// //       thirdPersonCamera.updateProjectionMatrix();
// //       thirdPersonRenderer.setSize( Math.floor( window.innerWidth / 3 ), Math.floor( window.innerHeight / 3 ) );
    
// //       if ( params.showSecondView ) {
    
// //         camera.aspect = 0.5 * window.innerWidth / window.innerHeight;
// //         renderer.setSize( 0.5 * window.innerWidth, window.innerHeight );
    
// //         secondCamera.aspect = 0.5 * window.innerWidth / window.innerHeight;
// //         secondRenderer.setSize( 0.5 * window.innerWidth, window.innerHeight );
// //         secondRenderer.domElement.style.display = 'block';
    
// //       } else {
    
// //         camera.aspect = window.innerWidth / window.innerHeight;
// //         renderer.setSize( window.innerWidth, window.innerHeight );
    
// //         secondRenderer.domElement.style.display = 'none';
    
// //       }
// //       camera.updateProjectionMatrix();
// //       renderer.setPixelRatio( window.devicePixelRatio * params.resolutionScale );
    
// //       secondCamera.updateProjectionMatrix();
// //       secondRenderer.setPixelRatio( window.devicePixelRatio );
    
// //       updateOrthoCamera();
    
// //     }
    
// //     function onMouseLeave( e ) {
    
// //       lastHoveredElement = null;
    
// //     }
    
// //     function onMouseMove( e ) {
    
// //       const bounds = this.getBoundingClientRect();
// //       mouse.x = e.clientX - bounds.x;
// //       mouse.y = e.clientY - bounds.y;
// //       mouse.x = ( mouse.x / bounds.width ) * 2 - 1;
// //       mouse.y = - ( mouse.y / bounds.height ) * 2 + 1;
    
// //       lastHoveredElement = this;
    
// //     }
    
// //     const startPos = new THREE.Vector2();
// //     const endPos = new THREE.Vector2();
// //     function onMouseDown( e ) {
    
// //       const bounds = this.getBoundingClientRect();
// //       startPos.set( e.clientX - bounds.x, e.clientY - bounds.y );
    
// //     }
    
// //     function onMouseUp( e ) {
    
// //       const bounds = this.getBoundingClientRect();
// //       endPos.set( e.clientX - bounds.x, e.clientY - bounds.y );
// //       if ( startPos.distanceTo( endPos ) > 2 ) {
    
// //         return;
    
// //       }
    
// //       if ( lastHoveredElement === secondRenderer.domElement ) {
    
// //         raycaster.setFromCamera( mouse, secondCamera );
    
// //       } else {
    
// //         raycaster.setFromCamera( mouse, params.orthographic ? orthoCamera : camera );
    
// //       }
    
// //       raycaster.firstHitOnly = true;
// //       const results = raycaster.intersectObject( tiles.group, true );
// //       if ( results.length ) {
    
// //         const object = results[ 0 ].object;
// //         const info = tiles.getTileInformationFromActiveObject( object );
    
// //         let str = '';
// //         for ( const key in info ) {
    
// //           let val = info[ key ];
// //           if ( typeof val === 'number' ) {
    
// //             val = Math.floor( val * 1e5 ) / 1e5;
    
// //           }
    
// //           let name = key;
// //           while ( name.length < 20 ) {
    
// //             name += ' ';
    
// //           }
    
// //           str += `${ name } : ${ val }\n`;
    
// //         }
// //         console.log( str );
    
// //       }
    
// //     }
    
// //     function updateOrthoCamera() {
    
// //       orthoCamera.position.copy( camera.position );
// //       orthoCamera.rotation.copy( camera.rotation );
    
// //       const scale = camera.position.distanceTo( controls.target ) / 2.0;
// //       let aspect = window.innerWidth / window.innerHeight;
// //       if ( params.showSecondView ) {
    
// //         aspect *= 0.5;
    
// //       }
// //       orthoCamera.left = - aspect * scale;
// //       orthoCamera.right = aspect * scale;
// //       orthoCamera.bottom = - scale;
// //       orthoCamera.top = scale;
// //       orthoCamera.near = camera.near;
// //       orthoCamera.far = camera.far;
// //       orthoCamera.updateProjectionMatrix();
    
// //     }
    
// //     function animate() {
    
// //       requestAnimationFrame( animate );
    
// //       if ( ! tiles ) return;
    
// //       // update options
// //       tiles.errorTarget = params.errorTarget;
// //       tiles.errorThreshold = params.errorThreshold;
// //       tiles.loadSiblings = params.loadSiblings;
// //       tiles.stopAtEmptyTiles = params.stopAtEmptyTiles;
// //       tiles.displayActiveTiles = params.displayActiveTiles;
// //       tiles.maxDepth = params.maxDepth;
// //       tiles.displayBoxBounds = params.displayBoxBounds;
// //       tiles.colorMode = parseFloat( params.colorMode );
    
// //       if ( params.orthographic ) {
    
// //         tiles.deleteCamera( camera );
// //         tiles.setCamera( orthoCamera );
// //         tiles.setResolutionFromRenderer( orthoCamera, renderer );
    
// //       } else {
    
// //         tiles.deleteCamera( orthoCamera );
// //         tiles.setCamera( camera );
// //         tiles.setResolutionFromRenderer( camera, renderer );
    
// //       }
    
// //       if ( params.showSecondView ) {
    
// //         tiles.setCamera( secondCamera );
// //         tiles.setResolutionFromRenderer( secondCamera, secondRenderer );
    
// //       } else {
    
// //         tiles.deleteCamera( secondCamera );
    
// //       }
    
// //       offsetParent.rotation.set( 0, 0, 0 );
// //       if ( params.up === '-Z' ) {
    
// //         offsetParent.rotation.x = Math.PI / 2;
    
// //       } else if ( params.up === '+Z' ) {
    
// //         offsetParent.rotation.x = - Math.PI / 2;
    
// //       }
    
// //       offsetParent.updateMatrixWorld( true );
    
// //       if ( parseFloat( params.raycast ) !== NONE && lastHoveredElement !== null ) {
    
// //         if ( lastHoveredElement === renderer.domElement ) {
    
// //           raycaster.setFromCamera( mouse, params.orthographic ? orthoCamera : camera );
    
// //         } else {
    
// //           raycaster.setFromCamera( mouse, secondCamera );
    
// //         }
    
// //         raycaster.firstHitOnly = parseFloat( params.raycast ) === FIRST_HIT_ONLY;
    
// //         const results = raycaster.intersectObject( tiles.group, true );
// //         if ( results.length ) {
    
// //           const closestHit = results[ 0 ];
// //           const point = closestHit.point;
// //           rayIntersect.position.copy( point );
    
// //           // If the display bounds are visible they get intersected
// //           if ( closestHit.face ) {
    
// //             const normal = closestHit.face.normal;
// //             normal.transformDirection( closestHit.object.matrixWorld );
// //             rayIntersect.lookAt(
// //               point.x + normal.x,
// //               point.y + normal.y,
// //               point.z + normal.z
// //             );
    
// //           }
    
// //           rayIntersect.visible = true;
    
// //         } else {
    
// //           rayIntersect.visible = false;
    
// //         }
    
// //       } else {
    
// //         rayIntersect.visible = false;
    
// //       }
    
// //       // update tiles
// //       window.tiles = tiles;
// //       if ( params.enableUpdate ) {
    
// //         secondCamera.updateMatrixWorld();
// //         camera.updateMatrixWorld();
// //         orthoCamera.updateMatrixWorld();
// //         tiles.update();
    
// //       }
    
// //       render();
// //       stats.update();
    
// //     }
    
// //     function render() {
    
// //       updateOrthoCamera();
    
// //       cameraHelper.visible = false;
// //       orthoCameraHelper.visible = false;
// //       secondCameraHelper.visible = false;
    
// //       // render primary view
// //       if ( params.orthographic ) {
    
// //         const dist = orthoCamera.position.distanceTo( rayIntersect.position );
// //         rayIntersect.scale.setScalar( dist / 150 );
    
// //       } else {
    
// //         const dist = camera.position.distanceTo( rayIntersect.position );
// //         rayIntersect.scale.setScalar( dist * camera.fov / 6000 );
    
// //       }
// //       renderer.render( scene, params.orthographic ? orthoCamera : camera );
    
// //       // render secondary view
// //       if ( params.showSecondView ) {
    
// //         const dist = secondCamera.position.distanceTo( rayIntersect.position );
// //         rayIntersect.scale.setScalar( dist * secondCamera.fov / 6000 );
// //         secondRenderer.render( scene, secondCamera );
    
// //       }
    
// //       // render third person view
// //       thirdPersonRenderer.domElement.style.visibility = params.showThirdPerson ? 'visible' : 'hidden';
// //       if ( params.showThirdPerson ) {
    
// //         cameraHelper.update();
// //         cameraHelper.visible = ! params.orthographic;
    
// //         orthoCameraHelper.update();
// //         orthoCameraHelper.visible = params.orthographic;
    
// //         if ( params.showSecondView ) {
    
// //           secondCameraHelper.update();
// //           secondCameraHelper.visible = true;
    
// //         }
    
// //         const dist = thirdPersonCamera.position.distanceTo( rayIntersect.position );
// //         rayIntersect.scale.setScalar( dist * thirdPersonCamera.fov / 6000 );
// //         thirdPersonRenderer.render( scene, thirdPersonCamera );
    
// //       }
    
// //       const cacheFullness = tiles.lruCache.itemList.length / tiles.lruCache.maxSize;
// //       let str = `Downloading: ${ tiles.stats.downloading } Parsing: ${ tiles.stats.parsing } Visible: ${ tiles.group.children.length - 2 }`;
    
// //       if ( params.enableCacheDisplay ) {
    
// //         const geomSet = new Set();
// //         tiles.traverse( tile => {
    
// //           const scene = tile.cached.scene;
// //           if ( scene ) {
    
// //             scene.traverse( c => {
    
// //               if ( c.geometry ) {
    
// //                 geomSet.add( c.geometry );
    
// //               }
    
// //             } );
    
// //           }
    
// //         } );
    
// //         let count = 0;
// //         geomSet.forEach( g => {
    
// //           // count += BufferGeometryUtils.estimateBytesUsed( g );
    
// //         } );
// //         str += `<br/>Cache: ${ ( 100 * cacheFullness ).toFixed( 2 ) }% ~${ ( count / 1000 / 1000 ).toFixed( 2 ) }mb`;
    
// //       }
    
// //       if ( params.enableRendererStats ) {
    
// //         const memory = renderer.info.memory;
// //         const programCount = renderer.info.programs.length;
// //         str += `<br/>Geometries: ${ memory.geometries } Textures: ${ memory.textures } Programs: ${ programCount }`;
    
// //       }
    
// //       if ( statsContainer.innerHTML !== str ) {
    
// //         statsContainer.innerHTML = str;
    
// //       }
    
// //     }
    
// //   }, [ionAccessToken,ionAssetId]);
 
// //   useEffect(()=>{
// //     const fetchAssetDetails = async () => {
// //       try {
// //         const response = await fetch(`https://api.cesium.com/v1/assets`, {
// //           headers: {
// //             Authorization: `Bearer ${ionAccessToken}`,
// //           },
// //         });

// //         if (response.ok) {
// //           const data = await response.json();
// //         setAssetList(data.items);
         
// //         } else {
// //           console.error('Error fetching asset details:', response.statusText);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching asset details:', error.message);
// //       }
// //     };
// //     fetchAssetDetails();
// //   },[assetList,ionAssetId])
// //      // Function to handle asset selection
// //      const handleAssetSelection = (e) => {
// //       const selectedId = e.target.value;
// //       // Get all IDs in assetList
// //       const allIds = assetList.map(asset => asset.id);
// //       const selectedAsset = assetList.find(asset => asset.id===parseInt(selectedId));
// //       setIonAssetId(selectedAsset.id);
// //   };
// //   return (
// //     <>
// //     <div><div>       
// //       <select onChange={handleAssetSelection}>
// //                 <option value="">Select Asset</option>
// //                 {assetList.map(asset => (
// //                     <option key={asset.id} value={asset.id}>{asset.name}-{asset.id}</option>
// //                 ))}
// //             </select>
// //             </div>
// //             <div >
// //                 <canvas ref={canvasRef}></canvas>
// //             </div></div>
// //     </>
// //   );
// // }
// // export default New;
// =======
//     };

//     setupTiles();

//   };

//   const rotationBetweenDirections = (dir1, dir2) => {
//     const rotation = new THREE.Quaternion();
//     const a = new THREE.Vector3().crossVectors(dir1, dir2);
//     rotation.x = a.x;
//     rotation.y = a.y;
//     rotation.z = a.z;
//     rotation.w = 1 + dir1.clone().dot(dir2);
//     rotation.normalize();

//     return rotation;
//      };

//   const init = () => {
//      // Set the new size of the canvas
// const innerWidth = 600;
// const innerHeight = 600;
//     scene = new THREE.Scene();
//     setScenes(scene);
//     renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current ,alpha:true});
//     renderer.setClearColor(0xffff00);  //color yellow
//     document.body.appendChild(renderer.domElement);
//     renderer.domElement.tabIndex = 1;
//     document.body.appendChild(renderer.domElement);

//     camera = new THREE.PerspectiveCamera(60, innerWidth  / innerHeight , .1, 4000);
//     camera.position.set(0,600,0);
//     camera.lookAt(0,0,0);

//     css2dRenderer = new CSS2DRenderer(); // Initialize CSS2DRenderer
//     css2dRenderer.setSize(innerWidth , innerHeight );
//     css2dRenderer.domElement.style.position = 'absolute';
//     css2dRenderer.domElement.style.top = '0';    
//     document.body.appendChild(css2dRenderer.domElement);

//     controls = new OrbitControls(camera,renderer.domElement);
//     controls = new OrbitControls(camera,css2dRenderer.domElement);
//     controls.enableDamping = true;
//     controls.screenSpacePanning = false;
//     controls.minDistance = 1;
//     controls.maxDistance = 2000;

//     light = new THREE.PointLight(0xffff00, 1);
//     camera.add(light);
//     scene.add(camera);

//     const dirLight = new THREE.DirectionalLight(0xffffff);
//     dirLight.position.set(1, 2, 3);
//     scene.add(dirLight);

//     const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
//     scene.add(ambLight);

//     offsetParent = new THREE.Group();
//     scene.add(offsetParent);

//     raycaster = new THREE.Raycaster();
//     mouse = new THREE.Vector2();

//      // Set up initial view mode
//     switchViewMode(viewMode);

//     enableInteractions();

//     reinstantiateTiles();

//     onWindowResize();
//     window.addEventListener('resize', onWindowResize, false);

//     // const gui = new GUI();
//     // gui.width = 300;

//     // const ionOptions = gui.addFolder('myasset');
//     // ionOptions.add(params, 'ionAssetId').onFinishChange(reinstantiateTiles);

//     // // Display all asset IDs in a dropdown
//     // const assetDropdown = ionOptions.add(params, 'ionAssetId', assetList.map(asset => asset.id));
//     // assetDropdown.onFinishChange(reinstantiateTiles);

//     // ionOptions.add(params, 'ionAccessToken');
//     // ionOptions.add(params, 'reload');
//     // ionOptions.open();
//   };

//   // Switch view mode between plan and side
//   const switchViewMode = (mode) => {
//     setViewMode(mode);
//     if (mode === 'plan') {
//       console.log("Enter plan mode")
//       // Plan view settings
//       camera.position.set(0, 600, 0);
//       camera.lookAt(0, 0, 0);
//       controls.autoRotate = false;
//       controls.enablePan = true;
//       controls.enableRotate = true;
//     } else if (mode === 'side') {
//       console.log("Enter side mode")

//       // Side view settings
//       camera.position.set(600, 0, 0);
//       camera.lookAt(0, 0, 0);
//       controls.autoRotate = false;
//       controls.enablePan = true;
//       controls.enableRotate = true;
//     }
//   };

// const createLabels = () => {
 
//   table.forEach((item) => {
//   const x = parseFloat(item.x);
//         const y = parseFloat(item.y);
//         const z = parseFloat(item.z);
// // Create a vector representing the original coordinates
// const originalVector = new THREE.Vector3(x, y, z);

// // Define the angle of rotation (90 degrees in radians)
// const angle =- Math.PI/2 ;

// // Create a rotation matrix around the x-axis
// const rotationMatrix = new THREE.Matrix4().makeRotationX(angle);

// // Apply the rotation matrix to the original vector
// const rotatedVector = originalVector.applyMatrix4(rotationMatrix);

// // Extract the new coordinates
// const newX = rotatedVector.x;
// const newY = rotatedVector.y;
// const newZ = rotatedVector.z;
// const vector = new THREE.Vector3(newX,newY,newZ)

//   const labelDiv = document.createElement('div');
//   labelDiv.className = 'label';
//   labelDiv.innerHTML = '<i class="fa-solid fa-circle-dot" style="font-size: 5px"></i>';
//   labelDiv.style.color = '#ffffff';
//   const labelObject = new CSS2DObject(labelDiv);
//   labelObject.position.set(newX,newY,newZ);
//   // Add label to the scene
//   scene.add(labelObject); 
// });
// };

//   let selectedObject = null;

//   const setHighlight = (color) => {
//     if (selectedObject) {
    
//       // const hexColor = new THREE.Color(color).getHex();
//       // selectedObject.material.color.set(hexColor);
//       // setHighlightColor(color);    
//     }
//   };

//   const onColorInputChange = (e) => {
//     setHighlight(e.target.value);
//   };

//   const onMouseMove = (event) => {
//     mouse.x = (event.clientX / innerWidth ) * 2 - 1;
//     mouse.y = -(event.clientY / innerHeight ) * 2 + 1;
   
 
//   };
 
//   const onMouseClick = () => {
//     raycaster.setFromCamera(mouse, camera);
  
//     const intersects = raycaster.intersectObjects(scene.children, true);
    
  
//     if (intersects.length > 0) {
//       const clickedObject = intersects[0].object;
//        console.log('Clicked object:', clickedObject);
//         // Access the position of the clicked object
//         const { x, y, z } = clickedObject.position;
//         console.log('Coordinates of clicked object:', x, y, z);
  
//       if (selectedObject !== clickedObject) {
//         if (selectedObject) {
//           selectedObject.material.color.set(0xffffff);
//         }
  
//         selectedObject = clickedObject;
//         selectedObject.visible = false;
  
//         // // Update the color of the selected object based on the input color
//         // const hexColor = new THREE.Color(highlightColor).getHex();
//         // selectedObject.material.color.set(hexColor);
//       }
//     } else {
//       console.log("no click events")
//       if (selectedObject) {
//         selectedObject.material.color.set(0xffffff);
//         selectedObject = null;
//       }
//     }
//   };
  

//   const enableInteractions = () => {
//     renderer.domElement.addEventListener('mousemove', onMouseMove);
//     renderer.domElement.addEventListener('click', onMouseClick);
//     css2dRenderer.domElement.addEventListener('mousemove', onMouseMove);
//     css2dRenderer.domElement.addEventListener('click', onMouseClick);
//   };

//   const onWindowResize = () => {
//      // Set the new size of the canvas
//     camera.aspect = innerWidth  / innerHeight ;
//     camera.updateProjectionMatrix();
//     renderer.setSize(innerWidth , innerHeight );
//     // renderer.setPixelRatio(window.devicePixelRatio);
//     css2dRenderer.setSize(innerWidth , innerHeight );
//   };
//   const render = () => {
//     tiles.setCamera(camera);
//     tiles.setResolutionFromRenderer(camera, renderer);
  
//     camera.updateMatrixWorld();
//     tiles.update();

//     css2dRenderer.render(scene, camera);
//     renderer.render(scene, camera);

//    }  

//   const animate = () => {
//     requestAnimationFrame(animate);

//     if (!tiles) return;

//     tiles.setCamera(camera);
//     tiles.setResolutionFromRenderer(camera, renderer);

//     camera.updateMatrixWorld();
//     tiles.update();

//     render(); // Trigger a re-render    
//     if (controls) {
//       controls.update();
//     }
//   };

//   const cleanUp = () => {
//     renderer.domElement.removeEventListener('mousemove', onMouseMove);
//     renderer.domElement.removeEventListener('click', onMouseClick);
//     css2dRenderer.domElement.removeEventListener('mousemove', onMouseMove);
//     css2dRenderer.domElement.removeEventListener('click', onMouseClick);
//   };

//   useEffect(() => {  
//   // getalloffset();
     
//     init();
    
//           // Map through the offsettable array and create a cube for each set of coordinates
//           table.forEach((item) => {
//                     // Convert coordinates to numbers
//         const x =item.x;
//         const y = item.y;
//         const z = item.z;
//  // Create a vector representing the original coordinates
//  const originalVector = new THREE.Vector3(x, y, z);

//  // Define the angle of rotation (90 degrees in radians)
//  const angle =- Math.PI/2 ;

//  // Create a rotation matrix around the x-axis
//  const rotationMatrix = new THREE.Matrix4().makeRotationX(angle);

//  // Apply the rotation matrix to the original vector
//  const rotatedVector = originalVector.applyMatrix4(rotationMatrix);

//  // Extract the new coordinates
//  const newX = rotatedVector.x;
//  const newY = rotatedVector.y;
//  const newZ = rotatedVector.z;

           
    
//             // Create a cube geometry
//             const cubeGeometry = new THREE.BoxGeometry(5,5,5);
    
//             // Create a basic material for the cube
//             const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
//             // Create a mesh by combining the geometry and material
//             const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
            
    
//             // Position the cube at the specified coordinates
//             cubeMesh.position.set((newX), (newY), (newZ));
//               // cubeMesh.position.set((item.x), (item.y), (item.z));
    
//             // Add the cube mesh to the scene
//             scene.add(cubeMesh);
//         });

// //  // Create a vector representing the original coordinates
// //  const originalVector = new THREE.Vector3(99.92,286.0,-22.67);

// //  // Define the angle of rotation (90 degrees in radians)
// //  const angle =- Math.PI/2 ;

// //  // Create a rotation matrix around the x-axis
// //  const rotationMatrix = new THREE.Matrix4().makeRotationX(angle);

// //  // Apply the rotation matrix to the original vector
// //  const rotatedVector = originalVector.applyMatrix4(rotationMatrix);

// //  // Extract the new coordinates
// //  const newX = rotatedVector.x;
// //  const newY = rotatedVector.y;
// //  const newZ = rotatedVector.z;

//                     // // Create a cube geometry
//                     // const cubeGeometry = new THREE.BoxGeometry(5,5,5);
    
//                     // // Create a basic material for the cube
//                     // const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
//                     // // Create a mesh by combining the geometry and material
//                     // const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    
            
//                     // // Position the cube at the specified coordinates
//                     // // cubeMesh.position.set((newX), (newY), (newZ));
//                     //   cubeMesh.position.set(0,0,0);
            
//                     // // Add the cube mesh to the scene
//                     // scene.add(cubeMesh);
       
//     animate();


//     return () => {
//       cleanUp();
//     };
//   }, [viewMode,ionAccessToken,ionAssetId,size,position,color]);
 
//   useEffect(()=>{
//     const fetchAssetDetails = async () => {
//       try {
//         const response = await fetch(`https://api.cesium.com/v1/assets`, {
//           headers: {
//             Authorization: `Bearer ${ionAccessToken}`,
//           },
//         });

//         if (response.ok) {
//           const data = await response.json();
//         setAssetList(data.items);
         
//         } else {
//           console.error('Error fetching asset details:', response.statusText);
//         }
//       } catch (error) {
//         console.error('Error fetching asset details:', error.message);
//       }
//     };
//     fetchAssetDetails();
//   },[assetList,ionAssetId])
//      // Function to handle asset selection
//      const handleAssetSelection = (e) => {
//       const selectedId = e.target.value;
//       // Get all IDs in assetList
//       const allIds = assetList.map(asset => asset.id);
//       const selectedAsset = assetList.find(asset => asset.id===parseInt(selectedId));
//       setIonAssetId(selectedAsset.id);
//   };
 

//   return (
//     <>
//     <div className="row">
//       {/* <div className="col-lg-5">
//         <button onClick={() => switchViewMode('plan')}>Plan View</button>
//       <button onClick={() => switchViewMode('side')}>Side View</button>
//       <select onChange={handleAssetSelection}>
//                 <option value="">Select Asset</option>
//                 {assetList.map(asset => (
//                     <option key={asset.id} value={asset.id}>{asset.name}-{asset.id}</option>
//                 ))}
//             </select>
//       </div>  */}
//       <div className="col-lg-1"></div>        
//       <div className="col-lg-6">
//       <canvas  ref={canvasRef}></canvas>
//       </div>
//       {/* <label>Change Color</label>
//       <input
//         type="color"
//         value={highlightColor}
//         onChange={onColorInputChange} 
//       /> */}     
//     </div>
  

//     </>
//   );
// }

// export default New;
// >>>>>>> a6f781ee03de8e307f2e7adac21544b70879cfc6
