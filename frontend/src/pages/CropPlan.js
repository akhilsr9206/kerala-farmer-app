import React, { useState, useEffect } from 'react';
import axios from 'axios';
const cleanText = (text) => {
  if (!text) return "";

  return text
    .replace(/\*\*/g, '')   
    .replace(/\*/g, '')     
    .replace(/__/g, '')     
    .replace(/`/g, '');     
};
const CROPS = [
  // Cereals
  'Paddy', 'Rice', 'Maize', 'Wheat', 'Jowar', 'Bajra', 'Ragi', 'Barley',
  // Pulses
  'Arhar/Tur', 'Gram', 'Green Gram', 'Black Gram', 'Masoor',
  'Horse Gram', 'Peas & Beans',
  // Oil Seeds
  'Groundnut', 'Sesamum', 'Sunflower', 'Soyabean',
  'Castor Seed', 'Linseed', 'Mustard', 'Safflower',
  // Plantation / Cash Crops
  'Coconut', 'Rubber', 'Coffee', 'Tea', 'Cardamom', 'Pepper',
  'Cashew', 'Arecanut', 'Cocoa', 'Sugarcane', 'Cotton',
  'Jute', 'Mesta', 'Tobacco',
  // Spices
  'Ginger', 'Turmeric', 'Garlic', 'Chillies', 'Coriander', 'Cumin',
  // Fruits
  'Banana', 'Mango', 'Papaya', 'Pineapple', 'Jackfruit',
  'Guava', 'Sapota', 'Orange', 'Lemon',
  // Vegetables
  'Tapioca', 'Tomato', 'Onion', 'Potato', 'Brinjal',
  'Cabbage', 'Cauliflower', 'Bhindi', 'Pumpkin', 'Cucumber',
  // Kerala Important
  'Nutmeg', 'Clove', 'Vanilla', 'Yam', 'Sweet Potato'
];

const DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
  'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
  'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
];

const SOILS = [
  'Laterite', 'Alluvial', 'Forest soil',
  'Coastal sandy', 'Red soil', 'Black soil', 'Loamy'
];

const IRRIGATIONS = ['drip', 'flood', 'rain-fed', 'sprinkler'];

const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Whole Year'];

const MARKET_PRICES = {
  'Paddy': 21, 'Rice': 35, 'Maize': 18, 'Wheat': 22,
  'Jowar': 20, 'Bajra': 18, 'Ragi': 35, 'Barley': 18,
  'Arhar/Tur': 80, 'Gram': 65, 'Green Gram': 75,
  'Black Gram': 70, 'Masoor': 60, 'Horse Gram': 45,
  'Peas & Beans': 50, 'Groundnut': 60, 'Sesamum': 130,
  'Sunflower': 55, 'Soyabean': 45, 'Castor Seed': 55,
  'Linseed': 60, 'Mustard': 55, 'Safflower': 50,
  'Coconut': 28, 'Rubber': 165, 'Coffee': 200, 'Tea': 180,
  'Cardamom': 1350, 'Pepper': 480, 'Cashew': 175,
  'Arecanut': 250, 'Cocoa': 200, 'Sugarcane': 3,
  'Cotton': 65, 'Jute': 45, 'Mesta': 35, 'Tobacco': 90,
  'Ginger': 80, 'Turmeric': 90, 'Garlic': 80,
  'Chillies': 120, 'Coriander': 70, 'Cumin': 200,
  'Banana': 40, 'Mango': 60, 'Papaya': 25, 'Pineapple': 30,
  'Jackfruit': 20, 'Guava': 40, 'Sapota': 35,
  'Orange': 50, 'Lemon': 60,
  'Tapioca': 12, 'Tomato': 25, 'Onion': 30, 'Potato': 20,
  'Brinjal': 20, 'Cabbage': 15, 'Cauliflower': 20,
  'Bhindi': 30, 'Pumpkin': 15, 'Cucumber': 18,
  'Nutmeg': 600, 'Clove': 700, 'Vanilla': 4000,
  'Yam': 35, 'Sweet Potato': 25
};

export default function CropPlan({ user }) {
  const [form, setForm] = useState({
    crop_name: 'Paddy',
    soil_type: 'Laterite',
    area: '1',
    season: 'Kharif',
    district: user.district || 'Kollam',
    rainfall: '2000',
    irrigation: 'drip',
    fertilizer_kg: '50',
    pesticide_kg: '2',
    farming_experience: '5',
    notes: ''
  });

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.district) return;
    setWeatherLoading(true);
    axios.get(`http://localhost:8000/api/weather/${form.district}`)
      .then(r => { setWeather(r.data); setWeatherLoading(false); })
      .catch(() => setWeatherLoading(false));
  }, [form.district]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const generatePlan = async () => {
    setLoading(true);
    setResult(null);
    setGoals(null);
    try {
      const payload = {
        crop_name:  form.crop_name,
        soil_type:  form.soil_type,
        area:       parseFloat(form.area),
        season:     form.season,
        district:   form.district,
        rainfall:   parseFloat(form.rainfall),
        fertilizer: form.fertilizer_kg,
        notes:      form.notes,
        user_id:    user.user_id,
      };

      const [planRes, logRes] = await Promise.all([
        axios.post('http://localhost:8000/api/crops/plan', {
          ...payload,
          irrigation:         form.irrigation,
          fertilizer_kg:      parseFloat(form.fertilizer_kg),
          pesticide_kg:       parseFloat(form.pesticide_kg),
          farming_experience: parseInt(form.farming_experience),
        }),
        axios.post('http://localhost:8000/api/crops/log', payload)
      ]);

      setResult(planRes.data.crop_plan);
      setGoals(logRes.data.goals);
    } catch {
      setResult('Error generating plan. Please try again.');
    }
    setLoading(false);
  };

  const estimatedPrice = MARKET_PRICES[form.crop_name] || 50;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <h2 style={{ color: '#1b5e20', marginBottom: '6px' }}>🌱 Crop Plan Generator</h2>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        AI-generated 3-month plan with real-time weather data
      </p>

      {/* Weather Card */}
      {weatherLoading && (
        <div style={{
          background: 'linear-gradient(135deg,#1b5e20,#2d7a2d)',
          borderRadius: '12px', padding: '14px 20px',
          color: 'white', fontSize: '14px', marginBottom: '20px'
        }}>
          🌤️ Loading weather for {form.district}...
        </div>
      )}

      {!weatherLoading && weather && (
        <div style={{
          background: 'linear-gradient(135deg,#1b5e20,#2d7a2d)',
          borderRadius: '14px', padding: '16px 22px', marginBottom: '20px',
          color: 'white', display: 'flex', gap: '20px',
          alignItems: 'center', flexWrap: 'wrap',
          boxShadow: '0 4px 14px rgba(27,94,32,0.3)'
        }}>
          <div>
            <div style={{ fontSize: '30px', fontWeight: 700 }}>
              {weather.temperature}°C
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>
              {weather.description} · Feels {weather.feels_like}°C
            </div>
          </div>
          {[
            { icon: '💧', val: `${weather.humidity}%`, label: 'Humidity' },
            { icon: '💨', val: `${weather.wind_speed} m/s`, label: 'Wind' },
            { icon: '🌧️', val: `${weather.rainfall_mm}mm`, label: 'Rain' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '8px 14px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px' }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{s.val}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
          <div style={{
            flex: 1, minWidth: '180px',
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px'
          }}>
            🌾 {weather.farming_advice}
          </div>
          <button onClick={() => {
            setWeatherLoading(true);
            axios.get(`http://localhost:8000/api/weather/${form.district}`)
              .then(r => { setWeather(r.data); setWeatherLoading(false); })
              .catch(() => setWeatherLoading(false));
          }} style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '7px 14px', borderRadius: '8px', fontSize: '12px'
          }}>
            🔄 Refresh
          </button>
        </div>
      )}

      {/* Market price hint */}
      <div style={{
        background: '#fff8e1', borderRadius: '10px',
        padding: '10px 16px', marginBottom: '20px',
        fontSize: '13px', color: '#e65100',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        💰 Current market price for <strong>{form.crop_name}</strong>:
        &nbsp;<strong>₹{estimatedPrice}/kg</strong>
        &nbsp;· Change crop to see updated price
      </div>

      {/* Form */}
      <div className="card">

        {/* Row 1 — Crop, District, Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Crop Name
            </label>
            <select value={form.crop_name} onChange={e => set('crop_name', e.target.value)}>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              District
            </label>
            <select value={form.district} onChange={e => set('district', e.target.value)}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Land Area (acres)
            </label>
            <input type="number" value={form.area} onChange={e => set('area', e.target.value)} />
          </div>
        </div>

        {/* Row 2 — Soil, Season, Irrigation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Soil Type
            </label>
            <select value={form.soil_type} onChange={e => set('soil_type', e.target.value)}>
              {SOILS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Season
            </label>
            <select value={form.season} onChange={e => set('season', e.target.value)}>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Irrigation Method
            </label>
            <select value={form.irrigation} onChange={e => set('irrigation', e.target.value)}>
              {IRRIGATIONS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3 — Rainfall, Fertilizer, Pesticide */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Rainfall (mm)
              {weather && (
                <span style={{ color: '#4CAF50', fontWeight: 400, marginLeft: '6px' }}>
                  — live: {weather.rainfall_mm}mm
                </span>
              )}
            </label>
            <input type="number" value={form.rainfall} onChange={e => set('rainfall', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Fertilizer (kg/acre)
            </label>
            <input type="number" value={form.fertilizer_kg} onChange={e => set('fertilizer_kg', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Pesticide (kg/acre)
            </label>
            <input type="number" value={form.pesticide_kg} onChange={e => set('pesticide_kg', e.target.value)} />
          </div>
        </div>

        {/* Row 4 — Experience, Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Farming Experience (years)
            </label>
            <input type="number" value={form.farming_experience} onChange={e => set('farming_experience', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Additional Notes (optional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. organic farming preferred, near water body..."
            />
          </div>
        </div>

        <button className="btn-primary" onClick={generatePlan}
          disabled={loading} style={{ fontSize: '15px', padding: '13px' }}>
          {loading ? '⏳ Generating AI Crop Plan...' : '🌱 Generate Crop Plan'}
        </button>
      </div>

      {/* 2-Week Goals */}
      {goals && (
        <div className="card" style={{ borderLeft: '5px solid #4CAF50' }}>
          <h3 style={{ color: '#1b5e20', marginBottom: '12px' }}>🎯 Your 2-Week Goals</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#444', fontSize: '14px' }}>
            {cleanText(goals)}
          </p>
        </div>
      )}

      {/* 3-Month Plan */}
      {result && (
        <div className="card">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '14px',
            flexWrap: 'wrap', gap: '8px'
          }}>
            <h3 style={{ color: '#1b5e20' }}>📋 Your 3-Month AI Crop Plan</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { bg: '#e8f5e9', color: '#1b5e20', text: `🌾 ${form.crop_name}` },
                { bg: '#e3f2fd', color: '#1565c0', text: `📍 ${form.district}` },
                { bg: '#fff8e1', color: '#e65100', text: `💰 ₹${estimatedPrice}/kg` },
              ].map((badge, i) => (
                <span key={i} style={{
                  background: badge.bg, color: badge.color,
                  padding: '4px 12px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 600
                }}>
                  {badge.text}
                </span>
              ))}
            </div>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.85', color: '#333', fontSize: '14px' }}>
            {cleanText(result)}
          </p>
        </div>
      )}

    </div>
  );
}