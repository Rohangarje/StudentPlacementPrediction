/**
 * 404 Not Found Page (src/pages/NotFound.jsx)
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Animated 404 */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: '8rem', marginBottom: '1rem', lineHeight: 1 }}
        >
          🎓
        </motion.div>

        <div
          style={{
            fontSize: 'clamp(5rem, 15vw, 8rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #4361EE, #F72585)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '0.5rem',
          }}
        >
          404
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Page Not Found
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            maxWidth: 400,
            margin: '0 auto 2rem',
            lineHeight: 1.7,
          }}
        >
          The page you're looking for doesn't exist. It may have been moved, deleted, or the URL might be wrong.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary btn-lg">
            🏠 Go Home
          </Link>
          <Link to="/predict" className="btn btn-secondary btn-lg">
            🔮 Try Prediction
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
