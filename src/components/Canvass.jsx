import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

function Canvass() {
  const canvasRef = useRef(null);
  let scene, camera, renderer, controls, boundingBox;

  const loadFBXFiles = (files) => {
    if (!files) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    // camera.position.z = 5;
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffff00);

    const fbxLoader = new FBXLoader();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fbxLoader.load(
        URL.createObjectURL(file),
        (object) => {
          scene.add(object);
          calculateBoundingBox(object);
        },
        undefined,
        (error) => {
          console.error('Error loading FBX:', error);
        }
      );
    }

    animate();
  };

  const calculateBoundingBox = (object) => {
    if (!boundingBox) {
      boundingBox = new THREE.Box3().setFromObject(object);
    } else {
      boundingBox.expandByObject(object);
    }
    fitCameraToBoundingBox();
  };
  

  const fitCameraToBoundingBox = () => {
    if (boundingBox) {
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      const distance = Math.max(size.x, size.y, size.z)*2;

      camera.position.copy(center);
      camera.position.z += distance;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(center);
      controls.update();
    }
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    if (controls) {
      controls.update();
    }
  };

  useEffect(() => {
    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (controls) {
        controls.dispose();
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);


  return (
    <div>
      <input
        type="file"
        multiple
        onChange={e => loadFBXFiles(e.target.files)}
        accept=".fbx"
      />
      <canvas ref={canvasRef} />
      
      </div>
  )

}

export default Canvass