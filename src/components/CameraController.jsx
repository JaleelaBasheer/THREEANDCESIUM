import React, { useRef } from 'react';
import { useThree, extend, useFrame } from 'react-three-fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import FlyControls from './FlyControls';

extend({ OrbitControls });

const CameraController = ({ mode }) => {
  const { camera, gl } = useThree();
  const controls = useRef();

  useFrame(() => {
    controls.current.update();
  });

  return (
    <>
      {mode === 'orbit' && <orbitControls ref={controls} args={[camera, gl.domElement]} />}
      {mode === 'fly' && (
        <FlyControls
          camera={camera}
          gl={gl}
          domElement={gl.domElement}
        />
      )}
    </>
  );
};

export default CameraController;
