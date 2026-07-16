/**
 * Toast Component (src/components/Toast.jsx)
 *
 * Renders a stack of toast notifications in the top-right corner.
 * Animated entrance via Framer Motion.
 */

import { AnimatePresence, motion } from 'framer-motion';

const ICONS = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

/** Single toast item */
function ToastItem({ toast, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`toast toast--${toast.type}`}
      role="alert"
      aria-live="polite"
    >
      <span>{ICONS[toast.type] || 'ℹ️'}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </motion.div>
  );
}

/**
 * Toast container — place once near the app root.
 *
 * @param {{ toasts: Array, removeToast: Function }} props
 */
export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container" aria-label="Notifications">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
