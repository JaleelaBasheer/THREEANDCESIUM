import React,{ useState, useEffect, useRef } from 'react'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Card, Form,FloatingLabel, Row, Button } from 'react-bootstrap'
function Cubee() {

    const canvasRef = useRef(null);
    
    const [cubeId, setCubeId] = useState(0);
    // Define state variables for the created box
    const [createdBox, setCreatedBox] = useState(null);
    // Define variable for creating box
    const [size, setSize] = useState([1, 1, 1]);
    const [position, setPosition] = useState([0, 0, 0]);
    const [color, setColor] = useState('#00ff00');
    const [name, setName] = useState('Cube');
    // Define state variables for edit modal inputs
    const [editSize, setEditSize] = useState('1,1,1'); // Example default value
    const [editPosition, setEditPosition] = useState('0,0,0'); // Default position
    const [editColor, setEditColor] = useState('#ffffff'); // Default color
    // State variables for move
    const [moveX, setMoveX] = useState(0);
    const [moveY, setMoveY] = useState(0);
    const [moveZ, setMoveZ] = useState(0);

    // Define state variables for rotation angles
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [rotateZ, setRotateZ] = useState(0);
    let camera, controls, scene, renderer, tiles, light, offsetParent, raycaster, mouse,css2dRenderer;
    
    const init = () => {
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current ,alpha:true});
        renderer.setClearColor(0xffff00);  //color yellow
        document.body.appendChild(renderer.domElement);
        renderer.domElement.tabIndex = 1;
    
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 4000);
        camera.position.set(0,100,0);
        camera.lookAt(0,0,0);
     
        document.body.appendChild(renderer.domElement);   
    
        controls = new OrbitControls(camera,renderer.domElement);   
        controls.enableDamping = true;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 2000;
    
        light = new THREE.PointLight(0xffff00, 1);
        camera.add(light);
        scene.add(camera);
    
        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(1, 2, 3);
        scene.add(dirLight);
    
        const ambLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambLight);
    
        offsetParent = new THREE.Group();
        scene.add(offsetParent);
    
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
           
        onWindowResize();
        window.addEventListener('resize', onWindowResize, false);
    
      };
      const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
      };
      const render = () => {      
        if (camera) {
          camera.updateMatrixWorld();
          renderer.render(scene, camera);
      }   
       }    
      const animate = () => {
        requestAnimationFrame(animate);       
        render(); 
        if (controls) {
          controls.update();
        }
      };    
      const cleanUp = () => {
      
      };
        // Function to handle create box

      const handleCreateBox = () => {
        if(scene){
          console.log("enter handle create box")
    // Create BoxGeometry
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    console.log(size[0], size[1], size[2])
    
    // Create MeshBasicMaterial
    const material = new THREE.MeshBasicMaterial({ color: color }); // Green color
    console.log(position[0], position[1], position[2])
    
    // Create Mesh
    const box = new THREE.Mesh(geometry, material);
    // Position the cube at the specified coordinates
    box.position.set(position[0], position[1], position[2]);
    
    
    // Add the box to the scene
    scene.add(box);
    setCreatedBox(box); 
        }
        else {
          console.error('Scene is not initialized');
        }
        
      };

      // Function to handle editing the box
     const handleEditBox = () => {
      console.log('handle edit box');

    if (createdBox) {
      createdBox.scale.set(...editSize.split(',').map(parseFloat));
      createdBox.position.set(...editPosition.split(',').map(parseFloat));
      createdBox.material.color.set(editColor);
      render(); // Re-render the scene after editing
  } else {
      console.error('No box is created to edit');
  }
      };

   // Function to handle rotating the created box
      const handleRotate = () => {
  if (createdBox) {
      createdBox.rotation.x = THREE.MathUtils.degToRad(rotateX);
      createdBox.rotation.y = THREE.MathUtils.degToRad(rotateY);
      createdBox.rotation.z = THREE.MathUtils.degToRad(rotateZ);
      render(); // Re-render the scene after rotating
  } else {
      console.error('No box is created to rotate');
  }
       };

        // Function to handle moving the cube
    const handleMoveBox = () => {
        if (createdBox) {
            createdBox.position.x += parseFloat(moveX);
            createdBox.position.y += parseFloat(moveY);
            createdBox.position.z += parseFloat(moveZ);
            render(); // Re-render the scene after moving
        } else {
            console.error('No box is created to move');
        }
    };

  useEffect(()=>{
    init()
    animate()
  },[size,position,color])  
  return (
    <>
      <button className="btn btn-primary" sx={{ width: '100%' }} data-bs-toggle="modal" data-bs-target="#staticBackdrop" >
        Create Box
      </button>
      <button className="btn ms-3 btn-secondary" sx={{ width: '100%' }} data-bs-toggle="modal" data-bs-target="#editModal" >
        Edit Box
      </button>
      <button className="btn ms-3 btn-warning" sx={{ width: '100%' }} data-bs-toggle="modal" data-bs-target="#rotateModal" >
        Rotate
      </button>
      <button className="btn ms-3 btn-dark" sx={{ width: '100%' }} data-bs-toggle="modal" data-bs-target="#moveModal" >
        Move
      </button>
          <div >
            <canvas ref={canvasRef}></canvas>
          </div>

   {/*modal for create box */}
 <div className="modal fade mt-5" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true"> 

<div className="modal-dialog">
  <div className="modal-content">
    <div className="modal-header">
      <h1 className="modal-title fs-5" id="staticBackdropLabel">Create Box</h1>
      <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div className="modal-body">
   <Card className="shadow border rounded p-2 mt-3">
      
  <Form>
  <Row>
  <FloatingLabel controlId="floatingInputSize" label="Size" className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Size" name="Size" value={size.join(',')}
          onChange={(e) => setSize(e.target.value.split(',').map(parseFloat))} />
  </FloatingLabel>


  <FloatingLabel controlId="floatingInputPosition" label="Position"  className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Position" name="Position" value={position.join(',')} onChange={(e) => setPosition(e.target.value.split(',').map(parseFloat))}/>
  </FloatingLabel>

  <FloatingLabel controlId="floatingInputColor" label="Color"  className="mb-3 col-lg-6">
  <Form.Control  placeholder="Color" name="Color"
       type="color" value={color} onChange={(e) => setColor(e.target.value)} /> 
  </FloatingLabel>

  <FloatingLabel controlId="floatingInputName" label="Name"  className="mb-3 col-lg-6">
  <Form.Control type="text" placeholder="Name" name="Name" value={name} onChange={(e) => setName(e.target.value)}/>
  </FloatingLabel>


  </Row>

  </Form>

  </Card>
    </div>
    <div class="modal-footer">
      <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Close</button>
      <button type="button" onClick={handleCreateBox}  class="btn btn-success">Create</button>
    </div>
  </div>
</div>
</div>

 {/* modal for the Edit box */}

<div className="modal fade mt-5" id="editModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
    <div className="modal-dialog">
        <div className="modal-content">
            <div className="modal-header">
                <h1 className="modal-title fs-5" id="editModalLabel">Edit Box</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
                <Card className="shadow border rounded p-2 mt-3">
                    <Form>
                        <Row>
                            <FloatingLabel controlId="floatingEditInputSize" label="Size" className="mb-3 col-lg-6">
                                <Form.Control type="text" placeholder="Size" name="Size" value={editSize} onChange={(e) => setEditSize(e.target.value)} />
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingEditInputPosition" label="Position" className="mb-3 col-lg-6">
                                <Form.Control type="text" placeholder="Position" name="Position" value={editPosition} onChange={(e) => setEditPosition(e.target.value)} />
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingEditInputColor" label="Color" className="mb-3 col-lg-6">
                                <Form.Control placeholder="Color" name="Color" type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                            </FloatingLabel>
                        </Row>
                    </Form>
                </Card>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Close</button>
                <button type="button" onClick={e=>handleEditBox(e)} className="btn btn-success">Update</button>
            </div>
        </div>
    </div>
</div>

{/* modal for the Rotate */}

<div className="modal fade mt-5" id="rotateModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="rotateModalLabel" aria-hidden="true">
    <div className="modal-dialog">
        <div className="modal-content">
            <div className="modal-header">
                <h1 className="modal-title fs-5" id="rotateModalLabel">Rotate Box</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
                <Card className="shadow border rounded p-2 mt-3">
                    <Form>
                        <Row>
                            <FloatingLabel controlId="floatingRotateInputX" label="X Axis" className="mb-3 col-lg-6">
                                <Form.Control type="number" placeholder="X Axis" name="XAxis" value={rotateX} onChange={(e) => setRotateX(e.target.value)} />
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingRotateInputY" label="Y Axis" className="mb-3 col-lg-6">
                                <Form.Control type="number" placeholder="Y Axis" name="YAxis" value={rotateY} onChange={(e) => setRotateY(e.target.value)} />
                            </FloatingLabel>
                            <FloatingLabel controlId="floatingRotateInputZ" label="Z Axis" className="mb-3 col-lg-6">
                                <Form.Control type="number" placeholder="Z Axis" name="ZAxis" value={rotateZ} onChange={(e) => setRotateZ(e.target.value)} />
                            </FloatingLabel>
                        </Row>
                    </Form>
                </Card>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Close</button>
                <button type="button" onClick={handleRotate} className="btn btn-success">Rotate</button>
            </div>
        </div>
    </div>
</div>

{/* Modal for moving a box */}

<div className="modal fade mt-5" id="moveModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="moveModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="moveModalLabel">Move Box</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <Card className="shadow border rounded p-2 mt-3">
                                <Form>
                                    <Row>
                                        <FloatingLabel controlId="floatingMoveInputX" label="X Axis" className="mb-3 col-lg-6">
                                            <Form.Control type="number" placeholder="X Axis" name="XAxis" value={moveX} onChange={(e) => setMoveX(e.target.value)} />
                                        </FloatingLabel>
                                        <FloatingLabel controlId="floatingMoveInputY" label="Y Axis" className="mb-3 col-lg-6">
                                            <Form.Control type="number" placeholder="Y Axis" name="YAxis" value={moveY} onChange={(e) => setMoveY(e.target.value)} />
                                        </FloatingLabel>
                                        <FloatingLabel controlId="floatingMoveInputZ" label="Z Axis" className="mb-3 col-lg-6">
                                            <Form.Control type="number" placeholder="Z Axis" name="ZAxis" value={moveZ} onChange={(e) => setMoveZ(e.target.value)} />
                                        </FloatingLabel>
                                    </Row>
                                </Form>
                            </Card>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Close</button>
                            <button type="button" onClick={handleMoveBox} className="btn btn-success">Move</button>
                        </div>
                    </div>
                </div>
</div>
    </>
  )
}

export default Cubee