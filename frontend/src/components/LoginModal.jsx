/**
 * Login Modal (src/components/LoginModal.jsx)
 *
 * Modal overlay that prompts the user to sign in with Google
 * before using the Predict feature.
 *
 * Features:
 * - Glass-morphism centered modal
 * - Google Sign-In button (credential callback)
 * - Dark overlay backdrop
 * - Close button / click-outside dismiss
 * - Animated entrance with Framer Motion
 */

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { login, demoLogin, isDemoMode } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSuccess = useCallback(
    async (credentialResponse) => {
      setErrorMsg('');
      const result = await login(credentialResponse.credential);
      if (result.success) {
        if (onSuccess) onSuccess(result.user);
        if (onClose) onClose();
      } else {
        setErrorMsg(result.error || 'Google Sign-In failed.');
      }
    },
    [login, onSuccess, onClose]
  );

  const handleGoogleError = useCallback(() => {
    setErrorMsg('Google Sign-In failed. Please try again.');
  }, []);

  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true);
    setErrorMsg('');
    const result = await demoLogin('Demo Student', 'student@demo.edu');
    setDemoLoading(false);
    if (result.success) {
      if (onSuccess) onSuccess(result.user);
      if (onClose) onClose();
    } else {
      setErrorMsg(result.error || 'Demo login failed.');
    }
  }, [demoLogin, onSuccess, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="login-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 999,
            }}
          />

          {/* Modal */}
          <motion.div
            className="login-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Sign in with Google"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              width: 'min(420px, 92vw)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg), 0 0 60px rgba(67,97,238,0.15)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition)',
              }}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Icon */}
            <div
              style={{
                fontSize: '3.5rem',
                marginBottom: '1rem',
              }}
            >
              🔐
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Sign in to Predict
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.75rem',
                lineHeight: 1.5,
              }}
            >
              Please sign in with your Google account to access the
              AI-powered placement prediction feature.
            </p>

            {/* Google Sign-In Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                size="large"
                shape="rectangular"
                text="signin_with"
                theme="outline"
                logo_alignment="center"
              />
            </div>

            {/* Demo Login Divider + Button */}
            {isDemoMode && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    margin: '0.75rem 0',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    or for quick access
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                </div>

                <button
                  id="demo-login-btn"
                  onClick={handleDemoLogin}
                  disabled={demoLoading}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(67,97,238,0.08)',
                    color: 'var(--primary-light)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: demoLoading ? 'wait' : 'pointer',
                    transition: 'all var(--transition)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => { if (!demoLoading) e.currentTarget.style.background = 'rgba(67,97,238,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(67,97,238,0.08)'; }}
                >
                  {demoLoading ? (
                    <><div className="spinner spinner-sm" /> Signing in…</>
                  ) : (
                    <>🚀 Continue as Demo User</>
                  )}
                </button>
              </>
            )}

            {/* Error message */}
            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.8rem',
                  color: '#FCA5A5',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                }}
              >
                ❌ {errorMsg}
              </motion.p>
            )}

            {/* Footer note */}
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '1rem',
              }}
            >
              By signing in, you agree to our Terms of Service.
              Your credentials are securely verified via Google.
            </p>
          </motion.div>
        </>
      )}

      {/* Styles */}
      <style>{`
        @media (max-width: 480px) {
          .login-modal {
            padding: 1.5rem !important;
          }
        }

        .login-modal iframe {
          border-radius: var(--radius-md) !important;
        }
      `}</style>
    </AnimatePresence>
  );
}

