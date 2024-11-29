// GETTING AS A GLB FORMAT(MAIN)

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash, faEye, faSearch } from '@fortawesome/free-solid-svg-icons';

function FbxToGlb() {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );

  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const controlsRef = useRef(null);
  const cumulativeBoundingBox = useRef(
    new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    )
  );

  const [isVisible, setIsVisible] = useState(true);
  const [fileSizes, setFileSizes] = useState([]);
  const [saveDirectory, setSaveDirectory] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [convertedModels, setConvertedModels] = useState([]);
  const [optimizeModel, setOptimizeModel] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('');
  const [failedFiles, setFailedFiles] = useState([]);

  useEffect(() => {
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.setClearColor(0x000000); // Black background color
    rendererRef.current.outputEncoding = THREE.sRGBEncoding;
    mountRef.current.appendChild(rendererRef.current.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    sceneRef.current.add(directionalLight);

    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current.domElement
    );
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.1;

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      mountRef.current.removeChild(rendererRef.current.domElement);
      controlsRef.current.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const selectSaveDirectory = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setSaveDirectory(dirHandle);
    } catch (err) {
      console.error("Error selecting directory:", err);
    }
  };

  const onFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const processModels = async () => {
    const loader = new FBXLoader();
    const objects = [];
    const newFileSizes = [];
    const newConvertedModels = [];
    const newFailedFiles = [];

    cumulativeBoundingBox.current = new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, Infinity),
      new THREE.Vector3(-Infinity, -Infinity, -Infinity)
    );

    const batchSize = 10;
    for (let i = 0; i < selectedFiles.length; i += batchSize) {
      const batch = selectedFiles.slice(i, i + batchSize);
      setProcessingStatus(`Processing files ${i + 1} to ${Math.min(i + batchSize, selectedFiles.length)} of ${selectedFiles.length}`);

      await Promise.all(batch.map(async (file) => {
        try {
          const fbxObject = await new Promise((resolve, reject) => {
            loader.load(
              URL.createObjectURL(file),
              (object) => resolve(object),
              (xhr) => {
                console.log(`${file.name}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
              },
              (error) => {
                console.error(`Error loading ${file.name}:, error`);
                reject(error);
              }
            );
          });

          if (optimizeModel) {
            try {
              fbxObject.traverse((child) => {
                if (child.isMesh) {
                  child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });

                  // Remove vertex colors if present
            if (child.geometry.attributes.color) {
                child.geometry.deleteAttribute("color");
              }
  
              // Remove UV coordinates
              if (child.geometry.attributes.uv) {
                child.geometry.deleteAttribute("uv");
              }
  
              // Remove normal data to further reduce size
              if (child.geometry.attributes.normal) {
                child.geometry.deleteAttribute("normal");
              }
                }
              });
            } catch (optimizeError) {
              console.error(`Error optimizing ${file.name}:, optimizeError`);
            }
          }

          const glbData = await new Promise((resolve, reject) => {
            const exporter = new GLTFExporter();
            exporter.parse(fbxObject, (result) => {
              resolve(result);
            }, {
              binary: true,
              forceIndices: true,
              truncateDrawRange: true
            }, (error) => {
              console.error(`Error exporting ${file.name} to GLB:, error`);
              reject(error);
            });
          });

          const gltfLoader = new GLTFLoader();
          const glbObject = await new Promise((resolve, reject) => {
            gltfLoader.parse(glbData, '', (gltf) => resolve(gltf.scene), reject);
          });
          console.log(glbObject)

          objects.push(glbObject);
          const boundingBox = new THREE.Box3().setFromObject(glbObject);
          cumulativeBoundingBox.current.union(boundingBox);

          newFileSizes.push({
            name: file.name,
            fbxSize: file.size,
            glbSize: glbData.byteLength
          });

          newConvertedModels.push({
            fileName: file.name.replace('.fbx', '.glb'),
            data: new Blob([glbData], { type: 'application/octet-stream' })
          });

          console.log(`Successfully processed ${file.name}`);
        } catch (error) {
          console.error(`Error processing file ${file.name}:, error`);
          newFailedFiles.push({ name: file.name, error: error.message || 'Unknown error' });
        }
      }));
    }

    objects.forEach((obj) => sceneRef.current.add(obj));
    adjustCamera();
    setFileSizes(newFileSizes);
    setConvertedModels(newConvertedModels);
    setFailedFiles(newFailedFiles);
    setProcessingStatus(`Processing complete. ${newConvertedModels.length} files converted. ${newFailedFiles.length} files failed.`);
    if (newFailedFiles.length > 0) {
      console.log("Failed files:", newFailedFiles);
    }
  };

  const saveConvertedModels = async () => {
    if (!saveDirectory) {
      alert("Please select a save directory first.");
      return;
    }

    if (convertedModels.length === 0) {
      alert("No models have been processed yet. Please process models before saving.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const model of convertedModels) {
      try {
        const newHandle = await saveDirectory.getFileHandle(model.fileName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(model.data);
        await writable.close();
        successCount++;
        setProcessingStatus(`Saving file ${successCount + failCount} of ${convertedModels.length}`);
      } catch (error) {
        console.error("Error saving file:", model.fileName, error);
        failCount++;
      }
    }

    setProcessingStatus(`Saving complete. ${successCount} files saved successfully. ${failCount} files failed to save.`);
  };

  const adjustCamera = () => {
    const center = new THREE.Vector3();
    cumulativeBoundingBox.current.getCenter(center);
    const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
    const distance = size.length();
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = distance / (2 * Math.tan(fov / 2));
    cameraZ *= 2.5; // Adjust multiplier to ensure all models are visible

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    if (isVisible) {  // Only update controls and render if visible
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const toggleVisibility = (visible) => {
    setIsVisible(visible);
    sceneRef.current.traverse(function (object) {
        if (object instanceof THREE.Mesh) {
            object.visible = visible;
        }
    });
  };

  const resetCameraView = () => {
    const center = new THREE.Vector3();
    cumulativeBoundingBox.current.getCenter(center);
    const size = cumulativeBoundingBox.current.getSize(new THREE.Vector3());
    const distance = size.length();
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = distance / (2 * Math.tan(fov / 2));
    cameraZ *= 2.5;  // Adjust to ensure all models are visible

    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  return (
    <div className="main">
      <div className="canvas-container">
        <button onClick={selectSaveDirectory}>Select Save Directory</button>
        <input
          className="button"
          type="file"
          multiple
          onChange={onFileChange}
          accept=".fbx"
        />
        <label>
          <input
            type="checkbox"
            checked={optimizeModel}
            onChange={(e) => setOptimizeModel(e.target.checked)}
          />
          Optimize (Reduce file size)
        </label>
        <button onClick={processModels}>Process Models</button>
        <button onClick={saveConvertedModels}>Save Converted Models</button>
        <div>{processingStatus}</div>
        <div ref={mountRef} style={{ width: "99%", height: "100vh" }}></div>
      </div>

      <div className="button-container">
        <button className="custom-button hide-show" onClick={() => toggleVisibility(true)}>
          <FontAwesomeIcon icon={faEye} />
        </button>
        <button className="custom-button" onClick={() => toggleVisibility(false)}>
          <FontAwesomeIcon icon={faEyeSlash} />
        </button>
        <button className="custom-button fit-view" onClick={resetCameraView}>
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      <div className="file-sizes">
        {fileSizes.map((file, index) => (
          <div key={index}>
            <p>{file.name}</p>
            <p>FBX size: {(file.fbxSize / 1024 / 1024).toFixed(2)} MB</p>
            <p>GLB size: {(file.glbSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ))}
      </div>

      {failedFiles.length > 0 && (
        <div className="failed-files">
          <h3>Failed Files:</h3>
          <ul>
            {failedFiles.map((file, index) => (
              <li key={index}>{file.name}: {file.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FbxToGlb;