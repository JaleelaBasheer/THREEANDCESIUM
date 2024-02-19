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



 
function App() {
 
 
  
  return (
    <div className="App"> 
     {/* <Routes>
    <Route path='/' element={ <Main/>}/>
     <Route path='/add' element={ <UploadAndThree/>}/>

    </Routes>
     */}
   
   {/* <ImageUpload></ImageUpload> */}
  
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
<Cubee></Cubee>
      
    </div>
  );
}

export default App;
