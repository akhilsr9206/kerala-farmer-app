from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import ask_llm_yield_explanation
import pickle, numpy as np, os

router = APIRouter()

MODEL_PATH    = "ml_models/yield_model.pkl"
ENCODERS_PATH = "ml_models/encoders.pkl"
model = encoders = None

def load_model():
    global model, encoders
    try:
        with open(MODEL_PATH, 'rb') as f:    model    = pickle.load(f)
        with open(ENCODERS_PATH, 'rb') as f: encoders = pickle.load(f)
        print("✅ XGBoost yield model loaded!")
    except Exception as e:
        print(f"⚠️ Model load failed: {e}")

load_model()

MARKET_PRICES = {
    'Paddy':21,'Coconut':28,'Rubber':165,'Banana':40,'Pepper':480,
    'Tapioca':12,'Cashew':175,'Cardamom':1350,'Coffee':200,
    'Ginger':80,'Arecanut':250,'Turmeric':90,'Sugarcane':3,
    'Groundnut':60,'Maize':18,'Onion':30,'Potato':20,
    'Ragi':35,'Sesame':130,'Garlic':80,'Chilli':120,
    'Sweet Potato':25
}

class YieldRequest(BaseModel):
    crop_name: str
    area: float
    district: str
    rainfall: float
    soil_type: str
    fertilizer_used: str
    irrigation: str
    temperature: float = 28.0
    humidity: float = 75.0
    farming_experience: int = 5
    fertilizer_kg: float = 50.0
    pesticide_kg: float = 2.0

def safe_encode(encoder, value):
    try:    return int(encoder.transform([value])[0])
    except: return 0

def predict_xgboost(req: YieldRequest) -> float:
    if not model or not encoders:
        return _fallback(req)
    try:
        crop_enc    = safe_encode(encoders['crop'], req.crop_name)
        season_map  = {
            'kharif':'Kharif','kharif (june-nov)':'Kharif',
            'rabi':'Rabi','rabi (nov-mar)':'Rabi',
            'summer':'Summer','whole year':'Whole Year',
            'autumn':'Autumn','winter':'Winter','organic':'Kharif'
        }
        season      = season_map.get(req.fertilizer_used.lower(), 'Kharif')
        season_enc  = safe_encode(encoders['season'], season)
        features    = np.array([[
            crop_enc, season_enc, req.area,
            req.rainfall, req.fertilizer_kg, req.pesticide_kg
        ]], dtype=float)
        return max(float(model.predict(features)[0]), 0.05)
    except Exception as e:
        print(f"XGBoost error: {e}")
        return _fallback(req)

def _fallback(req: YieldRequest) -> float:
    base = {'paddy':1.8,'coconut':1.3,'rubber':1.2,'banana':18.0,
            'pepper':0.5,'tapioca':11.0,'cashew':0.5,'cardamom':0.08,
            'ginger':4.9,'arecanut':1.3,'turmeric':2.0}.get(req.crop_name.lower(), 1.5)
    return base * min(req.rainfall/2000, 1.2) * (1.2 if req.irrigation=='drip' else 1.0) * req.area

@router.post("/predict")
def predict_yield(req: YieldRequest):
    predicted = predict_xgboost(req)
    price     = MARKET_PRICES.get(req.crop_name, 50)
    income    = predicted * price * 1000

    explanation = ask_llm_yield_explanation(
        crop=req.crop_name, area=req.area, district=req.district,
        rainfall=req.rainfall, soil=req.soil_type, irrigation=req.irrigation,
        predicted=predicted, price=price, income=income
    )

    return {
        "estimated_yield":  round(predicted, 2),
        "yield_per_acre":   round(predicted / req.area, 2),
        "unit":             "tonnes",
        "estimated_income": round(income, 0),
        "price_per_kg":     price,
        "model_used":       "XGBoost (Kaggle Dataset, R²=90.6%)" if model else "Formula Fallback",
        "crop":             req.crop_name,
        "district":         req.district,
        "explanation":      explanation
    }

@router.get("/model-info")
def model_info():
    return {
        "model_loaded":    model is not None,
        "model_type":      "XGBoost Regressor",
        "training_data":   "Kaggle India Crop Yield (19,689 rows)",
        "r2_score":        "0.9058 (90.6%)",
        "crops_supported": encoders['crop_names'] if encoders else [],
        "status":          "✅ Ready" if model else "⚠️ Fallback"
    }