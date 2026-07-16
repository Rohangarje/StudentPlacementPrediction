/**
 * useToast Hook (src/hooks/useToast.js)
 *
 * Provides a simple toast notification system.
 * Returns { toasts, showToast, removeToast }.
 */

import { useState, useCallback } from 'react';

let _id = 0;

/**
 * @returns {{ toasts: Array, showToast: Function, removeToast: Function }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration  ms before auto-dismiss (0 = no auto-dismiss)
   */
  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  return { toasts, showToast, removeToast };
}
