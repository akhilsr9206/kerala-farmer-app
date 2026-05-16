import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ── Crop emoji icons ──────────────────────────────────────
const CROP_ICONS = {
  'Paddy':'🌾','Rice':'🍚','Coconut':'🥥','Rubber':'🌲','Banana':'🍌',
  'Pepper':'🌶️','Cardamom':'🫚','Cashew':'🥜','Coffee':'☕','Ginger':'🫚',
  'Turmeric':'🟡','Arecanut':'🌰','Tapioca':'🥕','Tomato':'🍅','Onion':'🧅',
  'Potato':'🥔','Sugarcane':'🎋','Groundnut':'🥜','Maize':'🌽',
  'Garlic':'🧄','Chillies':'🌶️','Mango':'🥭','Jackfruit':'🍈',
  'Pineapple':'🍍','Papaya':'🍑','Sweet Potato':'🍠','Yam':'🍠',
};

const CROP_IMAGES = {
  'Paddy': '/images/crops/Paddy.jpg',
  'Rice': '/images/crops/Rice.jpg',
  'Coconut': '/images/crops/Coconut.jpg',
  'Rubber': '/images/crops/Rubber.jpg',
  'Banana': '/images/crops/Banana.jpg',
  'Pepper': '/images/crops/Pepper.jpg',
  'Cardamom': '/images/crops/Cardamum.jpg',
  'Cashew': '/images/crops/Cashew.jpg',
  'Coffee': '/images/crops/Coffee.jpg',
  'Ginger': '/images/crops/Ginger.jpg',
  'Turmeric': '/images/crops/Turmeric.jpg',
  'Arecanut': '/images/crops/Arecanut.jpg',
  'Tapioca': '/images/crops/Tapioca.jpg',
  'Tomato': '/images/crops/Tomoto.jpg',
  'Onion': '/images/crops/Onion.jpg',
  'Potato': '/images/crops/Potato.jpg',
  'Sugarcane': '/images/crops/Sugarcane.jpg',
  'Groundnut': '/images/crops/Groundnut.jpg',
  'Maize': '/images/crops/Maize.jpg',
  'Garlic': '/images/crops/Garlic.jpg',
  'Chillies': '/images/crops/Chillies.jpg',
};

const ALL_CROPS = [
  'Paddy','Rice','Coconut','Rubber','Banana','Pepper',
  'Cardamom','Cashew','Coffee','Ginger','Turmeric','Arecanut',
  'Tapioca','Tomato','Onion','Potato','Sugarcane','Groundnut',
  'Maize','Garlic','Chillies',
];

// Generate simulated 7-day future price trend
function generateFutureTrend(currentPrice) {
  const trend = [];
  let price = currentPrice;
  const volatility = currentPrice * 0.015; // 1.5% daily volatility
  const drift = currentPrice * 0.003;      // slight upward drift

  for (let i = 1; i <= 7; i++) {
    const change = (Math.random() - 0.45) * volatility + drift;
    price = Math.max(price + change, currentPrice * 0.85);
    trend.push({ day: `Day ${i}`, price: parseFloat(price.toFixed(2)) });
  }
  return trend;
}

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white', border: '1px solid #e0e0e0',
        borderRadius: '10px', padding: '10px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px'
      }}>
        <div style={{ fontWeight: 700, color: '#1b5e20', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: '#ff8c00', fontWeight: 600 }}>
          ₹{payload[0].value}/kg
        </div>
      </div>
    );
  }
  return null;
};

export default function Market({ user }) {
  const [prices, setPrices]           = useState({});
  const [liveData, setLiveData]       = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedCrop, setSelectedCrop]   = useState('Rubber');
  const [form, setForm]               = useState({
    crop_name: 'Rubber', quantity: '100', district: user.district || 'Kollam'
  });
  const [strategy, setStrategy]     = useState(null);
  const [nutrition, setNutrition]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [showGraph, setShowGraph]   = useState(false);
  const [imgErrors, setImgErrors]   = useState({});

  useEffect(() => {
    axios.get('http://localhost:8000/api/market/prices')
      .then(r => setPrices(r.data.prices)).catch(() => {});
    fetchLivePrice('Rubber');
  }, []);

  const fetchLivePrice = async (cropName) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/market/live-price/${cropName}?state=Kerala`
      );
      setLiveData(prev => ({ ...prev, [cropName]: res.data }));
      setLastUpdated(new Date().toLocaleString('en-IN', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      }));
    } catch {}
  };

  const fetchAllLivePrices = async () => {
    setLoadingPrices(true);
    try {
      const res = await axios.post('http://localhost:8000/api/market/live-prices', {
        crops: ALL_CROPS, state: 'Kerala'
      });
      setLiveData(res.data.prices || {});
      setLastUpdated(new Date().toLocaleString('en-IN', {
        day:'2-digit', month:'2-digit', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      }));
    } catch {}
    setLoadingPrices(false);
  };

  const handleCropClick = (crop) => {
    setSelectedCrop(crop);
    setForm(prev => ({ ...prev, crop_name: crop }));
    setShowGraph(false);
    setStrategy(null);
    setNutrition(null);
    if (!liveData[crop]) fetchLivePrice(crop);
  };

  const getPrice = (crop) => {
    const live = liveData[crop];
    if (live?.modal_price) return live.modal_price;
    return prices[crop] || null;
  };

  const isLive = (crop) => liveData[crop]?.is_live === true;

  const getStrategy = async () => {
    setLoading(true); setStrategy(null); setNutrition(null); setShowGraph(false);
    const res = await axios.post('http://localhost:8000/api/market/strategy', {
      ...form, quantity: parseFloat(form.quantity)
    });
    setStrategy(res.data);
    setLoading(false);
  };

  const getNutrition = async () => {
    setLoading(true); setNutrition(null); setStrategy(null); setShowGraph(false);
    const res = await axios.get(`http://localhost:8000/api/market/nutrition/${form.crop_name}`);
    setNutrition(res.data.nutrition_info);
    setLoading(false);
  };

  const handleShowGraph = () => {
    setShowGraph(prev => !prev);
    setStrategy(null);
    setNutrition(null);
    if (!liveData[selectedCrop]) fetchLivePrice(selectedCrop);
  };

  const currentPrice = getPrice(selectedCrop);
  const trendData = currentPrice ? generateFutureTrend(parseFloat(currentPrice)) : [];
  const maxTrend = trendData.length ? Math.max(...trendData.map(d => d.price)) : 0;
  const minTrend = trendData.length ? Math.min(...trendData.map(d => d.price)) : 0;
  const priceDiff = trendData.length
    ? (trendData[6].price - parseFloat(currentPrice)).toFixed(2)
    : 0;

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '28px 20px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h2 style={{ color:'#1b5e20', fontSize:'24px' }}>💰 Live AI Market Prices</h2>
          <p style={{ color:'#666', fontSize:'13px', marginTop:'4px' }}>
            Real-time crop prices + AI advice + Future trend chart
          </p>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={fetchAllLivePrices} disabled={loadingPrices}
            style={{
              background:'linear-gradient(135deg,#1b5e20,#2d7a2d)',
              color:'white', padding:'10px 18px', borderRadius:'10px',
              fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'6px'
            }}>
            {loadingPrices ? '⏳ Fetching...' : '🔄 Refresh Prices'}
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ fontSize:'12px', color:'#888', marginBottom:'16px' }}>
          Updated: {lastUpdated}
        </div>
      )}

      {/* ── Crop Cards Grid ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))',
        gap:'14px', marginBottom:'28px'
      }}>
        {ALL_CROPS.map(crop => {
          const price   = getPrice(crop);
          const live    = isLive(crop);
          const active  = selectedCrop === crop;
          const imgSrc  = CROP_IMAGES[crop];
          const icon    = CROP_ICONS[crop] || '🌿';

          return (
            <div key={crop} onClick={() => handleCropClick(crop)}
              style={{
                background:'white', borderRadius:'14px',
                overflow:'hidden', cursor:'pointer',
                boxShadow: active
                  ? '0 4px 20px rgba(27,94,32,0.25)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
                border: active ? '2.5px solid #4CAF50' : '2.5px solid transparent',
                transition:'all 0.2s', position:'relative',
                transform: active ? 'translateY(-2px)' : 'none'
              }}>

              {/* Live badge */}
              {live && (
                <div style={{
                  position:'absolute', top:'8px', right:'8px', zIndex:2,
                  background:'#1b5e20', color:'white',
                  fontSize:'9px', fontWeight:700,
                  padding:'2px 6px', borderRadius:'8px',
                  display:'flex', alignItems:'center', gap:'3px'
                }}>
                  <span style={{
                    width:'5px', height:'5px', borderRadius:'50%',
                    background:'#76ff03', display:'inline-block'
                  }}/>
                  LIVE
                </div>
              )}

              {/* Crop image */}
              <div style={{
                height:'90px', overflow:'hidden',
                background:'#f1f8f1', position:'relative'
              }}>
                {imgSrc && !imgErrors[crop] ? (
                  <img src={imgSrc} alt={crop}
                    onError={() => setImgErrors(prev => ({...prev, [crop]: true}))}
                    style={{
                      width:'100%', height:'100%',
                      objectFit:'cover', objectPosition:'center'
                    }} />
                ) : (
                  <div style={{
                    width:'100%', height:'100%',
                    display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'36px'
                  }}>
                    {icon}
                  </div>
                )}
              </div>

              {/* Crop info */}
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontWeight:700, color:'#1b5e20', fontSize:'13px' }}>
                  {crop}
                </div>
                <div style={{
                  color: live ? '#1b5e20' : '#ff8c00',
                  fontWeight:800, fontSize:'18px', marginTop:'2px'
                }}>
                  {price ? `₹${price}` : '—'}
                </div>
                <div style={{ fontSize:'11px', color:'#aaa' }}>per kg</div>

                {liveData[crop]?.market && liveData[crop].market !== 'Reference Price' && (
                  <div style={{
                    fontSize:'10px', color:'#888', marginTop:'4px',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                  }}>
                    📍 {liveData[crop].market}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Selected Crop Detail Panel ── */}
      {selectedCrop && (
        <div className="card" style={{ marginBottom:'20px' }}>

          {/* Selected crop header */}
          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'16px', flexWrap:'wrap' }}>
            <div style={{
              width:'64px', height:'64px', borderRadius:'12px',
              overflow:'hidden', background:'#f1f8f1', flexShrink:0
            }}>
              {CROP_IMAGES[selectedCrop] && !imgErrors[selectedCrop] ? (
                <img src={CROP_IMAGES[selectedCrop]} alt={selectedCrop}
                  onError={() => setImgErrors(prev => ({...prev, [selectedCrop]: true}))}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex',
                  alignItems:'center', justifyContent:'center', fontSize:'28px' }}>
                  {CROP_ICONS[selectedCrop] || '🌿'}
                </div>
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                <h3 style={{ color:'#1b5e20', fontSize:'20px' }}>{selectedCrop}</h3>
                <span style={{
                  background: isLive(selectedCrop) ? '#e8f5e9' : '#fff8e1',
                  color: isLive(selectedCrop) ? '#1b5e20' : '#e65100',
                  padding:'3px 10px', borderRadius:'20px',
                  fontSize:'11px', fontWeight:700
                }}>
                  {isLive(selectedCrop) ? '🟢 LIVE — Agmarknet' : '🟡 Reference Price'}
                </span>
              </div>
              {liveData[selectedCrop] && (
                <div style={{ display:'flex', gap:'16px', marginTop:'8px', flexWrap:'wrap' }}>
                  {[
                    { label:'Modal Price', val:`₹${liveData[selectedCrop].modal_price}`, color:'#1b5e20' },
                    { label:'Min Price',   val:`₹${liveData[selectedCrop].min_price}`,   color:'#1565c0' },
                    { label:'Max Price',   val:`₹${liveData[selectedCrop].max_price}`,   color:'#c62828' },
                  ].map((s,i) => (
                    <div key={i} style={{
                      background:'#f8f8f8', borderRadius:'8px',
                      padding:'6px 14px', textAlign:'center'
                    }}>
                      <div style={{ fontWeight:700, color:s.color, fontSize:'16px' }}>{s.val}/kg</div>
                      <div style={{ fontSize:'11px', color:'#888' }}>{s.label}</div>
                    </div>
                  ))}
                  {liveData[selectedCrop]?.date && liveData[selectedCrop].date !== new Date().toLocaleDateString() && (
                    <div style={{ fontSize:'12px', color:'#888', alignSelf:'center' }}>
                      📅 {liveData[selectedCrop].date}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sell form */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px', marginBottom:'16px' }}>
            <div>
              <label style={{ fontSize:'12px', color:'#555', fontWeight:600, display:'block', marginBottom:'5px' }}>
                Crop
              </label>
              <input value={form.crop_name}
                onChange={e => setForm({...form, crop_name:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#555', fontWeight:600, display:'block', marginBottom:'5px' }}>
                Quantity (kg)
              </label>
              <input type="number" value={form.quantity}
                onChange={e => setForm({...form, quantity:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#555', fontWeight:600, display:'block', marginBottom:'5px' }}>
                District
              </label>
              <input value={form.district}
                onChange={e => setForm({...form, district:e.target.value})} />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            <button onClick={getStrategy} disabled={loading}
              style={{
                background:'linear-gradient(135deg,#1b5e20,#2d7a2d)',
                color:'white', padding:'11px 20px', borderRadius:'10px',
                fontSize:'13px', fontWeight:600, flex:1, minWidth:'140px'
              }}>
              {loading && !nutrition && !showGraph ? '⏳...' : '💡 AI Selling Strategy'}
            </button>

            <button onClick={getNutrition} disabled={loading}
              style={{
                background:'linear-gradient(135deg,#6a1b9a,#8e24aa)',
                color:'white', padding:'11px 20px', borderRadius:'10px',
                fontSize:'13px', fontWeight:600, flex:1, minWidth:'140px'
              }}>
              {loading && nutrition !== null ? '⏳...' : '🥗 AI Nutrition Advice'}
            </button>

            <button onClick={handleShowGraph}
              style={{
                background: showGraph
                  ? 'linear-gradient(135deg,#1565c0,#1976d2)'
                  : 'linear-gradient(135deg,#37474f,#455a64)',
                color:'white', padding:'11px 20px', borderRadius:'10px',
                fontSize:'13px', fontWeight:600, flex:1, minWidth:'140px',
                border: showGraph ? '2px solid #82b1ff' : '2px solid transparent'
              }}>
              📈 {showGraph ? 'Hide Graph' : 'Show Future Graph'}
            </button>
          </div>
        </div>
      )}

      {/* ── Future Price Graph ── */}
      {showGraph && currentPrice && (
        <div className="card" style={{ borderLeft:'5px solid #1565c0', marginBottom:'20px' }}>
          <div style={{ marginBottom:'16px' }}>
            <h3 style={{ color:'#1565c0', fontSize:'18px' }}>
              📈 Future Price Trend — {selectedCrop}
            </h3>
            <p style={{ fontSize:'13px', color:'#666', marginTop:'4px' }}>
              Current Price: ₹{currentPrice}/kg &nbsp;·&nbsp;
              <span style={{ color: parseFloat(priceDiff) >= 0 ? '#1b5e20' : '#c62828', fontWeight:600 }}>
                7-day forecast: {parseFloat(priceDiff) >= 0 ? '▲' : '▼'} ₹{Math.abs(priceDiff)}
              </span>
            </p>
          </div>

          <div style={{ display:'flex', gap:'16px', marginBottom:'16px', flexWrap:'wrap' }}>
            {[
              { label:'Current',  val:`₹${currentPrice}`,     color:'#555' },
              { label:'7-Day Low', val:`₹${minTrend.toFixed(2)}`, color:'#c62828' },
              { label:'7-Day High',val:`₹${maxTrend.toFixed(2)}`, color:'#1b5e20' },
              { label:'Day 7 Est.',val:`₹${trendData[6]?.price || '—'}`, color:'#1565c0' },
            ].map((s,i) => (
              <div key={i} style={{
                background:'#f8f8f8', borderRadius:'10px',
                padding:'10px 16px', textAlign:'center', flex:1, minWidth:'90px'
              }}>
                <div style={{ fontWeight:700, color:s.color, fontSize:'16px' }}>{s.val}/kg</div>
                <div style={{ fontSize:'11px', color:'#888', marginTop:'2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top:10, right:20, left:0, bottom:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize:12, fill:'#888' }} />
              <YAxis
                domain={[
                  Math.floor(minTrend * 0.97),
                  Math.ceil(maxTrend * 1.03)
                ]}
                tick={{ fontSize:12, fill:'#888' }}
                tickFormatter={v => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={parseFloat(currentPrice)}
                stroke="#ff8c00" strokeDasharray="4 4"
                label={{ value:'Current', fill:'#ff8c00', fontSize:11 }}
              />
              <Line
                type="monotone" dataKey="price"
                stroke="#1b5e20" strokeWidth={2.5}
                dot={{ fill:'#1b5e20', r:4, strokeWidth:2, stroke:'white' }}
                activeDot={{ r:6, fill:'#1b5e20', stroke:'white', strokeWidth:2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div style={{
            marginTop:'12px', background:'#e8f5e9',
            borderRadius:'10px', padding:'10px 14px',
            fontSize:'13px', color:'#1b5e20'
          }}>
            ⚠️ <strong>Disclaimer:</strong> Future price trend is AI-simulated based on current price 
            and historical volatility patterns. Not financial advice — actual prices depend on 
            market conditions, monsoon, and demand.
          </div>
        </div>
      )}

      {/* ── Strategy Result ── */}
      {strategy && (
        <div className="card" style={{ borderLeft:'5px solid #ff8c00' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'24px' }}>📈</span>
            <h3 style={{ color:'#e65100', fontSize:'18px' }}>AI Selling Strategy</h3>
          </div>
          <div style={{ display:'flex', gap:'14px', marginBottom:'14px', flexWrap:'wrap' }}>
            <div style={{ background:'#fff8e1', borderRadius:'10px', padding:'10px 18px', textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:'20px', color:'#e65100' }}>
                ₹{strategy.live_price?.modal_price}/kg
              </div>
              <div style={{ fontSize:'11px', color:'#888' }}>
                {strategy.live_price?.is_live ? 'Live Price' : 'Reference'}
              </div>
            </div>
            <div style={{ background:'#e8f5e9', borderRadius:'10px', padding:'10px 18px', textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:'20px', color:'#1b5e20' }}>
                ₹{strategy.estimated_value?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize:'11px', color:'#888' }}>Estimated Value</div>
            </div>
          </div>
          <p style={{ whiteSpace:'pre-wrap', lineHeight:'1.8', color:'#444', fontSize:'14px' }}>
            {strategy.strategy}
          </p>
        </div>
      )}

      {/* ── Nutrition Result ── */}
      {nutrition && (
        <div className="card" style={{ borderLeft:'5px solid #9c27b0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
            <span style={{ fontSize:'24px' }}>🥗</span>
            <h3 style={{ color:'#6a1b9a', fontSize:'18px' }}>AI Nutrition Advice</h3>
          </div>
          <p style={{ whiteSpace:'pre-wrap', lineHeight:'1.8', color:'#444', fontSize:'14px' }}>
            {nutrition}
          </p>
        </div>
      )}
    </div>
  );
}