/**
 * ChartCard Component (src/components/ChartCard.jsx)
 *
 * A reusable wrapper card for all Recharts charts.
 * Provides consistent header, loading state, and error state.
 */

import { motion } from 'framer-motion';

/**
 * @param {{
 *   title:     string,
 *   subtitle?: string,
 *   icon?:     string,
 *   loading?:  boolean,
 *   error?:    string|null,
 *   children:  React.ReactNode,
 *   delay?:    number,
 *   style?:    Object,
 * }} props
 */
export default function ChartCard({
  title,
  subtitle,
  icon = '📊',
  loading = false,
  error = null,
  children,
  delay = 0,
  style = {},
}) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={style}
    >
      {/* Header */}
      <div className="card-header">
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <div>
          <div className="card-title">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted" style={{ marginTop: '0.1rem' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="loading-overlay" style={{ minHeight: 200 }}>
          <div className="spinner" />
          <span className="text-secondary text-sm">Loading chart…</span>
        </div>
      ) : error ? (
        <div
          className="loading-overlay"
          style={{ minHeight: 200, flexDirection: 'column', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <span className="text-sm text-secondary">{error}</span>
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}
