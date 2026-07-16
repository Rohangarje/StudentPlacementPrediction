# 🎓 AI-Based Student Placement Prediction System

<div align="center">

![Status](https://img.shields.io/badge/Status-Production%20Ready-22C55E?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.139-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A production-ready, enterprise-grade AI platform for predicting student campus placement outcomes.**

[Live Demo](#) · [API Docs](http://localhost:8000/docs) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Features](#features)
- [Screenshots](#screenshots)

---

## 🎯 Overview

The **AI-Based Student Placement Prediction System** uses trained machine learning models to predict whether an engineering student will be placed during campus recruitment. The system is built on 45,000+ student records with 13 features including CGPA, internships, coding skills, and soft skills.

### Key Features
- 🔮 **Real-time Single Prediction** — Instant placement prediction with probability score
- 📦 **Batch Prediction** — Predict for up to 1,000 students at once via API
- 📊 **Analytics Dashboard** — Placement trends, branch-wise stats, CGPA distribution
- 📈 **Model Performance** — Compare 4 ML models with confusion matrix & radar charts
- 🗃️ **Dataset Analysis** — Explore raw data, statistics, and correlation heatmap
- 🌗 **Dark/Light Mode** — Professional dark theme with light mode toggle

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 19 Frontend                            │
│  (Vite + Recharts + Framer Motion + React Router 6)            │
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Home   │ │ Prediction │ │Dashboard │ │ Model Perf.     │  │
│  └─────────┘ └────────────┘ └──────────┘ └─────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST API (Axios)
                           │ localhost:8000
┌──────────────────────────▼──────────────────────────────────────┐
│                    FastAPI Backend                              │
│  ┌────────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  API Routes    │  │  PlacementPr  │  │   DataService    │  │
│  │  /predict      │  │  edictor      │  │  dataset stats   │  │
│  │  /batch-predict│  │  .pkl load    │  │  correlation     │  │
│  │  /metrics      │  │  inference    │  │  sample data     │  │
│  └────────────────┘  └───────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┤
              │            │
  ┌───────────▼──┐  ┌──────▼───────────┐
  │  model.pkl   │  │  dataset/train.  │
  │  le.pkl      │  │  xls (CSV)       │
  └──────────────┘  └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                           |
|-------------|------------------------------------------------------|
| Frontend    | React 19, Vite 5, React Router 6, Axios             |
| UI/Charts   | Recharts 2, Framer Motion, Vanilla CSS              |
| Backend     | FastAPI, Uvicorn, Pydantic v2                       |
| ML          | Scikit-learn, Joblib, Pandas, NumPy                 |
| Models      | Logistic Regression, Decision Tree, Random Forest, KNN |
| Deployment  | Render / Railway (API) · Vercel / GitHub Pages (UI) |

---

## 📁 Project Structure

```
StudentPlacementPrediction/
├── backend/
│   ├── main.py                         # FastAPI app + CORS + lifespan
│   ├── requirements.txt
│   └── app/
│       ├── api/
│       │   └── routes.py              # All REST endpoints
│       ├── models/
│       │   └── schemas.py             # Pydantic request/response models
│       ├── services/
│       │   ├── predictor.py           # ML inference service
│       │   └── data_service.py        # Dataset analytics service
│       └── utils/
│           └── logger.py              # Logging configuration
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                   # React 19 entry point
│       ├── App.jsx                    # Router + layout shell
│       ├── index.css                  # Global design system
│       ├── components/
│       │   ├── Navbar.jsx             # Top navigation bar
│       │   ├── Sidebar.jsx            # Fixed left sidebar
│       │   ├── StatCard.jsx           # Animated KPI card
│       │   ├── ChartCard.jsx          # Chart wrapper
│       │   ├── LoadingSpinner.jsx     # Loading state
│       │   ├── Toast.jsx              # Notifications
│       │   └── ProbabilityRing.jsx    # SVG probability gauge
│       ├── pages/
│       │   ├── Home.jsx               # Landing + quick stats
│       │   ├── Prediction.jsx         # Single prediction form
│       │   ├── Dashboard.jsx          # Analytics dashboard
│       │   ├── ModelPerformance.jsx   # Model evaluation
│       │   ├── DatasetAnalysis.jsx    # Data exploration
│       │   ├── About.jsx              # Project info
│       │   └── NotFound.jsx           # 404 page
│       ├── services/
│       │   └── api.js                 # Axios API service
│       └── hooks/
│           ├── useTheme.js            # Dark/light mode
│           └── useToast.js            # Toast notifications
│
├── models/
│   ├── placement_prediction_model.pkl # Trained ML model
│   └── label_encoder.pkl             # Label encoders
├── dataset/
│   └── train.xls                     # Training dataset (CSV)
├── train_model.py                    # Model training script
└── README.md
```

---

## ⚡ Installation

### Prerequisites
- Python 3.10+ 
- Node.js 18+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/StudentPlacementPrediction.git
cd StudentPlacementPrediction
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

> **Note:** The pre-trained model files (`placement_prediction_model.pkl` and `label_encoder.pkl`) are already in the `models/` directory. No retraining is needed.

---

## 🚀 Running the Application

### Start the Backend (FastAPI)
```bash
# From the backend/ directory
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
✅ API available at: `http://localhost:8000`  
📖 Swagger UI: `http://localhost:8000/docs`

### Start the Frontend (React)
```bash
# From the frontend/ directory (new terminal)
cd frontend
npm run dev
```
✅ App available at: `http://localhost:5173`

---

## 📡 API Reference

### Base URL: `http://localhost:8000`

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| `GET`  | `/`                 | API info and endpoint listing        |
| `GET`  | `/health`           | Health check                         |
| `POST` | `/predict`          | Single student placement prediction  |
| `POST` | `/batch-predict`    | Batch prediction (up to 1,000)       |
| `GET`  | `/model-info`       | Model metadata and allowed values    |
| `GET`  | `/metrics`          | All model accuracy metrics           |
| `GET`  | `/feature-importance` | Feature importance scores          |
| `GET`  | `/dataset-stats`    | Aggregated dataset statistics        |
| `GET`  | `/correlation`      | Feature correlation matrix           |
| `GET`  | `/dataset-sample`   | First N rows of the dataset          |

### POST /predict — Example

**Request:**
```json
{
  "age": 21,
  "gender": "Male",
  "degree": "B.Tech",
  "branch": "CSE",
  "cgpa": 8.5,
  "internships": 2,
  "projects": 3,
  "coding_skills": 7,
  "communication_skills": 8,
  "aptitude_score": 75,
  "soft_skills": 7,
  "certifications": 2,
  "backlogs": 0
}
```

**Response:**
```json
{
  "prediction": "Placed",
  "placement_probability": 94.52,
  "not_placed_probability": 5.48,
  "model_used": "DecisionTreeClassifier",
  "confidence": "High",
  "input_summary": { ... }
}
```

---

## 🌐 Deployment

### Backend — Deploy to Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** → `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables if needed

### Frontend — Deploy to Vercel

1. Install the Vercel CLI: `npm i -g vercel`
2. Update `VITE_API_URL` in `frontend/.env`:
   ```
   VITE_API_URL=https://your-render-api.onrender.com
   ```
3. From the frontend directory:
   ```bash
   npm run build
   vercel --prod
   ```

### Frontend — Deploy to GitHub Pages

1. Add to `frontend/package.json`:
   ```json
   "homepage": "https://username.github.io/repo-name"
   ```
2. Install: `npm install gh-pages --save-dev`
3. Deploy: `npm run build && npx gh-pages -d dist`

---

## ✨ Features

### 🔮 Prediction Page
- Professional form with 13 input fields
- Interactive range sliders with real-time value display
- Animated SVG probability ring gauge
- Placed / Not Placed result card with colour coding
- Confidence tier: High / Medium / Low
- Class probability breakdown

### 📊 Dashboard
- 4 animated KPI cards with count-up animation
- Placement distribution donut chart
- Branch-wise grouped bar chart
- Gender breakdown bar chart
- Degree-wise bar chart
- CGPA area chart
- Feature importance horizontal bar chart

### 📈 Model Performance
- Comparison table for all 4 models
- Multi-metric radar chart
- Train vs Test accuracy bars
- Confusion matrix (colour-coded)
- Classification report table
- Feature importance from loaded model

### 🗃️ Dataset Analysis
- Raw data table (first 100 rows)
- Descriptive statistics grid
- Feature descriptions table
- Colour-coded correlation heatmap

### 🎨 Design System
- Dark/Light mode toggle (persists via localStorage)
- Glassmorphism card system
- Gradient backgrounds and borders
- Framer Motion page transitions
- Animated StatCards with count-up
- Sticky sidebar with active link indicator
- API health polling in navbar
- Toast notification system

---

## 📜 License

MIT License — feel free to use this project in your portfolio or extend it for production use.

---

<div align="center">
Built with ❤️ using FastAPI + React 19 + Scikit-learn
</div>
