"""
AI-Based Student Placement Prediction System
=============================================
Training Pipeline Module

Author: AI-Based Student Placement Prediction System
Description: Trains, evaluates, and saves the best ML model for placement prediction.
"""

import os
import logging
import warnings
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

warnings.filterwarnings("ignore")

# ─── Logging Configuration ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── Path Constants ─────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "dataset", "train.xls")   # CSV renamed as .xls
MODEL_DIR  = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "placement_prediction_model.pkl")
LE_PATH    = os.path.join(MODEL_DIR, "label_encoder.pkl")

# Target and ID columns
TARGET_COL = "Placement_Status"
ID_COL     = "Student_ID"

# Categorical columns to encode
CAT_COLS = ["Gender", "Degree", "Branch"]

# Random seed for reproducibility
RANDOM_STATE = 42
TEST_SIZE    = 0.20


# ═══════════════════════════════════════════════════════════════════════════════
# DataProcessor
# ═══════════════════════════════════════════════════════════════════════════════
class DataProcessor:
    """Handles all data loading, cleaning, and encoding logic."""

    def __init__(self, data_path: str):
        self.data_path = data_path
        self.label_encoders: dict[str, LabelEncoder] = {}
        self.df_raw: pd.DataFrame | None = None
        self.df_processed: pd.DataFrame | None = None

    # ── Loaders ──────────────────────────────────────────────────────────────
    def load_data(self) -> pd.DataFrame:
        """Load dataset; supports CSV files even with .xls extension."""
        logger.info("Loading dataset from: %s", self.data_path)
        try:
            df = pd.read_csv(self.data_path)
        except Exception:
            df = pd.read_excel(self.data_path)
        logger.info("Dataset loaded — shape: %s", df.shape)
        self.df_raw = df.copy()
        return df

    # ── Cleaning ─────────────────────────────────────────────────────────────
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove duplicates, handle missing values, drop ID column."""
        initial_rows = len(df)

        # Drop Student_ID
        if ID_COL in df.columns:
            df = df.drop(columns=[ID_COL])
            logger.info("Dropped column: %s", ID_COL)

        # Remove duplicates
        df = df.drop_duplicates()
        removed_dupes = initial_rows - len(df)
        if removed_dupes:
            logger.info("Removed %d duplicate rows", removed_dupes)

        # Handle missing values
        missing = df.isnull().sum()
        if missing.any():
            for col in df.columns:
                if df[col].isnull().any():
                    if df[col].dtype == "object":
                        df[col].fillna(df[col].mode()[0], inplace=True)
                    else:
                        df[col].fillna(df[col].median(), inplace=True)
            logger.info("Filled missing values")
        else:
            logger.info("No missing values detected")

        logger.info("Cleaned dataset shape: %s", df.shape)
        return df

    # ── Encoding ─────────────────────────────────────────────────────────────
    def encode_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Label-encode all categorical columns (including target)."""
        all_cat_cols = CAT_COLS + [TARGET_COL]
        for col in all_cat_cols:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
                logger.info("Encoded column '%s' → classes: %s", col, list(le.classes_))
        self.df_processed = df.copy()
        return df

    # ── Split ─────────────────────────────────────────────────────────────────
    def split_data(
        self, df: pd.DataFrame
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Split into train/test (80/20) and return X_train, X_test, y_train, y_test."""
        X = df.drop(columns=[TARGET_COL])
        y = df[TARGET_COL]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )
        logger.info(
            "Train: %d  |  Test: %d", len(X_train), len(X_test)
        )
        return X_train, X_test, y_train, y_test

    def save_encoders(self) -> None:
        """Persist label encoders to disk."""
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.label_encoders, LE_PATH)
        logger.info("Label encoders saved → %s", LE_PATH)


# ═══════════════════════════════════════════════════════════════════════════════
# ModelTrainer
# ═══════════════════════════════════════════════════════════════════════════════
class ModelTrainer:
    """Trains multiple classifiers and compares their performance."""

    MODELS = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
        "Decision Tree":       DecisionTreeClassifier(random_state=RANDOM_STATE),
        "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE),
        "KNN":                 KNeighborsClassifier(n_neighbors=5),
    }

    def __init__(
        self,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: np.ndarray,
        y_test: np.ndarray,
    ):
        self.X_train = X_train
        self.X_test  = X_test
        self.y_train = y_train
        self.y_test  = y_test
        self.results: list[dict] = []
        self.trained_models: dict = {}
        self.best_model_name: str = ""
        self.best_model = None

    # ── Train & Evaluate ───────────────────────────────────────────────────────
    def train_all(self) -> pd.DataFrame:
        """Train every model and collect evaluation metrics."""
        for name, model in self.MODELS.items():
            logger.info("Training: %s", name)
            model.fit(self.X_train, self.y_train)
            self.trained_models[name] = model

            train_acc = accuracy_score(self.y_train, model.predict(self.X_train))
            y_pred    = model.predict(self.X_test)
            test_acc  = accuracy_score(self.y_test, y_pred)
            precision = precision_score(self.y_test, y_pred, average="weighted", zero_division=0)
            recall    = recall_score(self.y_test, y_pred, average="weighted", zero_division=0)
            f1        = f1_score(self.y_test, y_pred, average="weighted", zero_division=0)

            self.results.append(
                {
                    "Model":             name,
                    "Training Accuracy": round(train_acc * 100, 2),
                    "Testing Accuracy":  round(test_acc  * 100, 2),
                    "Precision":         round(precision * 100, 2),
                    "Recall":            round(recall    * 100, 2),
                    "F1 Score":          round(f1        * 100, 2),
                }
            )
            logger.info(
                "%s → Train: %.2f%%  Test: %.2f%%  F1: %.2f%%",
                name, train_acc * 100, test_acc * 100, f1 * 100,
            )

        results_df = pd.DataFrame(self.results)
        self._select_best(results_df)
        return results_df

    def _select_best(self, results_df: pd.DataFrame) -> None:
        """Pick the model with highest testing accuracy."""
        best_row = results_df.loc[results_df["Testing Accuracy"].idxmax()]
        self.best_model_name = best_row["Model"]
        self.best_model      = self.trained_models[self.best_model_name]
        logger.info(
            "Best model: %s  (Test Acc: %.2f%%)",
            self.best_model_name,
            best_row["Testing Accuracy"],
        )

    # ── Reports ───────────────────────────────────────────────────────────────
    def print_reports(self) -> None:
        """Print classification report and confusion matrix for every model."""
        for name, model in self.trained_models.items():
            y_pred = model.predict(self.X_test)
            logger.info("\n===== %s =====", name)
            print(f"\n{'='*50}")
            print(f"  {name}")
            print(f"{'='*50}")
            print(classification_report(self.y_test, y_pred, target_names=["Not Placed", "Placed"]))
            print("Confusion Matrix:")
            print(confusion_matrix(self.y_test, y_pred))

    # ── Save ──────────────────────────────────────────────────────────────────
    def save_best_model(self) -> None:
        """Persist only the best model to disk."""
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.best_model, MODEL_PATH)
        logger.info("Best model saved → %s", MODEL_PATH)


# ═══════════════════════════════════════════════════════════════════════════════
# Visualizer
# ═══════════════════════════════════════════════════════════════════════════════
class Visualizer:
    """Generates and saves training-time charts."""

    CHART_DIR = os.path.join(BASE_DIR, "models", "charts")

    def __init__(self, results_df: pd.DataFrame):
        self.results_df = results_df
        os.makedirs(self.CHART_DIR, exist_ok=True)

    def plot_model_comparison(self) -> None:
        """Bar chart: model comparison by testing accuracy."""
        fig, ax = plt.subplots(figsize=(10, 6))
        colors = ["#4361ee", "#3a0ca3", "#7209b7", "#f72585"]
        ax.bar(self.results_df["Model"], self.results_df["Testing Accuracy"], color=colors)
        ax.set_title("Model Comparison — Testing Accuracy", fontsize=14, fontweight="bold")
        ax.set_ylabel("Accuracy (%)")
        ax.set_ylim(0, 110)
        for i, v in enumerate(self.results_df["Testing Accuracy"]):
            ax.text(i, v + 1, f"{v:.2f}%", ha="center", fontweight="bold")
        plt.tight_layout()
        path = os.path.join(self.CHART_DIR, "model_comparison.png")
        plt.savefig(path, dpi=150)
        plt.close()
        logger.info("Chart saved → %s", path)

    def plot_metrics_heatmap(self) -> None:
        """Heatmap of all evaluation metrics for all models."""
        metric_cols = ["Training Accuracy", "Testing Accuracy", "Precision", "Recall", "F1 Score"]
        matrix = self.results_df.set_index("Model")[metric_cols]
        fig, ax = plt.subplots(figsize=(10, 5))
        sns.heatmap(matrix, annot=True, fmt=".2f", cmap="YlGnBu", linewidths=0.5, ax=ax)
        ax.set_title("Model Metrics Heatmap", fontsize=14, fontweight="bold")
        plt.tight_layout()
        path = os.path.join(self.CHART_DIR, "metrics_heatmap.png")
        plt.savefig(path, dpi=150)
        plt.close()
        logger.info("Chart saved → %s", path)


# ═══════════════════════════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════════════════════════
def main() -> None:
    logger.info("=" * 60)
    logger.info("  AI-Based Student Placement Prediction System")
    logger.info("  Training Pipeline")
    logger.info("=" * 60)

    # 1. Load & preprocess
    processor = DataProcessor(DATA_PATH)
    df = processor.load_data()
    df = processor.clean_data(df)
    df = processor.encode_data(df)
    processor.save_encoders()

    # 2. Split
    X_train, X_test, y_train, y_test = processor.split_data(df)

    # 3. Train all models
    trainer = ModelTrainer(X_train, X_test, y_train, y_test)
    results_df = trainer.train_all()

    # 4. Print results table
    print("\n" + "=" * 70)
    print("  MODEL COMPARISON TABLE")
    print("=" * 70)
    print(results_df.to_string(index=False))
    print("=" * 70)
    print(f"\n  [BEST] Best Model: {trainer.best_model_name}")
    print("=" * 70 + "\n")

    # 5. Detailed reports
    trainer.print_reports()

    # 6. Save best model
    trainer.save_best_model()

    # 7. Save visualizations
    viz = Visualizer(results_df)
    viz.plot_model_comparison()
    viz.plot_metrics_heatmap()

    logger.info("Training pipeline completed successfully!")


if __name__ == "__main__":
    main()
