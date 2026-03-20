import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Users, Calendar, ClipboardList, FileSpreadsheet, ShieldCheck, LogOut, Clock, XCircle, Sparkles, UserPlus, FileText, FolderOpen, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { PatientSearch } from './components/PatientSearch';
import { PatientDetail } from './components/PatientDetail';
import { HybridAgenda } from './components/HybridAgenda';
import { Financials } from './components/Financials';
import { AccessManagement } from './components/Admin/AccessManagement';
import { NewAppointment } from './components/NewAppointment';
import { Operations } from './components/Operations';
import { PendingTreatments } from './components/PendingTreatments.tsx';
import { NewBudgetWizard } from './components/Clinical/NewBudgetWizard';
import { Auth } from './components/Auth/Auth';
import { ClinicProfileView } from './components/ClinicProfileView';

const Dashboard = ({ profile, user }: { profile: any, user: any }) => (
  <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
    <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(to right, #D4AF37, #FFFFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hola, {profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Colega'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Central de Operaciones Lumini</p>
      </div>
      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <div 
          className="glass" 
          style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1px solid var(--border-luxury)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
          title="Refrescar sistema"
        >
          <RefreshCw size={18} />
        </div>
        <div 
          className="glass" 
          style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
          onClick={() => { if(window.confirm('¿Cerrar sesión?')) supabase.auth.signOut(); }}
        >
          <LogOut size={18} />
        </div>
      </div>
    </header>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <NavLink reloadDocument to="/new-appointment" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card glass" style={{ height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', border: '1px solid rgba(212,175,55,0.3)' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.15)', padding: '1rem', borderRadius: '20px' }}>
            <Calendar color="var(--primary)" size={32} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Nueva Cita</span>
        </div>
      </NavLink>
      
      <NavLink reloadDocument to="/patients" state={{ autoAddNew: true }} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card glass" style={{ height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '20px' }}>
            <UserPlus color="var(--success)" size={32} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Nuevo Paciente</span>
        </div>
      </NavLink>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
      <NavLink reloadDocument to="/patients" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.2rem' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.6rem', borderRadius: '50%' }}>
            <FolderOpen color="var(--primary)" size={20} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Expediente</span>
        </div>
      </NavLink>

      <NavLink reloadDocument to="/pending" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.2rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', borderRadius: '50%' }}>
            <Clock color="#EF4444" size={20} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Pendientes</span>
        </div>
      </NavLink>

      <NavLink reloadDocument to="/new-budget" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', padding: '1.2rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.6rem', borderRadius: '50%' }}>
            <FileText color="#8B5CF6" size={20} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Nuevo Presupuesto</span>
        </div>
      </NavLink>
    </div>
  </div>
);

const PatientsPage = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialTab, setInitialTab] = useState<string | undefined>(undefined);
  const [autoAddNew, setAutoAddNew] = useState(false);

  useEffect(() => {
    const state = location.state as { 
      selectedPatientId?: string, 
      autoOpenTab?: string,
      autoAddNew?: boolean 
    };

    if (state?.selectedPatientId) {
      // Set the flags and fetch
      if (state.autoOpenTab) setInitialTab(state.autoOpenTab);
      if (state.autoAddNew) setAutoAddNew(state.autoAddNew);
      
      const patientId = state.selectedPatientId;
      
      // Clean state immediately so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: {} });
      
      fetchPatient(patientId);
    }
  }, [location.state, navigate, location.pathname]);

  const fetchPatient = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) setSelectedPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      // Optional: notification to user
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (selectedPatient) {
    return (
      <PatientDetail 
        patient={selectedPatient} 
        profile={profile}
        doctorName={profile?.full_name}
        onBack={() => {
          setSelectedPatient(null);
          setInitialTab(undefined);
          setAutoAddNew(false);
        }} 
        defaultTab={initialTab}
        autoAddNew={autoAddNew}
      />
    );
  }

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <h1>Pacientes</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Gestión de expedientes y registros clínicos.</p>
      <PatientSearch onSelect={setSelectedPatient} profile={profile} />
    </div>
  );
};

const Agenda = ({ profile }: { profile: any }) => <HybridAgenda profile={profile} />;
const Finance = () => <Financials />;
const Ops = ({ profile }: { profile: any }) => <Operations profile={profile} />;

const LoadingScreen = () => (
  <div className="auth-container">
    <div style={{ textAlign: 'center' }}>
      <Sparkles className="animate-spin" color="var(--primary)" size={48} />
      <p style={{ marginTop: '1rem', color: 'var(--text-gold)', letterSpacing: '0.2em' }}>LUMINI</p>
    </div>
  </div>
);

const StatusScreen = ({ title, message, icon: Icon, color }: any) => (
  <div className="auth-container">
    <div className="auth-card glass" style={{ textAlign: 'center' }}>
      <Icon color={color} size={64} style={{ marginBottom: '1.5rem' }} />
      <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>{message}</p>
      <button className="btn btn-outline w-full" onClick={() => supabase.auth.signOut()}>
        Cerrar Sesión
      </button>
    </div>
  </div>
);

const ADMIN_EMAILS = ['dIportobr@gmail.com', 'diego@ejemplo.com', 'admin@odontologia.com'];

const NavigationTracker = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading ? <div className="page-loader" /> : null;
};

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user.email);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('DEBUG: Cargando perfil para:', userEmail, data);

      let finalProfile = data || { id: userId, email: userEmail, status: 'approved' };
      
      // Forzar admin si el correo está en la lista maestra
      if (userEmail && ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
        finalProfile.is_admin = true;
        finalProfile.status = 'approved';
      }

      setProfile(finalProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback básico para no bloquear al usuario
      if (userEmail && ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
        setProfile({ id: userId, email: userEmail, is_admin: true, status: 'approved' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!session) return <Auth onSession={() => {}} />;

  if (profile?.status === 'pending') {
    return (
      <StatusScreen 
        title="Acceso Pendiente" 
        message="Tu cuenta está siendo revisada por un administrador. Te daremos acceso pronto."
        icon={Clock}
        color="var(--primary)"
      />
    );
  }

  if (profile?.status === 'rejected') {
    return (
      <StatusScreen 
        title="Acceso Denegado" 
        message="Lo sentimos, tu solicitud de acceso no fue aprobada. Contacta a soporte para más info."
        icon={XCircle}
        color="var(--error)"
      />
    );
  }

  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
        <NavigationTracker />
        
        <main className="page-content" key={window.location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard profile={profile} user={session?.user} />} />
            <Route path="/new-appointment" element={<NewAppointment profile={profile} />} />
            <Route path="/new-budget" element={<NewBudgetWizard profile={profile} />} />
            <Route path="/pending" element={<PendingTreatments profile={profile} />} />
            <Route path="/patients" element={<PatientsPage profile={profile} />} />
            <Route path="/agenda" element={<Agenda profile={profile} />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/ops" element={<Ops profile={profile} />} />
            <Route path="/clinic/:clinicId" element={<ClinicProfileView profile={profile} />} />
            <Route 
              path="/access" 
              element={profile?.is_admin ? <AccessManagement /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <NavLink reloadDocument to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={22} />
            <span>Inicio</span>
          </NavLink>
          <NavLink reloadDocument to="/agenda" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={22} />
            <span>Agenda</span>
          </NavLink>
          <NavLink reloadDocument to="/patients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={22} />
            <span>Pacientes</span>
          </NavLink>
          {profile?.is_admin && (
            <NavLink reloadDocument to="/access" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={22} />
              <span>Accesos</span>
            </NavLink>
          )}
          <NavLink reloadDocument to="/ops" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet size={22} />
            <span>Herramientas</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
};

export default App;
