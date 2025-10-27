import React, { useState, useRef, useCallback } from 'react';
import Layout from '../layout/Layout';
import { analyzeLeafImage } from '../../services/predictionApi';
import TreatmentGuide from './TreatmentGuide';
import './UploadPage.css';

const UploadPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' hoặc 'camera'
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

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

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Sử dụng camera sau nếu có
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `captured_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        
        setCapturedImages(prev => [...prev, { file, url: imageUrl, id: Date.now() }]);
        setUploadedFiles(prev => [...prev, file]);
      }, 'image/jpeg', 0.8);
    }
  }, []);

  const removeCapturedImage = (id) => {
    setCapturedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== id);
    });
    
    // Cũng remove file tương ứng từ uploadedFiles
    setUploadedFiles(prev => {
      const imageToRemove = capturedImages.find(img => img.id === id);
      if (imageToRemove) {
        return prev.filter(file => file !== imageToRemove.file);
      }
      return prev;
    });
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
    if (mode === 'upload') {
      stopCamera();
    }
    // Reset kết quả khi đổi mode
    setAnalysisResults([]);
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

  // Cleanup function
  React.useEffect(() => {
    return () => {
      stopCamera();
      capturedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [stopCamera, capturedImages]);

  return (
    <Layout>
      <div className="upload-content">
        {/* Mode Selection */}
        <div className="mode-selection">
          <button 
            className={`mode-button ${inputMode === 'upload' ? 'active' : ''}`}
            onClick={() => handleModeChange('upload')}
          >
            📁 Upload Files
          </button>
          <button 
            className={`mode-button ${inputMode === 'camera' ? 'active' : ''}`}
            onClick={() => handleModeChange('camera')}
          >
            📷 Take Photo
          </button>
        </div>

        {/* Upload Mode */}
        {inputMode === 'upload' && (
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
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
        )}

        {/* Camera Mode */}
        {inputMode === 'camera' && (
          <div className="camera-container">
            {!isCameraOpen ? (
              <div className="camera-placeholder">
                <div className="camera-icon">📷</div>
                <h3>Take Photos of Leaf</h3>
                <p>Use your device camera to capture leaf images for analysis</p>
                <button className="camera-start-button" onClick={startCamera}>
                  Start Camera
                </button>
              </div>
            ) : (
              <div className="camera-active">
                <div className="camera-video-container">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="camera-video"
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                <div className="camera-controls">
                  <button className="capture-button" onClick={capturePhoto}>
                    📸 Capture
                  </button>
                  <button className="camera-stop-button" onClick={stopCamera}>
                    ❌ Stop Camera
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Captured Images Preview */}
        {capturedImages.length > 0 && (
          <div className="captured-images">
            <h4>Captured Images ({capturedImages.length})</h4>
            <div className="captured-images-grid">
              {capturedImages.map((image) => (
                <div key={image.id} className="captured-image-item">
                  <img src={image.url} alt="Captured" className="captured-image-preview" />
                  <button 
                    className="remove-captured-image"
                    onClick={() => removeCapturedImage(image.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Uploaded Files List */}
        {inputMode === 'upload' && uploadedFiles.length > 0 && (
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
          </div>
        )}

        {/* Analyze Button */}
        {uploadedFiles.length > 0 && (
          <div className="analyze-section">
            <button 
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : `Analyze ${uploadedFiles.length} Image${uploadedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {/* Analysis Results */}
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
                  {result.treatment_suggestion && (
                    <TreatmentGuide treatmentData={result.treatment_suggestion} />
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
