import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set random seeds for reproducibility
np.random.seed(42)
random.seed(42)

# Product list for realistic descriptions
PRODUCTS = [
    {"code": "85123A", "desc": "WHITE HANGING HEART T-LIGHT HOLDER", "price_min": 1.25, "price_max": 2.95},
    {"code": "22423", "desc": "REGENCY CAKESTAND 3 TIER", "price_min": 10.95, "price_max": 14.95},
    {"code": "84879", "desc": "ASSORTED COLOUR BIRD ORNAMENT", "price_min": 1.45, "price_max": 1.95},
    {"code": "47566", "desc": "PARTY BUNTING", "price_min": 4.15, "price_max": 5.95},
    {"code": "22720", "desc": "SET OF 3 CAKE TINS PANTRY DESIGN", "price_min": 4.95, "price_max": 5.95},
    {"code": "22960", "desc": "JAM MAKING SET WITH JARS", "price_min": 3.75, "price_max": 4.25},
    {"code": "21731", "desc": "RED TOADSTOOL LED NIGHT LIGHT", "price_min": 1.25, "price_max": 1.65},
    {"code": "22197", "desc": "POPCORN HOLDER", "price_min": 0.72, "price_max": 0.85},
    {"code": "85099B", "desc": "JUMBO BAG RED RETROSPOT", "price_min": 1.65, "price_max": 2.05},
    {"code": "20725", "desc": "LUNCH BAG RED RETROSPOT", "price_min": 1.45, "price_max": 1.65},
    {"code": "22383", "desc": "LUNCH BAG SUKI DESIGN", "price_min": 1.45, "price_max": 1.65},
    {"code": "20727", "desc": "LUNCH BAG BLACK SKULL", "price_min": 1.45, "price_max": 1.65},
    {"code": "20728", "desc": "LUNCH BAG CARS BLUE", "price_min": 1.45, "price_max": 1.65},
    {"code": "22457", "desc": "NATURAL SLATE HEART MEMO BOARD", "price_min": 2.95, "price_max": 3.75},
    {"code": "22469", "desc": "HEART OF WICKER SMALL", "price_min": 1.45, "price_max": 1.65},
    {"code": "22086", "desc": "PAPER CHAIN KIT 50'S CHRISTMAS", "price_min": 2.55, "price_max": 3.39},
    {"code": "21212", "desc": "PACK OF 72 RETROSPOT PAPER  CASES", "price_min": 0.42, "price_max": 0.55},
    {"code": "22554", "desc": "PLASTERS IN TIN WOODLAND ANIMALS", "price_min": 1.65, "price_max": 2.10},
    {"code": "22556", "desc": "PLASTERS IN TIN CIRCUS PARADE", "price_min": 1.65, "price_max": 2.10},
    {"code": "21931", "desc": "JUMBO STORAGE BAG SUKI", "price_min": 1.95, "price_max": 2.45}
]

COUNTRIES = ["United Kingdom", "United Kingdom", "United Kingdom", "Germany", "France", "EIRE", "Spain", "Netherlands"]

def generate_transactions(num_customers=1200, end_date=datetime(2026, 5, 1)):
    """
    Generates a synthetic retail database with realistic e-commerce properties:
    - Customer lifetime (some join early, some late).
    - Custom spend distribution (log-normal, giving a few VIP spenders).
    - Poisson purchase frequencies (some purchase weekly, some once a year).
    - Customer churn (simulated dropout).
    - Black Friday / Holiday Seasonality.
    """
    start_date = end_date - timedelta(days=730) # 2 years of history
    
    records = []
    invoice_counter = 536365
    
    print(f"Generating synthetic transactions for {num_customers} customers...")
    
    for i in range(num_customers):
        customer_id = 10000 + i
        country = random.choice(COUNTRIES)
        
        # Inherent traits for this customer
        # 1. Join date (random uniform across the 2 years)
        join_days_after_start = random.randint(0, 600)
        cust_join_date = start_date + timedelta(days=join_days_after_start)
        
        # 2. Spend behavior: average Order Value (log-normal distribution)
        avg_order_value = np.random.lognormal(mean=3.5, sigma=0.8) + 10.0 # mostly $15-70, some high value
        
        # 3. Frequency behavior: expected transactions per month (Gamma distribution)
        expected_orders_per_month = np.random.gamma(shape=1.5, scale=1.0) # mean ~ 1.5 orders/month
        expected_orders_per_month = max(0.1, expected_orders_per_month) # min 1 order per 10 months
        
        # 4. Churn behavior: does this customer churn?
        # Older cohorts have higher cumulative churn probability
        cohort_age_days = (end_date - cust_join_date).days
        is_churned = random.random() < (0.2 + 0.6 * (cohort_age_days / 730)) # older customers are more likely to have churned
        
        if is_churned:
            # Active lifetime in days (less than total cohort age)
            active_duration = random.randint(30, max(31, cohort_age_days - 30))
            cust_end_date = cust_join_date + timedelta(days=active_duration)
        else:
            cust_end_date = end_date
            
        # Simulate orders over active lifetime
        current_time = cust_join_date
        while current_time < cust_end_date:
            # Time until next order (exponential distribution based on frequency parameter)
            days_to_next_order = np.random.exponential(scale=(30.4 / expected_orders_per_month))
            current_time += timedelta(days=days_to_next_order)
            
            if current_time >= cust_end_date:
                break
                
            # Seasonality multiplier (e.g., Nov-Dec holiday boost, summer lull)
            seasonality = 1.0
            month = current_time.month
            if month in [11, 12]: # Holiday peak
                seasonality = 1.8
            elif month in [1, 2]: # Post-holiday dip
                seasonality = 0.7
                
            # Random drop chance based on seasonality
            if random.random() > (0.8 * seasonality):
                # Skip this order or make it smaller
                if random.random() > 0.5:
                    continue
            
            # Generate invoice details
            num_items = random.randint(1, 8)
            invoice_id = str(invoice_counter)
            invoice_counter += 1
            
            # Select products for this invoice
            invoice_products = random.sample(PRODUCTS, k=min(num_items, len(PRODUCTS)))
            
            # Distribute order value among items
            invoice_value = avg_order_value * np.random.normal(1.0, 0.25)
            invoice_value = max(5.0, invoice_value) # minimum order value
            
            for prod in invoice_products:
                item_price = random.uniform(prod["price_min"], prod["price_max"])
                # Estimate a quantity to match price and share of invoice value
                target_item_value = invoice_value / len(invoice_products)
                quantity = max(1, int(round(target_item_value / item_price)))
                
                records.append({
                    "InvoiceNo": invoice_id,
                    "StockCode": prod["code"],
                    "Description": prod["desc"],
                    "Quantity": quantity,
                    "InvoiceDate": current_time.strftime("%Y-%m-%d %H:%M"),
                    "UnitPrice": round(item_price, 2),
                    "CustomerID": customer_id,
                    "Country": country
                })
                
    # Create DataFrame
    df = pd.DataFrame(records)
    
    # Sort by date
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])
    df = df.sort_values("InvoiceDate").reset_index(drop=True)
    
    # Format InvoiceDate back to string
    df["InvoiceDate"] = df["InvoiceDate"].dt.strftime("%Y-%m-%d %H:%M")
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(os.path.abspath(__file__)) + "/data", exist_ok=True)
    
    output_path = os.path.dirname(os.path.abspath(__file__)) + "/data/raw_transactions.csv"
    df.to_csv(output_path, index=False)
    print(f"Successfully generated {len(df)} transactions. Saved to {output_path}")

if __name__ == "__main__":
    generate_transactions()
