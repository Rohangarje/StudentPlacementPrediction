/**
 * Sidebar Component (src/components/Sidebar.jsx)
 *
 * Fixed left navigation sidebar with:
 * - Brand logo / name
 * - Navigation links with active state
 * - Collapse button on mobile (controlled by isOpen prop)
 * - AI status indicator
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation config
const NAV_ITEMS = [
  { path: '/',           label: 'Home',             icon: '🏠' },
  { path: '/predict',    label: 'Prediction',        icon: '🔮' },
  { path: '/dashboard',  label: 'Dashboard',         icon: '📊' },
  { path: '/performance',label: 'Model Performance', icon: '📈' },
  { path: '/dataset',    label: 'Dataset Analysis',  icon: '🗃️' },
  { path: '/about',      label: 'About',             icon: 'ℹ️' },
];

const sidebarVariants = {
  open:   { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

/**
 * @param {{ isOpen: boolean, onClose: Function }} props
 */
export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width to conditionally animate on mobile only
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 49,
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — animated on mobile via isOpen, static on desktop */}
      <motion.aside
        className="sidebar"
        animate={isMobile ? (isOpen ? 'open' : 'closed') : 'open'}
        variants={isMobile ? sidebarVariants : undefined}
        initial={false}
      >
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span style={{ fontSize: '1.6rem' }}>🎓</span>
          </div>
          <div>
            <div className="sidebar__brand-name">PlacementAI</div>
            <div className="sidebar__brand-tag">v2.0 • ML Powered</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          <div className="sidebar__nav-label">Navigation</div>
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar__link-icon">{icon}</span>
              <span className="sidebar__link-label">{label}</span>
              {location.pathname === path && (
                <motion.div
                  layoutId="active-pill"
                  className="sidebar__active-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer status badge */}
        <div className="sidebar__footer">
          <div className="sidebar__status">
            <span className="sidebar__status-dot" />
            <span>API Connected</span>
          </div>
          <div className="sidebar__version">FastAPI + React 19</div>
        </div>
      </motion.aside>

      {/* Sidebar CSS */}
      <style>{`
        .sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: var(--sidebar-width);
          background: linear-gradient(180deg, #0D1129 0%, #0B0F1A 100%);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 50;
          box-shadow: 4px 0 24px rgba(0,0,0,0.4);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar__brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.25rem 1rem;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .sidebar__logo {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #4361EE, #7209B7);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sidebar__brand-name {
          font-size: 1rem;
          font-weight: 800;
          background: linear-gradient(135deg, #A5B4FC, #F9A8D4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar__brand-tag {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sidebar__nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sidebar__nav-label {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 0.5rem 0.5rem 0.5rem;
          margin-bottom: 0.25rem;
        }

        .sidebar__link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition);
          overflow: hidden;
          text-decoration: none;
        }

        .sidebar__link:hover {
          background: rgba(67, 97, 238, 0.1);
          color: var(--text-primary);
        }

        .sidebar__link--active {
          background: linear-gradient(135deg, rgba(67,97,238,0.2), rgba(114,9,183,0.15));
          color: #fff;
          border: 1px solid rgba(67,97,238,0.3);
          font-weight: 600;
        }

        .sidebar__active-indicator {
          position: absolute;
          right: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: var(--grad-primary);
          border-radius: var(--radius-full) 0 0 var(--radius-full);
        }

        .sidebar__link-icon { font-size: 1rem; flex-shrink: 0; }
        .sidebar__link-label { flex: 1; }

        .sidebar__footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .sidebar__status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: var(--success);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .sidebar__status-dot {
          width: 7px; height: 7px;
          background: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--success);
          animation: pulse-glow 2s infinite;
        }

        .sidebar__version {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: min(82vw, 280px);
          }
        }
      `}</style>
    </>
  );
}
