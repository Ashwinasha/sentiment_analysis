import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';

function ResetPassword() {
  const location = useLocation(); // Get passed state
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    email: '',
    otp: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill email from state
  useEffect(() => {
    if (location.state?.email) {
      setForm(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const otpRes = await fetch('http://localhost:3002/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const otpData = await otpRes.json();
      if (otpData.error) {
        setMessage(otpData.error);
        setLoading(false);
        return;
      }

      const passRes = await fetch('http://localhost:3002/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const passData = await passRes.json();

      if (passData.error) {
        setMessage(passData.error);
      } else {
        setMessage('✅ Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setMessage('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card shadow-lg">
          <h2 className="text-center mb-4 fw-bold">Reset Password</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              value={form.email}
              className="form-control mb-3"
              readOnly // User cannot change
            />
            <input
              type="text"
              name="otp"
              placeholder="OTP"
              value={form.otp}
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="New Password"
              value={form.password}
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <button
              type="submit"
              className="btn btn-success w-100 position-relative form-btn"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          {message && (
            <p className={`mt-3 text-center ${message.includes('✅') ? 'text-success' : 'text-danger'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
