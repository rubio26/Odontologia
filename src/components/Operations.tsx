import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, History, FlaskConical, Lock, Wallet, EyeOff, Loader2, User, FileText, Calendar as CalendarIcon, PieChart, ArrowRight, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Operations = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
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

  const handleUpdateProfileName = async (newName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', profile.id);

      if (error) throw error;
      
      alert('Nombre actualizado con éxito. El cambio se verá reflejado al recargar.');
      window.location.reload();
    } catch (err: any) {
      alert('Error actualizando perfil: ' + err.message);
    }
  };

  const fetchOperationsData = async () => {
    setLoadingInitial(true);
    try {
      // 1. Fetch Lab Orders
      const { data: labs } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patients (full_name),
          laboratories (name)
        `)
        .eq('doctor_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (labs) setLabOrders(labs);

      // 4. Fetch Clinics
      const { data: clinicsData } = await supabase
        .from('clinics')
        .select('*')
        .eq('doctor_id', profile.id)
        .order('is_home', { ascending: false });
      
      if (clinicsData) setClinics(clinicsData);

      // 5. Fetch Patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('doctor_id', profile.id)
        .order('full_name');
      
      if (patientsData) setPatients(patientsData);

      // 6. Fetch Laboratories
      const { data: labsReg } = await supabase
        .from('laboratories')
        .select('*')
        .eq('doctor_id', profile.id)
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
    
    try {
      let reportData: any = {};
      const now = new Date();

      if (type === 'monthly' || type === 'custom') {
        const start = type === 'monthly' ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString() : new Date(dateRange.start).toISOString();
        const end = type === 'monthly' ? now.toISOString() : new Date(dateRange.end + 'T23:59:59').toISOString();

        const { data: trans } = await supabase
          .from('transactions')
          .select('*, patients(full_name), clinics(name)')
          .eq('doctor_id', profile.id)
          .gte('created_at', start)
          .lte('created_at', end);
        
        const { data: treats } = await supabase
          .from('treatments')
          .select('*, patients(full_name)')
          .eq('doctor_id', profile.id)
          .eq('status', 'active');
        
        const pending = treats?.filter(t => (t.total_amount - t.paid_amount) > 0) || [];
        
        reportData = { 
          title: type === 'monthly' ? 'BALANCE MENSUAL' : 'BALANCE PERSONALIZADO',
          period: `${new Date(start).toLocaleDateString()} al ${new Date(end).toLocaleDateString()}`,
          totals: {
            income: trans?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount_pyg), 0) || 0,
            expense: trans?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount_pyg), 0) || 0,
            pending: pending.reduce((sum, t) => sum + (t.total_amount - t.paid_amount), 0)
          },
          pending: pending
        };
      } 
      else if (type === 'stats') {
        const { data: trans } = await supabase
          .from('transactions')
          .select('*, patients(full_name), clinics(name)')
          .eq('doctor_id', profile.id)
          .eq('type', 'income');
        
        const byClinic: Record<string, number> = {};
        const byPatient: Record<string, number> = {};
        
        trans?.forEach(t => {
          const cName = t.clinics?.name || 'Sede Principal';
          const pName = t.patients?.full_name || 'Anónimo';
          byClinic[cName] = (byClinic[cName] || 0) + Number(t.amount_pyg);
          byPatient[pName] = (byPatient[pName] || 0) + Number(t.amount_pyg);
        });

        reportData = {
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
          .eq('doctor_id', profile.id)
          .order('created_at', { ascending: false });
        
        reportData = {
          title: 'REPORTE GASTOS DE LABORATORIO',
          period: `Historial Completo`,
          orders: labs || [],
          total: labs?.reduce((sum, l) => sum + Number(l.price), 0) || 0
        };
      }

      // OPEN NEW WINDOW FOR PRINTING
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>${reportData.title} - Lumini Studio</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; padding: 40px; color: #2D3436; line-height: 1.5; background: white; margin: 0; }
              .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 25px; margin-bottom: 35px; display: flex; justify-content: space-between; align-items: flex-end; }
              .logo-box { text-align: left; }
              .logo { font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #1a1a1a; margin-bottom: 2px; display: flex; align-items: center; gap: 10px; }
              .subtitle { font-size: 10px; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase; font-weight: 600; }
              .doc-info { text-align: right; }
              .doc-type { font-size: 18px; font-weight: 700; color: #1a1a1a; }
              .period { font-size: 12px; color: #636E72; }
              
              .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
              .stat-card { padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fafafa; }
              .stat-label { font-size: 10px; font-weight: 700; color: #636E72; text-transform: uppercase; margin-bottom: 5px; display: block; }
              .stat-value { font-size: 18px; font-weight: 700; color: #1a1a1a; }

              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
              th { text-align: left; padding: 12px; background: #f8f8f8; border-bottom: 2px solid #eee; color: #636E72; text-transform: uppercase; font-size: 11px; }
              td { padding: 12px; border-bottom: 1px solid #f2f2f2; }
              tr:nth-child(even) { background: #fafafa; }
              
              .section-title { font-size: 14px; font-weight: 700; color: #D4AF37; text-transform: uppercase; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; color: #a0a0a0; display: flex; justify-content: space-between; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-box">
                <div class="logo">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                   LUMINI STUDIO
                </div>
                <div class="subtitle">ESTÉTICA DENTAL AVANZADA</div>
              </div>
              <div class="doc-info">
                <div class="doc-type">${reportData.title}</div>
                <div class="period">${reportData.period}</div>
              </div>
            </div>

            ${(type === 'monthly' || type === 'custom') ? `
              <div class="stat-grid">
                <div class="stat-card">
                  <span class="stat-label">Ingresos</span>
                  <div class="stat-value" style="color: #27ae60;">${reportData.totals.income.toLocaleString()} PYG</div>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Egresos</span>
                  <div class="stat-value" style="color: #e74c3c;">${reportData.totals.expense.toLocaleString()} PYG</div>
                </div>
                <div class="stat-card" style="background: #fdfaf0; border-color: #D4AF37;">
                  <span class="stat-label">Pendiente (A Cobrar)</span>
                  <div class="stat-value" style="color: #D4AF37;">${reportData.totals.pending.toLocaleString()} PYG</div>
                </div>
              </div>

              <div class="section-title">Cuentas Pendientes de Cobro</div>
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Descripción</th>
                    <th style="text-align: right;">Presupuesto</th>
                    <th style="text-align: right;">Abonado</th>
                    <th style="text-align: right;">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.pending.length > 0 ? reportData.pending.map((t: any) => `
                    <tr>
                      <td>${t.patients?.full_name}</td>
                      <td>${t.description}</td>
                      <td style="text-align: right;">${t.total_amount?.toLocaleString()}</td>
                      <td style="text-align: right;">${t.paid_amount?.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: 700; color: #e74c3c;">${(t.total_amount - t.paid_amount).toLocaleString()}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">No hay cobros pendientes registrados.</td></tr>'}
                </tbody>
              </table>
            ` : ''}

            ${type === 'stats' ? `
              <div class="section-title">Análisis por Sede / Consultorio</div>
              <table>
                <thead>
                  <tr><th>Sede / Consultorio</th><th style="text-align: right;">Recaudación Acumulada</th></tr>
                </thead>
                <tbody>
                  ${reportData.byClinic.length > 0 ? reportData.byClinic.map(([name, total]: [string, number]) => `
                    <tr><td>${name}</td><td style="text-align: right; font-weight: 700;">${total.toLocaleString()} PYG</td></tr>
                  `).join('') : '<tr><td colspan="2" style="text-align: center; padding: 30px;">No hay datos de recaudación.</td></tr>'}
                </tbody>
              </table>

              <div class="section-title">Top 10 Pacientes (Mayor Facturación)</div>
              <table>
                <thead>
                  <tr><th>Paciente</th><th style="text-align: right;">Total Histórico</th></tr>
                </thead>
                <tbody>
                  ${reportData.byPatient.length > 0 ? reportData.byPatient.map(([name, total]: [string, number]) => `
                    <tr><td>${name}</td><td style="text-align: right; font-weight: 700; color: #D4AF37;">${total.toLocaleString()} PYG</td></tr>
                  `).join('') : '<tr><td colspan="2" style="text-align: center; padding: 30px;">Sin datos suficientes.</td></tr>'}
                </tbody>
              </table>
            ` : ''}

            ${type === 'labs' ? `
              <div class="stat-card" style="width: fit-content; margin-bottom: 30px; border-left: 5px solid #e74c3c;">
                <span class="stat-label">Inversión Total en Laboratorios</span>
                <div class="stat-value" style="color: #e74c3c;">${reportData.total.toLocaleString()} PYG</div>
              </div>

              <div class="section-title">Detalle de Trabajos Externos</div>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Trabajo</th>
                    <th>Laboratorio</th>
                    <th>Paciente</th>
                    <th style="text-align: right;">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.orders.length > 0 ? reportData.orders.map((o: any) => `
                    <tr>
                      <td>${new Date(o.created_at).toLocaleDateString()}</td>
                      <td>${o.item_description}</td>
                      <td>${o.laboratories?.name || '---'}</td>
                      <td>${o.patients?.full_name}</td>
                      <td style="text-align: right; font-weight: 700;">${o.price?.toLocaleString()}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 30px;">No hay registros de laboratorio.</td></tr>'}
                </tbody>
              </table>
            ` : ''}

            <div class="footer">
              <div>Emitido por: ${profile.full_name} | Lumini Studio® Smart Management</div>
              <div>Generado el: ${new Date().toLocaleString()}</div>
            </div>
            
            <script>
              window.onload = () => { 
                window.print(); 
                // Close after some time? Maybe better keep open so they can save.
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

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
      const payload = { ...newEntry, doctor_id: profile.id, is_home: registryType === 'clinics' ? clinics.length === 0 : false };

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
      const { error } = await supabase.from(table).delete().eq('id', id).eq('doctor_id', profile.id);
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
      const { error } = await supabase.from('clinics').update({ is_home: true }).eq('id', id).eq('doctor_id', profile.id);
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
        .insert([{ ...newLabOrder, doctor_id: profile.id }])
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

      {/* SECCIÓN: MI PERFIL */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} color="var(--primary)" /> Mi Perfil
        </h3>
        <div className="card glass" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-white)' }}>
                {profile?.full_name || 'Sin nombre'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {profile?.email} • {profile?.is_admin ? 'Administrador' : 'Profesional'}
              </p>
            </div>
            <button 
              className="btn btn-outline" 
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', height: 'auto' }}
              onClick={() => {
                const newName = window.prompt('Editar nombre completo:', profile?.full_name);
                if (newName && newName !== profile?.full_name) {
                  handleUpdateProfileName(newName);
                }
              }}
            >
              Editar Nombre
            </button>
          </div>
        </div>
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

      <style>{`
        /* Screen Styles (Dashboard) */
        .report-input-field { background: rgba(0,0,0,0.2) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; padding: 0.6rem; border-radius: 8px; width: 100%; }
        
        /* Transition utility */
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
              <div className="card-header-actions">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-gold)' }}>{item.name}</p>
                    {registryType === 'clinics' && item.is_home && <span className="badge badge-clinic" style={{ fontSize: '0.6rem' }}>PRINCIPAL</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {item.phone && <span>📱 {item.phone}</span>}
                    {item.address && <span>📍 {item.address}</span>}
                  </p>
                </div>
                <div className="actions-group" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {registryType === 'clinics' && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.8rem', height: 'auto', minHeight: '36px' }}
                      onClick={() => navigate(`/clinic/${item.id}`)}
                    >
                      <ArrowRight size={14} /> Ver Perfil
                    </button>
                  )}
                  {registryType === 'clinics' && !item.is_home && (
                    <button 
                      onClick={() => handleSetHome(item.id)}
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', border: 'none', background: 'var(--primary)', height: 'auto', minHeight: '36px' }}
                    >
                      <Home size={14} /> Definir Sede
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteEntry(item.id, registryType)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.4rem', marginLeft: 'auto' }}
                  >
                    <EyeOff size={18} />
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
