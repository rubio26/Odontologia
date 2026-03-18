import { useState, useEffect } from 'react';
import { Terminal, Droplets, CheckCircle2, History, FlaskConical, Lock, Wallet, EyeOff, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Operations = ({ profile }: { profile: any }) => {
  const [showIncome, setShowIncome] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [recentLog, setRecentLog] = useState<any>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);

  const [registryType, setRegistryType] = useState<'clinics' | 'labs'>('clinics');
  const [newEntry, setNewEntry] = useState({ name: '', address: '', phone: '' });
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  const [newLabOrder, setNewLabOrder] = useState({ patient_id: '', laboratory_id: '', item_description: '', price: 0 });
  const [isAddingLabWork, setIsAddingLabWork] = useState(false);

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

      // 5. Fetch Patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, full_name')
        .order('full_name');
      
      if (patientsData) setPatients(patientsData);

      // 6. Fetch Laboratories
      const { data: labsReg } = await supabase
        .from('laboratories')
        .select('*')
        .order('name');
      
      if (labsReg) setLaboratories(labsReg);

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
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const table = registryType === 'clinics' ? 'clinics' : 'laboratories';
      const payload = registryType === 'clinics' 
        ? { ...newEntry, is_home: clinics.length === 0 }
        : newEntry;

      const { data, error } = await supabase
        .from(table)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      
      if (registryType === 'clinics') setClinics([...clinics, data]);
      else setLaboratories([...laboratories, data]);

      setNewEntry({ name: '', address: '', phone: '' });
      setIsAddingEntry(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteEntry = async (id: string, type: 'clinics' | 'labs') => {
    if (!confirm('¿Seguro que quieres eliminar este registro?')) return;
    try {
      const table = type === 'clinics' ? 'clinics' : 'laboratories';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      if (type === 'clinics') setClinics(clinics.filter(c => c.id !== id));
      else setLaboratories(laboratories.filter(l => l.id !== id));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSetHome = async (id: string) => {
    try {
      await supabase.from('clinics').update({ is_home: false }).eq('doctor_id', profile.id);
      const { error } = await supabase.from('clinics').update({ is_home: true }).eq('id', id);
      if (error) throw error;
      setClinics(clinics.map(c => ({ ...c, is_home: c.id === id })));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddLabWork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .insert([newLabOrder])
        .select(`*, patients(full_name), laboratories(name)`)
        .single();

      if (error) throw error;
      setLabOrders([data, ...labOrders]);
      setNewLabOrder({ patient_id: '', laboratory_id: '', item_description: '', price: 0 });
      setIsAddingLabWork(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={18} color="var(--primary)" /> Control de Laboratorio
          </h3>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', height: 'auto' }}
            onClick={() => setIsAddingLabWork(!isAddingLabWork)}
          >
            {isAddingLabWork ? 'Cerrar' : '+ Añadir Trabajo'}
          </button>
        </div>

        {isAddingLabWork && (
          <form className="card glass" onSubmit={handleAddLabWork} style={{ marginBottom: '1.5rem' }}>
            <div className="auth-form" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <User size={16} color="var(--primary)" />
                <select 
                  required
                  value={newLabOrder.patient_id}
                  onChange={e => setNewLabOrder({...newLabOrder, patient_id: e.target.value})}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', padding: '0.8rem' }}
                >
                  <option value="" disabled style={{ background: '#111' }}>Seleccionar Paciente</option>
                  {patients.map(p => <option key={p.id} value={p.id} style={{ background: '#111' }}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <FlaskConical size={16} color="var(--primary)" />
                <select 
                  required
                  value={newLabOrder.laboratory_id}
                  onChange={e => setNewLabOrder({...newLabOrder, laboratory_id: e.target.value})}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', padding: '0.8rem' }}
                >
                  <option value="" style={{ background: '#111' }}>Seleccionar Laboratorio (Opcional)</option>
                  {laboratories.map(l => <option key={l.id} value={l.id} style={{ background: '#111' }}>{l.name}</option>)}
                </select>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <Terminal size={16} />
                  <input 
                    placeholder="Descripción (Ej: PPR)" 
                    value={newLabOrder.item_description} 
                    onChange={e => setNewLabOrder({...newLabOrder, item_description: e.target.value})}
                    required 
                  />
                </div>
                <div className="input-group">
                  <Wallet size={16} />
                  <input 
                    type="number"
                    placeholder="Precio" 
                    value={newLabOrder.price || ''} 
                    onChange={e => setNewLabOrder({...newLabOrder, price: Number(e.target.value)})}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full">Registrar Trabajo</button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {labOrders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No hay trabajos activos.</p>
          ) : (
            labOrders.map(order => (
              <div key={order.id} className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.item_description}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {order.patients?.full_name} {order.laboratories ? `| ${order.laboratories.name}` : ''}
                    </p>
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

      {/* Gestión Unificada de Registros (Sedes y Laboratorios) */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="var(--primary)" /> Sedes, Consultorios y Laboratorios
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '12px' }}>
          <button 
            className={`btn w-full ${registryType === 'clinics' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.75rem', height: '35px' }}
            onClick={() => setRegistryType('clinics')}
          >
            Mis Sedes
          </button>
          <button 
            className={`btn w-full ${registryType === 'labs' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.75rem', height: '35px' }}
            onClick={() => setRegistryType('labs')}
          >
            Laboratorios
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Lista de {registryType === 'clinics' ? 'sedes donde atiendes' : 'laboratorios de prótesis'}
          </p>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem' }}
            onClick={() => setIsAddingEntry(!isAddingEntry)}
          >
            {isAddingEntry ? 'Cancelar' : `+ Nuevo ${registryType === 'clinics' ? 'Lugar' : 'Lab'}`}
          </button>
        </div>

        {isAddingEntry && (
          <form className="card glass" onSubmit={handleAddEntry} style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div className="auth-form" style={{ gap: '0.8rem' }}>
              <div className="input-group">
                <Terminal size={16} />
                <input 
                  placeholder={`Nombre de ${registryType === 'clinics' ? 'la Sede' : 'el Laboratorio'}`} 
                  value={newEntry.name} 
                  onChange={e => setNewEntry({...newEntry, name: e.target.value})}
                  required 
                />
              </div>
              <div className="input-group">
                <User size={16} />
                <input 
                  placeholder="Número de Celular" 
                  value={newEntry.phone} 
                  onChange={e => setNewEntry({...newEntry, phone: e.target.value})}
                />
              </div>
              <div className="input-group">
                <FlaskConical size={16} />
                <input 
                  placeholder="Dirección / Ubicación" 
                  value={newEntry.address} 
                  onChange={e => setNewEntry({...newEntry, address: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Guardar Registro</button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {(registryType === 'clinics' ? clinics : laboratories).map(item => (
            <div key={item.id} className="card glass" style={{ 
              position: 'relative', 
              borderLeft: (registryType === 'clinics' && item.is_home) ? '4px solid var(--primary)' : '1px solid var(--border-luxury)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</p>
                    {registryType === 'clinics' && item.is_home && <span className="badge badge-clinic">PRINCIPAL</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {item.phone && `📱 ${item.phone}`} {item.address && `| 📍 ${item.address}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {registryType === 'clinics' && !item.is_home && (
                    <button 
                      onClick={() => handleSetHome(item.id)}
                      className="btn glass" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.65rem' }}
                    >
                      Home
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteEntry(item.id, registryType)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <EyeOff size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(registryType === 'clinics' ? clinics : laboratories).length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
              <p style={{ fontSize: '0.8rem' }}>No hay registros de {registryType === 'clinics' ? 'sedes' : 'laboratorios'}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
