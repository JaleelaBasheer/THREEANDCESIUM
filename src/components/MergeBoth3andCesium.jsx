import React, { useState, useEffect, useRef } from 'react';
import { DebugTilesRenderer as TilesRenderer, NONE } from '3d-tiles-renderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { CesiumIonTilesRenderer } from '3d-tiles-renderer';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Label from './Label';
import { getAllOffset } from '../services/AllApis';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';


function MergeBoth3andCesium() {
    const canvasRef = useRef(null);
    let camera, controls, scene, renderer, tiles, light,offsetParent, css2dRenderer;
    let selectedObject = null;
    let offsets = []; // Array to store offsets
    let offsetsobject = []; // Array to store offsets
  
    const raycaster = new THREE.Raycaster(); // Initialize raycaster
    const mouse = new THREE.Vector2(); // Initialize mouse
    const [offsettable ,setOffsettable] = useState([])
    
    const params = {
      'raycast': NONE,
      'ionAssetId': '2418668',
      'ionAccessToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE',
      'reload': () => {
        reinstantiateTiles();
      }
    };
    const [highlightColor, setHighlightColor] = useState('#ff0000');
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [assetList, setAssetList] = useState([]);
    const [labels, setLabels] = useState([]);
    const [showLabels, setShowLabels] = useState(true);
    const [cumulativeCenter, setCumulativeCenter] = useState(new THREE.Vector3());
    const [offsetTable, setOffsetTable] = useState([]);
    const [objectoffsetTable, setobjectoffsetTable]= useState([]);
    const [selectedMeshBoundingBoxCenter, setSelectedMeshBoundingBoxCenter] = useState(null);
    // Update the state to store object-mesh associations
    const [objectMeshAssociations, setObjectMeshAssociations] = useState([]);
    const [objectAssociations, setObjectAssociations] = useState([]);
  
    let cumulativeBoundingBox = new THREE.Box3(); // Initialize cumulative bounding box
    let cumulativeBoundingBoxObject = new THREE.Box3(); // Initialize cumulative bounding box
    useEffect(() => {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            scene.add(camera)
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0xff0000);
            document.body.appendChild(renderer.domElement);
            css2dRenderer = new CSS2DRenderer(); // Initialize CSS2DRenderer
            document.body.appendChild(renderer.domElement);
            controls = new OrbitControls(camera,css2dRenderer.domElement);

            controls.enableDamping = true;
            controls.screenSpacePanning = false;
            controls.minDistance = 1;
            controls.maxDistance = 2000;
        
        
        
            const dirLight = new THREE.DirectionalLight(0xffffff);
            dirLight.position.set(1, 2, 3);
            scene.add(dirLight);
        
            const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
            scene.add(ambLight);
        
            offsetParent = new THREE.Group();
            scene.add(offsetParent); 
            reinstantiateTiles();

            const gui = new GUI();
            gui.width = 300;
        
            const ionOptions = gui.addFolder('myasset');
            ionOptions.add(params, 'ionAssetId');
            ionOptions.add(params, 'ionAccessToken');
            ionOptions.add(params, 'reload');
            ionOptions.open();
            animate()
            
           return () => {
         window.removeEventListener('resize', onWindowResize);
        cleanUp()
         if (renderer) {
           renderer.dispose();
         }
       };
     }, [cumulativeCenter,labels,offsetTable,objectoffsetTable]);
  
    const loadFBXFiles = (files) => {
    
      if (!files) return;
       
      const fbxLoader = new FBXLoader();
  
      const loadedLabels = [];
      const loadedObjects = [];
      const loadedOffsets = []; // New array to store offsets
      const loadedOffsetsobject = []; // New array to store offsets
  
      
  
      for (let i = 0; i < files.length; i++) { 
   
        const file = files[i];
  
        fbxLoader.load(URL.createObjectURL(file),(object) => {
  
          console.log('Loaded FBX object:', object);
           // Push the loaded object and its filename into the array
      loadedObjects.push({ object, filename: file.name });
  
          object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
  
              // Store the association between object name and its mesh
              setObjectMeshAssociations((prevAssociations) => [
                ...prevAssociations,
                { objectName: file.name, mesh: child }
            ]);
  
                // Calculate bounding box for each mesh
                const boundingBox = calculateBoundingBox(child);
  
                // Log bounding box details for each mesh
                console.log(`File ${i + 1} - Mesh Bounding Box Min Coordinates:`, boundingBox.min.toArray());
                console.log(`File ${i + 1} - Mesh Bounding Box Max Coordinates:`, boundingBox.max.toArray());
  
                // Calculate center of the bounding box for each mesh
                const center = new THREE.Vector3();
                boundingBox.getCenter(center);
                console.log(`File ${i + 1} - Mesh Bounding Box Center:`, center.toArray());
                 // Update cumulative bounding box
               cumulativeBoundingBox.union(boundingBox);
                      // Accumulate differences in centers
         cumulativeCenter.subVectors(cumulativeBoundingBox.getCenter(new THREE.Vector3()), center);
         // Log cumulative bounding box details after each file
         const minCoordinates = cumulativeBoundingBox.min.toArray();
         const maxCoordinates = cumulativeBoundingBox.max.toArray();
             console.log('Cumulative Bounding Box Min Coordinates:',  minCoordinates);
             console.log('Cumulative Bounding Box Max Coordinates:', maxCoordinates);
   
             
               // Calculate the center
               const centerX = (minCoordinates[0] + maxCoordinates[0]) / 2;
         const centerY = (minCoordinates[1] + maxCoordinates[1]) / 2;
         const centerZ = (minCoordinates[2] + maxCoordinates[2]) / 2;
         
         const cumulativecenter = new THREE.Vector3(centerX, centerY, centerZ);
         
         console.log('Cumulative Bounding Box Center:', cumulativecenter.toArray())
         setCumulativeCenter(new THREE.Vector3(centerX, centerY, centerZ));
   
          // Calculate the difference between final cumulative center and individual bounding box center
           const offset = boundingBox.getCenter(new THREE.Vector3()).sub(cumulativecenter);
   
           // Log or use the offset as needed
           console.log(`File ${i + 1} - Offset:`, offset.toArray());
   
            // Store the offset for later use
         loadedOffsets.push(offset);
   
           // Store the offset for later use
           offsets.push(offset);
            }
  
          })
        
        // Calculate bounding box for the loaded object
        const boundingBoxobject = calculateBoundingBox(object);
  
        
        // Add label to each object
        // const label = createLabel(`Tag${i + 1}`, object);
  
        // Log bounding box details
        console.log(`File ${i + 1} - Bounding Box Min Coordinates:`, boundingBoxobject.min.toArray());
        console.log(`File ${i + 1} - Bounding Box Max Coordinates:`, boundingBoxobject.max.toArray());
  
        // Calculate center of the bounding box
        const center = new THREE.Vector3();
        boundingBoxobject.getCenter(center);
        console.log(`File ${i + 1} - Bounding Box Center:`, center.toArray());
       
        // Update cumulative bounding box
        // let cumulative= cumulativeBoundingBox.union(boundingBox);
         // Calculate the difference between final cumulative center and individual 
         cumulativeBoundingBoxObject.union(boundingBoxobject);
        // Update cumulative bounding box for objects
          const cumulativeCenterObject = cumulativeBoundingBoxObject.getCenter(new THREE.Vector3());
         // Calculate the offset between object center and cumulative center
  const offsetObject = center.clone().sub(cumulativeCenterObject);
  
  // Log or use the offset as needed
  console.log(`File ${i + 1} - Offset Object:`, offsetObject.toArray());
  
     scene.add(object);
     loadedOffsetsobject.push(offsetObject);
     offsetsobject.push(offsetObject);
  
        updateCameraAndControls();     
      enableInteractions()         
          },
          undefined,
          (error) => {
            console.error('Error loading FBX:', error);
          }
        );
       
      }  
      
  
      
  // Update the offsetTable state with the new offsets
      setObjectAssociations(loadedObjects)
      setOffsetTable(loadedOffsets);
      setobjectoffsetTable(loadedOffsetsobject);
      setLabels(loadedLabels); // Update the labels state
      initControls()
     initLight()
      onWindowResize();
      window.addEventListener('resize', onWindowResize, false);
      animate1();
      
       
    };
    const animate1 = () => {
        requestAnimationFrame(animate);
        if (renderer && scene && camera ) {
     
          renderer.render(scene, camera);
         
        }
        
        if (controls) {
          controls.update();
        }
             
         
      };
  
    const setupTiles = () => {

        tiles.fetchOptions.mode = 'cors';
    
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.153.0/examples/jsm/libs/draco/gltf/');
        const loader = new GLTFLoader(tiles.manager);
        loader.setDRACOLoader(dracoLoader);
        tiles.manager.addHandler(/\.gltf$/, loader);
        scene.add(tiles.group);
        // offsetParent.add(tiles.group);
                    console.log("6")

      };
    
      
      const reinstantiateTiles = () => {

        if (tiles) {
          scene.remove(tiles.group);
          tiles.dispose();
          tiles = null;
        }
    
        tiles = new CesiumIonTilesRenderer(params.ionAssetId, params.ionAccessToken);
    
        tiles.onLoadTileSet = () => {
    
          const sphere = new THREE.Sphere();
    
          tiles.getBoundingSphere(sphere);
          const position = sphere.center.clone();
          const distanceToEllipsoidCenter = position.length();
          
          const surfaceDirection = position.normalize();
          const up = new THREE.Vector3(0, 1, 0);
          const rotationToNorthPole = rotationBetweenDirections(surfaceDirection, up);
    
          tiles.group.quaternion.x = rotationToNorthPole.x;
          tiles.group.quaternion.y = rotationToNorthPole.y;
          tiles.group.quaternion.z = rotationToNorthPole.z;
          tiles.group.quaternion.w = rotationToNorthPole.w;
    
          tiles.group.position.y = -distanceToEllipsoidCenter;

    
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
    

    const createLabel = (text, object) => {
      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = text;
      labelDiv.style.marginTop = '-1em';
    
      const labelObject = new CSS2DObject(labelDiv);
      const boundingBox = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
    
      labelObject.position.copy(center);
      return labelObject;
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
      camera.position.z += distance;
  
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

        if ( !tiles ) return;
    
        tiles.setCamera(camera);
        tiles.setResolutionFromRenderer(camera, renderer);
    
        camera.updateMatrixWorld();
        tiles.update();    
        renderer.render(scene, camera);   
      
      if (controls) {
        controls.update();
      }
           
       
    };
  
    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
  
 
    const handleAddCommentButton = () => {
      const labelText = 'Label for ';
      const existingComment = labels.find(label => label.text === labelText)?.comment || '';
      const newComment = window.prompt(`Add a comment for "${labelText}":`, existingComment);
      if (newComment !== null) {
        setLabels((prevLabels) => [
          ...prevLabels,
          {
            position: { x: contextMenuPosition.x, y: contextMenuPosition.y },
            text: labelText,
            comment: newComment,
          },
        ]);
      }
      setContextMenuPosition({ x: 0, y: 0 });
    };
    const onMouseDown = (event) => {
      event.preventDefault();
  
      if (event.button === 0) {
        // Left click
        onMouseLeftClick(event);
      } else if (event.button === 2) {
        // Right click
        onMouseRightClick(event);
      }
    };
  
    const onMouseLeftClick = (event) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
  
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
  
        console.log('Left-click');
        handleObjectSelection(clickedObject);
      } else {
        console.log('Clicked outside of any object');
        handleDeselectObject();
      }
    };
  
    const onMouseRightClick = (event) => {
      console.log('Right-click');
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
  
      raycaster.setFromCamera(mouse, camera);
  
      const intersectsAbove = raycaster.intersectObjects(scene.children, true);
  
      if (intersectsAbove.length > 0) {
        const clickedObject = intersectsAbove[0].object;
        handleObjectSelection(clickedObject);
      } else {
        setContextMenuPosition({ x: 0, y: 0 });
        handleDeselectObject();
      }
    };
  
    const handleObjectSelection = (clickedObject) => {
      if (selectedObject) {
        selectedObject.material.color.set(0xffffff);
        selectedObject.material.programmaticColor = undefined; // Clear programmatic color
      }
  
      selectedObject = clickedObject;
      selectedObject.material.color.set(highlightColor);
          // Compute bounding box center of the selected mesh
          const boundingBox = new THREE.Box3().setFromObject(selectedObject);
          const boundingBoxCenter = new THREE.Vector3();
          boundingBox.getCenter(boundingBoxCenter);
          setSelectedMeshBoundingBoxCenter(boundingBoxCenter);
     console.log("bounding of selected mesh::--",selectedMeshBoundingBoxCenter)    
  
      // Programmatic color change
      const programmaticColor = new THREE.Color('#00ff00'); // Change this to the desired color
      selectedObject.material.programmaticColor = programmaticColor;
      // details of clicked object
      console.log("selected object details::", clickedObject)
  
     
    };
  
  
    const handleDeselectObject = () => {
      if (selectedObject) {
        console.log('Deselecting object');
        selectedObject.material.color.set(0xffffff);
        selectedObject = null;
      }
    };
  
    const enableInteractions = () => {
      if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('contextmenu', handleContextMenu);
        renderer.domElement.addEventListener('click', handleClickOutsideContextMenu);
      }
    };
  
    const handleContextMenu = (event) => {
      if (selectedObject) {
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
      }
    };
  
    const handleContextMenuColorChange = (color) => {
      setHighlightColor(color);
  
      if (selectedObject) {
        const hexColor = new THREE.Color(color).getHex();
        selectedObject.material.color.set(hexColor);
      }
    };
  
    const handleClickOutsideContextMenu = () => {
      if (contextMenuPosition.x !== 0 && contextMenuPosition.y !== 0) {
        setContextMenuPosition({ x: 0, y: 0 });
      }
    };
    
    const cleanUp = () => {
      if (renderer && renderer.domElement) {
  
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.domElement.removeEventListener('click', handleClickOutsideContextMenu);
      }
    };
    const onCommentClick = (labelText, existingComment) => {
      const newComment = window.prompt(`Add a comment for "${labelText}":`, existingComment);
      console.log(`Comment for "${labelText}":`, newComment);
    };
  
    const renderLabels = () => {
      return labels.map((label, index) => (
        <Label
          key={index}
          position={label.position}
          text={label.text}
          onCommentClick={(labelText, existingComment) =>
            onCommentClick(labelText, existingComment)
          }
        />
      ));
    };
   
    const renderContextMenu = () => {
      if (contextMenuPosition.x !== 0 && contextMenuPosition.y !== 0) {
        return (
          <div
            style={{
              position: 'absolute',
              top: contextMenuPosition.y-30,
              left: contextMenuPosition.x,
              background: '#fff',
              padding: '5px',
              boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)',
              zIndex: 1000,
            }}
          >
            <label> Select Highlight Color: </label>
            <input
              type="color"
              value={highlightColor}
              onInput={(e) => handleContextMenuColorChange(e.target.value)}
            />
            <button onClick={() => handleAddCommentButton()}>Add Comment</button>
          </div>
        );
      }
      return null;
    };
  
    const renderOffsetTable = () => {
      console.log('Rendering Offset Table');
      return (
        <table className='table table-stripe'>
          <thead>
            <tr>
              <th>No:</th>
              <th>Object Name</th>
              <th>Offset X</th>
              <th>Offset Y</th>
              <th>Offset Z</th>
            </tr>
          </thead>
          <tbody>
          {objectAssociations.map(( association,index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{association.filename.replace(/\.[^.]+$/, '')}</td>
              <td>{objectoffsetTable[index].x.toFixed(2)}</td>
              <td>{objectoffsetTable[index].y.toFixed(2)}</td>
              <td>{objectoffsetTable[index].z.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      );
    };
    
  
  const renderCombinedTable = () => {
    return (
        <table className='table table-stripe'>
            <thead>
                <tr>                  
                    <th>No:</th>
                    <th>Object Name</th>
                    <th>Mesh Name</th>
                    <th>Offset X</th>
                    <th>Offset Y</th>
                    <th>Offset Z</th>
                </tr>
            </thead>
            <tbody>
                {objectMeshAssociations.map((association, index) => (
                    <tr key={index}>
                        <td>{index+1}</td>
                        <td>{association.objectName.replace(/\.[^.]+$/, '')}</td>
                        <td>{association.mesh.name}</td>
                        <td>{offsetTable[index].x}</td>
                        <td>{offsetTable[index].y}</td>
                        <td>{offsetTable[index].z}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
  };
    return (
      <>
      <div>
        <input  className="myinput"
          type="file"
          multiple
          onChange={(e) => loadFBXFiles(e.target.files)}
          accept=".fbx"
        />
     <div style={{ position: 'relative' }}>
      <div className="m-3">
      <h3 className="text-warning text-center ms-5 me-5">Object Table</h3>
      {renderOffsetTable()}
      </div>
      <div className="m-3">
      <h3 className="text-success text-center ms-5 me-5">Mesh Table</h3>
      {renderCombinedTable()}
      </div>
      <div className="m-4">
      <canvas ref={canvasRef}></canvas>
  
      </div>
           
          </div>    
      </div>
        
        </>
    )
}

export default MergeBoth3andCesium