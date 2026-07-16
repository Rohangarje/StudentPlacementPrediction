/**
 * Dashboard Page (src/pages/Dashboard.jsx)
 *
 * Analytics dashboard featuring:
 * - 4 KPI stat cards
 * - Placement donut chart
 * - Branch-wise grouped bar
 * - Gender breakdown pie
 * - Degree breakdown
 * - CGPA area chart
 * - Feature importance horizontal bar
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

import { fetchDatasetStats, fetchFeatureImportance } from '../services/api';
import StatCard  from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#22C55E', '#FF6B35', '#4361EE', '#7209B7', '#F72585', '#06B6D4'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', boxShadow: 'var(--shadow-lg)' }}>
      {label && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{label}</p>}
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, fontWeight: 600, fontSize: '0.875rem', margin: '0.1rem 0' }}>
          {e.name}: {typeof e.value === 'number' ? e.value.toLocaleString() : e.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [fi, setFi]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, f] = await Promise.all([fetchDatasetStats(), fetchFeatureImportance()]);
        setStats(s);
        setFi(f);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard analytics…" />;
  if (error)   return (
    <div className="page-container">
      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ color: '#FCA5A5', marginTop: '0.5rem' }}>Failed to Load Dashboard</h2>
        <p className="text-secondary">{error}</p>
      </div>
    </div>
  );

  // ── Derived data ────────────────────────────────────────────────────────────
  const donutData = [
    { name: 'Placed',     value: stats.placed_count },
    { name: 'Not Placed', value: stats.not_placed_count },
  ];

  const branchData = Object.entries(stats.placement_by_branch).map(([b, c]) => ({
    name: b, Placed: c['Placed'] || 0, 'Not Placed': c['Not Placed'] || 0,
  }));

  const genderData = Object.entries(stats.placement_by_gender).map(([g, c]) => ({
    name: g, value: c['Placed'] || 0, total: (c['Placed'] || 0) + (c['Not Placed'] || 0),
  }));

  const degreeData = Object.entries(stats.placement_by_degree).map(([d, c]) => ({
    name: d, Placed: c['Placed'] || 0, 'Not Placed': c['Not Placed'] || 0,
  }));

  const fiData = fi?.features?.slice(0, 10).map((f) => ({
    name: f.feature.replace(/_/g, ' '),
    value: (f.importance * 100).toFixed(2),
  })) || [];

  return (
    <div className="page-container">
      {/* Hero */}
      <motion.div className="page-hero mb-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="page-hero__icon">📊</span>
        <h1 className="page-hero__title">Analytics Dashboard</h1>
        <p className="page-hero__subtitle">
          Comprehensive insights into student placement trends, academic performance, and model analytics.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid-4 mb-xl">
        <StatCard icon="👥" value={stats.total_students}   label="Total Students"    color="#4361EE" delay={0.0} />
        <StatCard icon="📊" value={stats.placement_rate}   label="Placement Rate"   color="#22C55E" suffix="%" delay={0.1} />
        <StatCard icon="🎓" value={stats.average_cgpa}     label="Average CGPA"     color="#F72585" delay={0.2} />
        <StatCard icon="💼" value={stats.average_internships} label="Avg Internships" color="#FF6B35" delay={0.3} />
      </div>

      {/* Row 1: Donut + Branch */}
      <div className="grid-2 mb-xl">
        <ChartCard title="Placement Distribution" icon="🍩" delay={0.2}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                paddingAngle={4} dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(1)}%`}
                labelLine={false}
              >
                {donutData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Branch-wise Placement" icon="🏛️" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
              <Bar dataKey="Placed"     fill="#22C55E" radius={[3,3,0,0]} />
              <Bar dataKey="Not Placed" fill="#FF6B35" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Gender + Degree */}
      <div className="grid-2 mb-xl">
        <ChartCard title="Gender-wise Placement" icon="⚧️" delay={0.4}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={genderData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Placed" fill="#4361EE" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Degree-wise Placement" icon="📜" delay={0.5}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={degreeData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
              <Bar dataKey="Placed"     fill="#7209B7" radius={[3,3,0,0]} />
              <Bar dataKey="Not Placed" fill="#F72585" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* CGPA Distribution */}
      <ChartCard title="CGPA Distribution" subtitle="Academic performance spread" icon="📈" delay={0.6} style={{ marginBottom: 'var(--space-xl)' }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={stats.cgpa_distribution} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cgpaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4361EE" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={3} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="count" stroke="#4361EE" fill="url(#cgpaGrad2)" strokeWidth={2} name="Students" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Feature Importance */}
      {fiData.length > 0 && (
        <ChartCard title="Feature Importance" subtitle={`From ${fi.model} model`} icon="⭐" delay={0.7}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={fiData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Importance (%)" radius={[0,4,4,0]}>
                {fiData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
