import React, { useState, useRef } from 'react';
import dxfToSvg from '../paper/dxfToSvgs';

const DXFtoSVGConverter = () => {
  const [svgString, setSvgString] = useState(null);
  const [fileName, setFileName] = useState('');
  const svgRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name.replace('.dxf', ''));

    const reader = new FileReader();
    reader.onload = (e) => {
      const dxfData = e.target.result;
      const svg = dxfToSvg(dxfData);
      setSvgString(svg);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!svgString || !svgRef.current) return;

    // Get the SVG content directly from the rendered SVG element
    const svgContent = new XMLSerializer().serializeToString(svgRef.current);
    
    // Create a Blob with the SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <input type="file" accept=".dxf" onChange={handleFileUpload} />
      {svgString && (
        <div>
          <div dangerouslySetInnerHTML={{ __html: svgString }} ref={svgRef} />
          <button onClick={handleDownload}>Download SVG</button>
        </div>
      )}
    </div>
  );
};

export default DXFtoSVGConverter;