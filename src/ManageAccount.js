import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // ✅ import AuthContext
import './ManageAccount.css';

function ManageAccount() {
  const navigate = useNavigate();
  const { updateUser } = useAuth(); // ✅ get updateUser from context
  const [form, setForm] = useState({ name: '', username: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch logged-in user info from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:3002/current-user', {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          setForm({ name: data.name, username: data.username });
          setUserId(data.id);
          setUser(data); // store full user, including email
        } else {
          setMessage(`❌ ${data.error || 'Failed to load user'}`);
        }
      } catch (err) {
        console.error(err);
        setMessage('❌ Server error while loading user');
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) return setMessage('❌ User not loaded yet.');

    try {
      const res = await fetch(`http://localhost:3002/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name, username: form.username }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Account updated successfully!');
        setMessageType('success');

        // ✅ Update AuthContext immediately so Navbar shows new name
        updateUser({ name: form.name, username: form.username });

        // Redirect to home after 1 second
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setMessage(`❌ ${data.error || 'Failed to update'}`);
        setMessageType('error');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to update account.');
      setMessageType('error');
    }
  };

  const handleClose = () => navigate('/');

  return (
    <div className="manage-account-wrapper">
      <div className="manage-account-container">
        <div className="manage-account-card">
          <button className="close-btn" onClick={handleClose}>✖</button>
          <h2 className="title">Manage Account</h2>

          {message && <p className={`message ${messageType}`}>{message}</p>}

          <form onSubmit={handleSubmit}>
            <label>Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />

            <label>Email</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="form-control mb-3" 
            />

            <label>Username</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} required />

            <button type="submit" className="btn-save">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ManageAccount;
