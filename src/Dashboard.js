// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css'; // Keep for animation and gradient

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Fetch current data
    fetch('http://localhost:3002/dashboard-data')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);

    // Fetch trend data
    fetch('http://localhost:3002/dashboard-history')
      .then(res => res.json())
      .then(setHistory)
      .catch(console.error);
  }, []);

  if (!data) return <div className="text-center mt-5">Loading...</div>;

  const total = data.Positive + data.Neutral + data.Negative;

  // Percentages
  const positivePercent = ((data.Positive / total) * 100).toFixed(1);
  const neutralPercent = ((data.Neutral / total) * 100).toFixed(1);
  const negativePercent = ((data.Negative / total) * 100).toFixed(1);

  // Bar chart
  const barData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      label: 'Sentiment Count',
      data: [data.Positive, data.Neutral, data.Negative],
      backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
    }]
  };

  // Pie chart
  const pieData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [data.Positive, data.Neutral, data.Negative],
      backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
    }]
  };

  // Line chart (trend)
  const lineData = {
    labels: history.map(item => item.date), // e.g., ['2025-09-01', '2025-09-02']
    datasets: [
      {
        label: 'Positive',
        data: history.map(item => item.Positive),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Neutral',
        data: history.map(item => item.Neutral),
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Negative',
        data: history.map(item => item.Negative),
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container animate__animated animate__fadeIn">
        <h2 className="mb-5 dashboard-title">Sentiment Dashboard</h2>

        {/* Summary with percentages */}
        <div className="summary-card">
          <h3>Total Predictions: {total}</h3>
          <p>
            😀 {data.Positive} Positive &nbsp;&nbsp;
            😐 {data.Neutral} Neutral &nbsp;&nbsp;
            😠 {data.Negative} Negative
          </p>
        </div>

        {/* Existing charts */}
        <div className="row charts">
          <div className="col-md-6">
            <div className="chart-card h-100">
              <h3>Sentiment Distribution (Bar)</h3>
              <Bar data={barData} />
            </div>
          </div>
          <div className="col-md-6">
            <div className="chart-card h-100">
              <h3>Sentiment Composition (Pie)</h3>
              <Pie data={pieData} />
            </div>
          </div>
        </div>

        {/* Line chart (trend) */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="chart-card">
              <h3>📈 Sentiment Trend Over Time</h3>
              {history.length > 0 ? (
                <Line data={lineData} />
              ) : (
                <p className="text-muted">No trend data available.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
