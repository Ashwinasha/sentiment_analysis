// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import SentimentChecker from './SentimentChecker';
import Navbar from './Navbar';
import SentimentTable from "./SentimentTable";
import Dashboard from './Dashboard'; // ✅ Import Dashboard
import 'bootstrap-icons/font/bootstrap-icons.css';



function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prediction" element={<SentimentChecker />} />
        <Route path="/SentimentTable" element={<SentimentTable />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ Add Dashboard Route */}
      </Routes>
    </Router>
  );
}

export default App;
