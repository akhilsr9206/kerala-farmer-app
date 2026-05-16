import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const SUGGESTIONS = [
  'Best crops for Kerala monsoon?',
  'How to treat coconut pests?',
  'Current rubber prices?',
  'Paddy cultivation tips'
];

export default function Chatbot({ user }) {
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: `നമസ്കാരം ${user.name}! 👋 I am your Kerala Farming AI assistant.\nAsk me anything about crops, pests, weather, or market prices!\n\n🎤 You can also speak in Malayalam or English using the mic button!`
  }]);
  const [input, setInput]         = useState('');
  const [language, setLanguage]   = useState('english');
  const [loading, setLoading]     = useState(false);
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText]   = useState('');
  const [alerts, setAlerts]       = useState([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const bottomRef    = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Fetch Live Alerts on Mount ─────────────────────────
  useEffect(() => {
    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(interval);
  }, []);

  const fetchLiveAlerts = async () => {
    try {
      const district = user.district || 'Kollam';
      const [weatherRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/weather/${district}`)
      ]);
      const w = weatherRes.data;
      const newAlerts = [];

      if (w.humidity > 85)
        newAlerts.push({ type: 'warning', icon: '🍄', msg: `High humidity (${w.humidity}%) — watch for fungal diseases in ${district}` });
      if (w.rainfall_mm > 15)
        newAlerts.push({ type: 'rain', icon: '🌧️', msg: `Heavy rain (${w.rainfall_mm}mm) — avoid pesticide spraying today` });
      if (w.temperature > 35)
        newAlerts.push({ type: 'heat', icon: '🌡️', msg: `High temp (${w.temperature}°C) — increase irrigation frequency` });
      if (w.wind_speed > 8)
        newAlerts.push({ type: 'wind', icon: '💨', msg: `Strong winds (${w.wind_speed} m/s) — secure young plants` });
      if (newAlerts.length === 0)
        newAlerts.push({ type: 'ok', icon: '✅', msg: `Weather conditions are normal in ${district} today` });

      setAlerts(newAlerts);
    } catch {
      // silently fail
    }
  };

  // ── Text to Speech ─────────────────────────────────────
  const speak = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'malayalam' ? 'ml-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      language === 'malayalam'
        ? v.lang.includes('ml')
        : v.lang.includes('en-IN') || v.lang.includes('en')
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  };

  // ── Voice Recognition ──────────────────────────────────
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice recognition not supported. Please use Google Chrome.');
      return;
    }

    const recognition = new SR();
    recognition.lang        = language === 'malayalam' ? 'ml-IN' : 'en-IN';
    recognition.continuous  = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
      setLiveText('');
    };

    recognition.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveText(interim || final);
      if (final) setInput(final);
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setListening(false);
      setLiveText('');
      if (e.error === 'not-allowed')
        alert('Microphone access denied. Please allow microphone in browser settings.');
    };

    recognition.onend = () => {
      setListening(false);
      setLiveText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setLiveText('');
  };

  // ── Send Message ───────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/chatbot/chat', {
        message: userMsg, language
      });
      const botText = res.data.response;
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      speak(botText.slice(0, 300)); // speak first 300 chars
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const ALERT_COLORS = {
    warning: '#fff3e0', rain: '#e3f2fd',
    heat: '#fce4ec', wind: '#f3e5f5', ok: '#e8f5e9'
  };
  const ALERT_BORDER = {
    warning: '#ff8c00', rain: '#1565c0',
    heat: '#c62828', wind: '#6a1b9a', ok: '#2d7a2d'
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 20px',
      height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ color: '#1b5e20', fontSize: '20px' }}>🤖 AI Farm Assistant</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* TTS Toggle */}
          <button onClick={() => setTtsEnabled(!ttsEnabled)} style={{
            background: ttsEnabled ? '#e8f5e9' : '#f5f5f5',
            color: ttsEnabled ? '#1b5e20' : '#888',
            border: `1px solid ${ttsEnabled ? '#a5d6a7' : '#ddd'}`,
            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
          }}>
            {ttsEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
          </button>
          {/* Language */}
          <select value={language} onChange={e => setLanguage(e.target.value)}
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}>
            <option value="english">English</option>
            <option value="malayalam">മലയാളം</option>
          </select>
        </div>
      </div>

      {/* Live Alerts Banner */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {alerts.map((alert, i) => (
            <div key={i} style={{
              background: ALERT_COLORS[alert.type] || '#fff',
              border: `1px solid ${ALERT_BORDER[alert.type] || '#ccc'}`,
              borderRadius: '10px', padding: '8px 14px',
              fontSize: '13px', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>{alert.icon}</span>
              <span>{alert.msg}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>
                🔴 LIVE
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => setInput(s)} style={{
            background: '#e8f5e9', color: '#1b5e20',
            border: '1px solid #a5d6a7', padding: '5px 12px',
            fontSize: '12px', borderRadius: '20px'
          }}>{s}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '12px 16px', borderRadius: '14px',
              background: msg.role === 'user' ? '#2d7a2d' : 'white',
              color: msg.role === 'user' ? 'white' : '#333',
              boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
              fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap'
            }}>
              {msg.role === 'bot' && <span style={{ marginRight: '6px' }}>🌾</span>}
              {msg.text}
              {msg.role === 'bot' && (
                <button onClick={() => speak(msg.text)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '14px', marginLeft: '8px', padding: '0',
                  opacity: 0.6, transform: 'none'
                }} title="Read aloud">🔊</button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'white', padding: '12px 16px',
              borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>
              <span style={{ color: '#666' }}>🌾 Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Live voice text */}
      {liveText && (
        <div style={{
          background: '#e3f2fd', borderRadius: '10px',
          padding: '8px 14px', fontSize: '13px',
          color: '#1565c0', fontStyle: 'italic'
        }}>
          🎤 {liveText}...
        </div>
      )}

      {/* Input Row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={language === 'malayalam'
            ? 'Malayalam-ൽ ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ സംസാരിക്കുക...'
            : 'Ask about crops, pests, market prices...'}
          style={{ flex: 1 }}
        />

        {/* Mic Button */}
        <button
          onClick={listening ? stopListening : startListening}
          style={{
            background: listening
              ? 'linear-gradient(135deg, #f44336, #c62828)'
              : 'linear-gradient(135deg, #1565c0, #1976d2)',
            color: 'white', padding: '10px 16px',
            borderRadius: '8px', fontSize: '18px',
            animation: listening ? 'pulse 1s infinite' : 'none',
            minWidth: '50px'
          }}
          title={listening ? 'Stop listening' : `Start voice input (${language === 'malayalam' ? 'Malayalam' : 'English'})`}
        >
          {listening ? '⏹️' : '🎤'}
        </button>

        {/* Send Button */}
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            background: '#2d7a2d', color: 'white',
            padding: '10px 20px', borderRadius: '8px',
            whiteSpace: 'nowrap', fontSize: '14px'
          }}
        >
          Send 📤
        </button>
      </div>

      {/* Mic status */}
      {listening && (
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#f44336', fontWeight: 600 }}>
          🔴 Listening in {language === 'malayalam' ? 'Malayalam (ml-IN)' : 'English (en-IN)'}... Speak now
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}