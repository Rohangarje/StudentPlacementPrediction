/**
 * Auth Context (src/context/AuthContext.jsx)
 *
 * Global authentication state management using Google OAuth.
 * Provides:
 *  - user: current authenticated user object (null if not logged in)
 *  - token: JWT session token (null if not logged in)
 *  - isAuthenticated: boolean helper
 *  - login(credential): verify Google token with backend, store JWT
 *  - logout(): clear auth state
 *  - loading: boolean for initial auth check
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogout } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // ─── On mount, verify stored token ─────────────────────────────────────
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.data?.authenticated) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      } catch {
        // API not reachable — keep token, but don't set user yet
        // Will re-verify when API is back
        setToken(storedToken);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // ─── Login: send Google credential to backend ──────────────────────────
  const login = useCallback(async (credential) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        credential,
      });

      const { token: jwt, user: userInfo } = response.data;

      // Store token
      localStorage.setItem('auth_token', jwt);
      setToken(jwt);
      setUser(userInfo);

      return { success: true, user: userInfo };
    } catch (error) {
      const message =
        error.response?.data?.detail || 'Authentication failed. Please try again.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    googleLogout();
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

