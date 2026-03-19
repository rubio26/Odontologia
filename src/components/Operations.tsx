import { useState, useEffect } from 'react';
import { Terminal, History, FlaskConical, Lock, Wallet, EyeOff, Loader2, User, FileText, Calendar as CalendarIcon, PieChart, Sparkles } from 'lucide-react';
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
  
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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

  const generateReport = async (type: 'monthly' | 'custom' | 'stats' | 'labs') => {
    setIsGenerating(true);
    setReportType(type);
    
    try {
      let data: any = {};
      const now = new Date();

      if (type === 'monthly' || type === 'custom') {
        const start = type === 'monthly' ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString() : new Date(dateRange.start).toISOString();
        const end = type === 'monthly' ? now.toISOString() : new Date(dateRange.end + 'T23:59:59').toISOString();

        // 1. Fetch Income/Expense
        const { data: trans } = await supabase
          .from('transactions')
          .select('*, patients(full_name), clinics(name)')
          .gte('created_at', start)
          .lte('created_at', end);
        
        // 2. Fetch Pending Collections (A cobrar)
        const { data: treats } = await supabase
          .from('treatments')
          .select('*, patients(full_name)')
          .eq('status', 'active');
        
        const aCobrar = treats?.filter(t => (t.total_amount - t.paid_amount) > 0) || [];
        
        data = { 
          title: type === 'monthly' ? 'BALANCE MENSUAL' : 'BALANCE PERSONALIZADO',
          period: `${new Date(start).toLocaleDateString()} al ${new Date(end).toLocaleDateString()}`,
          transactions: trans || [],
          pending: aCobrar,
          totals: {
            income: trans?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount_pyg), 0) || 0,
            expense: trans?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount_pyg), 0) || 0,
            pending: aCobrar.reduce((sum, t) => sum + (t.total_amount - t.paid_amount), 0)
          }
        };
      } 
      else if (type === 'stats') {
        // Stats: Group by clinic and patient
        const { data: trans } = await supabase
          .from('transactions')
          .select('*, patients(full_name), clinics(name)')
          .eq('type', 'income');
        
        const byClinic: Record<string, number> = {};
        const byPatient: Record<string, number> = {};
        
        trans?.forEach(t => {
          const cName = t.clinics?.name || 'Sede Principal';
          const pName = t.patients?.full_name || 'Anónimo';
          byClinic[cName] = (byClinic[cName] || 0) + Number(t.amount_pyg);
          byPatient[pName] = (byPatient[pName] || 0) + Number(t.amount_pyg);
        });

        data = {
          title: 'ESTADÍSTICAS ACUMULADAS',
          period: `Al ${now.toLocaleDateString()}`,
          byClinic: Object.entries(byClinic).sort((a: any, b: any) => b[1] - a[1]),
          byPatient: Object.entries(byPatient).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10)
        };
      }
      else if (type === 'labs') {
        const { data: labs } = await supabase
          .from('lab_orders')
          .select('*, patients(full_name), laboratories(name)')
          .order('created_at', { ascending: false });
        
        data = {
          title: 'REPORTE DE GASTOS DE LABORATORIO',
          period: `Historial Completo`,
          orders: labs || [],
          total: labs?.reduce((sum, l) => sum + Number(l.price), 0) || 0
        };
      }

      setReportData(data);
      setTimeout(() => {
        window.print();
        setTimeout(() => setReportData(null), 100);
      }, 500);

    } catch (err: any) {
      alert('Error generando reporte: ' + err.message);
    } finally {
      setIsGenerating(false);
      setShowRangePicker(false);
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
        ? { ...newEntry, doctor_id: profile.id, is_home: clinics.length === 0 }
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
                <Lock size={18} /> Ver Reportes Financieros
              </button>
            ) : (
              <form onSubmit={handleVerifyPassword}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Ingresa tu contraseña para ver los reportes:
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
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowPasswordInput(false); setError(null); setPassword(''); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loadingAuth}>
                    {loadingAuth ? <Loader2 className="animate-spin" size={20} /> : 'Verificar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="card glass" style={{ padding: '0.5rem', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
              onClick={() => setShowIncome(false)}
            >
              <EyeOff size={18} />
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', padding: '0.5rem' }}>
              <button className="btn btn-outline" style={{ height: 'auto', padding: '1rem 0.5rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => generateReport('monthly')}>
                <FileText size={20} color="var(--primary)" />
                <span style={{ fontSize: '0.7rem' }}>Balance Mensual</span>
              </button>
              <button className="btn btn-outline" style={{ height: 'auto', padding: '1rem 0.5rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => setShowRangePicker(true)}>
                <CalendarIcon size={20} color="var(--primary)" />
                <span style={{ fontSize: '0.7rem' }}>Rango Fechas</span>
              </button>
              <button className="btn btn-outline" style={{ height: 'auto', padding: '1rem 0.5rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => generateReport('stats')}>
                <PieChart size={20} color="var(--primary)" />
                <span style={{ fontSize: '0.7rem' }}>Estadísticas</span>
              </button>
              <button className="btn btn-outline" style={{ height: 'auto', padding: '1rem 0.5rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => generateReport('labs')}>
                <FlaskConical size={20} color="var(--primary)" />
                <span style={{ fontSize: '0.7rem' }}>Gastos Lab</span>
              </button>
            </div>

            {showRangePicker && (
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <input type="date" className="report-input-field" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                  <input type="date" className="report-input-field" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>
                <button className="btn btn-primary w-full" onClick={() => generateReport('custom')} disabled={!dateRange.start || !dateRange.end}>
                  Generar Reporte Personalizado
                </button>
              </div>
            )}
            
            {isGenerating && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Loader2 className="animate-spin" size={18} /> <span>Generando reporte...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div id="print-area" style={{ display: 'none' }}>
        {reportData && (
          <div className="report-container">
            <header className="report-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#000', padding: '0.5rem', borderRadius: '4px' }}>
                  <Sparkles size={24} color="#D4AF37" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>LUMINI STUDIO</h1>
                  <p style={{ fontSize: '0.7rem', color: '#666', margin: 0 }}>ESTÉTICA DENTAL AVANZADA</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>{reportData.title}</h2>
                <p style={{ fontSize: '0.7rem', color: '#666', margin: 0 }}>{reportData.period}</p>
              </div>
            </header>

            {(reportType === 'monthly' || reportType === 'custom') && (
              <>
                <div className="report-stat-grid">
                  <div className="report-stat">
                    <span>INGRESOS TOTALES</span>
                    <b>{reportData.totals.income.toLocaleString()} PYG</b>
                  </div>
                  <div className="report-stat">
                    <span>EGRESOS TOTALES</span>
                    <b style={{ color: '#EF4444' }}>{reportData.totals.expense.toLocaleString()} PYG</b>
                  </div>
                  <div className="report-stat">
                    <span>SALDO PENDIENTE (A COBRAR)</span>
                    <b style={{ color: '#D4AF37' }}>{reportData.totals.pending.toLocaleString()} PYG</b>
                  </div>
                </div>

                <h3>Listado de Cuentas a Cobrar (Activos)</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Descripción</th>
                      <th>Costo Total</th>
                      <th>Abonado</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.pending.length > 0 ? (
                      reportData.pending.map((t: any) => (
                        <tr key={t.id}>
                          <td>{t.patients?.full_name}</td>
                          <td>{t.description}</td>
                          <td>{t.total_amount?.toLocaleString()}</td>
                          <td>{t.paid_amount?.toLocaleString()}</td>
                          <td style={{ fontWeight: 'bold' }}>{(t.total_amount - t.paid_amount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No hay cuentas pendientes de cobro actualmente.</td></tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {reportType === 'stats' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                  <div>
                    <h3>Ingresos por Consultorio</h3>
                    <table className="report-table">
                      <thead>
                        <tr><th>Consultorio</th><th>Recaudación</th></tr>
                      </thead>
                      <tbody>
                        {reportData.byClinic.length > 0 ? (
                          reportData.byClinic.map(([name, total]: [string, number]) => (
                            <tr key={name}><td>{name}</td><td style={{ fontWeight: 'bold' }}>{total.toLocaleString()} PYG</td></tr>
                          ))
                        ) : (
                          <tr><td colSpan={2} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>No hay registros de recaudación por sede.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3>Top 10 Pacientes (Facturación)</h3>
                    <table className="report-table">
                      <thead>
                        <tr><th>Paciente</th><th>Total Invertido</th></tr>
                      </thead>
                      <tbody>
                        {reportData.byPatient.length > 0 ? (
                          reportData.byPatient.map(([name, total]: [string, number]) => (
                            <tr key={name}><td>{name}</td><td style={{ fontWeight: 'bold' }}>{total.toLocaleString()} PYG</td></tr>
                          ))
                        ) : (
                          <tr><td colSpan={2} style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>No hay datos suficientes para el ranking.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {reportType === 'labs' && (
              <>
                <div style={{ margin: '2rem 0' }}>
                   <div className="report-stat" style={{ width: 'fit-content' }}>
                      <span>GASTO TOTAL EN LABORATORIO</span>
                      <b style={{ color: '#EF4444' }}>{reportData.total.toLocaleString()} PYG</b>
                   </div>
                </div>
                <h3>Historial Detallado de Trabajos</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Laboratorio</th>
                      <th>Paciente</th>
                      <th>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.length > 0 ? (
                      reportData.orders.map((o: any) => (
                        <tr key={o.id}>
                          <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          <td>{o.item_description}</td>
                          <td>{o.laboratories?.name || 'N/A'}</td>
                          <td>{o.patients?.full_name}</td>
                          <td style={{ fontWeight: 'bold' }}>{o.price?.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No hay registros de gastos de laboratorio.</td></tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            <footer className="report-footer">
              <p>Lumini Studio Dental - Sistema de Gestión Inteligente</p>
              <p>Generado por {profile.full_name} el {new Date().toLocaleString()}</p>
            </footer>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          /* Force white background and reset body */
          html, body { 
            background: white !important; 
            color: black !important;
            margin: 0 !important; 
            padding: 0 !important;
            height: auto !important;
            width: 100% !important;
          }

          /* Hide everything in the app by default */
          body * { 
            visibility: hidden !important; 
          }

          /* Specifically restore the report area and its children */
          #print-area, #print-area * { 
            visibility: visible !important; 
            display: inherit !important;
          }

          #print-area { 
            display: block !important;
            position: absolute !important;
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            background: white !important;
            padding: 1.5rem !important;
            z-index: 99999 !important;
          }

          /* Ensure layout elements in the report work correctly */
          .report-container { display: block !important; width: 100% !important; }
          .report-header { display: flex !important; justify-content: space-between !important; }
          .report-stat-grid { display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 1rem !important; margin: 2rem 0 !important; }
          .report-stat { display: block !important; }
          .report-table { display: table !important; width: 100% !important; border-collapse: collapse !important; }
          .report-table thead { display: table-header-group !important; }
          .report-table tbody { display: table-row-group !important; }
          .report-table tr { display: table-row !important; }
          .report-table th, .report-table td { display: table-cell !important; }
          .report-footer { display: flex !important; justify-content: space-between !important; }
        }

        /* Screen Styles (Dashboard) */
        .report-container { font-family: 'Inter', system-ui, sans-serif; color: black; background: white; }
        .report-header { display: flex; justify-content: space-between; border-bottom: 3px solid #D4AF37; padding-bottom: 1.5rem; margin-bottom: 2rem; }
        .report-stat { padding: 1.5rem; border: 1px solid #eee; border-radius: 12px; background: #fcfcfc; box-shadow: inset 0 0 10px rgba(0,0,0,0.02); }
        .report-stat span { display: block; font-size: 0.7rem; color: #777; margin-bottom: 0.5rem; font-weight: 700; letter-spacing: 0.05em; }
        .report-stat b { font-size: 1.4rem; display: block; color: #111; }
        .report-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.85rem; }
        .report-table th { text-align: left; background: #f8f8f8; padding: 1rem; border-bottom: 2px solid #eee; color: #444; font-weight: 700; }
        .report-table td { padding: 1rem; border-bottom: 1px solid #f0f0f0; color: #333; }
        .report-footer { margin-top: 5rem; border-top: 2px solid #f0f0f0; padding-top: 1.5rem; font-size: 0.75rem; color: #888; display: flex; justify-content: space-between; }
        .report-input-field { background: rgba(0,0,0,0.2) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; padding: 0.6rem; border-radius: 8px; width: 100%; }
        
        .report-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin: 2rem 0; }

        /* Table alternate colors */
        .report-table tbody tr:nth-child(even) { background: #fafafa; }
      `}</style>

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
