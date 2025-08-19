// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import SentimentChecker from './SentimentChecker';
import SentimentTable from './SentimentTable';
import Dashboard from './Dashboard';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ManageAccount from './ManageAccount';

import { AuthProvider, useAuth } from './AuthContext';
import 'bootstrap-icons/font/bootstrap-icons.css';

// ProtectedRoute component
const ProtectedRoute = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

  return user ? element : <Navigate to="/login" replace />;
};

// PublicRoute component to handle loading and logged-in redirect
const PublicRoute = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

  return !user ? element : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthWrapper />
      </Router>
    </AuthProvider>
  );
}

// AuthWrapper component to conditionally render Navbar
const AuthWrapper = () => {
  const { user, loading } = useAuth();

  // Show a loading placeholder while restoring user session
  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

  return (
    <>
      {user && <Navbar />} {/* Show Navbar only when user is logged in */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute element={<Login />} />} />
        <Route path="/register" element={<PublicRoute element={<Register />} />} />
        <Route path="/forgot-password" element={<PublicRoute element={<ForgotPassword />} />} />
        <Route path="/reset-password" element={<PublicRoute element={<ResetPassword />} />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/prediction" element={<ProtectedRoute element={<SentimentChecker />} />} />
        <Route path="/SentimentTable" element={<ProtectedRoute element={<SentimentTable />} />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/manage-account" element={<ProtectedRoute element={<ManageAccount />} />} />

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
};

export default App;
