import React from 'react'

function FileUploadProgress({progress}) {
  return (
<div>
            <h3>File Upload Progress</h3>
            <div style={{ width: '100%', border: '1px solid #ccc', borderRadius: '4px', padding: '4px' }}>
                <div style={{ width: `${progress}%`, backgroundColor: 'blue', height: '20px', borderRadius: '4px', transition: 'width 0.3s' }}></div>
            </div>
            <p>{progress}%</p>
        </div>  )
}

export default FileUploadProgress