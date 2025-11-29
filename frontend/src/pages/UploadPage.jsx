import React, { useState } from 'react';
import { axiosClient } from '../api/axiosClient';
import PredictionCard from '../components/PredictionCard';

const sampleImages = [
  'https://media.istockphoto.com/id/1465038059/photo/dry-diseased-leaf-of-a-houseplant-in-hand-houseplant-care.jpg?s=612x612&w=0&k=20&c=IVl5dhI7gmXSeSvBkDXWwBMetybS9NXP5VTZKvS1JnU=',
  'data:image/jpeg;base64,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',
  'https://www.shutterstock.com/image-photo/disease-on-pear-tree-leaves-260nw-2196881751.jpg'
];

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [fileSignature, setFileSignature] = useState('');
  const [lastAnalyzedSignature, setLastAnalyzedSignature] = useState('');
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview('');
      setResult(null);
      setFileSignature('');
      setCanAnalyze(false);
      return;
    }

    const signature = `${selected.name}-${selected.size}-${selected.lastModified}`;
    setFile(selected);
    setFileSignature(signature);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError('');
    setCanAnalyze(signature !== lastAnalyzedSignature);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !canAnalyze) return;
    setLoading(true);
    setError('');
    setCanAnalyze(false);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await axiosClient.post('/predictions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data);
      setLastAnalyzedSignature(fileSignature);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      // Allow retry if analysis failed
      if (fileSignature && fileSignature !== lastAnalyzedSignature) {
        setCanAnalyze(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page app-shell">
      <div className="section-heading">
        <div>
          <p className="pill subtle">Smart Agriculture</p>
          <h1>Detect plant diseases with one photo</h1>
          <p className="muted">
            Upload a clear leaf image to get a health prediction, confidence score, and action
            steps.
          </p>
        </div>
      </div>

      <div className="grid-two">
        <div className="card">
          <h3>Upload a leaf image</h3>
          <p className="muted small">PNG, JPG up to 10MB</p>
          <form className="form" onSubmit={handleSubmit}>
            <label className="file-input dropzone">
              <div className="drop-text">
                <strong>Drag and drop a leaf image</strong>
                <span>or click to select</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
            </label>
            {preview && (
              <div className="preview">
                <img src={preview} alt="Preview" />
              </div>
            )}
            <button type="submit" disabled={!canAnalyze || loading}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
          {error && <p className="message error">{error}</p>}
          {result && (
            <div className="result-block">
              <div className="result-header">
                <span
                  className={
                    result.healthStatus === 'Healthy' ? 'badge success' : 'badge danger'
                  }
                >
                  {result.healthStatus}
                </span>
                <div>
                  <p className="muted mini-label">Disease type</p>
                  <strong>{result.diseaseType}</strong>
                </div>
                <div className="confidence">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                    />
                  </div>
                  <span>{Math.round((result.confidence || 0) * 100)}%</span>
                </div>
              </div>
              <div className="highlight">
                <p className="muted mini-label">Recommendation</p>
                <p className="recommendation">{result.recommendation}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card tips-card">
          <div className="tips-header">
            <span className="pill">Tips for better photos</span>
          </div>
          <ul className="tips">
            <li>Use natural light and avoid harsh shadows.</li>
            <li>Capture a single leaf, filling most of the frame.</li>
            <li>Keep the camera steady to prevent blur.</li>
          </ul>
          <div className="sample-grid soft">
            {sampleImages.map((src, idx) => (
              <img key={src} src={src} alt={`Sample ${idx + 1}`} loading="lazy" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
