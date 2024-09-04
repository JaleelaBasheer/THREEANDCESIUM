import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Label = ({scene, text, position }) => {
  const labelRef = useRef();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.fillText(text, 0, 24);

    const texture = new THREE.CanvasTexture(canvas);

    const geometry = new THREE.PlaneGeometry(canvas.width / 10, canvas.height / 10); // Adjust size as needed
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(position.x, position.y, position.z);

    scene.add(mesh);

    return () => {
      scene.remove(mesh);
    };
  }, [text, position]);

  return <group ref={labelRef} />;
};

export default Label;
