import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Wallet, ArrowRightLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CurrencyInput } from './CurrencyInput';

export const Financials = () => {
  const [exchangeRate, setExchangeRate] = useState(7450);
  const [costPYG, setCostPYG] = useState(115000);
  const [pricePYG, setPricePYG] = useState(350000);
  const [commissionPercent, setCommissionPercent] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['exchange_rate', 'default_commission']);
      
      if (data) {
        data.forEach(s => {
          if (s.key === 'exchange_rate') setExchangeRate(s.value.rate);
          if (s.key === 'default_commission') setCommissionPercent(s.value.percent);
        });
      }
    } catch (err) {
      console.error('Error loading financial settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const materialsPYG = costPYG;
  const costUSD = costPYG / exchangeRate;
  const commissionPYG = (pricePYG * commissionPercent) / 100;
  const netUtility = pricePYG - materialsPYG - commissionPYG;

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ padding: '1rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Finanzas Boutique</h2>
        <div className="badge badge-delivery">
          <ArrowRightLeft size={12} style={{ marginRight: '0.4rem' }} />
          1 USD ≈ {exchangeRate.toLocaleString()} PYG
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
              <CurrencyInput 
                className="card glass" 
                style={{ flex: 1, padding: '0.8rem', color: 'white' }} 
                value={costPYG}
                onChange={setCostPYG}
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
            <CurrencyInput 
              className="card glass" 
              style={{ width: '100%', padding: '0.8rem', color: 'white' }} 
              value={pricePYG}
              onChange={setPricePYG}
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
