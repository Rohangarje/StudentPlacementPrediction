# 🎓 AI-Based Student Placement Prediction System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.3+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

**A production-ready Machine Learning system that predicts campus placement outcomes for students using academic and skill-related features.**

[Live Demo](#how-to-run) · [Dataset](#dataset-description) · [Results](#results) · [Features](#features)

</div>

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Features](#features)
- [Dataset Description](#dataset-description)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [Results](#results)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [License](#license)
- [Author](#author)

---

## 🎯 Project Overview

The **AI-Based Student Placement Prediction System** is a full-stack machine learning application built with Python and Streamlit. It uses historical student data (academic performance + skill ratings) to train four different classification algorithms and automatically selects the best-performing model to predict whether a student will be **Placed** or **Not Placed** during campus recruitment.

---

## 📌 Problem Statement

Academic institutions face the challenge of identifying students who may struggle during campus placements. Early prediction enables:
- Targeted skill-development programs
- Mock interview preparation
- Mentorship allocation
- Curriculum adjustments

This system provides a data-driven approach to placement prediction using supervised machine learning.

---

## 🎯 Objectives

- [x] Build a robust multi-model ML pipeline for binary classification
- [x] Automatically benchmark and select the best-performing algorithm
- [x] Provide an intuitive Streamlit dashboard for students and faculty
- [x] Enable single and batch prediction workflows
- [x] Visualize model metrics, feature importance, and data insights interactively
- [x] Follow production-grade OOP, PEP8, and exception-handling standards

---

## ✨ Features

### 🤖 Machine Learning
- **4 Algorithms**: Logistic Regression, Decision Tree, Random Forest, KNN
- **Auto Model Selection**: Automatically picks the best model by testing accuracy
- **Comprehensive Evaluation**: Accuracy, Precision, Recall, F1-Score, Confusion Matrix

### 📊 Interactive Dashboard (5 Pages)
| Page | Description |
|------|-------------|
| 🏠 Home | KPI cards, class distribution, branch-wise placement, CGPA charts |
| 🔮 Predict | Single & batch prediction with probability gauge |
| 📊 Dataset Overview | Raw data, statistics, correlation heatmap, feature analysis |
| 📈 Model Performance | Comparison table, radar chart, confusion matrix, feature importance |
| ℹ️ About | Project info, tech stack, dataset description, pipeline diagram |

### 💡 Bonus Features
- ✅ CSV batch prediction with downloadable results
- ✅ Confidence score (probability gauge)
- ✅ Feature importance visualization (Random Forest + LR coefficients)
- ✅ Dark mode professional UI
- ✅ Responsive layout with interactive Plotly charts
- ✅ Model download/save functionality

---

## 📁 Dataset Description

**Source**: Synthetic dataset of 45,000 engineering students  
**Target**: `Placement_Status` (Placed / Not Placed)  
**Class Distribution**: ~36% Placed, ~64% Not Placed

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| Student_ID | int | — | Unique identifier (removed before training) |
| Age | int | 18–24 | Student age |
| Gender | str | Male/Female | Student gender |
| Degree | str | B.Tech/BCA/MCA/B.Sc | Degree program |
| Branch | str | CSE/ECE/ME/Civil/IT | Engineering branch |
| CGPA | float | 4.0–10.0 | Cumulative GPA |
| Internships | int | 0–5 | Number of internships |
| Projects | int | 0–10 | Number of projects |
| Coding_Skills | int | 1–10 | Self-rated coding ability |
| Communication_Skills | int | 1–10 | Self-rated communication |
| Aptitude_Test_Score | int | 0–100 | Aptitude test score |
| Soft_Skills_Rating | int | 1–10 | Soft skills rating |
| Certifications | int | 0–3 | Industry certifications |
| Backlogs | int | 0–3 | Academic backlogs |
| **Placement_Status** | **str** | **Placed/Not Placed** | **🎯 Target variable** |

---

## 🛠️ Installation

### Prerequisites
- Python 3.12+
- pip

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/StudentPlacementPrediction.git
cd StudentPlacementPrediction

# 2. (Optional) Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# 3. Install dependencies
pip install -r requirements.txt
```

---

## 📂 Project Structure

```
StudentPlacementPrediction/
│
├── dataset/
│   └── train.xls              # Dataset (CSV format, 45,000 records)
│
├── models/
│   ├── placement_prediction_model.pkl   # Best trained model
│   ├── label_encoder.pkl                # Label encoders
│   └── charts/                          # Training-time charts
│
├── notebooks/
│   └── placement_prediction.py         # EDA + training notebook script
│
├── app.py                     # 🚀 Main Streamlit application
├── train_model.py             # 🤖 Standalone training pipeline
├── requirements.txt           # 📦 Python dependencies
└── README.md                  # 📋 This file
```

---

## 🚀 How to Run

### Option 1: Streamlit App (Recommended)
```bash
streamlit run app.py
```
Then open your browser at: **http://localhost:8501**

### Option 2: Train Models Separately
```bash
python train_model.py
```
This will:
1. Load and clean the dataset
2. Train all 4 models
3. Print comparison table + classification reports
4. Save the best model to `models/`

### Option 3: Jupyter Notebook
```bash
pip install jupyter
cd notebooks
jupyter notebook placement_prediction.ipynb
```

---

## 📊 Results

> Results may vary slightly based on random seed and system configuration.

| Model | Training Accuracy | Testing Accuracy | Precision | Recall | F1 Score |
|-------|:-----------------:|:----------------:|:---------:|:------:|:--------:|
| Logistic Regression | ~79% | ~79% | ~79% | ~79% | ~79% |
| Decision Tree | ~100% | ~82% | ~82% | ~82% | ~82% |
| **Random Forest** | **~100%** | **~84%** | **~84%** | **~84%** | **~84%** |
| KNN | ~84% | ~80% | ~80% | ~80% | ~80% |

🏆 **Best Model**: Random Forest (highest testing accuracy)

---

## 🖼️ Screenshots

> _Screenshots will appear here after running the application._

| Home Page | Prediction Page |
|-----------|-----------------|
| ![Home](screenshots/home.png) | ![Predict](screenshots/predict.png) |

| Dataset Overview | Model Performance |
|-----------------|-------------------|
| ![Dataset](screenshots/dataset.png) | ![Performance](screenshots/performance.png) |

---

## 🔮 Future Enhancements

- [ ] Hyperparameter tuning with GridSearchCV / Optuna
- [ ] XGBoost and LightGBM integration
- [ ] SHAP explainability for individual predictions
- [ ] REST API endpoint via FastAPI
- [ ] Docker containerization
- [ ] Student recommendation engine
- [ ] Email alert system for at-risk students
- [ ] CI/CD pipeline with GitHub Actions

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**AI-Based Student Placement Prediction System**

Built with ❤️ using **Python • Streamlit • Scikit-learn • Plotly**

---

<div align="center">

⭐ **Star this repository if you found it helpful!** ⭐

</div>
