import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

function Appli() {
  const [showLeftDiv, setShowLeftDiv] = useState(true);
  const contentRef = useRef(null);
  const rendererRef = useRef(null);

  const toggleLeftDiv = () => {
    setShowLeftDiv(!showLeftDiv);
  };

  useEffect(() => {
    const width = contentRef.current.clientWidth;
    const height = contentRef.current.clientHeight;

    // Set up the scene
    const scene = new THREE.Scene();

    // Set up the camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Set up the renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    renderer.setClearColor(0xffff00);
    contentRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const { clientWidth, clientHeight } = contentRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      contentRef.current.removeChild(renderer.domElement);
    };
  }, []);
  return (
    <div style={{display: 'flex', flexDirection: 'column',width:'100%',margin:'0',padding:'0',height:'100vh', backgroundColor:'lightpink',overflow:'hidden'}}>
      <div className="row">
        <header style={{width:'100%',height:'50px',backgroundColor:'black'}}>

        </header>

      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'row'}}>
      {showLeftDiv && <div className='lsdiv' style={{width: '250px', backgroundColor: 'green'}}></div>}
  
      <div ref={contentRef} className='content' style={{ flex: 1, backgroundColor: 'white', position: 'relative' }}>
          <span onClick={toggleLeftDiv} style={{cursor: 'pointer', position: 'absolute', top: '10px', left:0}}>
            &#9776; 
          </span>
    </div>
    <div  className='rsdiv' style={{width: '75px', backgroundColor: 'red'}}>
    </div>
  </div>
      <div className="row">
        <footer style={{width:'100%',height:'35px',backgroundColor:'lightblue',zIndex:'1'}}>

        </footer>

      </div>
      
    </div>
  )
}

export default Appli
