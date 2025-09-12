import React, { useState, useEffect, useRef } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import './SentimentChecker.css'; // Make sure this file exists in /src

function SentimentChecker() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [batchError, setBatchError] = useState('');
  const [batchSuccess, setBatchSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [mode, setMode] = useState('text');

  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      setResult(null);
      setError('');
    };
  }, []);

  const handleSubmit = async () => {
    if (input.trim() === '') {
      setError('Enter the sentence');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setResult(data);
      setBatchResults([]);
      setBatchSuccess(false);
      setBatchError('');
    } catch {
      setError('Failed to fetch prediction. Try again later.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const lines = event.target.result.split('\n');
      if (lines.length <= 1) {
        setBatchError('CSV file is empty or malformed');
        setBatchResults([]);
        setBatchSuccess(false);
        return;
      }

      const sentences = lines.slice(1).map(line => line.trim()).filter(Boolean);
      if (sentences.length === 0) {
        setBatchError('CSV file contains no valid sentences');
        setBatchResults([]);
        setBatchSuccess(false);
        return;
      }

      setBatchError('');
      setLoading(true);

      try {
        const response = await fetch('http://localhost:3002/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sentences })
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setResult(null);
        setBatchResults(data);
        setBatchSuccess(true);
        setBatchError('');
      } catch {
        setBatchError('Failed to process file');
        setBatchSuccess(false);
        setBatchResults([]);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError('');
    setBatchResults([]);
    setBatchError('');
    setBatchSuccess(false);
  };

  const handleCancelUpload = () => {
  setSelectedFileName('');
  setBatchResults([]);
  setBatchError('');
  setBatchSuccess(false);
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};

  const getResultColor = () => {
    if (!result?.label) return '';
    return result.label.toLowerCase().trim();
  };

  return (
    
    <div className="sentiment-container">
      <h2 className="mb-5 table-title text-dark">Sentiment Analysis</h2>

      <div className="tab-buttons mb-5">
        <button className={`sentiment-button ${mode === 'text' ? 'active-tab' : ''} me-3`} onClick={() => setMode('text')}>
          Enter Text
        </button>
        <button  className={`sentiment-button ${mode === 'csv' ? 'active-tab' : ''}`}  onClick={() => setMode('csv')}>
          Upload CSV
        </button>
      </div>

      {mode === 'text' && (
        <div className="card p-4 shadow-sm">
          <input
            type="text"
            className="form-control mb-3 mt-2"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your sentence"
          />
          {error && <p className="text-danger">{error}</p>}
          
          <div className="d-flex justify-content-center gap-2">
            <button className="btn btn-success predict-button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Analyzing...' : 'Predict'}
            </button>
            {input.trim() && (
              <button className="btn btn-danger clear-button" onClick={handleClear}>
                Clear
              </button>
            )}
          </div>


          {result && (
            <div className={`result-section ${getResultColor()}`}>
              <h5>Analysis Result</h5>
              <p>
                <strong>Sentiment:</strong> {result.label}{' '}
                <img
                  src={process.env.PUBLIC_URL + `/${getResultColor()}.png`}
                  alt={result.label}
                  className="sentiment-icon"
                />
              </p>
              <p><strong>Confidence:</strong> {result.confidence.toFixed(2)}</p>
              {result.confidence < 0.5 && (
                <p className="text-warning">⚠️ Low confidence. Result may not be reliable.</p>
              )}
            </div>
          )}

        </div>
      )}

      {mode === 'csv' && (
        <div className="card p-4 shadow-sm">
          {!selectedFileName && (
            <div className="upload-card small-upload">
              <label htmlFor="csvUpload" className="upload-label">
                <i className="bi bi-upload upload-icon"></i>
                <span>Upload CSV File</span>
                <input
                  type="file"
                  id="csvUpload"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  ref={fileInputRef}
                  hidden
                />
              </label>
            </div>
          )}

            {selectedFileName && (
              <div
                className="uploaded-file d-flex align-items-center justify-content-between mt-3 p-3"
                style={{
                  borderRadius: '10px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(135deg, #e0e7ff, #f0f4f8)',
                }}
              >
                {/* File info with icon */}
                <div className="d-flex align-items-center">
                  <i
                    className="bi bi-file-earmark-text-fill"
                    style={{ fontSize: '1.5rem', color: '#4f46e5', marginRight: '10px' }}
                  ></i>
                  <span
                    style={{
                      fontWeight: '500',
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                      display: 'inline-block',
                    }}
                    title={selectedFileName} // shows full name on hover
                  >
                    {selectedFileName.length > 10
                      ? selectedFileName.substring(0, 10) + '...'
                      : selectedFileName}
                  </span>

                </div>

                {/* Delete button */}
                <button
                  onClick={handleCancelUpload}
                  className="btn btn-outline-danger btn-sm"
                  style={{ borderRadius: '50%', padding: '0.3rem 0.5rem' }}
                >
                  <i className="bi bi-trash-fill"></i>
                </button>
              </div>
            )}


            {loading && (
              <div className="text-center mb-3">
                <div className="spinner-border text-primary mt-5" role="status" />
                <p className="mt-5">Analyzing...</p>
              </div>
            )}

            {batchError && <p className="text-danger">{batchError}</p>}
            {batchSuccess && (
              <div className="success-message">✅ Predictions successful!</div>
            )}

            {batchResults.length > 0 && (
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Text</th>
                      <th>Sentiment</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.text}</td>
                        <td className={`sentiment-text ${item.label.toLowerCase()}`}>{item.label}</td>
                        <td>{item.confidence.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


    </div>
  );
}

export default SentimentChecker;
