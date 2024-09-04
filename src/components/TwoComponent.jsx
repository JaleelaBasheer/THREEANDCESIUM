import React,{useState} from 'react'
import ImageUpload from './ImageUpload';
import NewComponent from './NewComponent';
import ComponentA from './ComponentA';
import ComponentB from './ComponentB';

function TwoComponent() {

    const [showComponentA, setShowComponentA] = useState(true);
  return (
    <div>
        <button onClick={() => setShowComponentA(true)}>Show Component A</button>
        <button onClick={() => setShowComponentA(false)}>Show Component B</button>
        {showComponentA ? <ComponentA /> : <ComponentB />}
      
    </div>
  )
}

export default TwoComponent
