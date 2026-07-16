/**
 * React 19 Entry Point (src/main.jsx)
 *
 * Mounts the React application using the new React 19 createRoot API
 * with BrowserRouter for client-side routing.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App';

const root = document.getElementById('root');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
