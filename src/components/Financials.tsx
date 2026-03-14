import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, ArrowRightLeft } from 'lucide-react';

export const Financials = () => {
  const exchangeRate = 7450; // PYG/USD
  const [costUSD, setCostUSD] = useState(15);
  const [pricePYG, setPricePYG] = useState(350000);
  const [commissionPercent, setCommissionPercent] = useState(20);

  const materialsPYG = costUSD * exchangeRate;
  const commissionPYG = (pricePYG * commissionPercent) / 100;
  const netUtility = pricePYG - materialsPYG - commissionPYG;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Finanzas Multi-Moneda</h2>
        <div style={{ background: '#F1F5F9', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
          <ArrowRightLeft size={14} style={{ marginRight: '0.4rem' }} />
          1 USD = 7.450 PYG
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Calculadora de Rentabilidad</h3>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo Insumo (USD)</label>
            <input 
              type="number" 
              className="card" 
              style={{ width: '100%', marginTop: '0.3rem' }} 
              value={costUSD}
              onChange={(e) => setCostUSD(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cobro al Paciente (PYG)</label>
            <input 
              type="number" 
              className="card" 
              style={{ width: '100%', marginTop: '0.3rem' }} 
              value={pricePYG}
              onChange={(e) => setPricePYG(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>% Comisión Clínica</label>
            <input 
              type="number" 
              className="card" 
              style={{ width: '100%', marginTop: '0.3rem' }} 
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo Materiales</p>
            <p style={{ fontWeight: 700 }}>{materialsPYG.toLocaleString()} PYG</p>
          </div>
          <Wallet color="var(--error)" />
        </div>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comisión Clínica</p>
            <p style={{ fontWeight: 700 }}>{commissionPYG.toLocaleString()} PYG</p>
          </div>
          <DollarSign color="var(--warning)" />
        </div>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#166534' }}>Utilidad Neta</p>
            <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#166534' }}>{netUtility.toLocaleString()} PYG</p>
          </div>
          <TrendingUp color="#166534" />
        </div>
      </div>
    </div>
  );
};
