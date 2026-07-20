/**
 * Model Performance Page (src/pages/ModelPerformance.jsx)
 *
 * Deep dive into ML model evaluation:
 * - 5 KPI metric cards (best model stats)
 * - Tabbed interface: Comparison Table | Accuracy Charts | Confusion Matrix | Feature Importance
 * - Grouped bar charts for train vs test accuracy
 * - Radar chart for multi-metric comparison
 * - Confusion matrix heatmap (custom SVG)
 * - Feature importance horizontal bar
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Cell,
} from 'recharts';

import { fetchMetrics, fetchFeatureImportance } from '../services/api';
import StatCard  from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';

const MODEL_COLORS = {
  'Logistic Regression': '#4361EE',
  'Decision Tree':       '#7209B7',
  'Random Forest':       '#F72585',
  'KNN':                 '#FF6B35',
};

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
      {label && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>{label}</p>}
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
          {e.name}: {e.value}%
        </p>
      ))}
    </div>
  );
};

// Confusion matrix SVG heatmap
function ConfusionMatrix({ matrix, classNames }) {
  if (!matrix?.length) return <div className="text-secondary text-sm">No data</div>;
  const max = Math.max(...matrix.flat());
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table
        className="confusion-matrix-table"
        style={{ borderCollapse: 'separate', borderSpacing: '4px', margin: '0 auto' }}
      >
        <thead>
          <tr>
            <th style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}>Actual \ Predicted</th>
            {classNames.map((c) => (
              <th key={c} style={{ color: '#A5B4FC', fontSize: '0.8rem', padding: '0.3rem 0.75rem', fontWeight: 600 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ color: '#A5B4FC', fontSize: '0.8rem', fontWeight: 600, paddingRight: '0.75rem', whiteSpace: 'nowrap' }}>
                {classNames[i]}
              </td>
              {row.map((val, j) => {
                const intensity = max > 0 ? val / max : 0;
                const isMain = i === j;
                return (
                  <td
                    key={j}
                    className={`confusion-cell ${isMain ? 'confusion-cell--main' : ''}`}
                    title={`${classNames[i]} / ${classNames[j]}: ${val}`}
                    style={{
                      background: isMain
                        ? `rgba(67,97,238,${0.2 + intensity * 0.6})`
                        : `rgba(247,37,133,${intensity * 0.4})`,
                      borderRadius: '8px',
                      padding: '1.25rem',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      color: isMain ? '#A5B4FC' : '#F9A8D4',
                      minWidth: '70px',
                      border: `1px solid ${isMain ? 'rgba(67,97,238,0.4)' : 'rgba(247,37,133,0.2)'}`,
                    }}
                  >
                    {val.toLocaleString()}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        @media (max-width: 480px) {
          .confusion-matrix-table {
            font-size: 0.75rem;
          }
          .confusion-matrix-table th,
          .confusion-matrix-table td {
            padding: 0.5rem !important;
            font-size: 0.75rem !important;
            min-width: 50px !important;
          }
          .confusion-cell {
            padding: 0.6rem !important;
            font-size: 0.85rem !important;
            min-width: 45px !important;
          }
        }
      `}</style>
    </div>
  );
}

const TABS = ['Comparison Table', 'Accuracy Charts', 'Confusion Matrix', 'Feature Importance'];

export default function ModelPerformance() {
  const [metrics,  setMetrics]  = useState(null);
  const [fi,       setFi]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, f] = await Promise.all([fetchMetrics(), fetchFeatureImportance()]);
        setMetrics(m);
        setFi(f);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="page-container">
      <div className="page-hero mb-xl">
        <span className="page-hero__icon">📈</span>
        <h1 className="page-hero__title">Model Performance</h1>
        <p className="page-hero__subtitle">Training all 4 ML models… this may take 30–60 seconds.</p>
      </div>
      <LoadingSpinner message="Training models and computing metrics…" />
    </div>
  );

  if (error) return (
    <div className="page-container">
      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ color: '#FCA5A5' }}>Failed to Load Metrics</h2>
        <p className="text-secondary">{error}</p>
      </div>
    </div>
  );

  const bestModel = metrics.models.find((m) => m.model === metrics.best_model) || metrics.models[0];

  // ── Derived chart data ──────────────────────────────────────────────────────
  const radarData = ['testing_accuracy', 'precision', 'recall', 'f1_score'].map((key) => ({
    metric: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    ...Object.fromEntries(metrics.models.map((m) => [m.model, m[key]])),
  }));

  const trainTestData = metrics.models.map((m) => ({
    name:  m.model.replace('Logistic Regression', 'LR').replace('Decision Tree', 'DT').replace('Random Forest', 'RF'),
    Train: m.training_accuracy,
    Test:  m.testing_accuracy,
  }));

  const fiData = fi?.features?.slice(0, 10).map((f) => ({
    name:  f.feature.replace(/_/g, ' '),
    value: +(f.importance * 100).toFixed(2),
  })) || [];

  const classNames = Object.keys(metrics.classification_report).filter(
    (k) => !['accuracy', 'macro avg', 'weighted avg'].includes(k)
  );

  return (
    <div className="page-container">
      {/* Hero */}
      <motion.div className="page-hero mb-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="page-hero__icon">📈</span>
        <h1 className="page-hero__title">Model Performance</h1>
        <p className="page-hero__subtitle">
          Detailed comparison of all 4 ML models — accuracy, precision, recall, F1, and confusion matrix.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid-4 mb-xl">
        <StatCard icon="🏆" value={bestModel.testing_accuracy} label={`Best: ${metrics.best_model}`} color="#4361EE" suffix="%" delay={0.0} />
        <StatCard icon="🎯" value={bestModel.precision}        label="Precision"  color="#7209B7" suffix="%" delay={0.1} />
        <StatCard icon="🔁" value={bestModel.recall}           label="Recall"     color="#F72585" suffix="%" delay={0.2} />
        <StatCard icon="⚖️" value={bestModel.f1_score}         label="F1 Score"   color="#FF6B35" suffix="%" delay={0.3} />
      </div>

      {/* Tabs */}
      <div className="tabs mb-md" role="tablist">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === i}
            className={`tab-btn ${activeTab === i ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {['📊', '📈', '🔲', '⭐'][i]} {tab}
          </button>
        ))}
      </div>

      {/* Tab 0: Comparison Table */}
      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="t0">
          <div className="card mb-xl">
            <div className="card-header">
              <span>📊</span><div className="card-title">All Models — Comparison Table</div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Model', 'Train Acc (%)', 'Test Acc (%)', 'Precision (%)', 'Recall (%)', 'F1 Score (%)'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.models.map((m) => (
                    <tr key={m.model} style={m.model === metrics.best_model ? { background: 'rgba(67,97,238,0.08)' } : {}}>
                      <td style={{ fontWeight: 600, color: MODEL_COLORS[m.model] || 'var(--text-primary)' }}>
                        {m.model === metrics.best_model && '🏆 '}{m.model}
                      </td>
                      <td>{m.training_accuracy.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: '#A5B4FC' }}>{m.testing_accuracy.toFixed(2)}</td>
                      <td>{m.precision.toFixed(2)}</td>
                      <td>{m.recall.toFixed(2)}</td>
                      <td>{m.f1_score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar chart */}
          <ChartCard title="Multi-Metric Radar" subtitle="Comparing all models across key metrics" icon="🕸️">
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={130}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[50, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                {metrics.models.map((m) => (
                  <Radar
                    key={m.model}
                    name={m.model}
                    dataKey={m.model}
                    stroke={MODEL_COLORS[m.model]}
                    fill={MODEL_COLORS[m.model]}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                ))}
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{v}</span>} />
                <Tooltip content={<Tip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      )}

      {/* Tab 1: Accuracy Charts */}
      {activeTab === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="t1">
          <div className="grid-2 mb-xl">
            <ChartCard title="Testing Accuracy" icon="🎯">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.models.map((m) => ({ name: m.model.split(' ').map(w => w[0]).join(''), ...m }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="testing_accuracy" name="Test Accuracy" radius={[4,4,0,0]}>
                    {metrics.models.map((m, i) => (
                      <Cell key={i} fill={MODEL_COLORS[m.model] || '#4361EE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Train vs Test Accuracy" icon="📊">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trainTestData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<Tip />} />
                  <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{v}</span>} />
                  <Bar dataKey="Train" fill="#4361EE" radius={[3,3,0,0]} />
                  <Bar dataKey="Test"  fill="#F72585" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Precision / Recall / F1" subtitle="Per-model multi-metric comparison" icon="📉">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={metrics.models.map((m) => ({
                name: m.model.split(' ').map(w => w[0]).join(''),
                Precision: m.precision, Recall: m.recall, 'F1 Score': m.f1_score,
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<Tip />} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{v}</span>} />
                <Bar dataKey="Precision" fill="#4361EE" radius={[3,3,0,0]} />
                <Bar dataKey="Recall"    fill="#7209B7" radius={[3,3,0,0]} />
                <Bar dataKey="F1 Score"  fill="#22C55E" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      )}

      {/* Tab 2: Confusion Matrix */}
      {activeTab === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="t2">
          <ChartCard title={`Confusion Matrix — ${metrics.best_model}`} icon="🔲">
            <div style={{ padding: 'var(--space-lg)', overflowX: 'auto' }}>
              <ConfusionMatrix matrix={metrics.confusion_matrix} classNames={classNames} />
            </div>
            <div className="insight-grid">
              <div style={{ background: 'rgba(67,97,238,0.1)', border: '1px solid rgba(67,97,238,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ color: '#A5B4FC', fontWeight: 700, fontSize: '1.1rem' }}>■</span>
                <p className="text-xs text-muted mt-sm">Diagonal = Correct predictions (True Positive / Negative)</p>
              </div>
              <div style={{ background: 'rgba(247,37,133,0.08)', border: '1px solid rgba(247,37,133,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                <span style={{ color: '#F9A8D4', fontWeight: 700, fontSize: '1.1rem' }}>■</span>
                <p className="text-xs text-muted mt-sm">Off-diagonal = Misclassifications (FP / FN)</p>
              </div>
            </div>
          </ChartCard>

          {/* Classification report table */}
          <div className="card mt-md">
            <div className="card-header"><span>📋</span><div className="card-title">Classification Report</div></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Class', 'Precision', 'Recall', 'F1-Score', 'Support'].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {classNames.map((cls) => {
                    const r = metrics.classification_report[cls];
                    return (
                      <tr key={cls}>
                        <td style={{ fontWeight: 600, color: cls === 'Placed' ? '#22C55E' : '#FF6B35' }}>{cls}</td>
                        <td>{(r.precision * 100).toFixed(2)}%</td>
                        <td>{(r.recall * 100).toFixed(2)}%</td>
                        <td>{(r['f1-score'] * 100).toFixed(2)}%</td>
                        <td>{r.support?.toLocaleString() || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Feature Importance */}
      {activeTab === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="t3">
          <ChartCard title="Feature Importance" subtitle={`Model: ${fi?.model || 'N/A'}`} icon="⭐">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={fiData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" name="Importance (%)" radius={[0, 4, 4, 0]}>
                  {fiData.map((_, i) => (
                    <Cell key={i} fill={['#4361EE','#7209B7','#F72585','#FF6B35','#22C55E','#06B6D4'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      )}
    </div>
  );
}
