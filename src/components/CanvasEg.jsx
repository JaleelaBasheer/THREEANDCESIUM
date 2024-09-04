import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

function CanvasEg() {
    const canvasRef = useRef(null);
    let renderer;

    useEffect(() => {
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
        renderer.setSize(window.innerWidth * 0.67, window.innerHeight); // Adjust size as needed

        // Create a cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Position the camera
        camera.position.z = 5;

        // Render function
        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup function
        return () => {
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            // Update renderer size when window is resized
            renderer.setSize(window.innerWidth * 0.67, window.innerHeight);
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function for event listener
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
            <div className="row" style={{ margin: 0 }}>
                <div className="col-sm-3" style={{ backgroundColor: 'red', padding: 0 }}>
                    <nav className='leftsidenav'>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            <li>
                                <div id="lineListSideLnk" className="sideLnkInactive" >
                                    <i className="fa fa-list-alt sideLnkIcon"></i>
                                    <a className="sideLnk">Line List</a>
                                </div>
                            </li>
                           
                            {/* Repeat for other list items */}
                        </ul>
                    </nav>
                </div>
                <div className="col-sm-8" style={{ backgroundColor: 'green', padding: 0 }}>
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                </div>
                <div className="col-sm-1" style={{ backgroundColor: 'blue', padding: 0 }}>
                <div className="tooltip-container">
    <span className="icon-tooltip"  title='Show comment'>                  
    <i class="fa-solid fa-comment fs-4"></i>
                        </span>
        </div>                </div>
            </div>
        </div>
    );
}

export default CanvasEg;
