import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/auth/login', form);
      onLogin(res.data);
    } catch (e) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8f5e9, #f0f7f0)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px' }}>🌾</div>
          <h1 style={{ color: '#1b5e20', fontSize: '24px', marginTop: '8px' }}>Kerala Farmer AI</h1>
          <p style={{ color: '#666', marginTop: '4px' }}>Your intelligent farming companion</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input placeholder="Email address" type="email"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password" type="password"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          {error && <p className="error">⚠️ {error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            New farmer? <Link to="/register" style={{ color: '#2d7a2d', fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}