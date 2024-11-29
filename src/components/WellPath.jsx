import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import WellChart from './WellChart';

const CombinedWellVisualization = () => {
  const mountRef = useRef(null);
  const [tooltipData, setTooltipData] = useState(null);
  const curveRef = useRef(null);
  const ballRef = useRef(null);
  const [currentDepth, setCurrentDepth] = useState(0);

  // Sample well path data
  const wellPathData = [
    { MD: 0, TVD: 0, Inclination: 0, Azimuth: 0 },
    { MD: 100, TVD: 95, Inclination: 10, Azimuth: 90 },
    { MD: 200, TVD: 190, Inclination: 20, Azimuth: 100 },
    { MD: 300, TVD: 280, Inclination: 30, Azimuth: 110 },
    { MD: 400, TVD: 360, Inclination: 35, Azimuth: 120 },
  ];

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      (window.innerWidth / 2) / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(500, 500, 500);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Convert well path data to 3D coordinates
    const pathPoints = wellPathData.map((data) => {
      const x = data.MD * Math.sin(THREE.MathUtils.degToRad(data.Inclination)) * 
                Math.cos(THREE.MathUtils.degToRad(data.Azimuth));
      const y = -data.TVD; // Inverted for well representation
      const z = data.MD * Math.sin(THREE.MathUtils.degToRad(data.Inclination)) * 
                Math.sin(THREE.MathUtils.degToRad(data.Azimuth));
      return new THREE.Vector3(x, y, z);
    });

    // Create well path tube
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    curveRef.current = curve;
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 10, 8, false);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066cc,
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tubeMesh);

    // Add ball
    const ballGeometry = new THREE.SphereGeometry(8, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ballRef.current = ball;
    scene.add(ball);

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 500, 200);
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(500, 20, 0x888888, 0x888888);
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.enablePan = false; 
    controls.minDistance = 100;
    controls.maxDistance = 1500;
    controls.maxPolarAngle = Math.PI;
    controls.target.set(0, -200, 0);

    // Function to find closest point on curve
    const findClosestPointOnCurve = (point) => {
      const divisions = 200;
      let closestPoint = null;
      let closestDistance = Infinity;
      let closestT = 0;

      for (let i = 0; i <= divisions; i++) {
        const t = i / divisions;
        const curvePoint = curve.getPoint(t);
        const distance = point.distanceTo(curvePoint);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = curvePoint;
          closestT = t;
        }
      }

      return { point: closestPoint, t: closestT };
    };

    // Raycaster setup
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line = { threshold: 5 };
    const mouse = new THREE.Vector2();
    let isDragging = false;

    const updateBallPosition = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(tubeMesh);

      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        const { point: closestPoint, t } = findClosestPointOnCurve(intersectPoint);
        
        if (closestPoint) {
          ball.position.copy(closestPoint);

          // Calculate depth data
          const depth = -closestPoint.y;
          const currentLength = curve.getLength() * t;
          setCurrentDepth(depth);

          // Update tooltip
          setTooltipData({
            x: event.clientX,
            y: event.clientY,
            data: {
              MD: currentLength.toFixed(1),
              TVD: Math.abs(depth).toFixed(1),
              progress: (t * 100).toFixed(1)
            }
          });
        }
      }
    };

    // Mouse event handlers
    const onMouseDown = (event) => {
      if (event.button === 2) { // Right click
        event.preventDefault();
        isDragging = true;
        updateBallPosition(event);
      }
    };

    const onMouseUp = (event) => {
      if (event.button === 2) { // Right click release
        isDragging = false;
      }
    };

    const onMouseMove = (event) => {
      if (isDragging) {
        updateBallPosition(event);
      }
    };

    const onMouseLeave = () => {
      isDragging = false;
      setTooltipData(null);
    };

    // Prevent context menu from appearing on right click
    const onContextMenu = (event) => {
      event.preventDefault();
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    

    // Handle window resize
    const handleResize = () => {
      camera.aspect = (window.innerWidth / 2) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth / 2, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Set initial ball position
    const initialPosition = curve.getPoint(0);
    ball.position.copy(initialPosition);

    // Cleanup
    // Don't forget to update the cleanup function
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* 3D Visualization */}
      <div style={{ position: 'relative', width: '50%', height: '100%', backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div 
          ref={mountRef} 
          style={{ width: '100%', height: '100%', touchAction: 'none' }} 
        />
        
        {/* Tooltip for 3D view */}
        {tooltipData && (
          <div style={{
            position: 'absolute',
            left: tooltipData.x + 10,
            top: tooltipData.y + 10,
            transform: 'translate(0, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            fontSize: '14px'
          }}>
            <div>
              <div style={{ fontWeight: 500 }}>Measured Depth: {tooltipData.data.MD}m</div>
              <div style={{ fontWeight: 500 }}>True Vertical Depth: {tooltipData.data.TVD}m</div>
              <div style={{ color: '#666' }}>Progress: {tooltipData.data.progress}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Caliper Log Graph */}
      <div style={{ width: '50%', height: '100%', backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          padding: '24px',
          color: '#1f2937'
        }}>
          Well Caliper Log Visualization
        </h2>
        <div style={{ height: 'calc(100% - 100px)' }}>
          <WellChart currentDepth={currentDepth} />
        </div>
      </div>
    </div>
  );
};

export default CombinedWellVisualization;