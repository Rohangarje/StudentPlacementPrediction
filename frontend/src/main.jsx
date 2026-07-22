/**
 * React 19 Entry Point (src/main.jsx)
 *
 * Mounts the React application using the new React 19 createRoot API
 * with BrowserRouter for client-side routing and Google OAuth provider.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// ═══ Google OAuth Configuration ═══════════════════════════════════════
// Set VITE_GOOGLE_CLIENT_ID in your .env file or environment variables.
// You can create a client ID at https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  'YOUR_GOOGLE_CLIENT_ID_HERE';

const root = document.getElementById('root');

createRoot(root).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
