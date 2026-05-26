import os
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

def run_analysis():
    print("Starting Data Analysis & Segmentation...")
    
    # 1. Load Data
    pipeline_dir = os.path.dirname(os.path.abspath(__file__))
    raw_data_path = os.path.join(pipeline_dir, "data", "raw_transactions.csv")
    
    if not os.path.exists(raw_data_path):
        raise FileNotFoundError(f"Raw data file not found at {raw_data_path}. Run generator.py first.")
        
    df = pd.read_csv(raw_data_path)
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])
    df["TotalSpend"] = df["Quantity"] * df["UnitPrice"]
    
    # Define analysis end date (max transaction date + 1 day)
    analysis_date = df["InvoiceDate"].max() + pd.Timedelta(days=1)
    
    # ==========================================
    # 2. Cohort Retention Analysis
    # ==========================================
    print("Calculating Monthly Cohort Retention Matrix...")
    # Get Invoice Month
    df["InvoiceMonth"] = df["InvoiceDate"].dt.to_period("M")
    
    # Get signup month for each customer
    df["CohortMonth"] = df.groupby("CustomerID")["InvoiceDate"].transform("min").dt.to_period("M")
    
    # Group by CohortMonth and InvoiceMonth
    cohort_data = df.groupby(["CohortMonth", "InvoiceMonth"])["CustomerID"].nunique().reset_index()
    cohort_data.rename(columns={"CustomerID": "ActiveCustomers"}, inplace=True)
    
    # Calculate Cohort Index (number of months since signup)
    cohort_data["CohortIndex"] = (cohort_data["InvoiceMonth"] - cohort_data["CohortMonth"]).apply(lambda x: x.n)
    
    # Pivot cohort table
    cohort_pivot = cohort_data.pivot(index="CohortMonth", columns="CohortIndex", values="ActiveCustomers")
    
    # Calculate Retention rates
    cohort_sizes = cohort_pivot.iloc[:, 0]
    retention_matrix = cohort_pivot.divide(cohort_sizes, axis=0)
    
    # Prepare Cohort data for JSON output
    cohort_json_list = []
    for month in cohort_pivot.index:
        month_str = str(month)
        size = int(cohort_sizes[month])
        rates = []
        for i in range(13): # Show up to 12 months retention
            rate = retention_matrix.loc[month, i] if i in retention_matrix.columns else None
            # Handle NaN
            if pd.isna(rate):
                rate = None
            else:
                rate = round(float(rate), 3)
            rates.append(rate)
            
        cohort_json_list.append({
            "cohort": month_str,
            "size": size,
            "retention": rates
        })
        
    # Save Cohort matrix
    cohort_output_path = os.path.join(pipeline_dir, "data", "processed_cohorts.json")
    with open(cohort_output_path, "w") as f:
        json.dump(cohort_json_list, f, indent=2)
    print(f"Saved cohort matrix to {cohort_output_path}")

    # ==========================================
    # 3. RFM Calculation
    # ==========================================
    print("Calculating RFM Metrics...")
    
    rfm = df.groupby("CustomerID").agg({
        "InvoiceDate": lambda x: (analysis_date - x.max()).days,
        "InvoiceNo": "nunique",
        "TotalSpend": "sum",
        "Country": "first"
    }).reset_index()
    
    rfm.rename(columns={
        "InvoiceDate": "Recency",
        "InvoiceNo": "Frequency",
        "TotalSpend": "Monetary"
    }, inplace=True)
    
    # Handle zero frequency or negative monetary if any
    rfm = rfm[rfm["Monetary"] > 0].copy()
    
    # ==========================================
    # 4. K-Means Clustering on RFM
    # ==========================================
    print("Clustering customers using K-Means...")
    
    # Log transform RFM to reduce skewness (Data Science Best Practice!)
    rfm_log = pd.DataFrame()
    rfm_log["Recency"] = np.log(rfm["Recency"] + 1)
    rfm_log["Frequency"] = np.log(rfm["Frequency"])
    rfm_log["Monetary"] = np.log(rfm["Monetary"])
    
    # Scale variables
    scaler = StandardScaler()
    rfm_scaled = scaler.fit_transform(rfm_log)
    
    # Fit K-Means
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    rfm["Cluster"] = kmeans.fit_predict(rfm_scaled)
    
    # Map clusters to meaningful business names
    # Calculate cluster centroids to identify which is which
    centroids = rfm.groupby("Cluster")[["Recency", "Frequency", "Monetary"]].mean()
    
    # Define labels based on centroid relative stats:
    # High frequency, low recency, high monetary -> Champions
    # High recency, low frequency, low monetary -> Hibernating
    # High frequency, low-mid recency, mid monetary -> Loyal
    # High recency, high frequency, high monetary -> At Risk
    
    cluster_order = centroids.sort_values(by="Monetary", ascending=False).index.tolist()
    
    cluster_map = {
        cluster_order[0]: "Champions",
        cluster_order[1]: "Loyal Spenders",
        cluster_order[2]: "At-Risk Spenders",
        cluster_order[3]: "Lost/Hibernating"
    }
    
    rfm["Segment"] = rfm["Cluster"].map(cluster_map)
    
    # Save RFM with clusters as CSV for the ML modeling step
    rfm_output_csv = os.path.join(pipeline_dir, "data", "processed_rfm.csv")
    rfm.to_csv(rfm_output_csv, index=False)
    
    # Save Cluster Summaries for React dashboard metrics
    segment_summary = rfm.groupby("Segment").agg({
        "CustomerID": "count",
        "Recency": "mean",
        "Frequency": "mean",
        "Monetary": "mean"
    }).round(2).reset_index()
    
    segment_summary.rename(columns={"CustomerID": "CustomerCount"}, inplace=True)
    
    # Convert to JSON format
    summary_list = segment_summary.to_dict(orient="records")
    summary_output_path = os.path.join(pipeline_dir, "data", "cluster_summary.json")
    with open(summary_output_path, "w") as f:
        json.dump(summary_list, f, indent=2)
        
    print(f"Saved segmented customer RFM to {rfm_output_csv}")
    print(f"Saved cluster summary to {summary_output_path}")
    
    # Export RFM subset for frontend lookup
    rfm_sample = rfm.sort_values("Monetary", ascending=False).head(200) # top 200 customers
    sample_list = rfm_sample.to_dict(orient="records")
    sample_output_path = os.path.join(pipeline_dir, "data", "rfm_sample.json")
    with open(sample_output_path, "w") as f:
        json.dump(sample_list, f, indent=2)
        
    print(f"Saved sample customer list of size {len(sample_list)} for frontend preview.")

if __name__ == "__main__":
    run_analysis()
