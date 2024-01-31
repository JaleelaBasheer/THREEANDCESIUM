import React, { useState , useEffect} from 'react';
import axios from 'axios';
import AWS from 'aws-sdk'; // Import AWS SDK
import { Card, Form,FloatingLabel, Row, Button } from 'react-bootstrap'
import { addUser } from '../services/AllApis';




function Upload() {
  const [ionAccessToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE');
  const [assetId, setAssetId] = useState();
  const [deleteassetId, setdeleteAssetId] = useState();
  const [editassetId,seteditassetId]=useState()
  const [alldata,setalldata] = useState([])
  const [normalUserInputs,setNormalUserInputs] = useState({
    name:"",
   
   
  })
  const [files, setFiles] = useState([]);
  const [profile,setProfile] = useState("")

  const getandsetUserNormalInputs = (e)=>{
    const {name,value} = e.target
    setNormalUserInputs({...normalUserInputs,[name]:value})

  }
  console.log(normalUserInputs);
  console.log(files);
  console.log(deleteassetId)


  useEffect(()=>{
    
    const fetchAssetDetails = async () => {
      try {
        const response = await fetch(`https://api.cesium.com/v1/assets`, {
          headers: {
            Authorization: `Bearer ${ionAccessToken}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setalldata(data);
        } else {
          console.error('Error fetching asset details:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching asset details:', error.message);
      }
    };
    fetchAssetDetails()
   },[ionAccessToken])
 

  
 const deleteAsset= () =>{
    console.log(`Deleting asset with ID: `,deleteassetId);
      try {
        console.log(`Deleting asset with ID: ${deleteassetId}`);
         axios.delete(`https://api.cesium.com/v1/assets/${deleteassetId}`, {
          headers: { Authorization: `Bearer ${ionAccessToken}` },
        });
  
        console.log(`Asset with ID ${deleteassetId} deleted successfully`);
      } catch (error) {
        console.log(`Error deleting asset with ID ${deleteassetId}: ${error.message}`);
      }
    }

  

    const handleSubmit = async (e) => {
      e.preventDefault();
      const { name } = normalUserInputs;
  
      if (!name || files.length === 0) {
          alert("Please fill the form completely");
      } else {
          const data = new FormData();
          data.append("name", name);
  
          // Append each file individually to the FormData object
          files.forEach((file, index) => {
              data.append(`files`, file);
          });
  
          const headers = {
            "Content-Type": "multipart/form-data"
          }  
          try {
              // make api call
              const result = await addUser(data,headers);
  
              if (result.status === 200) {
                  setNormalUserInputs({
                      ...normalUserInputs,
                      name: ""
                  });
                  setFiles([]);
                  alert("New asset added successfully");
              } else {
                  alert("Request Failed");
              }
          } catch (error) {
              console.error("Error submitting form:", error);
              alert("An error occurred while submitting the form");
          }
      }
  };
  
  
  return (
    <div>
    <label>
     Delete Asset File:
        <input
          type="text"
          onChange={(e) => setdeleteAssetId(e.target.value)}
          
        />
              <button onClick={deleteAsset}>Delete Asset</button>

      
    </label>
  
    <br />


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
        <Form.Control type="file" multiple name ="files"  onChange={(e) => setFiles(Array.from(e.target.files))}>

        </Form.Control>
       
    </Form.Group>
    
    <Button onClick={e=>handleSubmit(e)} type="submit" variant ="primary">Submit</Button>
    </Row>

    </Form>

</div>

<div className="container mt-5">
        <h1 className="text-center">
            Edit Asset Info
        </h1>
   
    <Form>
    <Row>
    <FloatingLabel controlId="floatingInputname" label="Name" className="mb-3 col-lg-6">
    <Form.Control type="text" placeholder="Name" name="name"value={normalUserInputs.name} onChange={e=>getandsetUserNormalInputs(e)} />
    </FloatingLabel>  

    <FloatingLabel controlId="floatingInputdescription" label="Description"  className="mb-3 col-lg-6">
    <Form.Control type="text" placeholder="Description" name="description" value={normalUserInputs.description} onChange={e=>getandsetUserNormalInputs(e)} />
    </FloatingLabel>
   
    {/* <Button onClick={e=>uploadAsset(e)} type="submit" variant ="primary">Submit</Button> */}
    </Row>

    </Form>

</div>

  </div>
  );
}

export default Upload;
