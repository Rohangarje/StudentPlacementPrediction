/**
 * LoadingSpinner Component (src/components/LoadingSpinner.jsx)
 *
 * Full-page or inline loading state with animated spinner and message.
 */

import { motion } from 'framer-motion';

/**
 * @param {{ message?: string, fullPage?: boolean }} props
 */
export default function LoadingSpinner({ message = 'Loading…', fullPage = false }) {
  const content = (
    <div className="loading-overlay" style={{ flexDirection: 'column', gap: '1rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      >
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      </motion.div>
      <motion.p
        className="text-secondary text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)',
          zIndex: 100,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
