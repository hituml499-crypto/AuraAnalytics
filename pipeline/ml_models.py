import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import accuracy_score, roc_auc_score, r2_score, mean_absolute_error

def train_models():
    print("Starting Machine Learning Model Training...")
    
    pipeline_dir = os.path.dirname(os.path.abspath(__file__))
    raw_data_path = os.path.join(pipeline_dir, "data", "raw_transactions.csv")
    
    if not os.path.exists(raw_data_path):
        raise FileNotFoundError(f"Raw data file not found at {raw_data_path}. Run generator.py first.")
        
    df = pd.read_csv(raw_data_path)
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])
    df["TotalSpend"] = df["Quantity"] * df["UnitPrice"]
    
    max_date = df["InvoiceDate"].max()
    
    # ==========================================
    # 1. Churn Model Setup (Time-based Cutoff)
    # ==========================================
    # We define churn based on whether a customer purchases in the final 30 days.
    # We build features using data PRIOR to max_date - 30 days.
    # Target: 1 if customer had 0 transactions in the final 30 days, else 0.
    
    churn_cutoff = max_date - pd.Timedelta(days=30)
    print(f"Churn Model Cutoff Date: {churn_cutoff.strftime('%Y-%m-%d')}")
    
    # Active customers prior to cutoff
    df_pre_churn = df[df["InvoiceDate"] < churn_cutoff].copy()
    active_custs_pre_churn = df_pre_churn["CustomerID"].unique()
    
    # Targets: customers who purchased in the final 30 days
    df_post_churn = df[df["InvoiceDate"] >= churn_cutoff].copy()
    active_custs_post_churn = set(df_post_churn["CustomerID"].unique())
    
    # Calculate features at cutoff
    churn_features = df_pre_churn.groupby("CustomerID").agg({
        "InvoiceDate": lambda x: (churn_cutoff - x.max()).days,
        "InvoiceNo": "nunique",
        "TotalSpend": "sum"
    }).reset_index()
    
    churn_features.rename(columns={
        "InvoiceDate": "Recency",
        "InvoiceNo": "Frequency",
        "TotalSpend": "Monetary"
    }, inplace=True)
    
    # Only keep customers who had purchases before the cutoff
    churn_features = churn_features[churn_features["Monetary"] > 0].copy()
    
    # Label: Churn = 1 (not active post-cutoff), Churn = 0 (active post-cutoff)
    churn_features["Churn"] = churn_features["CustomerID"].apply(
        lambda x: 1 if x not in active_custs_post_churn else 0
    )
    
    # Prepare training matrices
    X_churn = churn_features[["Recency", "Frequency", "Monetary"]].copy()
    y_churn = churn_features["Churn"].values
    
    # Apply log transform to reduce skewness
    X_churn_log = X_churn.copy()
    X_churn_log["Recency"] = np.log(X_churn["Recency"] + 1)
    X_churn_log["Frequency"] = np.log(X_churn["Frequency"])
    X_churn_log["Monetary"] = np.log(X_churn["Monetary"])
    
    # Train-test split
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X_churn_log, y_churn, test_size=0.2, random_state=42, stratify=y_churn
    )
    
    # Scale features
    scaler_c = StandardScaler()
    X_train_c_scaled = scaler_c.fit_transform(X_train_c)
    X_test_c_scaled = scaler_c.transform(X_test_c)
    
    # Train Logistic Regression
    clf = LogisticRegression(random_state=42)
    clf.fit(X_train_c_scaled, y_train_c)
    
    # Evaluate
    y_pred_c = clf.predict(X_test_c_scaled)
    y_prob_c = clf.predict_proba(X_test_c_scaled)[:, 1]
    
    acc_c = accuracy_score(y_test_c, y_pred_c)
    auc_c = roc_auc_score(y_test_c, y_prob_c)
    print(f"Churn Classifier - Accuracy: {acc_c:.3f}, ROC-AUC: {auc_c:.3f}")
    
    # ==========================================
    # 2. CLV Model Setup (Time-based Cutoff)
    # ==========================================
    # Predict spend in final 90 days using features from prior history.
    clv_cutoff = max_date - pd.Timedelta(days=90)
    print(f"CLV Model Cutoff Date: {clv_cutoff.strftime('%Y-%m-%d')}")
    
    df_pre_clv = df[df["InvoiceDate"] < clv_cutoff].copy()
    df_post_clv = df[df["InvoiceDate"] >= clv_cutoff].copy()
    
    # Calculate features at cutoff
    clv_features = df_pre_clv.groupby("CustomerID").agg({
        "InvoiceDate": lambda x: (clv_cutoff - x.max()).days,
        "InvoiceNo": "nunique",
        "TotalSpend": "sum"
    }).reset_index()
    
    clm_rename = {
        "InvoiceDate": "Recency",
        "InvoiceNo": "Frequency",
        "TotalSpend": "Monetary"
    }
    clv_features.rename(columns=clm_rename, inplace=True)
    clv_features = clv_features[clv_features["Monetary"] > 0].copy()
    
    # Calculate target (actual 90 day future spend)
    spend_post_clv = df_post_clv.groupby("CustomerID")["TotalSpend"].sum().reset_index()
    spend_post_clv.rename(columns={"TotalSpend": "FutureSpend"}, inplace=True)
    
    clv_features = pd.merge(clv_features, spend_post_clv, on="CustomerID", how="left")
    clv_features["FutureSpend"] = clv_features["FutureSpend"].fillna(0.0)
    
    # Prepare training matrices
    X_clv = clv_features[["Recency", "Frequency", "Monetary"]].copy()
    y_clv = clv_features["FutureSpend"].values
    
    # Log transform features
    X_clv_log = X_clv.copy()
    X_clv_log["Recency"] = np.log(X_clv["Recency"] + 1)
    X_clv_log["Frequency"] = np.log(X_clv["Frequency"])
    X_clv_log["Monetary"] = np.log(X_clv["Monetary"])
    
    # Train-test split
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
        X_clv_log, y_clv, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler_r = StandardScaler()
    X_train_r_scaled = scaler_r.fit_transform(X_train_r)
    X_test_r_scaled = scaler_r.transform(X_test_r)
    
    # Train Ridge Regression (CLV Regressor)
    reg = Ridge(alpha=1.0)
    reg.fit(X_train_r_scaled, y_train_r)
    
    # Evaluate
    y_pred_r = reg.predict(X_test_r_scaled)
    # Clip negative predictions to 0 since spend cannot be negative
    y_pred_r = np.clip(y_pred_r, 0, None)
    
    r2_r = r2_score(y_test_r, y_pred_r)
    mae_r = mean_absolute_error(y_test_r, y_pred_r)
    print(f"CLV Regressor - R2 Score: {r2_r:.3f}, MAE: {mae_r:.2f}")
    
    # ==========================================
    # 3. Export Parameters for Frontend JS
    # ==========================================
    # Export normalization parameters (mean, std) and model coefficients (weights)
    # so React can run scaled predictions in real-time.
    
    parameters = {
        "churn": {
            "intercept": float(clf.intercept_[0]),
            "coefficients": {
                "Recency": float(clf.coef_[0][0]),
                "Frequency": float(clf.coef_[0][1]),
                "Monetary": float(clf.coef_[0][2])
            },
            "scaling": {
                "mean": {
                    "Recency": float(scaler_c.mean_[0]),
                    "Frequency": float(scaler_c.mean_[1]),
                    "Monetary": float(scaler_c.mean_[2])
                },
                "scale": {
                    "Recency": float(scaler_c.scale_[0]),
                    "Frequency": float(scaler_c.scale_[1]),
                    "Monetary": float(scaler_c.scale_[2])
                }
            },
            "metrics": {
                "accuracy": round(float(acc_c), 3),
                "auc": round(float(auc_c), 3)
            }
        },
        "clv": {
            "intercept": float(reg.intercept_),
            "coefficients": {
                "Recency": float(reg.coef_[0]),
                "Frequency": float(reg.coef_[1]),
                "Monetary": float(reg.coef_[2])
            },
            "scaling": {
                "mean": {
                    "Recency": float(scaler_r.mean_[0]),
                    "Frequency": float(scaler_r.mean_[1]),
                    "Monetary": float(scaler_r.mean_[2])
                },
                "scale": {
                    "Recency": float(scaler_r.scale_[0]),
                    "Frequency": float(scaler_r.scale_[1]),
                    "Monetary": float(scaler_r.scale_[2])
                }
            },
            "metrics": {
                "r2_score": round(float(r2_r), 3),
                "mae": round(float(mae_r), 2)
            }
        }
    }
    
    param_output_path = os.path.join(pipeline_dir, "data", "model_parameters.json")
    with open(param_output_path, "w") as f:
        json.dump(parameters, f, indent=2)
    print(f"Saved model parameters and coefficients to {param_output_path}")

if __name__ == "__main__":
    train_models();
