import React, { useState, useEffect } from 'react';
import { Play, ShieldAlert, Cpu, Sparkles, TrendingUp, Info } from 'lucide-react';
import modelParams from '../data/model_parameters.json';
import rfmSample from '../data/rfm_sample.json';

const Simulator = () => {
  // Preset personas for quick loading
  const personas = [
    { name: "Select a Customer Persona...", recency: 30, frequency: 5, monetary: 350 },
    { name: "VIP Champion (High Value, Recent)", recency: 4, frequency: 18, monetary: 1550 },
    { name: "Loyal Shopper (Recent, Consistent)", recency: 15, frequency: 8, monetary: 480 },
    { name: "At-Risk Customer (Valuable but Silent)", recency: 120, frequency: 12, monetary: 980 },
    { name: "Lapsed Customer (Unfrequent, Old)", recency: 280, frequency: 2, monetary: 60 }
  ];

  // State variables for inputs
  const [recency, setRecency] = useState(30);
  const [frequency, setFrequency] = useState(5);
  const [monetary, setMonetary] = useState(350);
  const [selectedSample, setSelectedSample] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(0);

  // Output states
  const [churnProb, setChurnProb] = useState(0);
  const [predictedSpend, setPredictedSpend] = useState(0);

  // Run client-side inference
  useEffect(() => {
    // 1. Churn Prediction Calculation
    const cParams = modelParams.churn;
    
    // Scale and transform features
    const r_log_c = Math.log(Number(recency) + 1);
    const f_log_c = Math.log(Number(frequency));
    const m_log_c = Math.log(Number(monetary));

    const r_scaled_c = (r_log_c - cParams.scaling.mean.Recency) / cParams.scaling.scale.Recency;
    const f_scaled_c = (f_log_c - cParams.scaling.mean.Frequency) / cParams.scaling.scale.Frequency;
    const m_scaled_c = (m_log_c - cParams.scaling.mean.Monetary) / cParams.scaling.scale.Monetary;

    // Dot product
    const z_churn = cParams.intercept + 
                    (cParams.coefficients.Recency * r_scaled_c) + 
                    (cParams.coefficients.Frequency * f_scaled_c) + 
                    (cParams.coefficients.Monetary * m_scaled_c);
    
    // Sigmoid function
    const probability = 1 / (1 + Math.exp(-z_churn));
    setChurnProb(probability);

    // 2. CLV Prediction Calculation
    const rParams = modelParams.clv;
    
    const r_log_r = Math.log(Number(recency) + 1);
    const f_log_r = Math.log(Number(frequency));
    const m_log_r = Math.log(Number(monetary));

    const r_scaled_r = (r_log_r - rParams.scaling.mean.Recency) / rParams.scaling.scale.Recency;
    const f_scaled_r = (f_log_r - rParams.scaling.mean.Frequency) / rParams.scaling.scale.Frequency;
    const m_scaled_r = (m_log_r - rParams.scaling.mean.Monetary) / rParams.scaling.scale.Monetary;

    // Dot product
    const predicted_val = rParams.intercept + 
                          (rParams.coefficients.Recency * r_scaled_r) + 
                          (rParams.coefficients.Frequency * f_scaled_r) + 
                          (rParams.coefficients.Monetary * m_scaled_r);
    
    // Clip at 0 (spend cannot be negative)
    setPredictedSpend(Math.max(0, predicted_val));

  }, [recency, frequency, monetary]);

  // Handle Preset Persona Selection
  const handlePresetChange = (e) => {
    const idx = Number(e.target.value);
    setSelectedPreset(idx);
    setSelectedSample(""); // reset sample selection
    
    if (idx > 0) {
      const p = personas[idx];
      setRecency(p.recency);
      setFrequency(p.frequency);
      setMonetary(p.monetary);
    }
  };

  // Handle Sample Customer Selection from raw files
  const handleSampleChange = (e) => {
    const customerId = e.target.value;
    setSelectedSample(customerId);
    setSelectedPreset(0); // reset preset dropdown
    
    const customer = rfmSample.find(c => c.CustomerID.toString() === customerId);
    if (customer) {
      setRecency(customer.Recency);
      setFrequency(customer.Frequency);
      setMonetary(Math.round(customer.Monetary));
    }
  };

  // Color helper for risk UI
  const getRiskLabel = (prob) => {
    if (prob < 0.3) return { label: 'Low Churn Risk', color: 'var(--emerald)' };
    if (prob < 0.7) return { label: 'Medium Churn Risk', color: 'var(--amber)' };
    return { label: 'High Churn Risk', color: 'var(--rose)' };
  };

  const riskInfo = getRiskLabel(churnProb);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Interactive Machine Learning Simulator</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Evaluate custom metrics and run client-side predictions of customer Churn Risk and 90-day spend value in real-time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Sliders and Selectors Panel */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} className="glow-text" style={{ color: 'var(--primary)' }} />
            Simulator Parameters
          </h3>

          {/* Quick Selectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Preset Customer Personas
              </label>
              <select 
                value={selectedPreset} 
                onChange={handlePresetChange}
                style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              >
                {personas.map((p, idx) => (
                  <option key={idx} value={idx}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Or select real customer from dataset
              </label>
              <select 
                value={selectedSample} 
                onChange={handleSampleChange}
                style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              >
                <option value="">Select a Customer ID...</option>
                {rfmSample.slice(0, 50).map((c) => (
                  <option key={c.CustomerID} value={c.CustomerID}>
                    ID: {c.CustomerID} ({c.Segment}) - Spend: ${Math.round(c.Monetary)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)' }} />

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Recency Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Recency (Days)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{recency} Days</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="365" 
                value={recency} 
                onChange={(e) => { setRecency(e.target.value); setSelectedPreset(0); }} 
                className="form-range" 
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Days since last transaction (higher increases churn probability).</span>
            </div>

            {/* Frequency Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Frequency (Orders)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{frequency} Orders</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="60" 
                value={frequency} 
                onChange={(e) => { setFrequency(e.target.value); setSelectedPreset(0); }} 
                className="form-range" 
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total unique orders placed (higher decreases churn probability).</span>
            </div>

            {/* Monetary Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Monetary Spend ($)</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>${monetary}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="5000" 
                value={monetary} 
                onChange={(e) => { setMonetary(e.target.value); setSelectedPreset(0); }} 
                className="form-range" 
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lifetime historical monetary revenue generated.</span>
            </div>

          </div>
        </div>

        {/* Prediction Outputs Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Prediction Dashboard */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
              Model Insights
            </h3>

            {/* Churn Prediction Output */}
            <div style={{ margin: '24px 0' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                PREDICTED CHURN RISK (30-DAY WINDOW)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: riskInfo.color }}>
                  {(churnProb * 100).toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: riskInfo.color }}>
                  {riskInfo.label}
                </span>
              </div>
              
              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${churnProb * 100}%`, height: '100%', background: riskInfo.color, borderRadius: '4px', transition: 'width 0.2s ease' }} />
              </div>
            </div>

            {/* CLV Prediction Output */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                PREDICTED FUTURE VALUE (NEXT 90-DAYS SPEND)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', color: 'var(--secondary)' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800 }}>
                  ${predictedSpend.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  CLV Forecast
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Predicted value based on regularized Ridge regression weights.
              </span>
            </div>
          </div>

          {/* Model Metrics Display */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} style={{ color: 'var(--primary)' }} />
              Production Model Metrics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Churn Accuracy</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald)' }}>
                  {(modelParams.churn.metrics.accuracy * 100).toFixed(1)}%
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>ROC-AUC: {modelParams.churn.metrics.auc.toFixed(2)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>CLV Model Fit</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  R²: {modelParams.clv.metrics.r2_score.toFixed(3)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>MAE: ${modelParams.clv.metrics.mae.toFixed(1)}</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Model Weights / Explainability */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Feature Impact Analysis (Model Coefficients)</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Coefficients demonstrate how each metric pushes the predictions. Positive values increase the prediction; negative values decrease it.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Churn Weights */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--rose)' }}>Churn Risk Coefficients</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(modelParams.churn.coefficients).map(([feat, val]) => (
                <div key={feat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>{feat}</span>
                    <span style={{ fontWeight: 600, color: val > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                      {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: val < 0 ? 'auto' : '50%', 
                      right: val < 0 ? '50%' : 'auto',
                      width: `${Math.min(50, Math.abs(val) * 20)}%`, 
                      height: '100%', 
                      background: val > 0 ? 'var(--rose)' : 'var(--emerald)', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLV Weights */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--secondary)' }}>Future CLV Spend Coefficients</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(modelParams.clv.coefficients).map(([feat, val]) => (
                <div key={feat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>{feat}</span>
                    <span style={{ fontWeight: 600, color: val > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                      {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: val < 0 ? 'auto' : '50%', 
                      right: val < 0 ? '50%' : 'auto',
                      width: `${Math.min(50, Math.abs(val) * 20)}%`, 
                      height: '100%', 
                      background: val > 0 ? 'var(--emerald)' : 'var(--rose)', 
                      borderRadius: '3px' 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Simulator;
