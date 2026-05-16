from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import ask_llm_market_strategy, ask_llm_nutrition
from services.market_service import fetch_live_price, fetch_multiple_prices, FALLBACK_PRICES

router = APIRouter()

class MarketRequest(BaseModel):
    crop_name: str
    quantity:  float
    district:  str

@router.get("/prices")
def get_all_prices():
    prices = {crop: round(qp / 100, 2) for crop, qp in FALLBACK_PRICES.items()}
    return {"prices": prices, "unit": "Rs per kg"}

@router.get("/live-price/{crop_name}")
def get_live_price(crop_name: str, state: str = "Kerala"):
    return fetch_live_price(crop_name, state)

@router.post("/live-prices")
def get_live_prices(request: dict):
    crops = request.get("crops", [])
    state = request.get("state", "Kerala")
    return {"prices": fetch_multiple_prices(crops, state), "count": len(crops)}

@router.post("/strategy")
def market_strategy(req: MarketRequest):
    price_data      = fetch_live_price(req.crop_name, "Kerala")
    price           = price_data["modal_price"]
    estimated_value = price * req.quantity

    strategy = ask_llm_market_strategy(
        crop=req.crop_name,
        quantity=req.quantity,
        district=req.district,
        price=price,
        source=price_data["source"],
        estimated_value=estimated_value
    )

    return {
        "crop":            req.crop_name,
        "live_price":      price_data,
        "quantity_kg":     req.quantity,
        "estimated_value": round(estimated_value, 2),
        "strategy":        strategy
    }

@router.get("/nutrition/{crop}")
def crop_nutrition(crop: str, language: str = "english"):
    return {"crop": crop, "nutrition_info": ask_llm_nutrition(crop, language)}