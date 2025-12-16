import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'active' : '');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <nav className="navbar">
      <Link className="brand" to="/upload">
        <img src="/leaf.svg" alt="" className="logo-icon" />
        <span>Smart Agriculture</span>
      </Link>
      <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
        <span />
        <span />
        <span />
      </button>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        <Link
          className={`nav-link ${isActive('/upload')}`}
          to="/upload"
          onClick={() => setOpen(false)}
        >
          Home
        </Link>
        <Link
          className={`nav-link ${isActive('/history')}`}
          to="/history"
          onClick={() => setOpen(false)}
        >
          History
        </Link>
        <button
          className="nav-link icon-btn"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="nav-link danger" onClick={handleLogout}>
          Logout
          {user?.name && <span className="user-tag">{user.name}</span>}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
