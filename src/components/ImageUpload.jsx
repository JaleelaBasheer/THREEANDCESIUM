import React , { useRef, useEffect, useState } from 'react'
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import { CSS2DObject , CSS2DRenderer} from 'three/examples/jsm/renderers/CSS2DRenderer';
import Label from './Label';
import { Box3 } from 'three';
import { BoxGeometry, MeshBasicMaterial } from 'three';


function ImageUpload() {
  const canvasRef = useRef(null);
  let camera, controls, scene, renderer, tiles, light,offsetParent, raycaster, mouse, css2dRenderer;
  let selectedObject = null;
  let offsets = []; // Array to store offsets
  let offsetsobject = []; // Array to store offsets

  
  const [highlightColor, setHighlightColor] = useState('#ff0000');
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [assetList, setAssetList] = useState([]);
  const [labels, setLabels] = useState([]);
  const [showLabels, setShowLabels] = useState(true);
  const [cumulativeCenter, setCumulativeCenter] = useState(new THREE.Vector3());
  const [offsetTable, setOffsetTable] = useState([]);
  const [objectoffsetTable, setobjectoffsetTable]= useState([]);
  const [selectedMeshBoundingBoxCenter, setSelectedMeshBoundingBoxCenter] = useState(null);
  const [objectCenter, setobjectCenter]= useState([]);
  const [meshcenter,setmeshcenter] = useState([]);

  // Update the state to store object-mesh associations
  const [objectMeshAssociations, setObjectMeshAssociations] = useState([]);
  const [objectAssociations, setObjectAssociations] = useState([]);

  const [table ,setTable] = useState([
    {x:"90.00",y:"279.40",z:"31.75"},
    {x:"68",y:"296.50",z:"40.48"},
    {x:"100",y:"286.10",z:"	-50.52"},
    {x:"95.40",y:"294",z:"25.24"},
    { x:"131.34", y:	"272.16",z:	"52.36"},
   
  ])

  let cumulativeBoundingBox = new THREE.Box3(); // Initialize cumulative bounding box
  let cumulativeBoundingBoxObject = new THREE.Box3(); // Initialize cumulative bounding box

  const loadFBXFiles = (files) => {
    if (!files) return;
    const fbxLoader = new FBXLoader();

    const loadedLabels = [];
    const loadedObjects = [];
    const loadedOffsets = []; // New array to store offsets
    const loadedOffsetsobject = []; // New array to store offsets
    const fileCenter = [];
    const singlemeshcenter = [];

    

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
              // console.log(`File ${i + 1} - Mesh Bounding Box Min Coordinates:`, boundingBox.min.toArray());
              // console.log(`File ${i + 1} - Mesh Bounding Box Max Coordinates:`, boundingBox.max.toArray());

              // Calculate center of the bounding box for each mesh
              const center = new THREE.Vector3();
             const meshescenter = boundingBox.getCenter(center);
             singlemeshcenter.push(meshescenter)
              console.log(`File ${i + 1} - Mesh Bounding Box Center:`, center.toArray());
               // Update cumulative bounding box
             cumulativeBoundingBox.union(boundingBox);
                    // Accumulate differences in centers
       cumulativeCenter.subVectors(cumulativeBoundingBox.getCenter(new THREE.Vector3()), center);
       // Log cumulative bounding box details after each file
       const minCoordinates = cumulativeBoundingBox.min.toArray();
       const maxCoordinates = cumulativeBoundingBox.max.toArray();
          //  console.log('Cumulative Bounding Box Min Coordinates:',  minCoordinates);
          //  console.log('Cumulative Bounding Box Max Coordinates:', maxCoordinates);
 
           
             // Calculate the center
             const centerX = (minCoordinates[0] + maxCoordinates[0]) / 2;
       const centerY = (minCoordinates[1] + maxCoordinates[1]) / 2;
       const centerZ = (minCoordinates[2] + maxCoordinates[2]) / 2;
       
       const cumulativecenter = new THREE.Vector3(centerX, centerY, centerZ);
       
      //  console.log('Cumulative Bounding Box Center:', cumulativecenter.toArray())
       setCumulativeCenter(new THREE.Vector3(centerX, centerY, centerZ));
 
        // Calculate the difference between final cumulative center and individual bounding box center
         const offset = boundingBox.getCenter(new THREE.Vector3()).sub(cumulativecenter);
 
         // Log or use the offset as needed
        //  console.log(`File ${i + 1} - Offset:`, offset.toArray());
 
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
     const objectfilecenter= boundingBoxobject.getCenter(center);
      console.log(`File ${i + 1} - Bounding Box Center:`, objectfilecenter.toArray());
      
     
      // Update cumulative bounding box
      // let cumulative= cumulativeBoundingBox.union(boundingBox);
       // Calculate the difference between final cumulative center and individual 
       cumulativeBoundingBoxObject.union(boundingBoxobject);
      // Update cumulative bounding box for objects
        const cumulativeCenterObject = cumulativeBoundingBoxObject.getCenter(new THREE.Vector3());
       // Calculate the offset between object center and cumulative center
const offsetObject = center.clone().sub(cumulativeCenterObject);

// Log or use the offset as needed
// console.log(`File ${i + 1} - Offset Object:`, offsetObject.toArray());

   scene.add(object);
   fileCenter.push(objectfilecenter)
   loadedOffsetsobject.push(offsetObject);
   offsetsobject.push(offsetObject);

      updateCameraAndControls();

  // Add label to the scene
  // object.add(label);
  // label.visible = showLabels;
  // loadedLabels.push(label);          
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
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
    setmeshcenter(singlemeshcenter);
    setobjectCenter(fileCenter)
    setLabels(loadedLabels); // Update the labels state
    initControls();
    initLight();
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);
    animate();
    
     
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
  

const fitCameraToBoundingBox = (object) => {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const minCoordinates = boundingBox.min.clone();
  const maxCoordinates = boundingBox.max.clone();

  updateCameraAndControls(boundingBox);
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
    if (renderer && scene && camera && css2dRenderer) {
 
      renderer.render(scene, camera);
      renderLabels();
    css2dRenderer.render(scene, camera);
    }
    
    if (controls) {
      controls.update();
    }
         
     
  };

  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  // const onMouseClick = (event) => {
  //   raycaster = new THREE.Raycaster();
  //   mouse = new THREE.Vector2();
  //   raycaster.setFromCamera(mouse, camera);
  //   const intersects = raycaster.intersectObjects(scene.children, true);

  //   if (intersects.length > 0) {
  //     const clickedObject = intersects[0].object;

  //     if (event.button === 0) {
  //       console.log('Left-click');
  //       if (selectedObject) {
  //         selectedObject.material.color.set(0xffffff);
  //       }

  //       selectedObject = clickedObject;
  //       selectedObject.material.color.set(highlightColor);
  //       // Log coordinates of the clicked object in world space
  //     const worldPosition = new THREE.Vector3();
  //     selectedObject.getWorldPosition(worldPosition);
  //     console.log("World Coordinates of Clicked Object:", worldPosition);

  //   } 
  //   if (event.button === 2) {
  //     console.log('Right-click');
  //     setContextMenuPosition({ x: event.clientX, y: event.clientY });

  //     raycaster.setFromCamera({ x: mouse.x, y: mouse.y + 0.1 }, camera);

  //     const intersectsAbove = raycaster.intersectObjects(scene.children, true);

  //     if (intersectsAbove.length > 0) {
  //       selectedObject = intersectsAbove[0].object;
  //     } else {
  //       setContextMenuPosition({ x: 0, y: 0 });
  //       selectedObject = null;
  //     }
  //   }
  //   }
  //   else {
  //     if (selectedObject && event.button === 0) {
  //       console.log('Clicked outside of any object');
  //       selectedObject.material.color.set(0xffffff);
  //       selectedObject = null;
  //     }
  //   }
  // };
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
  useEffect(() => {
     scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.set(0, 5, 0);
    // camera.lookAt(0,0,0)
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFC0CB);
    document.body.appendChild(renderer.domElement)
    css2dRenderer = new CSS2DRenderer(); // Initialize CSS2DRenderer
    document.body.appendChild(css2dRenderer.domElement);  
    
//     table.forEach((item) => {
//       // Create a cube geometry
//        const cubeGeometry = new THREE.BoxGeometry(5,5,5);

//        // Create a basic material for the cube
//        const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

//        // Create a mesh by combining the geometry and material
//        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

//        // Position the cube at the specified coordinates
//        cubeMesh.position.set(item.x, item.y, item.z);

//        // Add the cube mesh to the scene
//        scene.add(cubeMesh); 
//  });
       
        return () => {
      window.removeEventListener('resize', onWindowResize);
     cleanUp()
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [cumulativeCenter,labels,offsetTable,objectoffsetTable,objectCenter]);
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
            <th>Center X</th>
            <th>Center Y</th>
            <th>Center Z</th>
          </tr>
        </thead>
        <tbody>
        {objectAssociations.map(( association,index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{association.filename.replace(/\.[^.]+$/, '')}</td>
            <td>{objectCenter[index].x.toFixed(2)}</td>
            <td>{objectCenter[index].y.toFixed(2)}</td>
            <td>{objectCenter[index].z.toFixed(2)}</td>
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
                      <td>{meshcenter[index].x}</td>
                      <td>{meshcenter[index].y}</td>
                      <td>{meshcenter[index].z}</td>
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

export default ImageUpload