import React, { useState, useRef } from 'react';
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
  'Paddy', 'Rice', 'Maize', 'Wheat', 'Jowar', 'Bajra', 'Ragi', 'Barley',
  'Arhar/Tur', 'Gram', 'Green Gram', 'Black Gram', 'Masoor', 'Horse Gram', 'Peas & Beans',
  'Groundnut', 'Sesamum', 'Sunflower', 'Soyabean', 'Castor Seed', 'Linseed', 'Mustard',
  'Coconut', 'Rubber', 'Coffee', 'Tea', 'Cardamom', 'Pepper', 'Cashew', 'Arecanut',
  'Sugarcane', 'Cotton', 'Ginger', 'Turmeric', 'Garlic', 'Chillies',
  'Banana', 'Mango', 'Papaya', 'Pineapple', 'Jackfruit',
  'Tapioca', 'Tomato', 'Onion', 'Potato', 'Brinjal',
  'Cabbage', 'Cauliflower', 'Bhindi', 'Pumpkin', 'Cucumber',
  'Nutmeg', 'Clove', 'Vanilla', 'Yam', 'Sweet Potato'
];

const DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
];

const SYMPTOM_TAGS = [
  'Yellow leaves', 'Brown spots', 'Wilting', 'White powder',
  'Holes in leaves', 'Stem rot', 'Root damage', 'Black spots',
  'Curling leaves', 'Stunted growth', 'Sticky residue',
  'Discoloration', 'Fruit rot', 'Leaf fall', 'Bark damage'
];

export default function PestDetector({ user }) {
  const [form, setForm] = useState({
    crop_name: 'Paddy',
    symptoms: '',
    district: user.district || 'Kollam',
    language: 'english'
  });
  const [image, setImage]               = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult]             = useState(null);
  const [common, setCommon]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState('');
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image too large. Max 10MB allowed.');
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addTag = (tag) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms ? prev.symptoms + ', ' + tag : tag
    }));
  };

  const analyze = async () => {
    if (!form.symptoms.trim() && !image) {
      alert('Please upload a photo or describe symptoms');
      return;
    }
    setLoading(true);
    setResult(null);
    setCommon(null);
    setAnalysisMethod('');

    try {
      const formData = new FormData();
      formData.append('crop_name', form.crop_name);
      formData.append('symptoms', form.symptoms || 'Please analyze from uploaded image');
      formData.append('district', form.district);
      formData.append('language', form.language);
      if (image) formData.append('image', image);

      const res = await axios.post(
        'http://localhost:8000/api/pest/analyze',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setResult(res.data.analysis);
      setAnalysisMethod(res.data.analysis_method || '');
    } catch (e) {
      setResult('Error analyzing. Please try again.');
    }
    setLoading(false);
  };

  const loadCommon = async () => {
    setLoading(true);
    setCommon(null);
    setResult(null);
    try {
      const res = await axios.get(
        `http://localhost:8000/api/pest/common/${form.district}`
      );
      setCommon(res.data.common_pests);
    } catch {
      setCommon('Error loading. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <h2 style={{ color: '#1b5e20', fontSize: '24px', marginBottom: '6px' }}>
        🐛 AI Pest & Disease Detector
      </h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Upload a crop photo for instant AI diagnosis using
        <strong style={{ color: '#1565c0' }}> Groq Vision (Llama 4 Scout)</strong>
        — or describe symptoms for text analysis
      </p>

      <div className="card">

        {/* Row 1 — Crop, District, Language */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Affected Crop
            </label>
            <select value={form.crop_name} onChange={e => setForm({...form, crop_name: e.target.value})}>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Your District
            </label>
            <select value={form.district} onChange={e => setForm({...form, district: e.target.value})}>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Response Language
            </label>
            <select value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
              <option value="english">English</option>
              <option value="malayalam">മലയാളം</option>
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
          📷 Upload Crop Photo
          <span style={{ fontWeight: 400, color: '#1565c0', marginLeft: '8px', fontSize: '12px' }}>
            ✨ AI will analyze the image directly using Groq Vision
          </span>
        </label>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !imagePreview && fileRef.current.click()}
          style={{
            border: `2px dashed ${dragOver ? '#1565c0' : '#a5d6a7'}`,
            borderRadius: '12px',
            background: dragOver ? '#e3f2fd' : imagePreview ? '#fafafa' : '#f1f8f1',
            minHeight: '160px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
            gap: '10px', cursor: imagePreview ? 'default' : 'pointer',
            transition: 'all 0.2s', marginBottom: '20px', padding: '16px'
          }}>

          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={handleImageChange} />

          {imagePreview ? (
            <div style={{ position: 'relative', display: 'inline-block', textAlign: 'center' }}>
              <img src={imagePreview} alt="preview" style={{
                maxHeight: '220px', maxWidth: '100%',
                borderRadius: '10px', boxShadow: '0 3px 12px rgba(0,0,0,0.15)'
              }} />
              <button onClick={e => { e.stopPropagation(); removeImage(); }} style={{
                position: 'absolute', top: '-10px', right: '-10px',
                background: '#f44336', color: 'white', borderRadius: '50%',
                width: '28px', height: '28px', fontSize: '13px',
                padding: '0', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: 'none', cursor: 'pointer'
              }}>✕</button>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#4CAF50', fontWeight: 600 }}>
                ✅ {image?.name}
              </div>
              <div style={{ fontSize: '11px', color: '#1565c0', marginTop: '4px' }}>
                🤖 Groq Vision will analyze this image
              </div>
              <button onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
                style={{
                  marginTop: '8px', background: '#e8f5e9', color: '#1b5e20',
                  border: '1px solid #a5d6a7', padding: '5px 14px',
                  borderRadius: '8px', fontSize: '12px'
                }}>
                Change Photo
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '44px' }}>📷</div>
              <div style={{ color: dragOver ? '#1565c0' : '#2d7a2d', fontWeight: 600, fontSize: '15px' }}>
                {dragOver ? 'Drop image here!' : 'Click to upload or drag & drop'}
              </div>
              <div style={{ color: '#888', fontSize: '13px' }}>
                Take a photo of affected leaves, stem, roots, or fruits
              </div>
              <button onClick={e => { e.stopPropagation(); fileRef.current.click(); }}
                style={{
                  background: '#2d7a2d', color: 'white',
                  padding: '9px 22px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 600
                }}>
                Choose Photo
              </button>
            </>
          )}
        </div>

        {/* Symptoms */}
        <label style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
          Describe Symptoms
          <span style={{ fontWeight: 400, color: '#888', marginLeft: '6px' }}>
            (optional if image uploaded)
          </span>
        </label>
        <textarea value={form.symptoms} onChange={e => setForm({...form, symptoms: e.target.value})}
          placeholder="e.g. Yellow leaves with brown spots, holes in stem, white powder on leaves, plant wilting..."
          style={{ minHeight: '80px', resize: 'vertical', marginBottom: '12px' }} />

        {/* Quick tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>Quick add:</span>
          {SYMPTOM_TAGS.map(tag => (
            <button key={tag} onClick={() => addTag(tag)} style={{
              background: '#e8f5e9', color: '#1b5e20',
              border: '1px solid #c8e6c9', padding: '4px 12px',
              borderRadius: '20px', fontSize: '12px', fontWeight: 500
            }}>+ {tag}</button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={analyze} disabled={loading}
            style={{ flex: 1, fontSize: '15px', padding: '13px' }}>
            {loading
              ? (image ? '🔍 Analyzing image with AI Vision...' : '⏳ Analyzing symptoms...')
              : (image ? '🔍 Analyze with Groq Vision AI' : '🔍 Analyze Symptoms')}
          </button>
          <button onClick={loadCommon} disabled={loading} style={{
            background: '#ff8c00', color: 'white',
            padding: '13px 16px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap'
          }}>
            📋 Common in {form.district}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ borderLeft: '5px solid #f44336' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '26px' }}>🔬</span>
            <h3 style={{ color: '#c62828', fontSize: '18px' }}>AI Analysis Result</h3>
            {analysisMethod && (
              <span style={{
                background: '#e3f2fd', color: '#1565c0',
                padding: '3px 12px', borderRadius: '20px',
                fontSize: '11px', fontWeight: 600
              }}>
                🤖 {analysisMethod}
              </span>
            )}
          </div>

          {imagePreview && (
            <img src={imagePreview} alt="analyzed" style={{
              width: '120px', height: '90px', objectFit: 'cover',
              borderRadius: '8px', float: 'right', marginLeft: '16px',
              marginBottom: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }} />
          )}

          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.85', color: '#333', fontSize: '14px' }}>
            {cleanText(result)}
          </p>
          <div style={{ clear: 'both' }} />
        </div>
      )}

      {/* Common pests */}
      {common && (
        <div className="card" style={{ borderLeft: '5px solid #ff8c00' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '26px' }}>⚠️</span>
            <h3 style={{ color: '#e65100', fontSize: '18px' }}>
              Common Pests in {form.district} District
            </h3>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.85', color: '#333', fontSize: '14px' }}>
            {cleanText(common)}
          </p>
        </div>
      )}
    </div>
  );
}