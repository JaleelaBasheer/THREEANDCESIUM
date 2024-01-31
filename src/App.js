import './App.css';
import Main from './pages/Main';
import ImageUpload from './components/ImageUpload';
import Canvass from './components/Canvass';
import React ,{ useState } from 'react'
import ThreeDCanvas from './components/ThreeDCanvas';
import FitView from './components/FitView';
import Baby from './components/Baby';
import Cia from './components/Cia';
import New from './components/New';
import Upload from './components/Upload';
import NewComponent from './components/NewComponent';
import UploadAndThree from './components/UploadAndThree';
 
function App() {
 
 
  
  return (
    <div className="App"> 
    
   {/* <FitView></FitView> */}
   {/* <ThreeDCanvas></ThreeDCanvas> */}
   {/* <Canvass></Canvass> */}
   {/* <ImageUpload></ImageUpload> */}
   {/* <Baby></Baby> */}
   {/* <Cia></Cia> */}
   {/* <Upload></Upload> */}
  {/* <NewComponent></NewComponent> */}
     {/* <New ionAccessToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZWU3MTJjNi00Njk1LTQxZDktYmE4OS1mY2I3NTIyYzVhZTgiLCJpZCI6MTg3NjI0LCJpYXQiOjE3MDQ1NjAzMzF9.5FAkHltPwh5gROFmAfIEalS68ob5Xnsjt7EMkNcyIjE"></New> */}
<UploadAndThree></UploadAndThree>

      
    </div>
  );
}

export default App;
