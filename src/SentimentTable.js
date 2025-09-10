import React, { useEffect, useState } from "react";
import './SentimentTable.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function SentimentTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/recent-predictions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center mt-5">Loading data...</p>;
  if (error) return <p className="text-center text-danger mt-5">{error}</p>;

  return (
    <div className="container sentiment-table-container">
      <h2 className="table-title mb-5">Sentiment Logs</h2>


      <div className="table-container">
        <table className="table table-custom">
          <thead>
            <tr>
              <th>Text</th>
              <th>Sentiment</th>
              <th>Confidence</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {data.map((log, idx) => (
              <tr key={idx}>
                <td>{log.text}</td>
                <td>
                  <span className={`sentiment-text ${log.sentiment.toLowerCase()}`}>
                    {log.sentiment}
                  </span>
                </td>
                <td>{log.confidence.toFixed(2)}</td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SentimentTable;
