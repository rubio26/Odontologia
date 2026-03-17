import { useState } from 'react';
import { Terminal, Droplets, CheckCircle2, History, FlaskConical, Lock, Wallet, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Operations = ({ profile }: { profile: any }) => {
  const [showIncome, setShowIncome] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labOrders = [
    { id: 101, patient: 'Juan Pérez', item: 'Corona Zirconio', status: 'En Prueba', price: '450.000 PYG' },
    { id: 102, patient: 'Maria Rossi', item: 'Perno Muñón', status: 'Pendiente', price: '120.000 PYG' },
  ];

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

      if (authError) throw new Error('Contraseña incorrecta');

      setShowIncome(true);
      setShowPasswordInput(false);
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Centro Operativo</h2>
        <div className="badge badge-clinic">Bioseguridad Nivel A</div>
      </div>

      {/* Sección de Ingresos Protegida */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={18} color="var(--primary)" /> Recaudación
        </h3>
        
        {!showIncome ? (
          <div className="card glass" style={{ padding: '1.5rem' }}>
            {!showPasswordInput ? (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => setShowPasswordInput(true)}
              >
                <Lock size={18} /> Ver Ingresos Estimados
              </button>
            ) : (
              <form onSubmit={handleVerifyPassword}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Ingresa tu contraseña para ver los ingresos:
                </p>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <Lock size={18} />
                  <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    autoFocus
                  />
                </div>
                {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setShowPasswordInput(false);
                      setError(null);
                      setPassword('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="card" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A1A 100%)', borderLeft: '5px solid var(--primary)', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowIncome(false)}
            >
              <EyeOff size={18} />
            </button>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>Ingresos Estimados (Mes)</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-gold)' }}>12.450.000 <span style={{ fontSize: '1rem' }}>PYG</span></p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <span className="badge badge-clinic">24 CITAS CLÍNICA</span>
              <span className="badge badge-delivery">12 CITAS DELIVERY</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskConical size={18} color="var(--primary)" /> Control de Laboratorio
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {labOrders.map(order => (
            <div key={order.id} className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.item}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paciente: {order.patient}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-delivery" style={{ fontSize: '0.6rem' }}>{order.status}</span>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: 'var(--text-gold)' }}>{order.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplets size={18} color="var(--success)" /> Bitácora de Esterilización
        </h3>
        <div className="card glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
              <Terminal color="var(--success)" size={32} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Último Ciclo #892</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Autoclave Premium 134°C</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                <CheckCircle2 size={14} /> <span>EXITOSO - T: 25min / P: 2.2bar</span>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            <History size={18} /> Ver Historial Biológico
          </button>
        </div>
      </div>
    </div>
  );
};
