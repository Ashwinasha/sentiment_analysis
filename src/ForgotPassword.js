import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Reuse same CSS for consistency

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3002/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ OTP sent! Redirecting to reset password...');

        // Navigate to Reset Password page and pass email in state
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 1500);
      } else {
        setMessage(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setMessage('Server error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card shadow-lg position-relative">
          {/* Rounded Arrow Back Button */}
          <button
            className="arrow-back-btn"
            onClick={() => navigate('/login')}
          >
            ←
          </button>

          <h2 className="text-center mb-4 fw-bold">Forgot Password</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-control mb-3"
              required
            />
            <button
              type="submit"
              className="btn btn-warning w-100 position-relative form-btn"
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          {message && (
            <p
              className={`mt-3 text-center ${
                message.includes('✅') ? 'text-success' : 'text-danger'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
