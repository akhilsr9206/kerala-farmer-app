import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    const district =
      user?.district && user.district !== 'undefined'
        ? user.district
        : 'Thiruvananthapuram';

    axios
      .get(`http://localhost:8000/api/dashboard/${user.user_id}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    axios
      .get(`http://localhost:8000/api/weather/${district}`)
      .then((res) => {
        setWeather(res.data);
        setWeatherLoading(false);
      })
      .catch(() => setWeatherLoading(false));
  }, [user]);

  const chartData = data
    ? Object.entries(data.crop_summary || {}).map(([name, area]) => ({
        name,
        area
      }))
    : [];

  const getWeatherIcon = (description) => {
    if (!description) return '🌤️';

    const d = description.toLowerCase();

    if (d.includes('rain')) return '🌧️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('clear')) return '☀️';
    if (d.includes('storm')) return '⛈️';
    if (d.includes('mist')) return '🌫️';

    return '🌤️';
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '28px 20px'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2
            style={{
              color: '#1b5e20',
              fontSize: '24px'
            }}
          >
            🏠 My Farm Dashboard
          </h2>

          <p
            style={{
              color: '#666',
              fontSize: '14px',
              marginTop: '4px'
            }}
          >
            Welcome back, {user?.name || 'Farmer'}! Here's your farm overview.
          </p>
        </div>

        <div
          style={{
            fontSize: '13px',
            color: '#888'
          }}
        >
          📍 {user?.district || 'Kerala'}
        </div>
      </div>

      {/* WEATHER */}
      {weatherLoading ? (
        <div
          style={{
            background: 'linear-gradient(135deg,#1b5e20,#2d7a2d)',
            borderRadius: '14px',
            padding: '18px',
            color: 'white',
            marginBottom: '24px'
          }}
        >
          🌤️ Loading weather...
        </div>
      ) : weather ? (
        <div
          style={{
            background: 'linear-gradient(135deg,#1b5e20,#2d7a2d)',
            borderRadius: '14px',
            padding: '20px',
            color: 'white',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(27,94,32,0.25)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '42px' }}>
              {getWeatherIcon(weather.description)}
            </div>

            <div>
              <div
                style={{
                  fontSize: '34px',
                  fontWeight: '700',
                  lineHeight: 1
                }}
              >
                {weather.temperature}°C
              </div>

              <div
                style={{
                  fontSize: '13px',
                  opacity: 0.9
                }}
              >
                {weather.description} · Feels like {weather.feels_like}°C
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            {[
              {
                icon: '💧',
                label: 'Humidity',
                value: `${weather.humidity}%`
              },
              {
                icon: '💨',
                label: 'Wind',
                value: `${weather.wind_speed} m/s`
              },
              {
                icon: '🌧️',
                label: 'Rain',
                value: `${weather.rainfall_mm}mm`
              }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  minWidth: '85px',
                  textAlign: 'center'
                }}
              >
                <div>{item.icon}</div>
                <div style={{ fontWeight: '700' }}>{item.value}</div>
                <div style={{ fontSize: '11px' }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: '220px',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '13px',
              lineHeight: '1.5'
            }}
          >
            <div
              style={{
                fontWeight: '700',
                marginBottom: '5px'
              }}
            >
              🌾 Today's Farming Advice
            </div>

            {weather.farming_advice}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700'
            }}
          >
            📍 {weather.district}
          </div>
        </div>
      ) : null}

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {[
          {
            label: 'Crops Logged',
            value: data?.total_crops_logged || 0,
            icon: '🌱',
            color: '#4CAF50'
          },
          {
            label: 'Badges Earned',
            value: data?.badges_earned || 0,
            icon: '🏆',
            color: '#ff9800'
          },
          {
            label: 'Crop Types',
            value: Object.keys(data?.crop_summary || {}).length,
            icon: '🌾',
            color: '#2196f3'
          },
          {
            label: 'AI Insights',
            value: '3 ready',
            icon: '🤖',
            color: '#9c27b0'
          }
        ].map((item, i) => (
          <div
            key={i}
            className="card"
            style={{
              textAlign: 'center',
              padding: '20px'
            }}
          >
            <div style={{ fontSize: '32px' }}>{item.icon}</div>

            <div
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: item.color
              }}
            >
              {item.value}
            </div>

            <div
              style={{
                fontSize: '13px',
                color: '#666'
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* CHART + AI INSIGHTS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* LEFT CARD */}
        <div className="card">
          <h3
            style={{
              color: '#1b5e20',
              marginBottom: '16px'
            }}
          >
            📊 Crop Area Distribution
          </h3>

          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />

                  <Tooltip
                    formatter={(value) => [`${value} acres`, 'Area']}
                    contentStyle={{
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />

                  <Bar
                    dataKey="area"
                    fill="#4CAF50"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* REPORT BUTTON BELOW CHART */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '25px'
                }}
              >
                <button
                  onClick={() =>
                    window.open(
                      'http://localhost:8000/api/report/generate',
                      '_blank'
                    )
                  }
                  style={{
                    background: '#1b5e20',
                    color: 'white',
                    padding: '12px 22px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  📄 Generate Farm Report
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#aaa'
              }}
            >
              <div style={{ fontSize: '48px' }}>🌱</div>
              <p>Log your first crop to see chart</p>
            </div>
          )}
        </div>

        {/* RIGHT CARD */}
        <div className="card">
          <h3
            style={{
              color: '#1b5e20',
              marginBottom: '16px'
            }}
          >
            🤖 AI Insights
          </h3>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <p
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.8',
                color: '#444',
                fontSize: '14px'
              }}
            >
              {(data?.ai_insights ||
                'Start logging crops to receive AI suggestions.')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')}
            </p>
          )}
        </div>
      </div>

      {/* RECENT LOGS */}
      {data?.recent_logs?.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3
            style={{
              color: '#1b5e20',
              marginBottom: '16px'
            }}
          >
            📋 Recent Activity
          </h3>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            {data.recent_logs.map((log, i) => (
              <div
                key={i}
                style={{
                  background: '#f1f8f1',
                  border: '1px solid #dcefdc',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  minWidth: '150px'
                }}
              >
                <div
                  style={{
                    fontWeight: '700',
                    color: '#1b5e20'
                  }}
                >
                  🌿 {log.crop}
                </div>

                <div style={{ fontSize: '13px', color: '#666' }}>
                  {log.area} acres
                </div>

                <div style={{ fontSize: '12px', color: '#888' }}>
                  {log.season}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="card">
        <h3
          style={{
            color: '#1b5e20',
            marginBottom: '16px'
          }}
        >
          ⚡ Quick Actions
        </h3>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {[
            {
              label: '🤖 Ask AI Chatbot',
              path: '/chatbot',
              color: '#2d7a2d'
            },
            {
              label: '🌱 Generate Crop Plan',
              path: '/crop-plan',
              color: '#1565c0'
            },
            {
              label: '🐛 Pest Check',
              path: '/pest',
              color: '#c62828'
            },
            {
              label: '📊 Yield Prediction',
              path: '/yield',
              color: '#6a1b9a'
            },
            {
              label: '💰 Market Prices',
              path: '/market',
              color: '#ef6c00'
            }
          ].map((btn, i) => (
            <button
              key={i}
              onClick={() => (window.location.href = btn.path)}
              style={{
                background: btn.color,
                color: 'white',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}