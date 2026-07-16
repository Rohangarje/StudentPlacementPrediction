/**
 * API Service (src/services/api.js)
 *
 * Centralised Axios instance and all API call functions.
 * All requests target the FastAPI backend at http://localhost:8000.
 * During development, Vite proxies /api → http://localhost:8000.
 */

import axios from 'axios';

// ─── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,                          // 60s — metrics endpoint re-trains models
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// ─── Request interceptor (logging) ────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor (error normalisation) ────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Network error — is the backend running?';
    return Promise.reject(new Error(message));
  }
);


// ══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/** Verify API health */
export const fetchHealth = () => api.get('/health');

/** Root info */
export const fetchRoot = () => api.get('/');

/**
 * Predict placement for one student.
 * @param {Object} studentData - matches StudentInput schema
 */
export const predictPlacement = (studentData) =>
  api.post('/predict', studentData);

/**
 * Batch predict for multiple students.
 * @param {Array} students - array of StudentInput objects
 */
export const batchPredict = (students) =>
  api.post('/batch-predict', { students });

/** Get model metadata */
export const fetchModelInfo = () => api.get('/model-info');

/**
 * Get all model evaluation metrics.
 * NOTE: This retrains 4 models — may take 30–90 seconds on first call.
 */
export const fetchMetrics = () => api.get('/metrics');

/** Get feature importance scores */
export const fetchFeatureImportance = () => api.get('/feature-importance');

/** Get aggregated dataset statistics */
export const fetchDatasetStats = () => api.get('/dataset-stats');

/** Get feature correlation matrix */
export const fetchCorrelation = () => api.get('/correlation');

/**
 * Get first N rows of dataset
 * @param {number} n - number of rows (default 50)
 */
export const fetchDatasetSample = (n = 50) =>
  api.get(`/dataset-sample?n=${n}`);

export default api;
