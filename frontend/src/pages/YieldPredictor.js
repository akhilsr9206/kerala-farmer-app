import React, { useState } from 'react';
import axios from 'axios';

const CROPS = [
  // Cereals
  'Paddy',
  'Rice',
  'Maize',
  'Wheat',
  'Jowar',
  'Bajra',
  'Ragi',
  'Barley',

  // Pulses
  'Arhar/Tur',
  'Gram',
  'Green Gram',
  'Black Gram',
  'Masoor',
  'Horse Gram',
  'Peas & Beans',

  // Oil Seeds
  'Groundnut',
  'Sesamum',
  'Sunflower',
  'Soyabean',
  'Castor Seed',
  'Linseed',
  'Mustard',
  'Safflower',

  // Plantation / Cash Crops
  'Coconut',
  'Rubber',
  'Coffee',
  'Tea',
  'Cardamom',
  'Pepper',
  'Cashew',
  'Arecanut',
  'Cocoa',
  'Sugarcane',
  'Cotton',
  'Jute',
  'Mesta',
  'Tobacco',

  // Spices
  'Ginger',
  'Turmeric',
  'Garlic',
  'Chillies',
  'Coriander',
  'Cumin',

  // Fruits
  'Banana',
  'Mango',
  'Papaya',
  'Pineapple',
  'Jackfruit',
  'Guava',
  'Sapota',
  'Orange',
  'Lemon',

  // Vegetables
  'Tapioca',
  'Tomato',
  'Onion',
  'Potato',
  'Brinjal',
  'Cabbage',
  'Cauliflower',
  'Bhindi',
  'Pumpkin',
  'Cucumber',

  // Kerala Important
  'Nutmeg',
  'Clove',
  'Vanilla',
  'Yam',
  'Sweet Potato'
];

const DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod'
];

const SOILS = [
  'Laterite',
  'Alluvial',
  'Forest soil',
  'Coastal sandy',
  'Red soil',
  'Black soil',
  'Loamy'
];

const IRRIGATIONS = [
  'drip',
  'flood',
  'rain-fed',
  'sprinkler'
];

const SEASONS = [
  'Kharif',
  'Rabi',
  'Summer',
  'Whole Year'
];

export default function YieldPredictor({ user }) {
  const [form, setForm] = useState({
    crop_name: 'Paddy',
    area: '1',
    district: user?.district || 'Kollam',
    rainfall: '2200',
    soil_type: 'Laterite',
    fertilizer_used: 'Kharif',
    irrigation: 'drip',
    temperature: '28',
    humidity: '75',
    farming_experience: '5'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const predict = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        'http://localhost:8000/api/yield/predict',
        {
          ...form,
          area: parseFloat(form.area),
          rainfall: parseFloat(form.rainfall),
          temperature: parseFloat(form.temperature),
          humidity: parseFloat(form.humidity),
          farming_experience: parseInt(form.farming_experience)
        }
      );

      setResult(res.data);
    } catch (error) {
      setResult({
        explanation: 'Error predicting yield. Please check backend server and try again.'
      });
    }

    setLoading(false);
  };

  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/\*/g, '');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <h2 style={{ color: '#1b5e20', marginBottom: '8px' }}>
        📊 Real ML Yield Predictor
      </h2>

      <p style={{
        color: '#666',
        marginBottom: '24px',
        fontSize: '14px'
      }}>
        Powered by XGBoost model trained on real crop yield dataset
      </p>

      {/* Input Form */}
      <div className="card">

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>

          {/* Crop */}
          <div>
            <label className="form-label">Crop</label>
            <select
              value={form.crop_name}
              onChange={(e) => updateField('crop_name', e.target.value)}
            >
              {CROPS.map(crop => (
                <option key={crop}>{crop}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="form-label">District</label>
            <select
              value={form.district}
              onChange={(e) => updateField('district', e.target.value)}
            >
              {DISTRICTS.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="form-label">Area (acres)</label>
            <input
              type="number"
              value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
            />
          </div>

          {/* Rainfall */}
          <div>
            <label className="form-label">Rainfall (mm)</label>
            <input
              type="number"
              value={form.rainfall}
              onChange={(e) => updateField('rainfall', e.target.value)}
            />
          </div>

          {/* Soil */}
          <div>
            <label className="form-label">Soil Type</label>
            <select
              value={form.soil_type}
              onChange={(e) => updateField('soil_type', e.target.value)}
            >
              {SOILS.map(soil => (
                <option key={soil}>{soil}</option>
              ))}
            </select>
          </div>

          {/* Irrigation */}
          <div>
            <label className="form-label">Irrigation</label>
            <select
              value={form.irrigation}
              onChange={(e) => updateField('irrigation', e.target.value)}
            >
              {IRRIGATIONS.map(i => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="form-label">Season</label>
            <select
              value={form.fertilizer_used}
              onChange={(e) => updateField('fertilizer_used', e.target.value)}
            >
              {SEASONS.map(season => (
                <option key={season}>{season}</option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="form-label">Temperature (°C)</label>
            <input
              type="number"
              value={form.temperature}
              onChange={(e) => updateField('temperature', e.target.value)}
            />
          </div>

          {/* Humidity */}
          <div>
            <label className="form-label">Humidity (%)</label>
            <input
              type="number"
              value={form.humidity}
              onChange={(e) => updateField('humidity', e.target.value)}
            />
          </div>

          {/* Experience */}
          <div>
            <label className="form-label">Experience (Years)</label>
            <input
              type="number"
              value={form.farming_experience}
              onChange={(e) => updateField('farming_experience', e.target.value)}
            />
          </div>

        </div>

        <button
          className="btn-primary"
          style={{ marginTop: '22px' }}
          onClick={predict}
          disabled={loading}
        >
          {loading ? '⏳ Predicting...' : '📊 Predict Yield'}
        </button>

      </div>

      {/* Result */}
      {result && (
        <div
          className="card"
          style={{ borderLeft: '5px solid #2196F3' }}
        >

          <div style={{
            display: 'inline-block',
            background: '#e3f2fd',
            color: '#1565c0',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '18px'
          }}>
            🤖 {result.model_used || 'ML Model'}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '22px'
          }}>

            {/* Total Yield */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#1565c0'
              }}>
                {result.estimated_yield}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                tonnes total
              </div>
            </div>

            {/* Per Acre */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#1b5e20'
              }}>
                {result.yield_per_acre}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                tonnes / acre
              </div>
            </div>

            {/* Income */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#e65100'
              }}>
                ₹{result.estimated_income?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                estimated income
              </div>
            </div>

            {/* Crop */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#6a1b9a'
              }}>
                {result.crop}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                {result.district}
              </div>
            </div>

          </div>

          <h3 style={{
            color: '#1b5e20',
            marginBottom: '12px'
          }}>
            🤖 AI Recommendations
          </h3>

          <p style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.8',
            color: '#333',
            fontSize: '14px'
          }}>
            {cleanText(result.explanation)}
          </p>

        </div>
      )}

    </div>
  );
}