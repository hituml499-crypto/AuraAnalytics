import React, { useState } from 'react';
import Overview from './components/Overview';
import CohortMatrix from './components/CohortMatrix';
import Simulator from './components/Simulator';
import { LayoutDashboard, Calendar, Cpu, Database, FileText } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container-grid">
      
      {/* Sidebar Panel */}
      <aside style={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        borderRight: '1px solid var(--border-color)', 
        padding: '28px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        height: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Logo / Branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
              }} />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Aura<span className="glow-text">Analytics</span>
              </h1>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
              CUSTOMER RETENTION SUITE
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </div>

            <div 
              className={`nav-link ${activeTab === 'cohorts' ? 'active' : ''}`}
              onClick={() => setActiveTab('cohorts')}
            >
              <Calendar size={18} />
              <span>Cohort Matrix</span>
            </div>

            <div 
              className={`nav-link ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
            >
              <Cpu size={18} />
              <span>ML Simulator</span>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)', boxShadow: '0 0 8px var(--emerald)' }} />
            <span>Python Pipeline Connected</span>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)' }} />
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Portfolio Project</div>
            <div>Data Scientist / Analyst</div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main style={{ 
        padding: '40px', 
        overflowY: 'auto', 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        
        {/* Top Header Row */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Database size={16} />
            <span>67,827 Simulated E-Commerce Transactions</span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '6px', 
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <FileText size={14} />
              <span>Project README</span>
            </a>
          </div>
        </header>

        {/* Active Screen Tab View */}
        <div style={{ flex: 1 }}>
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'cohorts' && <CohortMatrix />}
          {activeTab === 'simulator' && <Simulator />}
        </div>
      </main>

    </div>
  );
}

export default App;
