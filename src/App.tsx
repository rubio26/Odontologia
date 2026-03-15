import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Users, Calendar, ClipboardList, Plus, FileSpreadsheet, ShieldCheck, LogOut, Clock, XCircle, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { PatientSearch } from './components/PatientSearch';
import { PatientDetail } from './components/PatientDetail';
import { HybridAgenda } from './components/HybridAgenda';
import { Financials } from './components/Financials';
import { AccessManagement } from './components/Admin/AccessManagement';
import { NewAppointment } from './components/NewAppointment';
import { Operations } from './components/Operations';
import { Auth } from './components/Auth/Auth';


const Dashboard = ({ profile }: { profile: any }) => (
  <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem' }}>Bienvenido, {profile?.preferred_name || 'Colega'} 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estatus: Lumina Dental Studio</p>
      </div>
      <div 
        className="glass" 
        style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
        onClick={() => supabase.auth.signOut()}
        title="Cerrar Sesión"
      >
        <LogOut size={18} />
      </div>
    </header>
    
    <div className="card" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A1A 100%)', borderLeft: '5px solid var(--primary)' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>Ingresos Estimados (Mes)</h3>
      <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-gold)' }}>12.450.000 <span style={{ fontSize: '1rem' }}>PYG</span></p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <span className="badge badge-clinic">24 CITAS CLÍNICA</span>
        <span className="badge badge-delivery">12 CITAS DELIVERY</span>
      </div>
    </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
        <NavLink to="/new-appointment" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.5rem' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
              <Plus color="var(--primary)" size={24} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nueva Cita</span>
          </div>
        </NavLink>
        <NavLink to="/patients" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.5rem' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
              <Users color="var(--primary)" size={24} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Expediente</span>
          </div>
        </NavLink>
      </div>
  </div>
);

const PatientsPage = () => {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  if (selectedPatient) {
    return <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <h1>Pacientes</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Gestión de expedientes y registros clínicos.</p>
      <PatientSearch onSelect={setSelectedPatient} />
    </div>
  );
};

const Agenda = () => <HybridAgenda />;
const Finance = () => <Financials />;
const Ops = () => <Operations />;

const LoadingScreen = () => (
  <div className="auth-container">
    <div style={{ textAlign: 'center' }}>
      <Sparkles className="animate-spin" color="var(--primary)" size={48} />
      <p style={{ marginTop: '1rem', color: 'var(--text-gold)', letterSpacing: '0.2em' }}>LUMINA</p>
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

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setProfile(data);
    setLoading(false);
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
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} />} />
          <Route path="/new-appointment" element={<NewAppointment />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/ops" element={<Ops />} />
          <Route 
            path="/access" 
            element={profile?.is_admin ? <AccessManagement /> : <Navigate to="/" />} 
          />
        </Routes>

        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={22} />
            <span>Inicio</span>
          </NavLink>
          <NavLink to="/agenda" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar size={22} />
            <span>Agenda</span>
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={22} />
            <span>Pacientes</span>
          </NavLink>
          {profile?.is_admin && (
            <NavLink to="/access" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={22} />
              <span>Accesos</span>
            </NavLink>
          )}
          <NavLink to="/ops" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileSpreadsheet size={22} />
            <span>Herramientas</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
};

export default App;
