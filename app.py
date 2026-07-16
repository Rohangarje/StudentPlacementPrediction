"""
AI-Based Student Placement Prediction System
=============================================
Streamlit Web Application  (app.py)

Author: AI-Based Student Placement Prediction System
Launch: streamlit run app.py
"""

# ─── Standard library ─────────────────────────────────────────────────────────
import os
import io
import logging
import warnings
import time
from pathlib import Path

warnings.filterwarnings("ignore")

# ─── Third-party ──────────────────────────────────────────────────────────────
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_PATH   = BASE_DIR / "dataset" / "train.xls"
MODEL_DIR   = BASE_DIR / "models"
MODEL_PATH  = MODEL_DIR / "placement_prediction_model.pkl"
LE_PATH     = MODEL_DIR / "label_encoder.pkl"

TARGET_COL  = "Placement_Status"
ID_COL      = "Student_ID"
CAT_COLS    = ["Gender", "Degree", "Branch"]
RANDOM_STATE = 42
TEST_SIZE    = 0.20

MODELS_DEF = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
    "Decision Tree":       DecisionTreeClassifier(random_state=RANDOM_STATE),
    "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE),
    "KNN":                 KNeighborsClassifier(n_neighbors=5),
}

# ─── Color palette ────────────────────────────────────────────────────────────
PRIMARY   = "#4361EE"
SECONDARY = "#7209B7"
ACCENT    = "#F72585"
SUCCESS   = "#4CAF50"
WARNING   = "#FF6B35"
DARK_BG   = "#0F1117"
CARD_BG   = "#1E2130"


# ══════════════════════════════════════════════════════════════════════════════
#  Page Configuration & CSS Injection
# ══════════════════════════════════════════════════════════════════════════════
def configure_page() -> None:
    st.set_page_config(
        page_title="Student Placement Predictor",
        page_icon="🎓",
        layout="wide",
        initial_sidebar_state="collapsed",
    )

    st.markdown(
        """
        <style>
        /* ── imports ── */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* ── root theme ── */
        :root {
            --primary: #4361EE;
            --secondary: #7209B7;
            --accent: #F72585;
            --success: #4CAF50;
            --warning: #FF6B35;
            --dark-bg: #0F1117;
            --card-bg: #1E2130;
            --text: #E2E8F0;
            --text-muted: #94A3B8;
        }

        /* ── global ── */
        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif !important;
            background-color: var(--dark-bg);
            color: var(--text);
        }

        /* ── hide sidebar toggle & sidebar entirely ── */
        section[data-testid="stSidebar"],
        button[data-testid="collapsedControl"],
        div[data-testid="stSidebarCollapseButton"] {
            display: none !important;
        }

        /* ── hide Streamlit's own top toolbar / header ── */
        header[data-testid="stHeader"],
        div[data-testid="stToolbar"],
        #stDecoration {
            display: none !important;
        }

        /* ── main background — extra top padding for topnav ── */
        .main .block-container {
            padding-top: 5rem !important;
            padding-bottom: 2rem !important;
            max-width: 1400px;
        }

        /* ══ TOP NAVIGATION BAR ══════════════════════════════════════ */
        .topnav {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 999999;
            background: linear-gradient(90deg, #0D1B3E 0%, #130828 50%, #0D1B3E 100%);
            border-bottom: 1px solid rgba(67,97,238,0.35);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            padding: 0 2.5rem;
            height: 62px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        }
        .topnav-brand {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            text-decoration: none;
            flex-shrink: 0;
        }
        .topnav-brand-icon { font-size: 1.5rem; }
        .topnav-brand-text {
            font-size: 1rem;
            font-weight: 700;
            background: linear-gradient(135deg, #A5B4FC, #F9A8D4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            white-space: nowrap;
        }
        .topnav-divider {
            width: 1px;
            height: 30px;
            background: rgba(67,97,238,0.35);
            margin: 0 1.5rem;
            flex-shrink: 0;
        }
        .topnav-links {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            flex: 1;
        }
        .topnav-link {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.45rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            color: #94A3B8;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s ease;
            text-decoration: none;
            white-space: nowrap;
        }
        .topnav-link:hover {
            color: #C4B5FD;
            background: rgba(67,97,238,0.12);
            border-color: rgba(67,97,238,0.25);
        }
        .topnav-link.active {
            color: #fff;
            background: linear-gradient(135deg, #4361EE, #7209B7);
            border-color: transparent;
            box-shadow: 0 2px 12px rgba(67,97,238,0.4);
        }
        .topnav-badge {
            margin-left: auto;
            flex-shrink: 0;
            background: rgba(67,97,238,0.15);
            border: 1px solid rgba(67,97,238,0.3);
            border-radius: 20px;
            padding: 0.2rem 0.8rem;
            font-size: 0.72rem;
            color: #A5B4FC;
            white-space: nowrap;
        }

        /* ── metric cards ── */
        .metric-card {
            background: linear-gradient(135deg, #1E2130 0%, #252A3A 100%);
            border: 1px solid rgba(67, 97, 238, 0.25);
            border-radius: 16px;
            padding: 1.4rem 1.6rem;
            text-align: center;
            transition: transform .25s ease, box-shadow .25s ease;
        }
        .metric-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(67, 97, 238, 0.35);
        }
        .metric-card h3 { font-size: 2rem; font-weight: 800; margin: 0; }
        .metric-card p  { font-size: 0.82rem; color: var(--text-muted); margin: 0; letter-spacing: .05em; text-transform: uppercase; }

        /* ── section header ── */
        .section-header {
            background: linear-gradient(135deg, rgba(67,97,238,.15) 0%, rgba(114,9,183,.15) 100%);
            border-left: 4px solid var(--primary);
            border-radius: 0 12px 12px 0;
            padding: .75rem 1.25rem;
            margin: 1.5rem 0 1rem 0;
        }
        .section-header h2 { margin: 0; font-size: 1.35rem; font-weight: 700; color: #A5B4FC; }
        .section-header p  { margin: .2rem 0 0 0; font-size: .82rem; color: var(--text-muted); }

        /* ── page hero ── */
        .hero-banner {
            background: linear-gradient(135deg, #0D1B3E 0%, #1A0533 50%, #0F1117 100%);
            border: 1px solid rgba(67,97,238,.3);
            border-radius: 20px;
            padding: 2.5rem 2rem;
            text-align: center;
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
        }
        .hero-banner::before {
            content: '';
            position: absolute; inset: 0;
            background: radial-gradient(circle at 30% 50%, rgba(67,97,238,.15) 0%, transparent 60%),
                        radial-gradient(circle at 70% 50%, rgba(247,37,133,.12) 0%, transparent 60%);
        }
        .hero-banner h1 {
            font-size: 2.4rem; font-weight: 800;
            background: linear-gradient(135deg, #A5B4FC, #F9A8D4);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin: 0;
        }
        .hero-banner p { font-size: 1rem; color: var(--text-muted); margin: .6rem 0 0; }

        /* ── predict result card ── */
        .result-placed {
            background: linear-gradient(135deg, rgba(76,175,80,.18) 0%, rgba(67,97,238,.1) 100%);
            border: 2px solid #4CAF50;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            animation: fadeIn .5s ease;
        }
        .result-not-placed {
            background: linear-gradient(135deg, rgba(255,107,53,.18) 0%, rgba(247,37,133,.1) 100%);
            border: 2px solid #FF6B35;
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            animation: fadeIn .5s ease;
        }
        .result-placed h2, .result-not-placed h2 {
            font-size: 2rem; font-weight: 800; margin: .5rem 0;
        }
        .result-placed h2   { color: #4CAF50; }
        .result-not-placed h2 { color: #FF6B35; }

        /* ── probability ring ── */
        .prob-circle {
            width: 130px; height: 130px; border-radius: 50%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            margin: 1rem auto;
            font-size: 1.7rem; font-weight: 800;
        }
        .prob-high { background: conic-gradient(#4CAF50 var(--p), #1E2130 0); color: #4CAF50; }
        .prob-low  { background: conic-gradient(#FF6B35 var(--p), #1E2130 0); color: #FF6B35; }

        /* ── data table styling ── */
        .dataframe { border-radius: 12px !important; overflow: hidden !important; }

        /* ── animations ── */
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

        /* ── tab styling ── */
        div[data-baseweb="tab-list"] { gap: 0.5rem; }
        div[data-baseweb="tab"] {
            background: rgba(67,97,238,.12) !important;
            border-radius: 8px !important;
            border: 1px solid rgba(67,97,238,.25) !important;
            color: #A5B4FC !important;
            padding: 0.4rem 1rem !important;
        }
        div[aria-selected="true"] {
            background: var(--primary) !important;
            color: white !important;
        }

        /* ── buttons ── */
        div.stButton > button {
            background: linear-gradient(135deg, #4361EE, #7209B7) !important;
            color: white !important;
            border: none !important;
            border-radius: 10px !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            padding: 0.65rem 2rem !important;
            transition: all .25s ease !important;
        }
        div.stButton > button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(67,97,238,.45) !important;
        }

        /* ── scrollbar ── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1E2130; }
        ::-webkit-scrollbar-thumb { background: #4361EE; border-radius: 3px; }
        </style>
        """,
        unsafe_allow_html=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  Data Helpers  (cached for performance)
# ══════════════════════════════════════════════════════════════════════════════
@st.cache_data(show_spinner=False)
def load_raw_data() -> pd.DataFrame:
    """Load the raw dataset (CSV with .xls extension)."""
    return pd.read_csv(DATA_PATH)


@st.cache_data(show_spinner=False)
def prepare_processed_data(df_raw: pd.DataFrame):
    """Clean, encode, and split the data; return all structures."""
    df = df_raw.copy()
    if ID_COL in df.columns:
        df.drop(columns=[ID_COL], inplace=True)
    df.drop_duplicates(inplace=True)
    for col in df.columns:
        if df[col].isnull().any():
            if df[col].dtype == "object":
                df[col].fillna(df[col].mode()[0], inplace=True)
            else:
                df[col].fillna(df[col].median(), inplace=True)

    label_encoders = {}
    for col in CAT_COLS + [TARGET_COL]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    return df, X_train, X_test, y_train, y_test, label_encoders, X.columns.tolist()


@st.cache_resource(show_spinner=False)
def train_all_models(X_train, X_test, y_train, y_test):
    """Train every model and collect metrics; return dict + dataframe."""
    results, trained = [], {}
    for name, model in MODELS_DEF.items():
        model.fit(X_train, y_train)
        trained[name] = model
        y_pred = model.predict(X_test)
        results.append(
            {
                "Model":             name,
                "Training Accuracy": round(accuracy_score(y_train, model.predict(X_train)) * 100, 2),
                "Testing Accuracy":  round(accuracy_score(y_test, y_pred)                 * 100, 2),
                "Precision":         round(precision_score(y_test, y_pred, average="weighted", zero_division=0) * 100, 2),
                "Recall":            round(recall_score(y_test, y_pred, average="weighted", zero_division=0)    * 100, 2),
                "F1 Score":          round(f1_score(y_test, y_pred, average="weighted", zero_division=0)        * 100, 2),
            }
        )
    results_df = pd.DataFrame(results)
    best_name  = results_df.loc[results_df["Testing Accuracy"].idxmax(), "Model"]
    return trained, results_df, best_name


def load_or_train_models():
    """Load pre-trained artifacts if they exist, otherwise train from scratch."""
    raw_df = load_raw_data()
    df_proc, X_train, X_test, y_train, y_test, label_encoders, feature_cols = prepare_processed_data(raw_df)
    trained_models, results_df, best_name = train_all_models(
        X_train.values, X_test.values, y_train.values, y_test.values
    )
    return raw_df, df_proc, X_train, X_test, y_train, y_test, label_encoders, feature_cols, trained_models, results_df, best_name


# ══════════════════════════════════════════════════════════════════════════════
#  Top Navigation Bar
# ══════════════════════════════════════════════════════════════════════════════

# Map query-param value → display info
NAV_PAGES = [
    ("Home",        "🏠", "Home"),
    ("Predict",     "🔮", "Predict"),
    ("Dataset",     "📊", "Dataset"),
    ("Performance", "📈", "Performance"),
    ("About",       "ℹ️",  "About"),
]


def render_topnav() -> str:
    """Render a sticky top navigation bar and return the active page key."""
    # Read current page from query params (default = Home)
    params      = st.query_params
    active_page = params.get("page", "Home")

    # Build nav-link HTML for each page
    links_html = ""
    for key, icon, label in NAV_PAGES:
        active_cls = "active" if key == active_page else ""
        # Each link sets ?page=<key> on click via JavaScript + Streamlit re-run
        links_html += (
            f"<a class='topnav-link {active_cls}' "
            f"href='?page={key}' target='_self'>"
            f"{icon}&nbsp;{label}</a>"
        )

    st.markdown(
        f"""
        <div class='topnav'>
            <div class='topnav-brand'>
                <span class='topnav-brand-icon'>🎓</span>
                <span class='topnav-brand-text'>Placement Predictor</span>
            </div>
            <div class='topnav-divider'></div>
            <div class='topnav-links'>{links_html}</div>
            <div class='topnav-badge'>AI-Powered &nbsp;|&nbsp; Scikit-learn</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    return active_page


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE: Home
# ══════════════════════════════════════════════════════════════════════════════
def page_home(raw_df, results_df, best_name):
    st.markdown(
        """
        <div class='hero-banner'>
            <h1>🎓 AI-Based Student Placement Prediction</h1>
            <p>Harness the power of Machine Learning to predict student placement outcomes with precision & confidence</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── KPI Cards ──
    placed_count     = int((raw_df[TARGET_COL] == "Placed").sum())
    not_placed_count = int((raw_df[TARGET_COL] == "Not Placed").sum())
    placement_rate   = round(placed_count / len(raw_df) * 100, 1)
    best_acc         = results_df["Testing Accuracy"].max()

    c1, c2, c3, c4 = st.columns(4)
    cards = [
        (c1, f"{len(raw_df):,}",          "Total Students",       "#4361EE"),
        (c2, f"{placed_count:,}",          "Students Placed",      "#4CAF50"),
        (c3, f"{placement_rate}%",         "Placement Rate",       "#F72585"),
        (c4, f"{best_acc:.1f}%",           "Best Model Accuracy",  "#FF6B35"),
    ]
    for col, val, label, color in cards:
        with col:
            st.markdown(
                f"""<div class='metric-card'>
                        <h3 style='color:{color};'>{val}</h3>
                        <p>{label}</p>
                    </div>""",
                unsafe_allow_html=True,
            )

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Two column charts ──
    col_l, col_r = st.columns(2)
    with col_l:
        st.markdown("<div class='section-header'><h2>📊 Class Distribution</h2></div>", unsafe_allow_html=True)
        counts = raw_df[TARGET_COL].value_counts()
        fig = go.Figure(go.Pie(
            labels=counts.index,
            values=counts.values,
            hole=0.55,
            marker=dict(colors=["#4CAF50", "#FF6B35"], line=dict(color="#0F1117", width=2)),
            textinfo="label+percent",
        ))
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0"), showlegend=True,
            legend=dict(font=dict(color="#E2E8F0")),
            margin=dict(t=20, b=20, l=20, r=20),
        )
        st.plotly_chart(fig, width='stretch')

    with col_r:
        st.markdown("<div class='section-header'><h2>📚 Branch-wise Placement</h2></div>", unsafe_allow_html=True)
        branch_df = raw_df.groupby(["Branch", TARGET_COL]).size().reset_index(name="Count")
        fig = px.bar(
            branch_df, x="Branch", y="Count", color=TARGET_COL,
            color_discrete_map={"Placed": "#4CAF50", "Not Placed": "#FF6B35"},
            barmode="group",
        )
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0"),
            legend=dict(font=dict(color="#E2E8F0")),
            xaxis=dict(gridcolor="rgba(255,255,255,.05)"),
            yaxis=dict(gridcolor="rgba(255,255,255,.05)"),
            margin=dict(t=20, b=20, l=20, r=20),
        )
        st.plotly_chart(fig, width='stretch')

    # ── CGPA Distribution ──
    st.markdown("<div class='section-header'><h2>📈 CGPA Distribution by Placement</h2></div>", unsafe_allow_html=True)
    fig = px.histogram(
        raw_df, x="CGPA", color=TARGET_COL, nbins=40, barmode="overlay", opacity=0.75,
        color_discrete_map={"Placed": "#4361EE", "Not Placed": "#F72585"},
    )
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#E2E8F0"),
        legend=dict(font=dict(color="#E2E8F0")),
        xaxis=dict(gridcolor="rgba(255,255,255,.05)"),
        yaxis=dict(gridcolor="rgba(255,255,255,.05)"),
        margin=dict(t=20, b=20, l=20, r=20),
    )
    st.plotly_chart(fig, width='stretch')

    # ── Best model banner ──
    st.markdown(
        f"""
        <div style='
            background: linear-gradient(135deg, rgba(67,97,238,.2), rgba(247,37,133,.15));
            border: 1px solid rgba(67,97,238,.4); border-radius:16px;
            padding:1.2rem 2rem; text-align:center; margin-top:1rem;
        '>
            <p style='color:#94A3B8; margin:0; font-size:.85rem;'>🏆&nbsp; BEST PERFORMING MODEL</p>
            <h2 style='color:#A5B4FC; margin:.3rem 0 0; font-size:1.6rem;'>{best_name}</h2>
            <p style='color:#64748B; margin:.2rem 0 0; font-size:.8rem;'>Testing Accuracy: {best_acc:.2f}%</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE: Predict Placement
# ══════════════════════════════════════════════════════════════════════════════
def page_predict(trained_models, results_df, best_name, label_encoders, feature_cols):
    st.markdown(
        "<div class='hero-banner'><h1>🔮 Predict Placement</h1>"
        "<p>Enter student details to get an instant placement prediction with confidence score</p></div>",
        unsafe_allow_html=True,
    )

    predict_tab, batch_tab = st.tabs(["🧑‍🎓  Single Student", "📁  Batch Prediction (CSV)"])

    best_model = trained_models[best_name]

    # ── SINGLE PREDICTION ──
    with predict_tab:
        st.markdown("<div class='section-header'><h2>Student Information</h2><p>Fill in all fields below</p></div>", unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        with col1:
            age         = st.number_input("Age", min_value=18, max_value=30, value=21, step=1)
            gender      = st.selectbox("Gender", ["Male", "Female"])
            degree      = st.selectbox("Degree", ["B.Tech", "B.E.", "B.Sc", "BCA", "MCA"])
            branch      = st.selectbox("Branch", ["CSE", "ECE", "ME", "Civil", "IT"])
            cgpa        = st.slider("CGPA", min_value=4.0, max_value=10.0, value=7.5, step=0.01, format="%.2f")

        with col2:
            internships  = st.number_input("Internships",  min_value=0, max_value=5,  value=1, step=1)
            projects     = st.number_input("Projects",     min_value=0, max_value=10, value=3, step=1)
            coding       = st.slider("Coding Skills",       min_value=1, max_value=10, value=6)
            communication = st.slider("Communication Skills", min_value=1, max_value=10, value=7)
            aptitude     = st.number_input("Aptitude Test Score", min_value=0, max_value=100, value=65, step=1)

        with col3:
            soft_skills    = st.slider("Soft Skills Rating",  min_value=1, max_value=10, value=7)
            certifications = st.number_input("Certifications", min_value=0, max_value=5, value=2, step=1)
            backlogs       = st.number_input("Backlogs",       min_value=0, max_value=5, value=0, step=1)
            model_choice   = st.selectbox("Select Model", list(trained_models.keys()), index=list(trained_models.keys()).index(best_name))

        st.markdown("<br>", unsafe_allow_html=True)
        predict_btn = st.button("🔮 Predict Placement", width='stretch')

        if predict_btn:
            with st.spinner("Analyzing student profile…"):
                time.sleep(0.6)

            # ── Encode inputs ──
            g_enc  = label_encoders["Gender"].transform([gender])[0]
            # B.E. is equivalent to B.Tech — map it before encoding
            degree_for_model = "B.Tech" if degree == "B.E." else degree
            d_enc  = label_encoders["Degree"].transform([degree_for_model])[0]
            br_enc = label_encoders["Branch"].transform([branch])[0]

            input_data = pd.DataFrame(
                [[age, g_enc, d_enc, br_enc, cgpa, internships, projects,
                  coding, communication, aptitude, soft_skills, certifications, backlogs]],
                columns=feature_cols,
            )

            chosen_model = trained_models[model_choice]
            prediction   = chosen_model.predict(input_data)[0]
            proba        = chosen_model.predict_proba(input_data)[0]

            # Map label back
            result_label = label_encoders[TARGET_COL].inverse_transform([prediction])[0]
            placed_idx   = list(label_encoders[TARGET_COL].classes_).index("Placed")
            placement_prob = proba[placed_idx] * 100

            # ── Result display ──
            st.markdown("<br>", unsafe_allow_html=True)
            res_class = "result-placed" if result_label == "Placed" else "result-not-placed"
            emoji     = "✅" if result_label == "Placed" else "❌"
            tip       = "Congratulations! High placement probability." if result_label == "Placed" else "Consider improving skills to boost placement chances."

            st.markdown(
                f"""
                <div class='{res_class}'>
                    <div style='font-size:3rem;'>{emoji}</div>
                    <h2>{result_label}</h2>
                    <p style='color:#94A3B8;font-size:.9rem;'>{tip}</p>
                    <div style='margin-top:1rem;'>
                        <p style='color:#94A3B8;font-size:.8rem;margin-bottom:.3rem;'>PLACEMENT PROBABILITY</p>
                        <div style='font-size:3rem;font-weight:800;
                            color:{"#4CAF50" if result_label=="Placed" else "#FF6B35"};'>
                            {placement_prob:.2f}%
                        </div>
                    </div>
                    <p style='color:#64748B;font-size:.75rem;margin-top:.8rem;'>Model: {model_choice}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # ── Probability gauge ──
            st.markdown("<br>", unsafe_allow_html=True)
            gauge = go.Figure(go.Indicator(
                mode="gauge+number+delta",
                value=placement_prob,
                number={"suffix": "%", "font": {"color": "#E2E8F0", "size": 36}},
                gauge={
                    "axis": {"range": [0, 100], "tickcolor": "#94A3B8"},
                    "bar":  {"color": "#4CAF50" if result_label == "Placed" else "#FF6B35"},
                    "bgcolor": "#1E2130",
                    "steps": [
                        {"range": [0, 40],  "color": "rgba(255,107,53,.15)"},
                        {"range": [40, 70], "color": "rgba(255,193,7,.1)"},
                        {"range": [70, 100],"color": "rgba(76,175,80,.15)"},
                    ],
                    "threshold": {"line": {"color": "#F72585", "width": 3}, "thickness": .8, "value": 50},
                },
                title={"text": "Placement Probability Gauge", "font": {"color": "#A5B4FC", "size": 16}},
            ))
            gauge.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#E2E8F0"),
                height=280,
            )
            st.plotly_chart(gauge, width='stretch')

            # ── All probabilities ──
            all_probs = {label_encoders[TARGET_COL].classes_[i]: round(p * 100, 2) for i, p in enumerate(proba)}
            st.markdown("**Class Probabilities:**")
            prob_cols = st.columns(len(all_probs))
            for idx, (lbl, prob) in enumerate(all_probs.items()):
                clr = "#4CAF50" if lbl == "Placed" else "#FF6B35"
                with prob_cols[idx]:
                    st.markdown(
                        f"<div style='background:rgba(30,33,48,.8);border:1px solid {clr}44;"
                        f"border-radius:12px;padding:.8rem;text-align:center;'>"
                        f"<h3 style='color:{clr};margin:0;'>{prob:.2f}%</h3>"
                        f"<p style='color:#94A3B8;margin:0;font-size:.8rem;'>{lbl}</p></div>",
                        unsafe_allow_html=True,
                    )

    # ── BATCH PREDICTION ──
    with batch_tab:
        st.markdown("<div class='section-header'><h2>Batch Prediction</h2><p>Upload a CSV to predict for multiple students at once</p></div>", unsafe_allow_html=True)

        template_cols = [
            "Age","Gender","Degree","Branch","CGPA","Internships","Projects",
            "Coding_Skills","Communication_Skills","Aptitude_Test_Score",
            "Soft_Skills_Rating","Certifications","Backlogs",
        ]
        template_df = pd.DataFrame(columns=template_cols)
        csv_template = template_df.to_csv(index=False)
        st.download_button(
            "⬇️ Download CSV Template",
            data=csv_template,
            file_name="batch_template.csv",
            mime="text/csv",
        )

        uploaded = st.file_uploader("Upload CSV for Batch Prediction", type=["csv"])
        if uploaded:
            try:
                batch_df = pd.read_csv(uploaded)
                st.success(f"Loaded {len(batch_df)} rows.")
                st.dataframe(batch_df.head(), width='stretch')

                if st.button("🚀 Run Batch Prediction"):
                    with st.spinner("Processing…"):
                        df_enc = batch_df.copy()
                        for col in ["Gender", "Degree", "Branch"]:
                            if col in df_enc.columns:
                                df_enc[col] = label_encoders[col].transform(df_enc[col].astype(str))
                        X_batch = df_enc[feature_cols]
                        preds   = best_model.predict(X_batch)
                        probas  = best_model.predict_proba(X_batch)[:, placed_idx if 'placed_idx' in dir() else 1]
                        batch_df["Prediction"]           = label_encoders[TARGET_COL].inverse_transform(preds)
                        batch_df["Placement_Probability"] = (probas * 100).round(2)
                    st.success("Batch prediction complete!")
                    st.dataframe(batch_df, width='stretch')
                    csv_out = batch_df.to_csv(index=False)
                    st.download_button("⬇️ Download Results", data=csv_out, file_name="batch_predictions.csv", mime="text/csv")
            except Exception as e:
                st.error(f"Error processing file: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE: Dataset Overview
# ══════════════════════════════════════════════════════════════════════════════
def page_dataset(raw_df, df_proc, label_encoders):
    st.markdown(
        "<div class='hero-banner'><h1>📊 Dataset Overview</h1>"
        "<p>Exploring 45,000 student records across 15 academic & skill features</p></div>",
        unsafe_allow_html=True,
    )

    tab1, tab2, tab3, tab4 = st.tabs(["🗃️ Raw Data", "📋 Statistics", "🔥 Correlations", "📊 Feature Analysis"])

    with tab1:
        st.markdown("<div class='section-header'><h2>Raw Dataset Preview</h2></div>", unsafe_allow_html=True)
        c1, c2, c3 = st.columns(3)
        c1.metric("Total Records",  f"{len(raw_df):,}")
        c2.metric("Features",       f"{raw_df.shape[1] - 1}")
        c3.metric("Missing Values", f"{raw_df.isnull().sum().sum()}")
        st.dataframe(raw_df.head(100), width='stretch', height=400)

        # ── Missing values bar ──
        missing = raw_df.isnull().sum()
        if missing.any():
            fig = px.bar(x=missing.index, y=missing.values, title="Missing Values per Column",
                         color=missing.values, color_continuous_scale="Blues")
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"))
            st.plotly_chart(fig, width='stretch')
        else:
            st.success("✅ No missing values detected in the dataset!")

    with tab2:
        st.markdown("<div class='section-header'><h2>Descriptive Statistics</h2></div>", unsafe_allow_html=True)
        st.dataframe(raw_df.describe().round(2), width='stretch')
        st.markdown("**Data Types:**")
        dtype_df = pd.DataFrame({"Column": raw_df.dtypes.index, "Type": raw_df.dtypes.astype(str).values})
        st.dataframe(dtype_df, width='stretch')

    with tab3:
        st.markdown("<div class='section-header'><h2>Correlation Heatmap</h2></div>", unsafe_allow_html=True)
        num_cols = df_proc.select_dtypes(include=np.number).columns.tolist()
        corr     = df_proc[num_cols].corr()
        fig = px.imshow(
            corr, text_auto=".2f", aspect="auto",
            color_continuous_scale="RdBu_r", zmin=-1, zmax=1,
            title="Feature Correlation Matrix",
        )
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"),
            coloraxis_colorbar=dict(tickfont=dict(color="#E2E8F0"), title=dict(font=dict(color="#E2E8F0"))),
            height=600,
        )
        st.plotly_chart(fig, width='stretch')

    with tab4:
        st.markdown("<div class='section-header'><h2>Feature Analysis</h2></div>", unsafe_allow_html=True)
        num_features = ["CGPA", "Coding_Skills", "Communication_Skills",
                        "Aptitude_Test_Score", "Soft_Skills_Rating", "Age"]
        selected_feat = st.selectbox("Select Feature", num_features)
        col_l, col_r = st.columns(2)
        with col_l:
            fig = px.box(raw_df, x=TARGET_COL, y=selected_feat, color=TARGET_COL,
                         color_discrete_map={"Placed": "#4CAF50", "Not Placed": "#FF6B35"},
                         title=f"{selected_feat} by Placement Status")
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"))
            st.plotly_chart(fig, width='stretch')
        with col_r:
            fig = px.violin(raw_df, x=TARGET_COL, y=selected_feat, color=TARGET_COL, box=True,
                            color_discrete_map={"Placed": "#4361EE", "Not Placed": "#F72585"},
                            title=f"{selected_feat} Distribution")
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"))
            st.plotly_chart(fig, width='stretch')

        # ── Categorical breakdown ──
        st.markdown("**Categorical Feature Breakdown:**")
        cat_feat  = st.selectbox("Select Categorical Feature", ["Gender", "Degree", "Branch"])
        cat_group = raw_df.groupby([cat_feat, TARGET_COL]).size().reset_index(name="Count")
        fig = px.bar(cat_group, x=cat_feat, y="Count", color=TARGET_COL, barmode="group",
                     color_discrete_map={"Placed": "#4CAF50", "Not Placed": "#FF6B35"},
                     title=f"{cat_feat} vs Placement Status")
        fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"))
        st.plotly_chart(fig, width='stretch')


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE: Model Performance
# ══════════════════════════════════════════════════════════════════════════════
def page_performance(trained_models, results_df, best_name, X_test, y_test, label_encoders, feature_cols):
    st.markdown(
        "<div class='hero-banner'><h1>📈 Model Performance</h1>"
        "<p>Detailed comparison of all ML models with interactive charts</p></div>",
        unsafe_allow_html=True,
    )

    # ── Summary metric cards ──
    best_row = results_df[results_df["Model"] == best_name].iloc[0]
    c1, c2, c3, c4, c5 = st.columns(5)
    for col, label, val, color in [
        (c1, "Best Model",        best_name,                               "#4361EE"),
        (c2, "Test Accuracy",     f"{best_row['Testing Accuracy']:.2f}%",  "#4CAF50"),
        (c3, "Precision",         f"{best_row['Precision']:.2f}%",         "#7209B7"),
        (c4, "Recall",            f"{best_row['Recall']:.2f}%",            "#F72585"),
        (c5, "F1 Score",          f"{best_row['F1 Score']:.2f}%",          "#FF6B35"),
    ]:
        with col:
            st.markdown(
                f"<div class='metric-card'><h3 style='color:{color};font-size:1.3rem;'>{val}</h3><p>{label}</p></div>",
                unsafe_allow_html=True,
            )

    st.markdown("<br>", unsafe_allow_html=True)

    tab1, tab2, tab3, tab4 = st.tabs(["📊 Comparison Table", "📈 Accuracy Charts", "🔲 Confusion Matrix", "⭐ Feature Importance"])

    with tab1:
        st.markdown("<div class='section-header'><h2>Model Comparison Table</h2></div>", unsafe_allow_html=True)

        styled = results_df.copy()
        st.dataframe(
            styled.style.highlight_max(
                subset=["Testing Accuracy", "Precision", "Recall", "F1 Score"],
                color="#1A3A1A",
            ).format("{:.2f}", subset=["Training Accuracy","Testing Accuracy","Precision","Recall","F1 Score"]),
            width='stretch',
            height=220,
        )

        # ── Radar chart ──
        categories = ["Testing Accuracy", "Precision", "Recall", "F1 Score"]
        fig = go.Figure()
        colors = ["#4361EE", "#7209B7", "#F72585", "#FF6B35"]
        for i, row in results_df.iterrows():
            vals = [row[c] for c in categories] + [row[categories[0]]]
            fig.add_trace(go.Scatterpolar(
                r=vals, theta=categories + [categories[0]],
                fill="toself", name=row["Model"],
                line=dict(color=colors[i % len(colors)]),
                fillcolor=["rgba(67,97,238,0.15)","rgba(114,9,183,0.15)","rgba(247,37,133,0.15)","rgba(255,107,53,0.15)"][i % 4],
            ))
        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[50, 100], color="#94A3B8")),
            showlegend=True,
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0"),
            title="Model Radar — Key Metrics",
            height=420,
        )
        st.plotly_chart(fig, width='stretch')

    with tab2:
        c_l, c_r = st.columns(2)
        with c_l:
            fig = px.bar(
                results_df, x="Model", y="Testing Accuracy", color="Model",
                color_discrete_sequence=["#4361EE","#7209B7","#F72585","#FF6B35"],
                title="Testing Accuracy Comparison",
            )
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"), showlegend=False)
            fig.update_traces(texttemplate="%{y:.2f}%", textposition="outside")
            st.plotly_chart(fig, width='stretch')

        with c_r:
            fig = go.Figure()
            for m, color in zip(results_df["Model"], ["#4361EE","#7209B7","#F72585","#FF6B35"]):
                row = results_df[results_df["Model"] == m].iloc[0]
                fig.add_trace(go.Bar(
                    name=m, x=["Train Acc", "Test Acc"],
                    y=[row["Training Accuracy"], row["Testing Accuracy"]],
                    marker_color=color,
                ))
            fig.update_layout(
                barmode="group", title="Train vs Test Accuracy",
                paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#E2E8F0"),
                legend=dict(font=dict(color="#E2E8F0")),
            )
            st.plotly_chart(fig, width='stretch')

        # ── Full metrics grouped bar ──
        metrics = ["Precision", "Recall", "F1 Score"]
        fig = go.Figure()
        for m, color in zip(results_df["Model"], ["#4361EE","#7209B7","#F72585","#FF6B35"]):
            row = results_df[results_df["Model"] == m].iloc[0]
            fig.add_trace(go.Bar(name=m, x=metrics, y=[row[metric] for metric in metrics], marker_color=color))
        fig.update_layout(
            barmode="group", title="Precision / Recall / F1 Comparison",
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0"),
            legend=dict(font=dict(color="#E2E8F0")),
        )
        st.plotly_chart(fig, width='stretch')

    with tab3:
        st.markdown("<div class='section-header'><h2>Confusion Matrix</h2></div>", unsafe_allow_html=True)
        cm_model = st.selectbox("Select model", list(trained_models.keys()))
        chosen   = trained_models[cm_model]
        y_pred   = chosen.predict(X_test)
        cm       = confusion_matrix(y_test, y_pred)
        class_names = label_encoders[TARGET_COL].classes_

        fig = px.imshow(
            cm, text_auto=True, x=class_names, y=class_names,
            color_continuous_scale="Blues",
            labels=dict(x="Predicted", y="Actual"),
            title=f"Confusion Matrix — {cm_model}",
        )
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"),
            coloraxis_colorbar=dict(tickfont=dict(color="#E2E8F0")),
            height=420,
        )
        st.plotly_chart(fig, width='stretch')

        st.markdown("**Classification Report:**")
        cr = classification_report(y_test, y_pred, target_names=class_names, output_dict=True)
        cr_df = pd.DataFrame(cr).T.round(4)
        st.dataframe(cr_df, width='stretch')

    with tab4:
        st.markdown("<div class='section-header'><h2>Feature Importance</h2></div>", unsafe_allow_html=True)
        fi_models = {k: v for k, v in trained_models.items() if hasattr(v, "feature_importances_")}
        if fi_models:
            fi_choice = st.selectbox("Select tree-based model", list(fi_models.keys()))
            importances = fi_models[fi_choice].feature_importances_
            fi_df = pd.DataFrame({"Feature": feature_cols, "Importance": importances}).sort_values("Importance", ascending=False)
            fig = px.bar(fi_df, x="Importance", y="Feature", orientation="h",
                         color="Importance", color_continuous_scale="Purples",
                         title=f"Feature Importance — {fi_choice}")
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"), height=450)
            st.plotly_chart(fig, width='stretch')
        else:
            st.info("Feature importance is available for tree-based models (Decision Tree, Random Forest).")

        # ── Logistic Regression coefficients ──
        if "Logistic Regression" in trained_models:
            lr = trained_models["Logistic Regression"]
            coef_df = pd.DataFrame({"Feature": feature_cols, "Coefficient": lr.coef_[0]}).sort_values("Coefficient", ascending=False)
            fig = px.bar(coef_df, x="Coefficient", y="Feature", orientation="h",
                         color="Coefficient", color_continuous_scale="RdBu",
                         title="Logistic Regression Coefficients")
            fig.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", font=dict(color="#E2E8F0"), height=420)
            st.plotly_chart(fig, width='stretch')


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE: About Project
# ══════════════════════════════════════════════════════════════════════════════
def page_about():
    st.markdown(
        "<div class='hero-banner'><h1>ℹ️ About Project</h1>"
        "<p>Learn about the system, methodology, and the team behind it</p></div>",
        unsafe_allow_html=True,
    )

    col_l, col_r = st.columns([2, 1])

    with col_l:
        st.markdown(
            """
            <div class='section-header'><h2>🎯 Project Overview</h2></div>

            <p style='color:#CBD5E1;line-height:1.8;'>
            The <strong style='color:#A5B4FC;'>AI-Based Student Placement Prediction System</strong>
            is a production-grade machine learning application that leverages supervised learning
            to predict whether a student will be placed during campus recruitment drives.
            </p>

            <div class='section-header'><h2>📌 Problem Statement</h2></div>
            <p style='color:#CBD5E1;line-height:1.8;'>
            Campus placements are a critical milestone for engineering students. Universities need
            early insights into which students may struggle, so targeted interventions (skill training,
            mock interviews, mentoring) can be applied in time. This system provides data-driven
            placement predictions based on academic performance and soft-skill ratings.
            </p>

            <div class='section-header'><h2>🎯 Objectives</h2></div>
            <ul style='color:#CBD5E1;line-height:2;'>
                <li>Develop a robust multi-model ML pipeline for binary classification</li>
                <li>Automatically benchmark and select the best-performing algorithm</li>
                <li>Provide an intuitive Streamlit dashboard for end-users</li>
                <li>Enable both single and batch prediction workflows</li>
                <li>Visualize model performance and feature importance interactively</li>
            </ul>
            """,
            unsafe_allow_html=True,
        )

    with col_r:
        st.markdown(
            """
            <div style='background:linear-gradient(135deg,rgba(67,97,238,.15),rgba(114,9,183,.15));
                        border:1px solid rgba(67,97,238,.3);border-radius:16px;padding:1.5rem;'>
                <h3 style='color:#A5B4FC;font-size:1rem;margin-top:0;'>🛠️ Tech Stack</h3>
                <ul style='color:#CBD5E1;font-size:.85rem;line-height:2;list-style:none;padding:0;'>
                    <li>🐍 Python 3.12+</li>
                    <li>🌊 Streamlit 1.28+</li>
                    <li>🤖 Scikit-learn 1.3+</li>
                    <li>📊 Pandas 2.0+</li>
                    <li>🔢 NumPy 1.24+</li>
                    <li>📉 Matplotlib / Seaborn</li>
                    <li>📈 Plotly 5.15+</li>
                    <li>💾 Joblib 1.3+</li>
                </ul>
            </div>
            <br>
            <div style='background:linear-gradient(135deg,rgba(247,37,133,.12),rgba(255,107,53,.1));
                        border:1px solid rgba(247,37,133,.3);border-radius:16px;padding:1.5rem;'>
                <h3 style='color:#F9A8D4;font-size:1rem;margin-top:0;'>🤖 ML Models</h3>
                <ul style='color:#CBD5E1;font-size:.85rem;line-height:2;list-style:none;padding:0;'>
                    <li>📊 Logistic Regression</li>
                    <li>🌳 Decision Tree</li>
                    <li>🌲 Random Forest</li>
                    <li>🔍 K-Nearest Neighbors</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # ── Dataset description ──
    st.markdown(
        """
        <div class='section-header'><h2>📁 Dataset Description</h2></div>
        """,
        unsafe_allow_html=True,
    )

    features_info = {
        "Age":                   ("int",   "Student age (18–24)"),
        "Gender":                ("str",   "Male / Female"),
        "Degree":                ("str",   "B.Tech / B.Sc / BCA / MCA"),
        "Branch":                ("str",   "CSE / ECE / ME / Civil / IT"),
        "CGPA":                  ("float", "Cumulative GPA (4.0–10.0)"),
        "Internships":           ("int",   "Number of internships completed (0–5)"),
        "Projects":              ("int",   "Number of projects (0–10)"),
        "Coding_Skills":         ("int",   "Self-rated coding ability (1–10)"),
        "Communication_Skills":  ("int",   "Self-rated communication (1–10)"),
        "Aptitude_Test_Score":   ("int",   "Aptitude test score (0–100)"),
        "Soft_Skills_Rating":    ("int",   "Soft skills rating (1–10)"),
        "Certifications":        ("int",   "Number of certifications (0–3)"),
        "Backlogs":              ("int",   "Number of backlogs (0–3)"),
        "Placement_Status":      ("str",   "🎯 Target: Placed / Not Placed"),
    }
    feat_df = pd.DataFrame(
        [(k, v[0], v[1]) for k, v in features_info.items()],
        columns=["Feature", "Type", "Description"],
    )
    st.dataframe(feat_df, width='stretch', hide_index=True)

    # ── Pipeline diagram ──
    st.markdown("<div class='section-header'><h2>⚙️ ML Pipeline</h2></div>", unsafe_allow_html=True)
    steps = ["📂 Load Data", "🧹 Clean Data", "🔤 Label Encode", "✂️ Train/Test Split", "🤖 Train Models", "📊 Evaluate", "🏆 Select Best", "💾 Save Model"]
    cols  = st.columns(len(steps))
    for col, step in zip(cols, steps):
        with col:
            st.markdown(
                f"<div style='background:rgba(67,97,238,.12);border:1px solid rgba(67,97,238,.25);"
                f"border-radius:10px;padding:.7rem .3rem;text-align:center;font-size:.75rem;"
                f"color:#A5B4FC;font-weight:600;'>{step}</div>",
                unsafe_allow_html=True,
            )

    # ── Future enhancements ──
    st.markdown(
        """
        <div class='section-header'><h2>🚀 Future Enhancements</h2></div>
        <div style='display:grid;grid-template-columns:1fr 1fr;gap:1rem;'>
            <div style='background:rgba(30,33,48,.8);border:1px solid rgba(67,97,238,.2);border-radius:12px;padding:1rem;'>
                <h4 style='color:#A5B4FC;margin-top:0;'>🔧 Technical</h4>
                <ul style='color:#CBD5E1;font-size:.85rem;line-height:1.8;'>
                    <li>Hyperparameter tuning with Grid/RandomSearchCV</li>
                    <li>XGBoost / LightGBM integration</li>
                    <li>SHAP explainability layer</li>
                    <li>Cross-validation pipelines</li>
                    <li>REST API via FastAPI</li>
                </ul>
            </div>
            <div style='background:rgba(30,33,48,.8);border:1px solid rgba(247,37,133,.2);border-radius:12px;padding:1rem;'>
                <h4 style='color:#F9A8D4;margin-top:0;'>💡 Features</h4>
                <ul style='color:#CBD5E1;font-size:.85rem;line-height:1.8;'>
                    <li>Student recommendation engine</li>
                    <li>Historical placement trend analytics</li>
                    <li>Resume scoring integration</li>
                    <li>College-level benchmarking</li>
                    <li>Email alerts for at-risk students</li>
                </ul>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  Main Application Entry
# ══════════════════════════════════════════════════════════════════════════════
def main():
    configure_page()

    # ── Top navigation (rendered before spinner so bar is always visible) ──
    page = render_topnav()

    # ── Loading state ──
    with st.spinner("Initializing AI models…"):
        (raw_df, df_proc, X_train, X_test, y_train, y_test,
         label_encoders, feature_cols, trained_models, results_df, best_name) = load_or_train_models()

    # ── Route ──
    if page == "Home":
        page_home(raw_df, results_df, best_name)

    elif page == "Predict":
        page_predict(trained_models, results_df, best_name, label_encoders, feature_cols)

    elif page == "Dataset":
        page_dataset(raw_df, df_proc, label_encoders)

    elif page == "Performance":
        page_performance(trained_models, results_df, best_name, X_test.values, y_test.values, label_encoders, feature_cols)

    elif page == "About":
        page_about()


if __name__ == "__main__":
    main()
