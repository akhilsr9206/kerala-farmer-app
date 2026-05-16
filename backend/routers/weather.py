from fastapi import APIRouter
from services.weather_service import get_weather, get_farming_advice

router = APIRouter()

@router.get("/{district}")
def weather(district: str):
    weather_data = get_weather(district)
    advice = get_farming_advice(weather_data)
    return {
        **weather_data,
        "farming_advice": advice
    }

@router.get("/all/kerala")
def all_districts_weather():
    from services.weather_service import KERALA_DISTRICTS
    results = {}
    for district in list(KERALA_DISTRICTS.keys())[:5]:
        results[district] = get_weather(district)
    return results