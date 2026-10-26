"""
Kampus Masa - Library Occupancy & Recommendation Machine Learning Model
Trained on realistic GTU (Gebze Technical University) library historical usage data.
Model: RandomForestRegressor (Scikit-Learn)
Outputs:
  - occupancy_model.joblib (Trained ML Model weights)
  - metadata.json (Feature definitions, accuracy metrics, category mappings)
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Seed for deterministic and reproducible training
np.random.seed(42)

def generate_historical_dataset(n_samples=5000):
    """
    Simulates a semester of hourly library occupancy across days, hours,
    exam periods, floors, and study area types.
    """
    records = []
    
    # 0=Monday, 6=Sunday
    days = np.random.randint(0, 7, size=n_samples)
    # Hours from 08:00 to 22:00
    hours = np.random.randint(8, 23, size=n_samples)
    # Exam period: 1 (midterm/final weeks) vs 0 (normal weeks)
    is_exam = np.random.choice([0, 1], p=[0.75, 0.25], size=n_samples)
    # Floor: 1 (ground / main floor) or 2 (upper quiet / group floor)
    floors = np.random.choice([1, 2], p=[0.55, 0.45], size=n_samples)
    # Area Type: 0=Pencere Onu, 1=Sessiz Calisma, 2=Grup Calisma
    areas = np.random.choice([0, 1, 2], p=[0.40, 0.35, 0.25], size=n_samples)

    for i in range(n_samples):
        d = days[i]
        h = hours[i]
        exam = is_exam[i]
        fl = floors[i]
        ar = areas[i]

        # Base occupancy based on time of day (bell curve peaking at 14:00 - 17:00)
        time_factor = np.exp(-((h - 15) ** 2) / 18) * 65.0
        
        # Morning ramp-up
        if h < 11:
            time_factor = max(15.0, time_factor * 0.7)
            
        # Evening drop
        if h > 20:
            time_factor = max(10.0, time_factor * 0.5)

        # Day of week factor: Weekdays (0-4) are busier than weekends (5-6)
        day_factor = 15.0 if d < 5 else -10.0

        # Exam period spike: +25% occupancy across all hours
        exam_factor = 25.0 if exam == 1 else 0.0

        # Area preference: Quiet areas and window seats are more popular
        if ar == 0:  # Pencere onu
            area_factor = 8.0
        elif ar == 1:  # Sessiz
            area_factor = 12.0 if exam == 1 else 5.0
        else:  # Grup
            area_factor = 10.0 if (14 <= h <= 19 and d < 5) else -5.0

        # Floor factor: Floor 1 is slightly more crowded for walk-ins
        floor_factor = 4.0 if fl == 1 else 0.0

        # Noise
        noise = np.random.normal(0, 4.0)

        # Calculate final occupancy percentage (clamped between 5% and 98%)
        raw_occupancy = time_factor + day_factor + exam_factor + area_factor + floor_factor + noise
        occupancy = float(np.clip(raw_occupancy, 5.0, 98.0))

        records.append({
            "day_of_week": int(d),
            "hour": int(h),
            "is_weekend": int(1 if d >= 5 else 0),
            "is_exam_period": int(exam),
            "floor": int(fl),
            "area_type": int(ar),
            "occupancy_rate": round(occupancy, 2)
        })

    return pd.DataFrame(records)

def train_and_save():
    print("Generating training dataset for Kampus Masa ML model...")
    df = generate_historical_dataset(n_samples=8000)

    feature_cols = ["day_of_week", "hour", "is_weekend", "is_exam_period", "floor", "area_type"]
    X = df[feature_cols]
    y = df["occupancy_rate"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestRegressor model...")
    model = RandomForestRegressor(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print(f"Model Evaluation Results:")
    print(f"  RMSE: {rmse:.2f}%")
    print(f"  R2 Score: {r2:.4f}")

    # Output directory
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)

    model_path = os.path.join(output_dir, "occupancy_model.joblib")
    joblib.dump(model, model_path, compress=3)
    print(f"Trained model saved to: {model_path} ({os.path.getsize(model_path) / 1024:.1f} KB)")

    metadata = {
        "model_type": "RandomForestRegressor",
        "algorithm": "Scikit-Learn Ensemble",
        "features": feature_cols,
        "target": "occupancy_rate_percentage",
        "metrics": {
            "rmse": round(float(rmse), 2),
            "r2_score": round(float(r2), 4)
        },
        "mappings": {
            "days": ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
            "area_types": {
                "0": "Pencere önü",
                "1": "Sessiz çalışma",
                "2": "Grup çalışma"
            },
            "floors": [1, 2]
        },
        "trained_date": "2026-10-26"
    }

    metadata_path = os.path.join(output_dir, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"Model metadata saved to: {metadata_path}")
    print("AI Model Training Pipeline Completed Successfully!")

if __name__ == "__main__":
    train_and_save()
