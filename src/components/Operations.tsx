import { useState, useEffect } from 'react';
import { Terminal, Droplets, CheckCircle2, History, FlaskConical, Lock, Wallet, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Operations = ({ profile }: { profile: any }) => {
  const [showIncome, setShowIncome] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [recentLog, setRecentLog] = useState<any>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);

  const [newClinic, setNewClinic] = useState({ name: '', address: '', phone: '' });
  const [isAddingClinic, setIsAddingClinic] = useState(false);

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    setLoadingInitial(true);
    try {
      // 1. Fetch Lab Orders
      const { data: labs } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patients (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (labs) setLabOrders(labs);

      // 2. Fetch Latest Sterilization Log
      const { data: log } = await supabase
        .from('sterilization_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (log) setRecentLog(log);

      // 3. Fetch Monthly Earnings (Sum of transactions)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: trans } = await supabase
        .from('transactions')
        .select('amount_pyg')
        .eq('type', 'income')
        .gte('created_at', firstDay);

      if (trans) {
        const total = trans.reduce((sum, t) => sum + Number(t.amount_pyg), 0);
        setMonthlyEarnings(total);
      }

      // 4. Fetch Clinics
      const { data: clinicsData } = await supabase
        .from('clinics')
        .select('*')
        .order('is_home', { ascending: false });
      
      if (clinicsData) setClinics(clinicsData);

    } catch (err) {
      console.error('Error fetching operations data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
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
      setLoadingAuth(false);
    }
  };
  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('clinics')
        .insert([{ ...newClinic, is_home: clinics.length === 0 }])
        .select()
        .single();

      if (error) throw error;
      setClinics([...clinics, data]);
      setNewClinic({ name: '', address: '', phone: '' });
      setIsAddingClinic(false);
    } catch (err: any) {
      alert('Error al añadir clinica: ' + err.message);
    }
  };

  const handleDeleteClinic = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta sede?')) return;
    try {
      const { error } = await supabase.from('clinics').delete().eq('id', id);
      if (error) throw error;
      setClinics(clinics.filter(c => c.id !== id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleSetHome = async (id: string) => {
    try {
      // 1. Quitar home de todos
      await supabase.from('clinics').update({ is_home: false }).eq('doctor_id', profile.id);
      // 2. Poner home en el seleccionado
      const { error } = await supabase.from('clinics').update({ is_home: true }).eq('id', id);
      
      if (error) throw error;
      setClinics(clinics.map(c => ({ ...c, is_home: c.id === id })));
    } catch (err: any) {
      alert('Error al marcar sede principal: ' + err.message);
    }
  };

  if (loadingInitial) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Sincronizando Centro Operativo...</p>
    </div>
  );

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
                    disabled={loadingAuth}
                  >
                    {loadingAuth ? <Loader2 className="animate-spin" size={20} /> : 'Verificar'}
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
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {monthlyEarnings.toLocaleString()} <span style={{ fontSize: '1rem' }}>PYG</span>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
               <span className="badge badge-clinic">BASADO EN TRANSACCIONES REALES</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskConical size={18} color="var(--primary)" /> Control de Laboratorio
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {labOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No hay pedidos activos.</p>
          ) : (
            labOrders.map(order => (
              <div key={order.id} className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.item_description}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paciente: {order.patients?.full_name}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-delivery" style={{ fontSize: '0.6rem' }}>{order.status}</span>
                    <p style={{ fontSize: '0.75rem', marginTop: '0.3rem', color: 'var(--text-gold)' }}>
                      {Number(order.price).toLocaleString()} PYG
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
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
            {recentLog ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Último Ciclo {recentLog.cycle_number ? `#${recentLog.cycle_number}` : ''}</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{recentLog.machine_name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <CheckCircle2 size={14} /> <span>{recentLog.status} - T: {recentLog.temperature}°C / P: {recentLog.pressure}bar</span>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Sin Registros</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No se han registrado ciclos de esterilización.</p>
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>
            <History size={18} /> Ver Historial Biológico
          </button>
        </div>
      </div>

      {/* Gestión de Sedes / Consultorios */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="var(--primary)" /> Mis Sedes y Consultorios
          </h3>
          <button 
            className="btn glass" 
            style={{ padding: '0.5rem', fontSize: '0.75rem' }}
            onClick={() => setIsAddingClinic(!isAddingClinic)}
          >
            {isAddingClinic ? 'Cerrar' : '+ Añadir'}
          </button>
        </div>

        {isAddingClinic && (
          <form className="card glass" onSubmit={handleAddClinic} style={{ marginBottom: '1.5rem' }}>
            <div className="auth-form">
              <div className="input-group">
                <Terminal size={16} />
                <input 
                  placeholder="Nombre de la Sede" 
                  value={newClinic.name} 
                  onChange={e => setNewClinic({...newClinic, name: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <FlaskConical size={16} />
                <input 
                  placeholder="Dirección" 
                  value={newClinic.address} 
                  onChange={e => setNewClinic({...newClinic, address: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Guardar Sede</button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {clinics.map(clinic => (
            <div key={clinic.id} className="card glass" style={{ position: 'relative', borderLeft: clinic.is_home ? '4px solid var(--primary)' : '1px solid var(--border-luxury)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{clinic.name}</p>
                    {clinic.is_home && <span className="badge badge-clinic">PRINCIPAL</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{clinic.address}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!clinic.is_home && (
                    <button 
                      onClick={() => handleSetHome(clinic.id)}
                      className="btn glass" 
                      style={{ padding: '0.4rem', fontSize: '0.7rem' }}
                      title="Marcar como Principal"
                    >
                      Set Home
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteClinic(clinic.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                  >
                    <EyeOff size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {clinics.length === 0 && !isAddingClinic && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tienes sedes registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
};
