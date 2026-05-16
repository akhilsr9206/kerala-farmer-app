"""
Kerala Farmer App — XGBoost Yield Prediction Model
Trained on real Kaggle India Crop Yield dataset (19,689 rows)
Place crop_yield.csv in backend/ml_models/ folder before running.
Run from backend folder: python ml_models/train_yield_model.py
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import pickle
import os

print("=" * 55)
print("  Kerala Farmer App — XGBoost Yield Model Training")
print("=" * 55)

# Resolve path to csv (works whether run from backend/ or ml_models/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, 'crop_yield.csv')
if not os.path.exists(CSV_PATH):
    CSV_PATH = 'crop_yield.csv'

df = pd.read_csv(CSV_PATH)
print(f"\n📂 Dataset loaded: {len(df)} total rows")

# Crop mapping
crop_mapping = {
    'Rice':         'Paddy',
    'Coconut ':     'Coconut',
    'Black pepper': 'Pepper',
    'Cardamom':     'Cardamom',
    'Cashewnut':    'Cashew',
    'Banana':       'Banana',
    'Tapioca':      'Tapioca',
    'Ginger':       'Ginger',
    'Arecanut':     'Arecanut',
    'Turmeric':     'Turmeric',
}

df = df[df['Crop'].isin(crop_mapping.keys())].copy()
df['Crop'] = df['Crop'].map(crop_mapping)
print(f"🌾 After crop filter: {len(df)} rows")

# Normalize Coconut yield (nuts to tonnes, 1 tonne ≈ 6500 nuts)
df.loc[df['Crop'] == 'Coconut', 'Yield'] /= 6500

# Drop State and Crop_Year as not needed
df = df.drop(columns=['Crop_Year', 'State', 'Production'])

# Clean Season
df['Season'] = df['Season'].str.strip()

# Remove outliers per crop (5th-95th percentile)
clean = []
for crop in df['Crop'].unique():
    sub = df[df['Crop'] == crop]
    lo = sub['Yield'].quantile(0.05)
    hi = sub['Yield'].quantile(0.95)
    clean.append(sub[(sub['Yield'] >= lo) & (sub['Yield'] <= hi)])

df = pd.concat(clean).reset_index(drop=True)
print(f"✅ After outlier removal: {len(df)} rows")
print(f"\n📋 Rows per crop:")
print(df['Crop'].value_counts().to_string())

# Encode
le_crop   = LabelEncoder().fit(df['Crop'])
le_season = LabelEncoder().fit(df['Season'])
df['crop_enc']   = le_crop.transform(df['Crop'])
df['season_enc'] = le_season.transform(df['Season'])

features = ['crop_enc', 'season_enc', 'Area',
            'Annual_Rainfall', 'Fertilizer', 'Pesticide']

X = df[features]
y = df['Yield']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"\n📊 Train: {len(X_train)} | Test: {len(X_test)}")

print("\n⚙️  Training XGBoost on real dataset...")
model = XGBRegressor(
    n_estimators=300, max_depth=6, learning_rate=0.08,
    subsample=0.85, colsample_bytree=0.85,
    min_child_weight=3, gamma=0.1,
    random_state=42, verbosity=0
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae  = mean_absolute_error(y_test, y_pred)
r2   = r2_score(y_test, y_pred)

print(f"\n📊 Model Evaluation Results:")
print(f"   R² Score : {r2:.4f}  ({r2*100:.1f}% variance explained)")
print(f"   RMSE     : {rmse:.4f} tonnes/acre")
print(f"   MAE      : {mae:.4f} tonnes/acre")
print(f"   Test rows: {len(y_test)}")

fi = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print(f"\n🔍 Feature Importance:")
for feat, imp in fi.items():
    print(f"   {feat:<20} {imp:.4f}")

os.makedirs(BASE_DIR, exist_ok=True)
with open(os.path.join(BASE_DIR, 'yield_model.pkl'), 'wb') as f:
    pickle.dump(model, f)
with open(os.path.join(BASE_DIR, 'encoders.pkl'), 'wb') as f:
    pickle.dump({
        'crop': le_crop, 'season': le_season,
        'features': features,
        'crop_names': list(le_crop.classes_),
        'season_names': list(le_season.classes_),
    }, f)

print(f"\n✅ Model saved   → ml_models/yield_model.pkl")
print(f"✅ Encoders saved → ml_models/encoders.pkl")
print(f"\n🎉 Done! R² = {r2*100:.1f}%")
