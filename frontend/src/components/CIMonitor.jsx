import React, { useState } from 'react';

export default function CIMonitor() {
  const [activeTab, setActiveTab] = useState('pipeline');

  const testCases = [
    { name: 'GET / - API Metadata & Student Identification', status: 'PASSED', duration: '743ms', suite: 'Unit/Integration' },
    { name: 'GET /health - Service Health Status Probe', status: 'PASSED', duration: '143ms', suite: 'Health Check' },
    { name: 'GET /events/history - Event-Driven Telemetry Stream', status: 'PASSED', duration: '146ms', suite: 'Event Architecture' },
    { name: 'GET /tasks (No Auth) - 401 Unauthorized Guard', status: 'PASSED', duration: '69ms', suite: 'Security & Auth' },
    { name: 'GET /invalid-route - 404 Centralized Error Handler', status: 'PASSED', duration: '64ms', suite: 'Routing & 404' },
  ];

  return (
    <div className="ci-monitor-card" style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.98))',
      border: '1px solid rgba(168, 85, 247, 0.35)',
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
            background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: '0 4px 12px rgba(147, 51, 234, 0.4)',
          }}>
            ⚡
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#c084fc' }}>
              Practical 12: CI/CD Pipeline with GitHub Actions
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Automated testing, static analysis, and continuous integration pipeline on <code>main</code>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* GitHub Actions Live Badge */}
          <a
            href="https://github.com/24CS048Manav/ITUE301-AWDF_Practical13/actions/workflows/ci.yml"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ade80',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              CI Pipeline: Passing
            </span>
          </a>

          <a
            href="https://github.com/24CS048Manav/ITUE301-AWDF_Practical13/actions"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(192, 132, 252, 0.15)',
              border: '1px solid rgba(192, 132, 252, 0.4)',
              color: '#c084fc',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ↗ Actions Tab
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('pipeline')}
          style={{
            background: activeTab === 'pipeline' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
            border: activeTab === 'pipeline' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'pipeline' ? '#f3e8ff' : '#94a3b8',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Workflow Architecture
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          style={{
            background: activeTab === 'tests' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
            border: activeTab === 'tests' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeTab === 'tests' ? '#f3e8ff' : '#94a3b8',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Automated Test Suite (5 Tests)
        </button>
      </div>

      {activeTab === 'pipeline' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Stage 1: Trigger & Lint */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #a855f7',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#d8b4fe', fontSize: '0.95rem' }}>1. Triggers &amp; Lint Job</span>
              <span style={{ fontSize: '0.75rem', background: '#581c87', color: '#f3e8ff', padding: '2px 8px', borderRadius: '12px' }}>
                Job: lint
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div><strong>Triggers:</strong> <code>push</code> &amp; <code>pull_request</code> to <code>main</code></div>
              <div><strong>Environment:</strong> <code>ubuntu-latest</code> (Node 20)</div>
              <div><strong>Step 1:</strong> Checkout code (<code>actions/checkout@v4</code>)</div>
              <div><strong>Step 2:</strong> Cache &amp; Install (<code>npm ci</code>)</div>
              <div><strong>Step 3:</strong> Static Analysis (<code>npm run lint</code>)</div>
            </div>
          </div>

          {/* Stage 2: Build & Test */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #22c55e',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#86efac', fontSize: '0.95rem' }}>2. Test Execution Job</span>
              <span style={{ fontSize: '0.75rem', background: '#14532d', color: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                Job: build-and-test
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div><strong>Pre-requisite:</strong> <code>needs: lint</code> (Pass required)</div>
              <div><strong>Test Runner:</strong> Jest 30 + Supertest 7</div>
              <div><strong>Execution:</strong> <code>npm test</code> (in <code>./backend</code>)</div>
              <div><strong>Assertions:</strong> Status codes, JSON shapes, auth 401s</div>
              <div><strong>Output:</strong> Pass/Fail report with execution logs</div>
            </div>
          </div>

          {/* Stage 3: Demonstration */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            borderTop: '3px solid #38bdf8',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#7dd3fc', fontSize: '0.95rem' }}>3. Lab Demonstration Proof</span>
              <span style={{ fontSize: '0.75rem', background: '#0369a1', color: '#e0f2fe', padding: '2px 8px', borderRadius: '12px' }}>
                Rubric Criteria
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div><strong>Step 1:</strong> Initial CI Setup &amp; Workflow commit</div>
              <div><strong>Step 2:</strong> Deliberately broken test commit (Red X)</div>
              <div><strong>Step 3:</strong> Corrected test commit (Green Checkmark)</div>
              <div><strong>Evidence:</strong> GitHub Actions execution logs captured</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          {testCases.map((tc, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: idx < testCases.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
              fontSize: '0.85rem',
            }}>
              <div>
                <span style={{ color: '#4ade80', marginRight: '8px', fontWeight: 'bold' }}>✓</span>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{tc.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '10px' }}>({tc.suite})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'monospace' }}>{tc.duration}</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4ade80',
                  background: 'rgba(34, 197, 94, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}>
                  {tc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
