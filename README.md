# AuraAnalytics: E-Commerce Customer Value & Churn Analytics Suite

AuraAnalytics is an end-to-end Data Science and Business Intelligence portfolio project. It addresses a core retail business objective: **maximizing customer retention and predicting lifetime value (CLV)**. 

Rather than working on generic datasets (like Titanic or Iris), this project establishes a complete data engineering, modeling, and dashboarding pipeline using simulated transaction logs containing 67,000+ entries. It demonstrates proficiency in time-based validation, clustering, regression, classification, and frontend engineering.

---

## 🌟 Key Features

1. **Transaction Simulation Engine (`generator.py`)**: Programmatically creates 24 months of e-commerce transactions for 1,200 customers. Simulates seasonal demand (Black Friday/Holiday spikes), customer lifecycle lengths, frequency distributions (Poisson process), and transaction value distributions (Log-normal distribution).
2. **RFM Cohort Analyzer (`analyzer.py`)**:
   - Calculates **Cohort Retention Matrices** grouping customers by their registration month to track month-on-month engagement.
   - Computes **Recency, Frequency, and Monetary (RFM)** metrics.
   - Preprocesses highly right-skewed transaction metrics with **Log-Transformations** and **StandardScaler** to meet distance assumptions.
   - Applies **K-Means Clustering** to segment customers into actionable business cohorts: *Champions*, *Loyal Spenders*, *At-Risk Spenders*, and *Lost/Hibernating*.
3. **Leakage-Free Predictive Models (`ml_models.py`)**:
   - **Churn Classifier (Logistic Regression)**: Predicts the likelihood of a customer having zero purchase activity in the next 30 days. Uses a rolling time-cutoff to prevent data leakage.
   - **CLV Regressor (Ridge Regression)**: Forecasts the future 90-day spend of a customer.
4. **Interactive Dashboard & Simulator (React + Vite + Chart.js)**:
   - Displays gross revenue KPIs, cohort retention tables, and cluster distributions.
   - Includes a **Recruiter Playground Simulator**: Drag sliders (Recency, Frequency, Spend) to calculate ML predictions in real-time right in your browser using the exported model coefficients.

---

## 🛠️ Tech Stack & Libraries

- **Data Science / Machine Learning**: Python 3.11, Pandas, NumPy, Scikit-Learn (KMeans, StandardScaler, LogisticRegression, Ridge)
- **Frontend / Data Visualization**: JavaScript, React, Vite, Chart.js, Lucide-React, CSS3 (Glassmorphic dark design)

---

## 📂 Project Architecture

```
customer_analytics/
│
├── pipeline/                    # Python Data Science Pipeline
│   ├── data/                    # CSVs & Generated JSONs
│   │   ├── raw_transactions.csv
│   │   ├── processed_cohorts.json
│   │   ├── cluster_summary.json
│   │   └── model_parameters.json
│   ├── generator.py             # Synthetic retail generator
│   ├── analyzer.py              # Cohort and RFM K-Means pipeline
│   └── ml_models.py             # Churn & CLV modeling script
│
├── dashboard/                   # React web interface
│   ├── src/
│   │   ├── components/          # Overview, CohortMatrix, Simulator
│   │   ├── data/                # Copied JSON artifacts from pipeline
│   │   ├── App.jsx
│   │   └── index.css            # Dark glassmorphism stylesheet
│   └── package.json
│
├── run.bat                      # One-click script to run pipeline & start app
└── README.md                    # Project documentation
```

---

## 🔬 Deep Dive: Data Science Design Decisions

### 1. Zero Data Leakage Time-Splitting
A common beginner mistake is building RFM metrics over the entire historical duration and predicting churn directly. This leaks future indicators into features. AuraAnalytics implements a strict **Time-Cutoff Validation**:
- **For Churn Classification**: Features are calculated on transactions before a specific `t - 30 days` cutoff. The target (Churn = 1 or 0) is calculated based on whether they had transactions *after* the cutoff.
- **For CLV Regression**: Features are aggregated before `t - 90 days`, and the target is the actual gross spend *in* those 90 days.

### 2. Standardizing Skewed Inputs for K-Means
Since transactional count data is highly right-skewed (many small spenders, very few VIP spenders), standardizing with a simple Z-score is insufficient. We apply:
$$\text{Feature}_{\text{transformed}} = \ln(\text{Feature} + 1)$$
Following log-transformation, features are scaled using `StandardScaler` to ensure the Euclidean distance calculations in K-Means are not dominated by monetary magnitude.

### 3. Edge Prediction Simulator in JavaScript
To make the dashboard fully interactive without requiring a running Python backend, the coefficients, intercepts, and scaling means/standard deviations are exported to `model_parameters.json`. The React simulator executes:
$$z = \beta_0 + \sum \beta_i \left( \frac{\ln(x_i + 1) - \mu_i}{\sigma_i} \right)$$
$$P(\text{Churn}) = \frac{1}{1 + e^{-z}}$$
This demonstrates full-stack analytical integration.

---

## 🚀 How to Run the Project

### Prerequisites
- Python 3.11+
- Node.js (v18+)

### Run via Batch Script (Windows)
Double-click `run.bat` at the root of the project directory. This script will automatically:
1. Install Python requirements.
2. Run the generator, analyzer, and ML models.
3. Copy the output files to the React project.
4. Launch the local React development web server.

### Run Manually
1. **Initialize Data & Models**:
   ```bash
   pip install pandas numpy scikit-learn
   python pipeline/generator.py
   python pipeline/analyzer.py
   python pipeline/ml_models.py
   ```
2. **Copy artifacts to dashboard**:
   ```bash
   copy pipeline\data\*.json dashboard\src\data\
   ```
3. **Start Dashboard**:
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.


   ## DashBoard Previews

   ### Overview Analytics
   <img width="1058" height="291" alt="overview_2" src="https://github.com/user-attachments/assets/87e522bf-7865-410f-afd9-26e77125a46a" />
<img width="1112" height="640" alt="overview_1" src="https://github.com/user-attachments/assets/5bb468ab-ffcb-4cea-87f4-21f8572e10b4" />

   ### Cohort Retention Heatmap
   <img width="1011" height="627" alt="cohort" src="https://github.com/user-attachments/assets/2595f52c-c806-49fa-a4e4-2ad5e66207be" />

   ### Real-Time Machine Learning Simulator
   <img width="1082" height="308" alt="ML Simulator_2" src="https://github.com/user-attachments/assets/8e41af67-564b-4483-babc-43ec7039b66d" />
<img width="1093" height="637" alt="ML Simulator" src="https://github.com/user-attachments/assets/325a8d45-cdfc-49d9-8bbd-9c7bece6423e" />
