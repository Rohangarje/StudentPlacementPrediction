/**
 * About Page (src/pages/About.jsx)
 *
 * Project information, tech stack, ML pipeline steps, objectives, and feature list.
 */

import { motion } from 'framer-motion';

const TECH_STACK = [
  { category: 'Frontend',  items: ['React 19', 'Vite 5', 'Recharts', 'Framer Motion', 'React Router 6', 'Axios'] },
  { category: 'Backend',   items: ['FastAPI', 'Uvicorn', 'Pydantic v2', 'Python 3.12+'] },
  { category: 'ML / Data', items: ['Scikit-learn', 'Pandas', 'NumPy', 'Joblib'] },
  { category: 'Deployment',items: ['Render / Railway (API)', 'Vercel / GitHub Pages (UI)'] },
];

const ML_MODELS = [
  { name: 'Random Forest',       icon: '🌲', desc: 'Ensemble of decision trees with bagging' },
  { name: 'Decision Tree',       icon: '🌳', desc: 'Single tree with GINI-based splits' },
  { name: 'Logistic Regression', icon: '📊', desc: 'Linear model with regularisation' },
  { name: 'K-Nearest Neighbors', icon: '🔍', desc: 'Distance-based classification (k=5)' },
];

const PIPELINE = [
  { step: 1, icon: '📂', label: 'Load Data' },
  { step: 2, icon: '🧹', label: 'Clean & Dedupe' },
  { step: 3, icon: '🔤', label: 'Label Encode' },
  { step: 4, icon: '✂️', label: 'Train/Test Split' },
  { step: 5, icon: '🤖', label: 'Train Models' },
  { step: 6, icon: '📊', label: 'Evaluate' },
  { step: 7, icon: '🏆', label: 'Select Best' },
  { step: 8, icon: '💾', label: 'Save Model' },
];

const cardStyle = {
  background: 'var(--grad-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-lg)',
};

export default function About() {
  return (
    <div className="page-container">
      {/* Hero */}
      <motion.div className="page-hero mb-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="page-hero__icon">ℹ️</span>
        <h1 className="page-hero__title">About This Project</h1>
        <p className="page-hero__subtitle">
          AI-Based Student Placement Prediction System — Production-ready ML + full-stack architecture.
        </p>
      </motion.div>

      <div className="about-layout">
        {/* Left Column */}
        <div>
          {/* Overview */}
          <motion.div style={cardStyle} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-lg">
            <div className="card-header"><span>🎯</span><div className="card-title">Project Overview</div></div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
              The <strong style={{ color: '#A5B4FC' }}>AI-Based Student Placement Prediction System</strong> is a
              production-grade machine learning application that leverages supervised learning algorithms to predict
              whether a student will be placed during campus recruitment drives.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, marginTop: '0.75rem' }}>
              The system analyses 13 academic and skill-based features — including CGPA, internships, coding skills,
              and soft skills — to provide an instant placement prediction with confidence probability.
            </p>
          </motion.div>

          {/* ML Pipeline */}
          <motion.div style={cardStyle} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-lg">
            <div className="card-header"><span>⚙️</span><div className="card-title">ML Pipeline</div></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {PIPELINE.map((p, i) => (
                <div key={p.step} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{
                    background: 'rgba(67,97,238,0.12)',
                    border: '1px solid rgba(67,97,238,0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: '#A5B4FC',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>
                    {p.icon} {p.label}
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Objectives */}
          <motion.div style={cardStyle} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="mb-lg">
            <div className="card-header"><span>🎯</span><div className="card-title">Project Objectives</div></div>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 2.2, paddingLeft: '1rem', listStyle: 'disc' }}>
              <li>Develop a robust multi-model ML pipeline for binary placement classification</li>
              <li>Automatically benchmark Logistic Regression, Decision Tree, Random Forest & KNN</li>
              <li>Expose predictions via a production-ready FastAPI REST API</li>
              <li>Build a professional React dashboard with real-time analytics</li>
              <li>Enable single-student and batch prediction workflows</li>
              <li>Visualise model performance, feature importance, and data correlations</li>
            </ul>
          </motion.div>

          {/* Future Enhancements */}
          <motion.div style={cardStyle} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="card-header"><span>🚀</span><div className="card-title">Future Enhancements</div></div>
            <div className="grid-2">
              {[
                { title: '🔧 Technical', items: ['Hyperparameter tuning (GridSearchCV)', 'XGBoost / LightGBM', 'SHAP explainability', 'Cross-validation support', 'Model versioning & MLflow'] },
                { title: '💡 Features',  items: ['Student recommendation engine', 'Resume scoring integration', 'College-level benchmarking', 'Email alerts for at-risk students', 'Historical trend analytics'] },
              ].map(({ title, items }) => (
                <div key={title} style={{ background: 'rgba(67,97,238,0.05)', borderRadius: 'var(--radius-sm)', padding: '0.875rem' }}>
                  <h4 style={{ color: '#A5B4FC', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</h4>
                  <ul style={{ color: 'var(--text-muted)', lineHeight: 2, fontSize: '0.83rem' }}>
                    {items.map((it) => <li key={it}>• {it}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="about-side-column">
          {/* Tech Stack */}
          {TECH_STACK.map((cat, i) => (
            <motion.div
              key={cat.category}
              style={{ ...cardStyle, borderColor: 'rgba(67,97,238,0.25)' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <h4 style={{ color: '#A5B4FC', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                🛠️ {cat.category}
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {cat.items.map((item) => (
                  <span key={item} className="badge badge-primary">{item}</span>
                ))}
              </div>
            </motion.div>
          ))}

          {/* ML Models */}
          <motion.div style={cardStyle} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <h4 style={{ color: '#F9A8D4', fontSize: '0.875rem', marginBottom: '0.875rem', fontWeight: 700 }}>
              🤖 ML Models
            </h4>
            {ML_MODELS.map((m) => (
              <div
                key={m.name}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{m.icon}</span>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', margin: 0 }}>{m.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Dataset card */}
          <motion.div
            style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(67,97,238,0.1), rgba(247,37,133,0.06))', textAlign: 'center' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
            <h4 style={{ color: '#A5B4FC', marginBottom: '0.5rem' }}>Dataset</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              45,000+ synthetic student records<br />
              13 features · Binary classification<br />
              80/20 train-test split
            </p>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
