import React, { useState, useEffect } from 'react'
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Form,FloatingLabel, Row, Button } from 'react-bootstrap'
import { addUser } from '../services/AllApis';
import FileUploadProgress from './FileUploadProgress';


function UploadAndThree() {

    let camera;
    let offsets = []; // Array to store offsets
    let offsetsobject = []; // Array to store offsets   
    const [cumulativeCenter, setCumulativeCenter] = useState(new THREE.Vector3());
    const [offsetTable, setOffsetTable] = useState();
    const [objectoffsetTable, setobjectoffsetTable]= useState([]);
    const [objectMeshAssociations, setObjectMeshAssociations] = useState([]);
    const [objectAssociations, setObjectAssociations] = useState([]); 
    let cumulativeBoundingBox = new THREE.Box3(); // Initialize cumulative bounding box
    let cumulativeBoundingBoxObject = new THREE.Box3(); // Initialize cumulative bounding box
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);



    const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      loadFBXFiles(selectedFiles);
  };
  
    const loadFBXFiles = (selectedFiles) => {
      if (!selectedFiles) return;
      const fbxLoader = new FBXLoader();
      const totalFiles = selectedFiles.length;
      let filesLoaded = 0;
  
      const loadedObjects = [];
      const loadedOffsets = []; // New array to store offsets
      const loadedOffsetsobject = []; // New array to store offsets
      const offsetBoundingBoxCenters = [];
      
  
    for (let i = 0; i < selectedFiles.length; i++) {    
      const file = selectedFiles[i];
  
       fbxLoader.load(URL.createObjectURL(file),(object) => {
        filesLoaded++;
        const progressPercentage = (filesLoaded / totalFiles) * 100;
        setProgress(progressPercentage);
  
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

            offsetBoundingBoxCenters.push({
                    objectName: file.name,
                    meshName: child.name,
                    offset: offset.toArray()
                });
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
  
     loadedOffsetsobject.push(offsetObject);
     offsetsobject.push(offsetObject);
  
          },
          undefined,
          (error) => {
            console.error('Error loading FBX:', error);
          }
        );
       
      }  
      
  // Update the offsetTable state with the new offsets
      setObjectAssociations(loadedObjects)
      setOffsetTable( offsetBoundingBoxCenters);
      setobjectoffsetTable(loadedOffsetsobject);
    };    
    const calculateBoundingBox = (object) => {
      const boundingBox = new THREE.Box3().setFromObject(object);
     
      return boundingBox;
    };
    
    useEffect(() => {
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 4000);
      camera.position.set(0, 0, 5);    
    }, [cumulativeCenter,offsetTable,objectoffsetTable]);


    const [normalUserInputs,setNormalUserInputs] = useState({
      name:"",    
    }) 
    const getandsetUserNormalInputs = (e)=>{
      const {name,value} = e.target
      setNormalUserInputs({...normalUserInputs,[name]:value})  
    }
    console.log(normalUserInputs);
    console.log(files);
    const handleSubmit = async (e) => {
      e.preventDefault();
      // Set loading to true when form is submitted
      setLoading(true);
      const { name } = normalUserInputs;
    
    // Ensure offsetTable is a valid object
    const offsetTableString = JSON.stringify(offsetTable);
    console.log("Name:", name);
    console.log("Offset Table String:", offsetTableString);
    console.log("Files:", files);


    if (files.length === 0) {
        alert("Please load files");
    } else {
        const data = new FormData();
        data.append("name", name);

        // Append each file individually to the FormData object
        files.forEach((file, index) => {
            data.append(`files`, file);
        });
        
        // Stringify and append the offsetTable to the FormData
        data.append("offsetTable", JSON.stringify(offsetTable));
         const headers = {
          "Content-Type": "multipart/form-data"
        }

        console.log("FormData:", data);

          try {
              // make api call
              const result = await addUser(data,headers);
  
              if (result.status === 200) {
                setNormalUserInputs({
                    ...normalUserInputs,
                    name: ""
                });
                setFiles([]);
                setOffsetTable([]);
                 // After receiving response, set loading to false
            setLoading(false);                
                  alert("New asset added successfully");
              } else {
                  alert("Request Failed");
              }
          } catch (error) {
              console.error("Error submitting form:", error);
              setLoading(false); // Ensure loading is set to false even in case of errors
              alert("An error occurred while submitting the form");
          }
      }
  };
  

  return (
    <div>

            <div className="container mt-5">
        <h1 className="text-center">
            Add New Asset
        </h1>
   
    <Form>
    <Row>
    <FloatingLabel controlId="floatingInputname" label="Name" className="mb-3 col-lg-6">
    <Form.Control type="text" placeholder="Name" name="name"value={normalUserInputs.name} onChange={e=>getandsetUserNormalInputs(e)} />
    </FloatingLabel>  

    
    <Form.Group className="mb-3 col-lg-6">
        <Form.Label >Choose File Uploaded</Form.Label>
        <Form.Control type="file" multiple name ="files" onChange={handleFileChange} accept=".fbx">

        </Form.Control>
       
    </Form.Group>
    <FileUploadProgress progress={progress}/>
   { 
loading?(
  <div className="spinner-grow text-warning text-center" role="status">
  <span className="visually-hidden">Loading...</span> 
  </div> 
  ):(<Button onClick={e=>handleSubmit(e)} type="submit" variant ="primary">Submit</Button>
  )

}
    </Row>

    </Form>

</div> 
  </div>
  )
}

export default UploadAndThree