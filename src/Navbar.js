import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const togglePopover = () => setPopoverOpen(prev => !prev);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">🤖 TriLang Sentiment AI</div>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/prediction">Predict</Link></li>
        <li><Link to="/SentimentTable">Sentiment Table</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>

        {isAuthenticated && (
          <li className="popover-wrapper" ref={popoverRef}>
            <button onClick={togglePopover} className="popover-btn">
              {user?.name || 'Account'} ▼
            </button>

            {popoverOpen && (
              <div className="popover-menu">
                <Link to="/manage-account" onClick={() => setPopoverOpen(false)}>
                  Manage Account
                </Link>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
