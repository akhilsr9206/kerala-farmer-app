import requests
import os
from dotenv import load_dotenv

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

KERALA_DISTRICTS = {
    "Thiruvananthapuram": (8.5241, 76.9366),
    "Kollam": (8.8932, 76.6141),
    "Pathanamthitta": (9.2648, 76.7870),
    "Alappuzha": (9.4981, 76.3388),
    "Kottayam": (9.5916, 76.5222),
    "Idukki": (9.9189, 77.1025),
    "Ernakulam": (9.9312, 76.2673),
    "Thrissur": (10.5276, 76.2144),
    "Palakkad": (10.7867, 76.6548),
    "Malappuram": (11.0510, 76.0711),
    "Kozhikode": (11.2588, 75.7804),
    "Wayanad": (11.6854, 76.1320),
    "Kannur": (11.8745, 75.3704),
    "Kasaragod": (12.4996, 74.9869),
}

def get_weather(district: str) -> dict:
    """Get current weather for a Kerala district"""
    coords = KERALA_DISTRICTS.get(district)
    
    if not coords:
        return get_default_weather(district)
    
    lat, lon = coords
    
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": WEATHER_API_KEY,
            "units": "metric"
        }
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            return {
                "district": district,
                "temperature": round(data["main"]["temp"], 1),
                "feels_like": round(data["main"]["feels_like"], 1),
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"].title(),
                "wind_speed": data["wind"]["speed"],
                "rainfall_mm": data.get("rain", {}).get("1h", 0),
                "status": "success"
            }
    except Exception as e:
        print(f"Weather API error: {e}")
    
    return get_default_weather(district)

def get_default_weather(district: str) -> dict:
    """Fallback weather data based on Kerala averages"""
    return {
        "district": district,
        "temperature": 29.0,
        "feels_like": 32.0,
        "humidity": 78,
        "description": "Partly Cloudy",
        "wind_speed": 3.5,
        "rainfall_mm": 0,
        "status": "fallback"
    }

def get_farming_advice(weather: dict) -> str:
    """Generate farming advice based on weather"""
    temp = weather["temperature"]
    humidity = weather["humidity"]
    rainfall = weather["rainfall_mm"]
    
    advice = []
    
    if rainfall > 10:
        advice.append("Heavy rain expected — avoid spraying pesticides today")
        advice.append("Check drainage channels to prevent waterlogging")
    elif rainfall > 0:
        advice.append("Light rain — good for recently transplanted crops")
    else:
        advice.append("No rain — ensure irrigation for paddy and vegetables")
    
    if humidity > 85:
        advice.append("High humidity — watch for fungal diseases like blast and blight")
        advice.append("Apply preventive Bordeaux mixture on susceptible crops")
    
    if temp > 35:
        advice.append("Very hot — increase irrigation frequency")
        advice.append("Provide shade for nursery seedlings")
    elif temp < 20:
        advice.append("Cool weather — good for cardamom and coffee flowering")
    
    return " | ".join(advice) if advice else "Weather conditions are normal for farming"