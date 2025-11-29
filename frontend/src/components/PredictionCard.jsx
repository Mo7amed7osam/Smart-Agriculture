import React from 'react';

const PredictionCard = ({ prediction }) => {
  const statusClass =
    prediction.healthStatus === 'Healthy' ? 'badge success' : 'badge danger';
  const confidencePct = Math.round((prediction.confidence || 0) * 100);

  return (
    <article className="history-card">
      <div className="history-header">
        <div>
          <p className="muted">
            {prediction.createdAt ? new Date(prediction.createdAt).toLocaleString() : ''}
          </p>
          <strong>{prediction.diseaseType}</strong>
        </div>
        <span className={statusClass}>{prediction.healthStatus}</span>
      </div>
      <div className="confidence">
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${confidencePct}%` }} />
        </div>
        <span>{confidencePct}% confidence</span>
      </div>
      <p className="recommendation highlight">{prediction.recommendation}</p>
      {prediction.imageUrl && (
        <img
          className="thumb"
          src={prediction.imageUrl}
          alt="Leaf"
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}
    </article>
  );
};

export default PredictionCard;
