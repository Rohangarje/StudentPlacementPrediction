/**
 * React Application Root (src/App.jsx)
 *
 * Configures:
 * - React Router routes (all 7 pages)
 * - Sidebar + Navbar layout shell
 * - Dark/light theme via useTheme hook
 * - Toast notification context via useToast hook
 * - Framer Motion page transitions
 */

import { Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Layout components
import Navbar  from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast   from './components/Toast';

// Pages
import Home            from './pages/Home';
import Prediction      from './pages/Prediction';
import Dashboard       from './pages/Dashboard';
import ModelPerformance from './pages/ModelPerformance';
import DatasetAnalysis from './pages/DatasetAnalysis';
import About           from './pages/About';
import NotFound        from './pages/NotFound';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// Animated page wrapper
function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location                        = useLocation();
  const { isDark, toggleTheme }         = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main content area ── */}
      <div className="main-content">
        {/* ── Top Navbar ── */}
        <Navbar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          isDark={isDark}
          onThemeToggle={toggleTheme}
        />

        {/* ── Page routes with transitions ── */}
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="/predict"     element={<AnimatedPage><Prediction /></AnimatedPage>} />
            <Route path="/dashboard"   element={<AnimatedPage><Dashboard /></AnimatedPage>} />
            <Route path="/performance" element={<AnimatedPage><ModelPerformance /></AnimatedPage>} />
            <Route path="/dataset"     element={<AnimatedPage><DatasetAnalysis /></AnimatedPage>} />
            <Route path="/about"       element={<AnimatedPage><About /></AnimatedPage>} />
            <Route path="*"            element={<AnimatedPage><NotFound /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* ── Toast container (top-right corner) ── */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
