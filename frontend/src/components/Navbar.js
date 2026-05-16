import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: '🏠 Dashboard' },
  { path: '/chatbot', label: '🤖 AI Chat' },
  { path: '/crop-plan', label: '🌱 Crop Plan' },
  { path: '/pest', label: '🐛 Pest Check' },
  { path: '/yield', label: '📊 Yield' },
  { path: '/market', label: '💰 Market' },
];

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1b5e20, #2d7a2d)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky', top: 0, zIndex: 100,
      minHeight: '60px', flexWrap: 'wrap', gap: '8px'
    }}>
      <div style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
        🌾 Kerala Farmer AI
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {NAV_ITEMS.map(item => (
          <Link key={item.path} to={item.path} style={{
            color: location.pathname === item.path ? '#a5d6a7' : 'rgba(255,255,255,0.85)',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            background: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
          }}>
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#c8e6c9', fontSize: '13px' }}>👨‍🌾 {user.name}</span>
        <button onClick={onLogout} style={{
          background: 'rgba(255,255,255,0.2)', color: 'white',
          padding: '6px 14px', fontSize: '13px', borderRadius: '6px'
        }}>Logout</button>
      </div>
    </nav>
  );
}