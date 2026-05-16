import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DISTRICTS = ['Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha',
  'Kottayam','Idukki','Ernakulam','Thrissur','Palakkad',
  'Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'];

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', district:'Kollam', land_size:'1' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/auth/register', {
        ...form, land_size: parseFloat(form.land_size)
      });
      onLogin(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8f5e9, #f0f7f0)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px' }}>👨‍🌾</div>
          <h2 style={{ color: '#1b5e20' }}>Create Your Account</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <select value={form.district} onChange={e => setForm({...form, district: e.target.value})}>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <input placeholder="Land size (acres)" type="number" value={form.land_size} onChange={e => setForm({...form, land_size: e.target.value})} />
          {error && <p className="error">⚠️ {error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            Already registered? <Link to="/" style={{ color: '#2d7a2d', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}