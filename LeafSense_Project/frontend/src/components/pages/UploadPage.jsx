import React, { useState, useRef } from 'react';
import Layout from '../layout/Layout';
import './UploadPage.css';

const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('Analysis completed!');
    }, 3000);
  };

  return (
    <Layout>
      <div className="upload-content">
        <div className="upload-area">
          <div className="upload-icon">📁</div>
          <h3>Upload Leaf Images</h3>
          <p>Drag and drop your images here or click to browse</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="file-input"
            id="file-upload"
            ref={fileInputRef}
          />
          <label htmlFor="file-upload" className="upload-button">
            Choose Files
          </label>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h4>Uploaded Files ({uploadedFiles.length})</h4>
            <div className="file-list">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">🖼️</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    className="remove-file"
                    onClick={() => removeFile(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button 
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Images'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadPage;
