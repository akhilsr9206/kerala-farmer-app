import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import CropPlan from './pages/CropPlan';
import PestDetector from './pages/PestDetector';
import YieldPredictor from './pages/YieldPredictor';
import Market from './pages/Market';
import Admin from "./pages/Admin";

import Navbar from './components/Navbar';

function AppContent() {
  const location = useLocation();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('farmer_user');
    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved);

      if (!parsed.district || parsed.district === 'undefined' || parsed.district === 'null') {
        localStorage.removeItem('farmer_user');
        return null;
      }

      return parsed;
    } catch (e) {
      localStorage.removeItem('farmer_user');
      return null;
    }
  });

  const login = (userData) => {
    const userToSave = {
      user_id: userData.user_id,
      name: userData.name,
      district: userData.district || 'Thiruvananthapuram',
      land_size: userData.land_size || 1.0,
      email: userData.email || ''
    };

    localStorage.setItem('farmer_user', JSON.stringify(userToSave));
    setUser(userToSave);
  };

  const logout = () => {
    localStorage.removeItem('farmer_user');
    setUser(null);
  };

  // 🔥 IMPORTANT LINE
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {/* ✅ Hide navbar on admin page */}
      {user && !isAdminPage && <Navbar user={user} onLogout={logout} />}

      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={login} />} />
        <Route path="/register" element={<Register onLogin={login} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/chatbot" element={user ? <Chatbot user={user} /> : <Navigate to="/" />} />
        <Route path="/crop-plan" element={user ? <CropPlan user={user} /> : <Navigate to="/" />} />
        <Route path="/pest" element={user ? <PestDetector user={user} /> : <Navigate to="/" />} />
        <Route path="/yield" element={user ? <YieldPredictor user={user} /> : <Navigate to="/" />} />
        <Route path="/market" element={user ? <Market user={user} /> : <Navigate to="/" />} />
        <Route path="/admin" element={user ? <Admin /> : <Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;