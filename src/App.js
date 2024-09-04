import './App.css';
import Main from './pages/Main';
import ImageUpload from './components/ImageUpload';
import React ,{ useState } from 'react'

import New from './components/New';
import Upload from './components/Upload';
import NewComponent from './components/NewComponent';
import UploadAndThree from './components/UploadAndThree';
import {Routes, Route } from 'react-router-dom';
import MergeBoth3andCesium from './components/MergeBoth3andCesium'
import Egone from './components/Egone'
import Final from './components/Final'
import Canvass from './components/Canvass'
import ThreeDCanvas from './components/ThreeDCanvas'
import Cubee from './components/Cubee'
import Paperr from './components/Paperr';
import Examplesss from './components/Examplesss';
import Testing from './components/Testing';
import CameraEg from './components/CameraEg';
import FlyEg from './components/FlyEg';
import Ray from './components/Ray';
import ThreeJSCamera from './components/ThreeJSCamera ';
import Person from './components/Person';
import TouchEg from './components/TouchEg';
import CanvasEg from './components/CanvasEg';
import SingleThree from './components/SingleThree'
import Bayloneg from './components/Bayloneg'
import Indexed from './components/Indexed';
import Appli from './components/Appli';
import TwoComponent from './components/TwoComponent';
import ThreeScene from './ThreeScence';
import AdminPage from './components/AdminPage';
import FitView from './components/FitView';
import ThreeJs from './components/ThreeJs';
// import FBXViewer from './components/Test';
import FileUploader from './components/FileUploader';
// import FBXViewer from './components/Rohith1';
// import FBXViewer from './components/Rohith2';
import Test from './components/Test'
import CombinedFBXViewer from './components/CombinedViewer';
import FBXViewer from './components/Rohith3';
import Uploaded from './components/Uploaded';
import FinalLargeSceneModel from './components/FinalLargeSceneModel';
import FinalBoxes from './components/FinalBoxes';
// import FBXViewer from './components/Octriandculling';
// import CombinedFBXViewer from './components/CombinedFbxViewer';





 
function App() {
  const [fileUrl, setFileUrl] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  }
 

  return (
    <div className="App"> 
    {/* <AdminPage/> */}
    {/* <FitView/> */}
    {/* <Appli/> */}
     {/* <Routes>
    <Route path='/' element={ <Main/>}/>
     <Route path='/add' element={ <UploadAndThree/>}/>

    </Routes>
     */}
   {/* <ImageUpload></ImageUpload> */}
  {/* <SingleThree /> */}
  
   {/* <Upload></Upload> */}
   {/* <NewComponent></NewComponent> */}
   {/* <New ionAccessToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE"></New> */}
   {/* <UploadAndThree></UploadAndThree> */}
   {/* <Main></Main> */}
   {/* <MergeBoth3andCesium></MergeBoth3andCesium> */}
   {/* <Egone></Egone> */}
   {/* <Final></Final> */}
   {/* <ThreeDCanvas></ThreeDCanvas> */}
   {/* <Canvass></Canvass> */}
{/*  */}
{/* <Cubee></Cubee> */}
{/* <Paperr></Paperr> */}
{/* <Examplesss></Examplesss> */}
{/* <input type="file" accept=".babylon" onChange={handleFileChange} /> */}
{/* <TwoComponent/> */}
{/* <ThreeScene/> */}
      {/* <div >
      <Bayloneg />
      
    </div> */}
{/* <ImageUpload></ImageUpload> */}
      {/* <Testing></Testing> */}
      {/* <CameraEg></CameraEg> */}
      {/* <FlyEg></FlyEg> */}
      {/* <Ray ionAccessToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE"></Ray> */}
{/* <Person></Person>     */}
{/* <TouchEg/> */}
{/* <CanvasEg></CanvasEg> */}
{/* <Indexed/> */}
{/* <ThreeJs/> */}



{/* <FBXViewer/> */}
{/* <div>
      <h1>FBX to GLB Converter</h1>
      <FileUploader />
    </div> */}
     {/* <FBXViewer/>  */}
    {/*<CombinedFBXViewer/>*/}
    {/* <Test/> */}
    {/* <Uploaded/> */}
    <FinalLargeSceneModel/>
    {/* <FinalBoxes/> */}
</div>
  );
}

export default App;
