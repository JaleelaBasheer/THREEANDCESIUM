import React, { useRef } from 'react';
import { useFrame } from 'react-three-fiber';
import { Vector3 } from 'three';

const FlyControls = ({ camera, gl, domElement }) => {
  const prevMousePos = useRef({ x: 0, y: 0 });
  const euler = new Vector3(0, 0, 0);

  const onMouseMove = (event) => {
    const deltaX = event.clientX - prevMousePos.current.x;
    const deltaY = event.clientY - prevMousePos.current.y;
    const sensitivity = 0.1;

    if (event.buttons === 1) { // Left button (orbit)
      euler.set(-deltaY * sensitivity, -deltaX * sensitivity, 0);
      camera.rotation.x += euler.x;
      camera.rotation.y += euler.y;
    } else if (event.buttons === 4) { // Middle button (pan)
      camera.position.x -= deltaX * sensitivity;
      camera.position.y += deltaY * sensitivity;
    }

    prevMousePos.current = { x: event.clientX, y: event.clientY };
  };

  useFrame(() => {
    camera.updateProjectionMatrix();
  });

  React.useEffect(() => {
    domElement.addEventListener('mousemove', onMouseMove);
    return () => {
      domElement.removeEventListener('mousemove', onMouseMove);
    };
  }, [domElement]);

  return null;
};

export default FlyControls;
