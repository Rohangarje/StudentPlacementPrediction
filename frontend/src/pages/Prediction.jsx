/**
 * Prediction Page (src/pages/Prediction.jsx)
 *
 * Professional form for single student placement prediction.
 * Features:
 * - 13 validated input fields across 3 columns
 * - Real-time range slider value display
 * - Animated result card
 * - SVG probability ring
 * - Predict / Clear / Reset buttons
 * - Loading state & error toasts
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictPlacement } from '../services/api';
import ProbabilityRing from '../components/ProbabilityRing';
import LoadingSpinner  from '../components/LoadingSpinner';
import LoginModal from '../components/LoginModal';
import { useAuth } from '../context/AuthContext';

// ─── Default form values ───────────────────────────────────────────────────────
const DEFAULT_FORM = {
  age:                  21,
  gender:               'Male',
  degree:               'B.Tech',
  branch:               'CSE',
  cgpa:                 7.5,
  internships:          1,
  projects:             3,
  coding_skills:        6,
  communication_skills: 7,
  aptitude_score:       65,
  soft_skills:          7,
  certifications:       2,
  backlogs:             0,
};

// ─── Form field configs ────────────────────────────────────────────────────────
const TEXT_FIELDS = [
  {
    key: 'age', label: 'Age', type: 'number',
    min: 18, max: 35, step: 1, icon: '🎂',
  },
  {
    key: 'gender', label: 'Gender', type: 'select',
    options: ['Male', 'Female'], icon: '⚧️',
  },
  {
    key: 'degree', label: 'Degree', type: 'select',
    options: ['B.Tech', 'B.E.', 'B.Sc', 'BCA', 'MCA'], icon: '🎓',
  },
  {
    key: 'branch', label: 'Branch', type: 'select',
    options: ['CSE', 'ECE', 'ME', 'Civil', 'IT'], icon: '🏛️',
  },
  {
    key: 'internships', label: 'Internships', type: 'number',
    min: 0, max: 10, step: 1, icon: '💼',
  },
  {
    key: 'projects', label: 'Projects', type: 'number',
    min: 0, max: 20, step: 1, icon: '🔨',
  },
  {
    key: 'certifications', label: 'Certifications', type: 'number',
    min: 0, max: 10, step: 1, icon: '📜',
  },
  {
    key: 'backlogs', label: 'Backlogs', type: 'number',
    min: 0, max: 10, step: 1, icon: '⚠️',
  },
];

const SLIDER_FIELDS = [
  { key: 'cgpa',                 label: 'CGPA',                 min: 4.0, max: 10.0, step: 0.01, icon: '📊', color: '#4361EE' },
  { key: 'coding_skills',        label: 'Coding Skills',        min: 1,   max: 10,   step: 1,    icon: '💻', color: '#7209B7' },
  { key: 'communication_skills', label: 'Communication Skills', min: 1,   max: 10,   step: 1,    icon: '🗣️', color: '#F72585' },
  { key: 'aptitude_score',       label: 'Aptitude Score',       min: 0,   max: 100,  step: 1,    icon: '🧠', color: '#06B6D4' },
  { key: 'soft_skills',          label: 'Soft Skills Rating',   min: 1,   max: 10,   step: 1,    icon: '🌟', color: '#22C55E' },
];

// Field rendered as select or number input
function FieldItem({ config, value, onChange }) {
  const { key, label, type, options, min, max, step, icon } = config;
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`field-${key}`}>
        {icon} {label}
      </label>
      {type === 'select' ? (
        <select
          id={`field-${key}`}
          className="form-control"
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          id={`field-${key}`}
          type="number"
          className="form-control"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
        />
      )}
    </div>
  );
}

// Slider field
function SliderField({ config, value, onChange }) {
  const { key, label, min, max, step, icon, color } = config;
  const pct = ((value - min) / (max - min) * 100).toFixed(0);
  return (
    <div className="form-group">
      <div className="flex-between">
        <label className="form-label" htmlFor={`slider-${key}`}>
          {icon} {label}
        </label>
        <span className="range-value" style={{ color }}>{value}</span>
      </div>
      <input
        id={`slider-${key}`}
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(key, parseFloat(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, var(--border-color) ${pct}%, var(--border-color) 100%)`,
        }}
      />
      <div className="flex-between" style={{ marginTop: '0.15rem' }}>
        <span className="text-xs text-muted">{min}</span>
        <span className="text-xs text-muted">{max}</span>
      </div>
    </div>
  );
}

export default function Prediction() {
  const { isAuthenticated, user } = useAuth();
  const [form,    setForm]    = useState({ ...DEFAULT_FORM });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 480;
  const ringSize = isMobile ? 140 : 180;

  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);   // Clear result on input change
    setError(null);
  }, []);

  const handlePredict = async () => {
    // Require authentication before predicting
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await predictPlacement(form);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear  = () => { setResult(null); setError(null); };
  const handleReset  = () => { setForm({ ...DEFAULT_FORM }); setResult(null); setError(null); };

  const isPlaced = result?.prediction === 'Placed';

  return (
    <div className="page-container">
      {/* Hero */}
      <motion.div
        className="page-hero mb-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="page-hero__icon">🔮</span>
        <h1 className="page-hero__title">Predict Placement</h1>
        <p className="page-hero__subtitle">
          Enter student details below to generate an instant, AI-powered placement prediction.
        </p>
      </motion.div>

      <div className="prediction-layout">
        {/* ── Input Form ── */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <span>📋</span>
            <div>
              <div className="card-title">Student Information</div>
              <div className="text-xs text-muted">Fill in all fields for an accurate prediction</div>
            </div>
          </div>

          {/* Section: Basic Info */}
          <div className="section-header mb-md">
            <p className="section-header__title">🎓 Academic Details</p>
          </div>
          <div className="form-grid form-grid--academic">
            {TEXT_FIELDS.slice(0, 6).map((f) => (
              <FieldItem key={f.key} config={f} value={form[f.key]} onChange={handleChange} />
            ))}
          </div>

          {/* Section: Certifications & Backlogs */}
          <div className="form-grid form-grid--certs">
            {TEXT_FIELDS.slice(6).map((f) => (
              <FieldItem key={f.key} config={f} value={form[f.key]} onChange={handleChange} />
            ))}
          </div>

          {/* Section: Skills */}
          <div className="section-header mb-md">
            <p className="section-header__title">⚡ Skills & Performance</p>
          </div>
          <div className="form-grid form-grid--skills">
            {SLIDER_FIELDS.map((f) => (
              <SliderField key={f.key} config={f} value={form[f.key]} onChange={handleChange} />
            ))}
          </div>

          {/* Buttons */}
          <div className="prediction-actions">
            <button
              id="predict-btn"
              className="btn btn-primary btn-lg"
              onClick={handlePredict}
              disabled={loading}
              style={{ flex: '1 1 180px' }}
            >
              {loading ? <><div className="spinner spinner-sm" /> Analyzing…</> : '🔮 Predict Placement'}
            </button>
            <button className="btn btn-ghost" onClick={handleClear} disabled={loading}>
              🧹 Clear Result
            </button>
            <button className="btn btn-danger" onClick={handleReset} disabled={loading}>
              ↺ Reset Form
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 'var(--space-md)',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                color: '#FCA5A5',
                fontSize: '0.9rem',
              }}
            >
              ❌ {error}
            </motion.div>
          )}
        </motion.div>

        {/* ── Result Panel ── */}
        <div>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                className="card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ minHeight: 300 }}
              >
                <LoadingSpinner message="Analyzing student profile…" />
              </motion.div>
            )}

            {!loading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {/* Main result card */}
                <div className={`result-card result-card--${isPlaced ? 'placed' : 'not-placed'} mb-md`}>
                  <div className="result-card__emoji">{isPlaced ? '✅' : '❌'}</div>
                  <div className="result-card__label">{result.prediction}</div>
                  <p className="result-card__tip">
                    {isPlaced
                      ? 'Congratulations! High placement probability detected.'
                      : 'Consider improving skills and gaining more experience.'}
                  </p>

                  {/* Probability ring */}
                  <ProbabilityRing
                    probability={result.placement_probability}
                    placed={isPlaced}
                    size={ringSize}
                  />

                  {/* Model used */}
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <span className="badge badge-primary">Model: {result.model_used}</span>
                    {' '}
                    <span className={`badge badge-${result.confidence === 'High' ? 'success' : result.confidence === 'Medium' ? 'warning' : 'danger'}`}>
                      {result.confidence} Confidence
                    </span>
                  </div>
                </div>

                {/* Probability breakdown */}
                <div className="card">
                  <div className="card-header">
                    <span>📊</span>
                    <div className="card-title">Class Probabilities</div>
                  </div>
                  <div className="result-grid">
                    {[
                      { label: 'Placed',     value: result.placement_probability,     color: '#22C55E' },
                      { label: 'Not Placed', value: result.not_placed_probability, color: '#FF6B35' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          background: `rgba(${item.color === '#22C55E' ? '34,197,94' : '255,107,53'},0.08)`,
                          border: `1px solid ${item.color}44`,
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: item.color }}>
                          {item.value.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!loading && !result && (
              <motion.div
                key="placeholder"
                className="card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '3rem 2rem', minHeight: 300 }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.4 }}>🎯</div>
                <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Ready to Predict
                </h3>
                <p className="text-sm text-muted">
                  Fill in the student details on the left and click<br />
                  <strong style={{ color: 'var(--primary-light)' }}>Predict Placement</strong> to see the result.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Auth status bar (when logged in) ── */}
      {isAuthenticated && user && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
          }}
        >
          <img
            src={user.picture}
            alt={user.name}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '2px solid var(--primary)',
            }}
            referrerPolicy="no-referrer"
          />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.email} · <span style={{ color: 'var(--success)' }}>Authenticated</span>
            </div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--success)' }}>
            ✅ Signed in
          </span>
        </motion.div>
      )}

      {/* ── Login Modal ── */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Mobile scoped styles */}
      <style>{`
        @media (max-width: 480px) {
          .prediction-layout .card {
            padding: 1rem;
          }
          .prediction-layout .form-grid--skills {
            gap: var(--space-sm);
          }
          .prediction-layout .prediction-actions {
            gap: 0.625rem;
          }
          .prediction-layout .prediction-actions .btn {
            width: 100%;
            flex: none !important;
          }
        }
      `}</style>
    </div>
  );
}
