import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, ArrowRightLeft } from 'lucide-react';

export const Financials = () => {
  const exchangeRate = 7450; // PYG/USD
  const [costPYG, setCostPYG] = useState(115000);
  const [pricePYG, setPricePYG] = useState(350000);
  const [commissionPercent, setCommissionPercent] = useState(20);

  const materialsPYG = costPYG;
  const costUSD = costPYG / exchangeRate;
  const commissionPYG = (pricePYG * commissionPercent) / 100;
  const netUtility = pricePYG - materialsPYG - commissionPYG;

  return (
    <div style={{ padding: '1rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Finanzas Boutique</h2>
        <div className="badge badge-delivery">
          <ArrowRightLeft size={12} style={{ marginRight: '0.4rem' }} />
          1 USD ≈ 7.450 PYG
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Calculadora de Rentabilidad</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ fontSize: '0.75em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Costo Insumos (Guaraníes)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="number" 
                className="card glass" 
                style={{ flex: 1, padding: '0.8rem', color: 'white' }} 
                value={costPYG}
                onChange={(e) => setCostPYG(Number(e.target.value))}
              />
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.8rem', color: 'var(--primary)' }}>
                ≈ ${costUSD.toFixed(2)}
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Honorarios / Precio al Paciente (PYG)
            </label>
            <input 
              type="number" 
              className="card glass" 
              style={{ width: '100%', padding: '0.8rem', color: 'white' }} 
              value={pricePYG}
              onChange={(e) => setPricePYG(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Comisión Clínica / Consultorio (%)
            </label>
            <input 
              type="number" 
              className="card glass" 
              style={{ width: '100%', padding: '0.8rem', color: 'white' }} 
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo Materiales</p>
            <p style={{ fontWeight: 700, color: 'var(--error)' }}>{materialsPYG.toLocaleString()} PYG</p>
          </div>
          <Wallet color="var(--error)" size={20} />
        </div>
        <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comisión Clínica</p>
            <p style={{ fontWeight: 700, color: 'var(--warning)' }}>{commissionPYG.toLocaleString()} PYG</p>
          </div>
          <DollarSign color="var(--warning)" size={20} />
        </div>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success)' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Utilidad Neta Real</p>
            <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--success)' }}>{netUtility.toLocaleString()} PYG</p>
          </div>
          <TrendingUp color="var(--success)" size={24} />
        </div>
      </div>
    </div>
  );
};
