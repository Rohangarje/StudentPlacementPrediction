/**
 * Dataset Analysis Page (src/pages/DatasetAnalysis.jsx)
 *
 * Tabbed exploration of the raw dataset:
 * - Overview tab: sample data table + key stats
 * - Statistics tab: descriptive statistics
 * - Correlation tab: correlation heatmap
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchDatasetStats, fetchDatasetSample, fetchCorrelation } from '../services/api';
import ChartCard  from '../components/ChartCard';
import StatCard   from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = ['🗃️ Data Preview', '📋 Statistics', '🔥 Correlation'];

// Correlation heatmap rendered as an HTML table with colour cells
function CorrelationHeatmap({ data, columns }) {
  if (!columns?.length) return <div className="text-secondary text-sm">No data</div>;
  const flat = data.flat();
  const abs  = flat.map(Math.abs);
  const max  = Math.max(...abs) || 1;

  const toColor = (val) => {
    const a = Math.abs(val) / max;
    if (val > 0) return `rgba(67,97,238,${0.1 + a * 0.7})`;
    return `rgba(247,37,133,${0.1 + a * 0.7})`;
  };

  return (
    <div style={{ overflowX: 'auto', fontSize: '0.68rem', WebkitOverflowScrolling: 'touch' }}>
      <table className="correlation-table" style={{ borderCollapse: 'separate', borderSpacing: '2px', whiteSpace: 'nowrap' }}>
        <thead>
          <tr>
            <th className="corr-header" style={{ color: 'var(--text-muted)', padding: '0.3rem 0.6rem', textAlign: 'left', minWidth: 90 }}>Feature</th>
            {columns.map((c) => (
              <th key={c} className="corr-col-header" style={{ color: 'var(--text-secondary)', padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 600, minWidth: 60 }}>
                {c.replace(/_/g, ' ').split(' ').map(w => w[0]).join('')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="corr-row-label" style={{ color: 'var(--text-secondary)', padding: '0.25rem 0.6rem', fontWeight: 500, minWidth: 90 }}>
                {columns[i].replace(/_/g, ' ')}
              </td>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="corr-cell"
                  title={`${columns[i]} / ${columns[j]}: ${val}`}
                  style={{
                    background: toColor(val),
                    borderRadius: '4px',
                    padding: '0.3rem 0.4rem',
                    textAlign: 'center',
                    fontWeight: i === j ? 800 : 500,
                    color: i === j ? '#fff' : 'var(--text-primary)',
                    border: i === j ? '1px solid rgba(67,97,238,0.5)' : 'none',
                    minWidth: 50,
                  }}
                >
                  {val.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-md mt-md" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span>■ <span style={{ color: '#7B8FF0' }}>Blue = Positive correlation</span></span>
        <span>■ <span style={{ color: '#F9A8D4' }}>Pink = Negative correlation</span></span>
        <span>Strong: |r| &gt; 0.7 · Moderate: 0.4–0.7 · Weak: &lt; 0.4</span>
      </div>
      <style>{`@media (max-width: 600px){.correlation-table{font-size:0.6rem !important}.corr-header{padding:0.2rem 0.4rem !important;min-width:60px !important;font-size:0.65rem !important}.corr-col-header{padding:0.2rem 0.25rem !important;min-width:35px !important;font-size:0.6rem !important}.corr-row-label{padding:0.15rem 0.4rem !important;min-width:60px !important;font-size:0.6rem !important}.corr-cell{padding:0.15rem 0.2rem !important;min-width:30px !important;font-size:0.55rem !important}}`}</style>
    </div>
  );
}

export default function DatasetAnalysis() {
  const [stats,  setStats]  = useState(null);
  const [sample, setSample] = useState([]);
  const [corr,   setCorr]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sa, c] = await Promise.all([
          fetchDatasetStats(),
          fetchDatasetSample(100),
          fetchCorrelation(),
        ]);
        setStats(s);
        setSample(sa);
        setCorr(c);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dataset…" />;

  const columns = sample.length > 0 ? Object.keys(sample[0]) : [];

  return (
    <div className="page-container">
      {/* Hero */}
      <motion.div className="page-hero mb-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="page-hero__icon">🗃️</span>
        <h1 className="page-hero__title">Dataset Analysis</h1>
        <p className="page-hero__subtitle">
          Explore 45,000+ student records, descriptive statistics, and feature correlations.
        </p>
      </motion.div>

      {stats && (
        <div className="grid-4 mb-xl">
          <StatCard icon="👥" value={stats.total_students} label="Total Records" color="#4361EE" delay={0.0} />
          <StatCard icon="📊" value={columns.length}       label="Features"      color="#7209B7" delay={0.1} />
          <StatCard icon="✅" value={0}                    label="Missing Values" color="#22C55E" delay={0.2} />
          <StatCard icon="📈" value={stats.average_cgpa}   label="Avg CGPA"      color="#F72585" delay={0.3} />
        </div>
      )}

      {/* Tabs */}
      <div className="tabs mb-md">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === i ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 0: Data Preview */}
      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="d0">
          <div className="card">
            <div className="card-header">
              <span>🗃️</span>
              <div>
                <div className="card-title">Raw Dataset Preview</div>
                <div className="text-xs text-muted">Showing first 100 rows of {stats?.total_students?.toLocaleString()} total records</div>
              </div>
            </div>
            <div className="data-table-wrapper" style={{ maxHeight: 480 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sample.map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td key={c} style={c === 'Placement_Status' ? {
                          fontWeight: 600,
                          color: row[c] === 'Placed' ? '#22C55E' : '#FF6B35',
                        } : {}}>
                          {row[c] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 1: Statistics */}
      {activeTab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="d1">
          <div className="card">
            <div className="card-header"><span>📋</span><div className="card-title">Dataset Statistics</div></div>
            <div className="grid-2 mb-lg">
              {[
                { label: 'Total Records',         value: stats?.total_students?.toLocaleString() },
                { label: 'Placement Rate',         value: `${stats?.placement_rate}%` },
                { label: 'Average CGPA',           value: stats?.average_cgpa },
                { label: 'Avg Internships',        value: stats?.average_internships },
                { label: 'Average Projects',       value: stats?.average_projects },
                { label: 'Avg Aptitude Score',     value: `${stats?.average_aptitude}%` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: 'rgba(67,97,238,0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                  }}
                >
                  <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-light)', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Feature info table */}
            <div className="section-header mb-md"><p className="section-header__title">📋 Feature Descriptions</p></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature</th><th>Type</th><th>Range / Values</th><th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Age',                  'int',   '18–35',                  'Student age'],
                    ['Gender',               'str',   'Male / Female',           'Student gender'],
                    ['Degree',               'str',   'B.Tech / B.Sc / BCA / MCA','Degree type'],
                    ['Branch',               'str',   'CSE / ECE / ME / Civil / IT','Engineering branch'],
                    ['CGPA',                 'float', '4.0–10.0',               'Cumulative GPA'],
                    ['Internships',          'int',   '0–10',                   'Internships completed'],
                    ['Projects',             'int',   '0–20',                   'Projects completed'],
                    ['Coding_Skills',        'int',   '1–10',                   'Coding ability rating'],
                    ['Communication_Skills', 'int',   '1–10',                   'Communication rating'],
                    ['Aptitude_Test_Score',  'int',   '0–100',                  'Aptitude test score'],
                    ['Soft_Skills_Rating',   'int',   '1–10',                   'Soft skills rating'],
                    ['Certifications',       'int',   '0–10',                   'Certifications count'],
                    ['Backlogs',             'int',   '0–10',                   'Academic backlogs'],
                    ['Placement_Status',     'str',   'Placed / Not Placed',    '🎯 Target variable'],
                  ].map(([feat, type, range, desc]) => (
                    <tr key={feat}>
                      <td style={{ fontWeight: 600, color: feat === 'Placement_Status' ? '#F72585' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{feat}</td>
                      <td><span className="badge badge-info">{type}</span></td>
                      <td className="text-sm text-secondary">{range}</td>
                      <td className="text-sm text-muted">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Correlation */}
      {activeTab === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="d2">
          <ChartCard title="Feature Correlation Matrix" subtitle="Pearson correlation between all numeric features" icon="🔥">
            {corr ? (
              <div style={{ padding: 'var(--space-md)' }}>
                <CorrelationHeatmap data={corr.data} columns={corr.columns} />
              </div>
            ) : (
              <div className="text-secondary text-sm" style={{ padding: '2rem', textAlign: 'center' }}>
                Correlation data unavailable
              </div>
            )}
          </ChartCard>
        </motion.div>
      )}
    </div>
  );
}
