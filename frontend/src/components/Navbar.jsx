/**
 * Navbar Component (src/components/Navbar.jsx)
 *
 * Fixed top navigation bar with:
 * - Hamburger menu (mobile sidebar toggle)
 * - Page title / breadcrumb
 * - Dark/light mode toggle
 * - API health status pill
 */

import { useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { fetchHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/':            { title: 'Home',             subtitle: 'Overview & Quick Stats' },
  '/predict':     { title: 'Prediction',       subtitle: 'Single Student Analysis' },
  '/dashboard':   { title: 'Dashboard',        subtitle: 'Analytics & Insights' },
  '/performance': { title: 'Model Performance',subtitle: 'Accuracy & Metrics' },
  '/dataset':     { title: 'Dataset Analysis', subtitle: 'Data Exploration' },
  '/about':       { title: 'About',            subtitle: 'Project Information' },
};

/**
 * @param {{ onMenuToggle: Function, isDark: boolean, onThemeToggle: Function }} props
 */
export default function Navbar({ onMenuToggle, isDark, onThemeToggle }) {
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Page', subtitle: '' };
  const { isAuthenticated, user, login, logout } = useAuth();
  const [apiStatus, setApiStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  // Poll API health on mount
  useEffect(() => {
    const check = async () => {
      try {
        await fetchHealth();
        setApiStatus('online');
      } catch {
        setApiStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showLoginMenu) return;
    const handleClick = () => setShowLoginMenu(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showLoginMenu]);

  const handleGoogleSuccess = useCallback(
    async (credentialResponse) => {
      await login(credentialResponse.credential);
      setShowLoginMenu(false);
    },
    [login]
  );

  return (
    <header className="navbar">
      {/* Left: menu button + title */}
      <div className="navbar__left">
        <button
          className="navbar__menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
          title="Toggle sidebar"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="navbar__title-group">
          <h1 className="navbar__title">{pageInfo.title}</h1>
          <p className="navbar__subtitle">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Right: auth + status + theme toggle */}
      <div className="navbar__right">
        {/* ── Auth (Google Sign-In / User Avatar) ── */}
        <div className="navbar__auth">
          {isAuthenticated && user ? (
            <div
              className="navbar__user"
              onClick={() => setShowLoginMenu((v) => !v)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <img
                src={user.picture}
                alt={user.name}
                className="navbar__avatar"
                referrerPolicy="no-referrer"
                title={user.name}
              />
              <span className="navbar__user-name">{user.name}</span>

              {/* Dropdown menu */}
              {showLoginMenu && (
                <div
                  className="navbar__dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="navbar__dropdown-header">
                    <strong>{user.name}</strong>
                    <span className="text-muted text-xs">{user.email}</span>
                  </div>
                  <hr className="divider" style={{ margin: '0.35rem 0' }} />
                  <button className="navbar__dropdown-btn" onClick={logout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error('Google Sign-In failed')}
                size="medium"
                shape="pill"
                text="signin_with"
                theme="outline"
                logo_alignment="left"
              />
            </div>
          )}
        </div>

        {/* API status */}
        <div className={`navbar__status navbar__status--${apiStatus}`} title={`API ${apiStatus}`}>
          <span className="navbar__status-dot" />
          <span className="navbar__status-label">
            {apiStatus === 'online'   && 'API Online'}
            {apiStatus === 'offline'  && 'API Offline'}
            {apiStatus === 'checking' && 'Connecting…'}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          className="navbar__theme-btn"
          onClick={onThemeToggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--navbar-height);
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          z-index: 40;
          box-shadow: 0 2px 20px rgba(0,0,0,0.2);
          transition: left var(--transition);
        }

        @media (max-width: 768px) {
          .navbar { left: 0; }
        }

        .navbar__left {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }

        .navbar__menu-btn {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background var(--transition);
        }
        .navbar__menu-btn:hover { background: rgba(67,97,238,0.1); }
        .navbar__menu-btn span {
          display: block;
          width: 18px; height: 2px;
          background: var(--text-secondary);
          border-radius: 999px;
          transition: background var(--transition);
        }
        .navbar__menu-btn:hover span { background: var(--text-primary); }

        .navbar__title-group { min-width: 0; }

        .navbar__title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .navbar__subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin: 0;
          white-space: nowrap;
        }

        .navbar__right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .navbar__status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .navbar__status--online {
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.3);
          color: #86EFAC;
        }
        .navbar__status--offline {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.3);
          color: #FCA5A5;
        }
        .navbar__status--checking {
          background: rgba(67,97,238,0.12);
          border-color: rgba(67,97,238,0.3);
          color: #A5B4FC;
        }

        .navbar__status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .navbar__status--online  .navbar__status-dot { background: #22C55E; box-shadow: 0 0 6px #22C55E; }
        .navbar__status--offline .navbar__status-dot { background: #EF4444; }
        .navbar__status--checking .navbar__status-dot {
          background: #A5B4FC;
          animation: pulse-glow 1.5s infinite;
        }

        .navbar__status-label {
          display: none;
        }
        @media (min-width: 640px) {
          .navbar__status-label { display: inline; }
        }
        @media (max-width: 480px) {
          .navbar {
            padding: 0 0.875rem;
          }
          .navbar__subtitle {
            display: none;
          }
          .navbar__title {
            font-size: 0.95rem;
          }
          .navbar__status {
            padding: 0.3rem;
            border: none;
            background: transparent;
          }
          .navbar__status-label {
            display: none;
          }
        }

        @media (max-width: 360px) {
          .navbar {
            padding: 0 0.625rem;
          }
          .navbar__title {
            font-size: 0.85rem;
            max-width: 120px;
          }
          .navbar__right {
            gap: 0.4rem;
          }
          .navbar__theme-btn {
            width: 32px;
            height: 32px;
            font-size: 0.875rem;
          }
        }

        .navbar__theme-btn {
          width: 36px; height: 36px;
          border-radius: var(--radius-sm);
          background: rgba(67,97,238,0.1);
          border: 1px solid var(--border-color);
          font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all var(--transition);
        }
        .navbar__theme-btn:hover {
          background: rgba(67,97,238,0.2);
          border-color: var(--border-glow);
          transform: scale(1.05);
        }

        /* ── Auth section styles ── */
        .navbar__auth {
          display: flex;
          align-items: center;
        }

        .navbar__google-btn-wrapper {
          display: flex;
          align-items: center;
        }
        .navbar__google-btn-wrapper iframe {
          border-radius: var(--radius-full) !important;
        }

        .navbar__user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.2rem 0.5rem 0.2rem 0.2rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: rgba(67,97,238,0.08);
          transition: all var(--transition);
        }
        .navbar__user:hover {
          background: rgba(67,97,238,0.15);
          border-color: var(--border-glow);
        }

        .navbar__avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--primary);
          object-fit: cover;
        }

        .navbar__user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .navbar__dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          min-width: 200px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 0.5rem;
          z-index: 100;
          animation: fadeIn 0.15s ease;
        }

        .navbar__dropdown-header {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.35rem 0.5rem;
        }
        .navbar__dropdown-header strong {
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .navbar__dropdown-btn {
          width: 100%;
          text-align: left;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all var(--transition);
        }
        .navbar__dropdown-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #FCA5A5;
        }

        @media (max-width: 640px) {
          .navbar__user-name {
            display: none;
          }
          .navbar__user {
            padding: 0.2rem;
            border: none;
            background: transparent;
          }
          .navbar__avatar {
            width: 30px;
            height: 30px;
          }
          .navbar__google-btn-wrapper iframe {
            width: 100px !important;
            min-width: 100px !important;
          }
        }
      `}</style>
    </header>
  );
}
