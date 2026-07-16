# AI-Based Student Placement Prediction System
# Jupyter Notebook — Exploratory Data Analysis & Model Training

# In[ ]:
"""
AI-Based Student Placement Prediction System
============================================
Notebook: placement_prediction.ipynb (Python script version)

This script mirrors the notebook cells for reproducibility.
Run in Jupyter: jupyter notebook notebooks/placement_prediction.ipynb
"""

# ─── Cell 1: Imports ──────────────────────────────────────────────────────────
import os, sys, warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc,
)

warnings.filterwarnings("ignore")
pd.set_option("display.max_columns", None)
sns.set_theme(style="darkgrid", palette="viridis")
print("All imports successful ✅")

# ─── Cell 2: Load Data ────────────────────────────────────────────────────────
DATA_PATH = os.path.join("..", "dataset", "train.xls")
df = pd.read_csv(DATA_PATH)
print(f"Dataset Shape: {df.shape}")
df.head()

# ─── Cell 3: Basic Info ───────────────────────────────────────────────────────
print("=" * 60)
print("DATASET INFO")
print("=" * 60)
df.info()
print(f"\nMissing Values:\n{df.isnull().sum()}")
print(f"\nDuplicates: {df.duplicated().sum()}")

# ─── Cell 4: Descriptive Statistics ──────────────────────────────────────────
print("Descriptive Statistics:")
df.describe()

# ─── Cell 5: Placement Distribution ──────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
# Countplot
sns.countplot(data=df, x="Placement_Status", palette=["#FF6B35","#4CAF50"], ax=axes[0])
axes[0].set_title("Placement Status Distribution", fontweight="bold")
axes[0].set_xlabel("Status")
axes[0].set_ylabel("Count")
for p in axes[0].patches:
    axes[0].annotate(f"{int(p.get_height()):,}", (p.get_x() + p.get_width()/2, p.get_height()+200), ha="center")

# Pie chart
counts = df["Placement_Status"].value_counts()
axes[1].pie(counts, labels=counts.index, autopct="%1.1f%%", colors=["#FF6B35","#4CAF50"],
            startangle=90, explode=(0.05, 0))
axes[1].set_title("Placement Ratio", fontweight="bold")
plt.tight_layout()
plt.savefig("placement_distribution.png", dpi=150, bbox_inches="tight")
plt.show()
print(f"\nPlacement Counts:\n{counts}")

# ─── Cell 6: CGPA Distribution ───────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 5))
for status, color in zip(["Placed","Not Placed"],["#4361EE","#F72585"]):
    ax.hist(df[df["Placement_Status"]==status]["CGPA"], bins=40, alpha=0.7, label=status, color=color)
ax.set_title("CGPA Distribution by Placement Status", fontweight="bold", fontsize=14)
ax.set_xlabel("CGPA")
ax.set_ylabel("Frequency")
ax.legend()
plt.tight_layout()
plt.show()

# ─── Cell 7: Branch-wise Placement ───────────────────────────────────────────
branch_df = df.groupby(["Branch","Placement_Status"]).size().reset_index(name="Count")
fig, ax = plt.subplots(figsize=(12,5))
sns.barplot(data=branch_df, x="Branch", y="Count", hue="Placement_Status",
            palette={"Placed":"#4CAF50","Not Placed":"#FF6B35"}, ax=ax)
ax.set_title("Branch-wise Placement Distribution", fontweight="bold", fontsize=14)
plt.tight_layout()
plt.show()

# ─── Cell 8: Correlation Heatmap ─────────────────────────────────────────────
df_temp = df.copy()
for col in ["Gender","Degree","Branch","Placement_Status"]:
    df_temp[col] = LabelEncoder().fit_transform(df_temp[col].astype(str))
df_temp.drop(columns=["Student_ID"], inplace=True)

fig, ax = plt.subplots(figsize=(14,10))
corr = df_temp.corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="coolwarm",
            linewidths=0.5, ax=ax, cbar_kws={"shrink":.8})
ax.set_title("Feature Correlation Heatmap", fontweight="bold", fontsize=14)
plt.tight_layout()
plt.show()

# ─── Cell 9: Data Preprocessing ──────────────────────────────────────────────
TARGET_COL   = "Placement_Status"
ID_COL       = "Student_ID"
CAT_COLS     = ["Gender","Degree","Branch"]
RANDOM_STATE = 42
TEST_SIZE    = 0.20

df_clean = df.copy()
df_clean.drop(columns=[ID_COL], inplace=True)
df_clean.drop_duplicates(inplace=True)

label_encoders = {}
for col in CAT_COLS + [TARGET_COL]:
    le = LabelEncoder()
    df_clean[col] = le.fit_transform(df_clean[col].astype(str))
    label_encoders[col] = le
    print(f"Encoded '{col}': {dict(zip(le.classes_, le.transform(le.classes_)))}")

X = df_clean.drop(columns=[TARGET_COL])
y = df_clean[TARGET_COL]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE,
                                                     random_state=RANDOM_STATE, stratify=y)
print(f"\nTrain: {X_train.shape}  |  Test: {X_test.shape}")

# ─── Cell 10: Model Training & Evaluation ────────────────────────────────────
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
    "Decision Tree":       DecisionTreeClassifier(random_state=RANDOM_STATE),
    "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE),
    "KNN":                 KNeighborsClassifier(n_neighbors=5),
}

results, trained_models = [], {}
for name, model in models.items():
    model.fit(X_train, y_train)
    trained_models[name] = model
    y_pred   = model.predict(X_test)
    train_acc = accuracy_score(y_train, model.predict(X_train))
    test_acc  = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall    = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1        = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    results.append({
        "Model": name,
        "Training Accuracy": round(train_acc*100, 2),
        "Testing Accuracy":  round(test_acc*100, 2),
        "Precision":         round(precision*100, 2),
        "Recall":            round(recall*100, 2),
        "F1 Score":          round(f1*100, 2),
    })
    print(f"\n{'='*50}\n{name}\n{'='*50}")
    print(classification_report(y_test, y_pred, target_names=["Not Placed","Placed"]))

results_df = pd.DataFrame(results)
print("\n" + "="*70)
print("MODEL COMPARISON TABLE")
print("="*70)
print(results_df.to_string(index=False))

# ─── Cell 11: Best Model ──────────────────────────────────────────────────────
best_name  = results_df.loc[results_df["Testing Accuracy"].idxmax(), "Model"]
best_model = trained_models[best_name]
print(f"\n🏆 Best Model: {best_name}")
print(f"   Testing Accuracy: {results_df[results_df['Model']==best_name]['Testing Accuracy'].values[0]:.2f}%")

# ─── Cell 12: Confusion Matrix Grid ──────────────────────────────────────────
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()
for i, (name, model) in enumerate(trained_models.items()):
    y_pred = model.predict(X_test)
    cm     = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Not Placed","Placed"],
                yticklabels=["Not Placed","Placed"], ax=axes[i])
    axes[i].set_title(f"{name}\nTest Acc: {accuracy_score(y_test,y_pred)*100:.2f}%", fontweight="bold")
    axes[i].set_xlabel("Predicted"); axes[i].set_ylabel("Actual")
plt.suptitle("Confusion Matrices — All Models", fontsize=16, fontweight="bold")
plt.tight_layout()
plt.show()

# ─── Cell 13: Model Comparison Chart ─────────────────────────────────────────
fig, ax = plt.subplots(figsize=(12, 6))
metrics = ["Training Accuracy","Testing Accuracy","Precision","Recall","F1 Score"]
x = np.arange(len(metrics))
width = 0.2
colors = ["#4361EE","#7209B7","#F72585","#FF6B35"]
for i, (_, row) in enumerate(results_df.iterrows()):
    ax.bar(x + i*width, [row[m] for m in metrics], width, label=row["Model"], color=colors[i])
ax.set_xticks(x + width*1.5); ax.set_xticklabels(metrics, rotation=15)
ax.set_ylabel("Score (%)"); ax.set_ylim(0,115)
ax.set_title("Model Performance Comparison", fontweight="bold", fontsize=14)
ax.legend(loc="upper right")
plt.tight_layout()
plt.show()

# ─── Cell 14: Feature Importance ─────────────────────────────────────────────
if hasattr(best_model, "feature_importances_"):
    fi_df = pd.DataFrame({"Feature": X.columns, "Importance": best_model.feature_importances_}).sort_values("Importance", ascending=True)
    fig, ax = plt.subplots(figsize=(10,7))
    colors  = plt.cm.viridis(np.linspace(0.3, 0.9, len(fi_df)))
    ax.barh(fi_df["Feature"], fi_df["Importance"], color=colors)
    ax.set_title(f"Feature Importance — {best_name}", fontweight="bold", fontsize=14)
    ax.set_xlabel("Importance Score")
    plt.tight_layout()
    plt.show()

# ─── Cell 15: Save Best Model ─────────────────────────────────────────────────
MODEL_DIR  = os.path.join("..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "placement_prediction_model.pkl")
LE_PATH    = os.path.join(MODEL_DIR, "label_encoder.pkl")
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(best_model,    MODEL_PATH)
joblib.dump(label_encoders, LE_PATH)
print(f"✅ Best model saved  → {MODEL_PATH}")
print(f"✅ Label encoders saved → {LE_PATH}")

# ─── Cell 16: Inference Test ──────────────────────────────────────────────────
sample = pd.DataFrame([{
    "Age": 21, "Gender": 1, "Degree": 0, "Branch": 2,
    "CGPA": 8.5, "Internships": 2, "Projects": 4,
    "Coding_Skills": 8, "Communication_Skills": 7,
    "Aptitude_Test_Score": 80, "Soft_Skills_Rating": 8,
    "Certifications": 2, "Backlogs": 0,
}])
pred  = best_model.predict(sample)[0]
proba = best_model.predict_proba(sample)[0]
label = label_encoders[TARGET_COL].inverse_transform([pred])[0]
placed_idx = list(label_encoders[TARGET_COL].classes_).index("Placed")
print(f"\nSample Prediction: {label}")
print(f"Placement Probability: {proba[placed_idx]*100:.2f}%")
