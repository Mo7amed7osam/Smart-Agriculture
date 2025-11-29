import React, { useEffect, useState } from 'react';
import { axiosClient } from '../api/axiosClient';
import PredictionCard from '../components/PredictionCard';

const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setError('');
      try {
        const { data } = await axiosClient.get('/predictions');
        setItems(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="page app-shell">
      <div className="section-heading">
        <div>
          <p className="pill subtle">Your records</p>
          <h1>Prediction history</h1>
          <p className="muted">Review every scan you have made, sorted from newest to oldest.</p>
        </div>
      </div>

      <div className="card">
        {error && <p className="message error">{error}</p>}
        {items.length === 0 ? (
          <p className="muted">No predictions yet. Upload an image to see results here.</p>
        ) : (
          <div className="history-grid">
            {items.map((item) => (
              <PredictionCard key={item._id} prediction={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
