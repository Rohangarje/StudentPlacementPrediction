/**
 * Home Page (src/pages/Home.jsx)
 *
 * Landing page with:
 * - Animated hero banner
 * - 4 KPI stat cards (fetched from /dataset-stats)
 * - Placement distribution donut chart
 * - Branch-wise placement bar chart
 * - CGPA distribution histogram
 * - Best model banner
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';

import { fetchDatasetStats, fetchMetrics } from '../services/api';
import StatCard    from '../components/StatCard';
import ChartCard   from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';

// Chart color palette
const COLORS = ['#22C55E', '#FF6B35', '#4361EE', '#7209B7', '#F72585'];

// Custom Recharts tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1rem',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {label && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Home() {
  const [stats,   setStats]   = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s] = await Promise.all([fetchDatasetStats()]);
        setStats(s);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // Load metrics separately (slow endpoint)
    fetchMetrics().then(setMetrics).catch(() => {});
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const donutData = stats
    ? [
        { name: 'Placed',     value: stats.placed_count },
        { name: 'Not Placed', value: stats.not_placed_count },
      ]
    : [];

  const branchData = stats
    ? Object.entries(stats.placement_by_branch).map(([branch, counts]) => ({
        branch,
        Placed:     counts['Placed']     || 0,
        'Not Placed': counts['Not Placed'] || 0,
      }))
    : [];

  const cgpaData = stats?.cgpa_distribution || [];

  if (loading) return <LoadingSpinner message="Loading dashboard data…" />;
  if (error) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#FCA5A5', marginBottom: '0.5rem' }}>Backend Not Reachable</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
          <p className="text-sm text-muted">
            Make sure the FastAPI backend is running:<br />
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-light)' }}>
              uvicorn main:app --reload
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Hero Banner ── */}
      <motion.div
        className="page-hero mb-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="page-hero__icon animate-float">🎓</span>
        <h1 className="page-hero__title">AI-Based Student Placement Prediction</h1>
        <p className="page-hero__subtitle">
          Harness machine learning to predict campus placement outcomes with precision and confidence.
        </p>
        <div className="hero-actions" style={{ marginTop: '1.5rem', position: 'relative', zIndex: 1 }}>
          <Link to="/predict" className="btn btn-primary btn-lg">
            🔮 Predict Now
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            📊 View Dashboard
          </Link>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      {stats && (
        <div className="grid-4 mb-xl">
          <StatCard icon="👥" value={stats.total_students}  label="Total Students"    color="#4361EE" animate delay={0.0} />
          <StatCard icon="✅" value={stats.placed_count}    label="Students Placed"  color="#22C55E" animate delay={0.1} />
          <StatCard icon="📊" value={stats.placement_rate}  label="Placement Rate"   color="#F72585" suffix="%" delay={0.2} />
          <StatCard icon="🎓" value={stats.average_cgpa}    label="Average CGPA"     color="#FF6B35" delay={0.3} />
        </div>
      )}

      {/* ── Charts Row 1 ── */}
      <div className="grid-2 mb-xl">
        {/* Donut chart */}
        <ChartCard title="Placement Distribution" icon="🍩" delay={0.2}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%" cy="50%"
                innerRadius={75} outerRadius={115}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(1)}%`}
                labelLine={false}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} stroke="var(--bg-primary)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                formatter={(val) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{val}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Branch-wise bar chart */}
        <ChartCard title="Branch-wise Placement" icon="📚" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="branch" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{val}</span>} />
              <Bar dataKey="Placed"      fill="#22C55E" radius={[4, 4, 0, 0]} name="Placed" />
              <Bar dataKey="Not Placed"  fill="#FF6B35" radius={[4, 4, 0, 0]} name="Not Placed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── CGPA Distribution ── */}
      <ChartCard title="CGPA Distribution" subtitle="Academic performance spread across all students" icon="📈" delay={0.4} style={{ marginBottom: 'var(--space-xl)' }}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cgpaData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4361EE" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={3} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4361EE"
              fill="url(#cgpaGrad)"
              strokeWidth={2}
              name="Students"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Best Model Banner ── */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'linear-gradient(135deg, rgba(67,97,238,0.12), rgba(247,37,133,0.08))',
            border: '1px solid rgba(67,97,238,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 2rem',
            textAlign: 'center',
          }}
        >
          <p className="text-sm text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            🏆 Best Performing Model
          </p>
          <h2 className="text-gradient" style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {metrics.best_model}
          </h2>
          <p className="text-muted text-sm">Testing Accuracy: {metrics.best_accuracy}%</p>
          <Link to="/performance" className="btn btn-secondary btn-sm mt-md">
            View All Models →
          </Link>
        </motion.div>
      )}

      {/* ── Quick stats row ── */}
      {stats && (
        <div className="grid-4" style={{ marginTop: 'var(--space-xl)' }}>
          <StatCard icon="💼" value={stats.average_internships} label="Avg Internships"   color="#7209B7" delay={0.7} />
          <StatCard icon="🔨" value={stats.average_projects}    label="Avg Projects"      color="#06B6D4" delay={0.8} />
          <StatCard icon="🧠" value={stats.average_aptitude}    label="Avg Aptitude Score" color="#F72585" suffix="%" delay={0.9} />
          <StatCard icon="📋" value={stats.not_placed_count}    label="Not Placed"         color="#EF4444" delay={1.0} />
        </div>
      )}
    </div>
  );
}
