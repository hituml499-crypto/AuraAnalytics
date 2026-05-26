import React from 'react';
import cohortsData from '../data/processed_cohorts.json';

const CohortMatrix = () => {
  // Generate header columns Month 0 to Month 12
  const maxMonthIndex = 12;
  const monthHeaders = Array.from({ length: maxMonthIndex + 1 }, (_, i) => `Month ${i}`);

  // Helper to color cell based on retention rate
  const getCellStyles = (rate) => {
    if (rate === null || rate === undefined) {
      return {
        background: 'transparent',
        color: 'var(--text-muted)',
      };
    }
    
    // Indigo shades based on rate (0 to 1)
    const opacity = Math.max(0.05, rate);
    const textLight = rate > 0.4 ? '#ffffff' : '#e2e8f0';
    return {
      backgroundColor: `rgba(99, 102, 241, ${opacity})`,
      color: textLight,
      fontWeight: rate > 0.5 ? '600' : '400',
      border: '1px solid rgba(255, 255, 255, 0.03)'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Cohort Retention Heatmap</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Tracks monthly customer signups (cohorts) and their active purchasing behavior over time.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Cohort Retention Matrix (%)</h3>
        
        <div className="cohort-table-container">
          <table className="cohort-table">
            <thead>
              <tr>
                <th className="cohort-cell-label" style={{ minWidth: '130px' }}>Signup Cohort</th>
                <th className="cohort-size-label" style={{ minWidth: '100px' }}>Cohort Size</th>
                {monthHeaders.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortsData.map((row) => (
                <tr key={row.cohort}>
                  <td className="cohort-cell-label">{row.cohort}</td>
                  <td className="cohort-size-label">{row.size.toLocaleString()}</td>
                  {row.retention.map((rate, idx) => {
                    const styles = getCellStyles(rate);
                    return (
                      <td 
                        key={idx} 
                        style={styles}
                        title={`Cohort ${row.cohort} - Month ${idx}: ${rate !== null ? (rate * 100).toFixed(1) + '%' : 'N/A'}`}
                      >
                        {rate !== null ? `${(rate * 100).toFixed(0)}%` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Retention Legend:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(255,255,255,0.05)' }}></span>
            <span>0-5%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(99, 102, 241, 0.25)' }}></span>
            <span>20-30%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(99, 102, 241, 0.5)' }}></span>
            <span>40-60%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(99, 102, 241, 0.9)' }}></span>
            <span>80-100%</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px' }}>Analyzing the Cohort Matrix</h3>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Month 0 (100%):</strong> Represents the base month where all customers in that cohort made their initial purchase.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Decay Curve:</strong> Notice how the retention drops in Month 1 and stabilizes. A steeper curve indicates churn issues, while a flatter curve demonstrates strong product retention and product-market fit.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Cohort Quality:</strong> Compare different signup months. If newer cohorts show higher retention numbers in Month 1 and Month 2 compared to older cohorts, it means onboarding or product updates are successfully retaining customers.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CohortMatrix;
