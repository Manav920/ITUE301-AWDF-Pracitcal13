import React, { useState, useEffect } from 'react';
import { getHealth, getApiOverview } from '../api';

export default function DockerMonitor() {
  const [healthData, setHealthData] = useState(null);
  const [apiOverview, setApiOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, overview] = await Promise.all([
        getHealth().catch(err => ({ error: err.message, status: 'UNAVAILABLE' })),
        getApiOverview().catch(err => ({ error: err.message })),
      ]);
      setHealthData(health);
      setApiOverview(overview);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="docker-monitor-card" style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '32px',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
      color: '#f8fafc',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
          }}>
            🐳
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
              Practical 11: Containerization with Docker & Docker Compose
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Orchestrated via <code>docker-compose.yml</code> on bridge network <code>app-network</code>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.8rem',
            padding: '4px 10px',
            borderRadius: '20px',
            background: healthData?.status === 'HEALTHY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
            color: healthData?.status === 'HEALTHY' ? '#4ade80' : '#facc15',
            border: `1px solid ${healthData?.status === 'HEALTHY' ? '#22c55e' : '#eab308'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: healthData?.status === 'HEALTHY' ? '#4ade80' : '#facc15',
              display: 'inline-block',
            }} />
            {healthData?.status === 'HEALTHY' ? 'STACK HEALTHY' : 'PROBING...'}
          </span>
          <button
            onClick={fetchStatus}
            disabled={loading}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Refreshing...' : '↻ Probe Health'}
          </button>
        </div>
      </div>

      {/* 3 Container Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}>
        {/* Service 1: Frontend */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #06b6d4',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#67e8f9', fontSize: '1rem' }}>🌐 frontend</span>
            <span style={{ fontSize: '0.75rem', background: '#0e7490', color: '#ecfeff', padding: '2px 8px', borderRadius: '12px' }}>
              Port 5173:5173
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
            <div><strong>Container:</strong> <code>task_manager_frontend</code></div>
            <div><strong>Build:</strong> Multi-Stage (<code>node:18-alpine</code>)</div>
            <div><strong>Stage 1:</strong> <code>npm run build</code> (Vite)</div>
            <div><strong>Stage 2:</strong> Lightweight Preview Runner</div>
            <div><strong>Depends On:</strong> <code>backend</code></div>
          </div>
        </div>

        {/* Service 2: Backend */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #3b82f6',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#93c5fd', fontSize: '1rem' }}>⚙️ backend</span>
            <span style={{ fontSize: '0.75rem', background: '#1d4ed8', color: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
              Port 5000:5000
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
            <div><strong>Container:</strong> <code>task_manager_backend</code></div>
            <div><strong>Image:</strong> <code>node:18-alpine</code></div>
            <div><strong>DNS Alias:</strong> <code>backend:5000</code></div>
            <div><strong>Database URI:</strong> <code>mongodb://mongodb:27017</code></div>
            <div><strong>Depends On:</strong> <code>mongodb</code></div>
          </div>
        </div>

        {/* Service 3: MongoDB */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          borderTop: '3px solid #10b981',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '1rem' }}>🍃 mongodb</span>
            <span style={{ fontSize: '0.75rem', background: '#047857', color: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
              Port 27017:27017
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
            <div><strong>Container:</strong> <code>task_manager_mongodb</code></div>
            <div><strong>Image:</strong> <code>mongo:latest</code> (Official)</div>
            <div><strong>DNS Alias:</strong> <code>mongodb:27017</code></div>
            <div><strong>Volume:</strong> <code>mongodb_data:/data/db</code></div>
            <div><strong>Persistence:</strong> Named Volume Across Restarts</div>
          </div>
        </div>
      </div>

      {/* Network & Supplementary Highlights */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '10px',
        padding: '16px',
        border: '1px dashed rgba(56, 189, 248, 0.3)',
        fontSize: '0.85rem',
      }}>
        <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔗 Inter-Container Architecture & Supplementary Implementations:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', color: '#cbd5e1' }}>
          <div>
            <span style={{ color: '#a5f3fc', fontWeight: 600 }}>1. Bridge Network (<code>app-network</code>):</span>
            <br />
            Containers communicate using internal Docker DNS service names (e.g. <code>mongodb:27017</code> instead of <code>localhost</code>).
          </div>
          <div>
            <span style={{ color: '#a5f3fc', fontWeight: 600 }}>2. Multi-Stage React Build:</span>
            <br />
            Separate <code>AS build</code> stage executes Vite build, minimizing final container size for production.
          </div>
          <div>
            <span style={{ color: '#a5f3fc', fontWeight: 600 }}>3. Volume Persistence:</span>
            <br />
            Named volume <code>mongodb_data</code> preserves tasks, users, and collections even when containers are torn down.
          </div>
        </div>

        {healthData && (
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.78rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span>Uptime: <strong>{healthData.uptimeSeconds || 0}s</strong> | Node: <strong>{healthData.container?.nodeVersion || 'v18+'}</strong></span>
            <span>Connected Host: <strong>{healthData.database?.host || 'localhost'}</strong> ({healthData.database?.database || 'task_manager_24cs048'})</span>
            <span>Last Probe: <strong>{lastChecked || 'Initial'}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
