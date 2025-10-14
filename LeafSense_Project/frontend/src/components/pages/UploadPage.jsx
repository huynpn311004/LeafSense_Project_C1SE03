import React, { useState, useRef } from 'react';
import Layout from '../layout/Layout';
import { analyzeLeafImage } from '../../services/predictionApi';
import './UploadPage.css';

const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResults([]);
    
    try {
      const results = await Promise.all(
        uploadedFiles.map(async (file) => {
          const result = await analyzeLeafImage(file);
          return {
            filename: file.name,
            ...result
          };
        })
      );
      
      setAnalysisResults(results);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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

        {analysisResults.length > 0 && (
          <div className="analysis-results">
            <h4>Analysis Results</h4>
            {analysisResults.map((result, index) => (
              <div key={index} className="result-item">
                <h5>{result.filename}</h5>
                <div className="result-content">
                  <div className="classification-result">
                    <h6>Classification Result:</h6>
                    <p>Disease: {result.classification.class}</p>
                    <p>Confidence: {(result.classification.confidence * 100).toFixed(2)}%</p>
                  </div>
                  {result.highlight_image && (
                    <div className="highlight-image">
                      <h6>Highlighted Image:</h6>
                      <img src={result.highlight_image} alt={`highlight-${result.filename}`} style={{maxWidth: '100%', borderRadius: 8}} />
                    </div>
                  )}
                  {result.segmentation.length > 0 && (
                    <div className="segmentation-result">
                      <h6>Detected Regions:</h6>
                      {result.segmentation.map((seg, idx) => (
                        <div key={idx} className="segment">
                          <p>Type: {seg.class}</p>
                          <p>Confidence: {(seg.confidence * 100).toFixed(2)}%</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadPage;
