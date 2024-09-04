import React, { useState } from 'react';
import axios from 'axios';

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState('');

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('fbxFile', file);

    try {
      const response = await axios.post('http://localhost:4000/convert', formData);
      setModelUrl(response.data.filePath);
    } catch (error) {
      console.error('Error uploading file:', error);
    }

    setLoading(false);
  };

  return (
    <div>
      <input type="file" onChange={onFileChange} />
      <button onClick={onUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload and Convert'}
      </button>
      {modelUrl && <p>Converted model URL: {modelUrl}</p>}
    </div>
  );
};

export default FileUploader;
