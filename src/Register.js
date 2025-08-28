import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', otp: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); 
  const [emailValid, setEmailValid] = useState(true); // track email validity
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'email') {
      setEmailValid(validateEmail(value)); // validate email on typing
    }
  };

  const validateEmail = (email) => {
    // Simple regex validation for email
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const handleSendOtp = async () => {
    if (!form.email) {
      return setMessage('Please enter your email to receive OTP.');
    }

    if (!validateEmail(form.email)) {
      setEmailValid(false);
      return setMessage('❌ Invalid email format. Please enter a valid email address.');
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3002/register-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('✅ OTP sent! Check your email.');
        setOtpSent(true);
      } else {
        setMessage(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setMessage('Server error. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!otpSent) return setMessage('Please send OTP first.');

    if (!validateEmail(form.email)) {
      setEmailValid(false);
      return setMessage('❌ Invalid email format.');
    }

    setLoading(true);
    setMessage('');

    try {
      // Verify OTP first
      const otpRes = await fetch('http://localhost:3002/register-verify-otp', {
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

      // Register the user
      const res = await fetch('http://localhost:3002/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('✅ Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage('Server error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card shadow-lg">
          <h2 className="text-center mb-4 fw-bold">REGISTER</h2>
          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="Name"
              onChange={handleChange}
              className="form-control mb-3"
              required
            />
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`form-control mb-3 ${!emailValid ? 'is-invalid' : ''}`}
              required
            />
            {!otpSent && (
              <button
                type="button"
                className="btn btn-warning w-50 form-btn"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            )}

            {otpSent && (
              <>
                <input
                  name="otp"
                  placeholder="Enter OTP"
                  onChange={handleChange}
                  className="form-control mb-3"
                  required
                />
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
                  className="btn btn-success w-50 form-btn"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </>
            )}
          </form>

          {message && (
            <p
              className={`mt-3 text-center ${
                message.includes('successful') || message.includes('OTP sent') ? 'text-success' : 'text-danger'
              }`}
            >
              {message}
            </p>
          )}

          <div className="mt-4 text-center">
            <p className="mb-1">
              Already have an account?{' '}
              <Link to="/login" className="text-decoration-none fw-bold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
