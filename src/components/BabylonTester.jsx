

import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

class FreeCameraMouseInput {
    constructor() {
      this.buttons = [];
      this.angularSensibility = 2000.0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.direction = new BABYLON.Vector3(0, 0, 0);
    }
  
    attachControl(element, noPreventDefault) {
      if (!this._pointerInput) {
        this._pointerInput = (p, s) => {
          const evt = p.event;
          if (evt.pointerType !== 'mouse') return;
  
          if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            try {
              evt.srcElement.setPointerCapture(evt.pointerId);
            } catch (e) {}
            if (this.buttons.length === 0) this.buttons.push(evt.button);
            this.previousPosition = {
              x: evt.clientX,
              y: evt.clientY
            };
            if (!noPreventDefault) evt.preventDefault();
          }
          else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
            try {
              evt.srcElement.releasePointerCapture(evt.pointerId);
            } catch (e) {}
            if (this.buttons.length !== 0) this.buttons.pop();
            this.previousPosition = null;
            this.offsetX = 0;
            this.offsetY = 0;
            if (!noPreventDefault) evt.preventDefault();
          }
          else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (!this.previousPosition) return;
            this.offsetX = evt.clientX - this.previousPosition.x;
            this.offsetY = evt.clientY - this.previousPosition.y;
            if (!noPreventDefault) evt.preventDefault();
          }
        };
      }
      this._observer = this.camera.getScene().onPointerObservable.add(
        this._pointerInput,
        BABYLON.PointerEventTypes.POINTERDOWN |
        BABYLON.PointerEventTypes.POINTERUP |
        BABYLON.PointerEventTypes.POINTERMOVE
      );
    }
  
    detachControl() {
      if (this._observer && this.camera) {
        this.camera.getScene().onPointerObservable.remove(this._observer);
        this._observer = null;
        this.previousPosition = null;
      }
    }
  
    checkInputs() {
      const speed = this.camera.speed;
      if (!this.previousPosition) return;
  
      if (this.buttons.indexOf(0) !== -1) {
        if (this.camera.getScene().useRightHandedSystem) {
          this.camera.cameraRotation.y -= this.offsetX / (20 * this.angularSensibility);
        } else {
          this.camera.cameraRotation.y += this.offsetX / (20 * this.angularSensibility);
        }
        this.direction.copyFromFloats(0, 0, -this.offsetY * speed / 300);
        if (this.camera.getScene().useRightHandedSystem) this.direction.z *= -1;
      }
  
      if (this.buttons.indexOf(1) !== -1) {
        this.direction.copyFromFloats(
          this.offsetX * speed / 500,
          -this.offsetY * speed / 500,
          0
        );
      }
  
      if (this.buttons.indexOf(0) !== -1 || this.buttons.indexOf(1) !== -1) {
        this.camera.getViewMatrix().invertToRef(this.camera._cameraTransformMatrix);
        BABYLON.Vector3.TransformNormalToRef(
          this.direction,
          this.camera._cameraTransformMatrix,
          this.camera._transformedDirection
        );
        this.camera.cameraDirection.addInPlace(this.camera._transformedDirection);
      }
    }
  
    getTypeName() {
      return "FreeCameraMouseInput";
    }
  
    getSimpleName() {
      return "mouse";
    }
  }

function TestComponent() {

  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const meshesRef = useRef([]);
  const [cameraMode, setCameraMode] = useState('orbit');



  useEffect(() => {
    const canvas = canvasRef.current;
    engineRef.current = new BABYLON.Engine(canvas, true);
    sceneRef.current = new BABYLON.Scene(engineRef.current);
    
    // Initial camera setup
    setupCamera('orbit');

    const light = new BABYLON.HemisphericLight(
      'light', 
      new BABYLON.Vector3(0, 1, 0), 
      sceneRef.current
    );

    engineRef.current.runRenderLoop(() => {
      sceneRef.current.render();
    });

    window.addEventListener('resize', () => {
      engineRef.current.resize();
    });

    return () => {
      engineRef.current.dispose();
    };
  }, []);

  const setupCamera = (mode) => {
    if (!sceneRef.current) return;

    // Store current camera position and target if exists
    const currentPosition = sceneRef.current.activeCamera?.position.clone();
    const currentTarget = sceneRef.current.activeCamera?.target?.clone() || 
                         sceneRef.current.activeCamera?.getTarget().clone();

    // Dispose current camera if exists
    if (sceneRef.current.activeCamera) {
      sceneRef.current.activeCamera.dispose();
    }

    if (mode === 'orbit') {
      const camera = new BABYLON.ArcRotateCamera(
        'orbitCamera',
        Math.PI / 2,
        Math.PI / 3,
        10,
        currentTarget || new BABYLON.Vector3(0, 0, 0),
        sceneRef.current
      );

      // Configure orbit camera
      camera.minZ = 0.001;
      camera.wheelDeltaPercentage = 0.01;
      camera.panningSensibility = 100;
      camera.angularSensibilityX = 500;
      camera.angularSensibilityY = 500;
      camera.attachControl(canvasRef.current, true);
      
      if (currentPosition) {
        camera.setPosition(currentPosition);
      }

    } else if (mode === 'fly') {
      const camera = new BABYLON.FreeCamera(
        'flyCamera',
        currentPosition || new BABYLON.Vector3(0, 5, -10),
        sceneRef.current
      );

      // Configure fly camera
      camera.minZ = 0.001;
      camera.speed = 0.5;
      camera.inputs.clear();
      
      const mouseInput = new FreeCameraMouseInput();
      mouseInput.camera = camera;
      camera.inputs.add(mouseInput);
      
      if (currentTarget) {
        camera.setTarget(currentTarget);
      }
      
      camera.attachControl(canvasRef.current, true);
    }

    setCameraMode(mode);
  };

  const handleFileInput = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length || !sceneRef.current) return;
  
    // Clear previous meshes
    meshesRef.current.forEach(mesh => mesh.dispose());
    meshesRef.current = [];
  
    // Load each file sequentially
    for (const file of files) {
      const url = URL.createObjectURL(file);
      
      try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
          "",
          "",
          url,
          sceneRef.current,
          undefined,
          ".glb"
        );
        
        meshesRef.current.push(...result.meshes);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`Error loading file ${file.name}:`, error);
        URL.revokeObjectURL(url);
      }
    }
  
    // Calculate cumulative bounding box
    if (meshesRef.current.length > 0) {
      let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
      let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
  
      meshesRef.current.forEach(mesh => {
        // Skip if mesh doesn't have geometry
        if (!mesh.getBoundingInfo || !mesh.geometry) return;
  
        // Get mesh vertices in world space
        const positions = mesh.geometry.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!positions) return;
  
        // Process vertices in groups of 3 (x,y,z)
        for (let i = 0; i < positions.length; i += 3) {
          // Create vector from vertex position
          const vertex = new BABYLON.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
  
          // Transform vertex to world space
          const worldVertex = BABYLON.Vector3.TransformCoordinates(
            vertex,
            mesh.getWorldMatrix()
          );
  
          // Update min and max
          min = BABYLON.Vector3.Minimize(min, worldVertex);
          max = BABYLON.Vector3.Maximize(max, worldVertex);
        }
      });
  
      
      // Calculate dimensions and center
      const dimensions = max.subtract(min);
      const center = BABYLON.Vector3.Center(min, max);
      
      // Calculate diagonal for camera radius
      const diagonal = Math.sqrt(
        dimensions.x ** 2 +
        dimensions.y ** 2 +
        dimensions.z ** 2
      );
  
      // Update camera position and target
      const camera = sceneRef.current.activeCamera;
      camera.setTarget(center);
      
      // Set radius with some padding
      camera.radius = diagonal * 1.5;
  
      // Optional: Adjust camera beta (vertical angle) for better view
      camera.beta = Math.PI / 3; // 60 degrees
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ margin: '10px' }}>
        <input 
          type="file" 
          accept=".glb"
          multiple 
          onChange={handleFileInput}
          style={{ marginRight: '10px' }}
        />
       <button 
          onClick={() => setupCamera('orbit')}
          style={{ 
            marginRight: '10px',
            backgroundColor: cameraMode === 'orbit' ? '#4CAF50' : '#ddd',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          Orbit Camera
        </button>
        <button 
          onClick={() => setupCamera('fly')}
          style={{ 
            backgroundColor: cameraMode === 'fly' ? '#2196F3' : '#ddd',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          Fly Camera
        </button>
      </div>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%',
          height: 'calc(100vh - 60px)',
          touchAction: 'none'
        }} 
      />
    </div>
  );
}

export default TestComponent;