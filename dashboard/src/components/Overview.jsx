import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Users, DollarSign, ShoppingBag, RefreshCw } from 'lucide-react';
import clusterSummary from '../data/cluster_summary.json';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Overview = () => {
  // Compute global KPIs from cluster summary
  const totalCustomers = clusterSummary.reduce((acc, curr) => acc + curr.CustomerCount, 0);
  const totalRevenue = clusterSummary.reduce((acc, curr) => acc + (curr.Monetary * curr.CustomerCount), 0);
  const avgRecency = clusterSummary.reduce((acc, curr) => acc + (curr.Recency * curr.CustomerCount), 0) / totalCustomers;
  const avgOrderCount = clusterSummary.reduce((acc, curr) => acc + (curr.Frequency * curr.CustomerCount), 0) / totalCustomers;

  // Segment colors matching CSS variables
  const colors = {
    'Champions': { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },
    'Loyal Spenders': { bg: 'rgba(6, 182, 212, 0.7)', border: '#06b6d4' },
    'At-Risk Spenders': { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },
    'Lost/Hibernating': { bg: 'rgba(244, 63, 94, 0.7)', border: '#f43f5e' }
  };

  const chartData = {
    labels: clusterSummary.map(item => item.Segment),
    datasets: [
      {
        label: 'Number of Customers',
        data: clusterSummary.map(item => item.CustomerCount),
        backgroundColor: clusterSummary.map(item => colors[item.Segment]?.bg || '#6366f1'),
        borderColor: clusterSummary.map(item => colors[item.Segment]?.border || '#6366f1'),
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const revenueData = {
    labels: clusterSummary.map(item => item.Segment),
    datasets: [
      {
        label: 'Total Revenue ($)',
        data: clusterSummary.map(item => Math.round(item.Monetary * item.CustomerCount)),
        backgroundColor: clusterSummary.map(item => colors[item.Segment]?.bg || '#6366f1'),
        borderColor: clusterSummary.map(item => colors[item.Segment]?.border || '#6366f1'),
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter' }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter' }
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Overview Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Performance metrics and customer RFM segmentations based on K-Means clustering.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Customers KPI */}
        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE CUSTOMERS</span>
            <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{totalCustomers.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 500 }}>
            Active over the last 24 months
          </div>
        </div>

        {/* Revenue KPI */}
        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL REVENUE</span>
            <div style={{ padding: '6px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '6px', color: 'var(--secondary)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">${Math.round(totalRevenue).toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 500 }}>
            Gross sales value generated
          </div>
        </div>

        {/* Orders KPI */}
        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>AVG ORDERS / CUST</span>
            <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', color: 'var(--emerald)' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="metric-value">{avgOrderCount.toFixed(1)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Lifetime invoice count average
          </div>
        </div>

        {/* Recency KPI */}
        <div className="glass-panel metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>AVG RECENCY</span>
            <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', color: 'var(--amber)' }}>
              <RefreshCw size={20} />
            </div>
          </div>
          <div className="metric-value">{Math.round(avgRecency)} Days</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Average days since last purchase
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Customer Count Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Customer Distribution by Segment</h3>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Contribution Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Revenue Contribution by Segment</h3>
          <div style={{ height: '300px' }}>
            <Bar data={revenueData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* Segment Breakdown Details */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Segment Characteristics Profiles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {clusterSummary.map(segment => {
            const badgeClass = segment.Segment === 'Champions' ? 'badge-champions' :
                               segment.Segment === 'Loyal Spenders' ? 'badge-loyal' :
                               segment.Segment === 'At-Risk Spenders' ? 'badge-atrisk' : 'badge-hibernating';
            return (
              <div key={segment.Segment} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <span className={`badge ${badgeClass}`} style={{ marginBottom: '12px' }}>{segment.Segment}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Size:</span>
                    <span style={{ fontWeight: 600 }}>{segment.CustomerCount} custs</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg Recency:</span>
                    <span style={{ fontWeight: 600 }}>{Math.round(segment.Recency)} days</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg Freq:</span>
                    <span style={{ fontWeight: 600 }}>{segment.Frequency.toFixed(1)} orders</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg Value:</span>
                    <span style={{ fontWeight: 600 }}>${Math.round(segment.Monetary)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Overview;
