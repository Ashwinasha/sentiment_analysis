// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css'; // Keep for animation and gradient

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3002/dashboard-data')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="text-center mt-5">Loading...</div>;

  const total = data.Positive + data.Neutral + data.Negative;

  const barData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      label: 'Sentiment Count',
      data: [data.Positive, data.Neutral, data.Negative],
      backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
    }]
  };

  const pieData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [data.Positive, data.Neutral, data.Negative],
      backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
    }]
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container animate__animated animate__fadeIn">
        <h2 className="mb-5 fw-semibold">Sentiment Dashboard</h2>

        <div className="summary-card">
          <h3>Total Predictions: {total}</h3>
          <p>
            😀 {data.Positive} Positive &nbsp;&nbsp;
            😐 {data.Neutral} Neutral &nbsp;&nbsp;
            😠 {data.Negative} Negative
          </p>
        </div>

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
      </div>
    </div>
  );
};

export default Dashboard;
