import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DATA_GOV_API_KEY")

# Agmarknet API endpoint
AGMARKNET_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# Map our app crop names to Agmarknet commodity names
CROP_TO_COMMODITY = {
    'Paddy':       'Paddy(Common)',
    'Rice':        'Rice',
    'Maize':       'Maize',
    'Wheat':       'Wheat',
    'Jowar':       'Jowar(Sorghum)',
    'Bajra':       'Bajra(Pearl Millet/Cumbu)',
    'Ragi':        'Ragi (Finger Millet)',
    'Groundnut':   'Groundnut',
    'Sesamum':     'Sesamum(Sesame,Gingelly,Til)',
    'Sunflower':   'Sunflower',
    'Soyabean':    'Soyabean',
    'Coconut':     'Coconut',
    'Pepper':      'Black Pepper',
    'Cardamom':    'Cardamom',
    'Cashew':      'Cashewnuts',
    'Arecanut':    'Areca Nut(Betel Nut)',
    'Sugarcane':   'Sugarcane',
    'Ginger':      'Ginger(Dry)',
    'Turmeric':    'Turmeric',
    'Garlic':      'Garlic',
    'Chillies':    'Dry Chillies',
    'Banana':      'Banana',
    'Mango':       'Mango',
    'Papaya':      'Papaya',
    'Pineapple':   'Pineapple',
    'Jackfruit':   'Jack Fruit',
    'Tapioca':     'Tapioca',
    'Tomato':      'Tomato',
    'Onion':       'Onion',
    'Potato':      'Potato',
    'Brinjal':     'Brinjal',
    'Cabbage':     'Cabbage',
    'Cauliflower': 'Cauliflower',
    'Bhindi':      'Bhindi(Ladies Finger)',
    'Pumpkin':     'Pumpkin',
    'Cucumber':    'Cucumber',
    'Sweet Potato':'Sweet Potato',
    'Yam':         'Yam',
    'Coffee':      'Coffee',
    'Rubber':      'Rubber',
}

# Fallback static prices (Rs/quintal → converted to Rs/kg)
FALLBACK_PRICES = {
    'Paddy': 2183, 'Rice': 3500, 'Maize': 1800, 'Wheat': 2275,
    'Coconut': 2800, 'Rubber': 16500, 'Pepper': 48000,
    'Cardamom': 135000, 'Cashew': 17500, 'Arecanut': 25000,
    'Banana': 4000, 'Ginger': 8000, 'Turmeric': 9000,
    'Garlic': 8000, 'Tapioca': 1200, 'Tomato': 2500,
    'Onion': 3000, 'Potato': 2000, 'Sugarcane': 350,
    'Groundnut': 6000, 'Chillies': 12000, 'Coffee': 20000,
}

def fetch_live_price(crop_name: str, state: str = "Kerala") -> dict:
    """Fetch real-time price from data.gov.in Agmarknet API"""
    
    commodity = CROP_TO_COMMODITY.get(crop_name, crop_name)
    
    if not API_KEY or API_KEY == "79b464db66ec23bdd000001b51af2a7f6394e5f67f7f9e455041571":
        return get_fallback_price(crop_name)
    
    try:
        params = {
            "api-key": API_KEY,
            "format": "json",
            "limit": 10,
            "filters[State]": state,
            "filters[Commodity]": commodity,
        }
        
        response = requests.get(AGMARKNET_URL, params=params, timeout=8)
        data = response.json()
        
        records = data.get("records", [])
        
        if not records:
            # Try without state filter for broader results
            params.pop("filters[State]")
            response = requests.get(AGMARKNET_URL, params=params, timeout=8)
            data = response.json()
            records = data.get("records", [])
        
        if records:
            # Get most recent record
            record = records[0]
            modal_price = float(record.get("Modal_Price", 0))
            min_price   = float(record.get("Min_Price", 0))
            max_price   = float(record.get("Max_Price", 0))
            market      = record.get("Market", "")
            district    = record.get("District", "")
            arrival_date= record.get("Arrival_Date", "")
            
            # Convert quintal to kg (1 quintal = 100 kg)
            return {
                "crop":          crop_name,
                "commodity":     commodity,
                "modal_price":   round(modal_price / 100, 2),
                "min_price":     round(min_price / 100, 2),
                "max_price":     round(max_price / 100, 2),
                "unit":          "Rs/kg",
                "market":        market,
                "district":      district,
                "state":         state,
                "date":          arrival_date,
                "source":        "Agmarknet (Live)",
                "is_live":       True
            }
    
    except Exception as e:
        print(f"Agmarknet API error for {crop_name}: {e}")
    
    return get_fallback_price(crop_name)


def get_fallback_price(crop_name: str) -> dict:
    """Return static fallback price"""
    price_per_quintal = FALLBACK_PRICES.get(crop_name, 5000)
    price_per_kg = price_per_quintal / 100
    
    return {
        "crop":        crop_name,
        "commodity":   CROP_TO_COMMODITY.get(crop_name, crop_name),
        "modal_price": round(price_per_kg, 2),
        "min_price":   round(price_per_kg * 0.9, 2),
        "max_price":   round(price_per_kg * 1.1, 2),
        "unit":        "Rs/kg",
        "market":      "Reference Price",
        "district":    "Kerala",
        "state":       "Kerala",
        "date":        datetime.now().strftime("%d/%m/%Y"),
        "source":      "Reference (Static)",
        "is_live":     False
    }


def fetch_multiple_prices(crops: list, state: str = "Kerala") -> dict:
    """Fetch prices for multiple crops"""
    results = {}
    for crop in crops:
        results[crop] = fetch_live_price(crop, state)
    return results