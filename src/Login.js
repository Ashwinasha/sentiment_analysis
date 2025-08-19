import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Login.css';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
  e.preventDefault();
  setLoading(true);
  setMessage('');

  try {
    const res = await fetch('http://localhost:3002/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 🔑 important for sending cookies
    body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      // Show success message first
      setMessage('✅ Login successful! Redirecting...');
      
      // Keep spinner running for a short while
      setTimeout(() => {
        setLoading(false);      // stop spinner
         login({ 
      id: data.id,
      username: data.username,
      name: data.name,
      email: data.email // 🔹 fetched and stored
    });
        navigate('/');          // then redirect
      }, 1500);
    } else {
      setMessage(data.error);
      setLoading(false);       // stop spinner on error
    }
  } catch (err) {
    setMessage('Server error, please try again.');
    setLoading(false);
  }
};


  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card shadow-lg">
          <h2 className="text-center mb-4 fw-bold">LOGIN</h2>
          <form onSubmit={handleSubmit}>
            <input
              name="username"
              placeholder="Username"
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <button
              type="submit"
              className="btn btn-primary w-100 position-relative"
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Message section */}
          {message && (
            <p
              className={`mt-3 text-center ${
                message.includes('successful') ? 'text-success' : 'text-danger'
              }`}
              style={{ fontWeight: '500' }}
            >
              {message}
            </p>
          )}

          <div className="mt-4 text-center">
            <p className="mb-1">
              Don't have an account?{' '}
              <Link to="/register" className="text-decoration-none fw-bold">
                Register here
              </Link>
            </p>
            <p>
              Forgot password?{' '}
              <Link to="/forgot-password" className="text-decoration-none fw-bold">
                Reset here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
