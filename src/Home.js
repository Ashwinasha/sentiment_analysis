// src/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
// import FallingLetters from './FallingLetters';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* <FallingLetters /> */}
      <h1 className="home-title">Welcome to the Sentiment Analyzer</h1>
      <p className="home-description">Analyze the tone of your text in real time using AI.</p>
      <button className="start-button" onClick={() => navigate('/prediction')}>
        Start
      </button>
    </div>
  );
}

export default Home;
