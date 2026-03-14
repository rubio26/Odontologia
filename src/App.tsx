import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Users, Calendar, Calculator, ClipboardList, Plus, FileSpreadsheet } from 'lucide-react';
import { PatientSearch } from './components/PatientSearch';
import { PatientDetail } from './components/PatientDetail';
import { HybridAgenda } from './components/HybridAgenda';
import { Financials } from './components/Financials';
import { Operations as OpsComponent } from './components/Operations';

const Dashboard = () => (
  <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem' }}>Bienvenida, Olivia 👋</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estatus: Clínica Boutique & Delivery</p>
      </div>
      <div className="glass" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>OC</div>
    </header>
    
    <div className="card" style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A1A 100%)', borderLeft: '5px solid var(--primary)' }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>Ingresos Estimados (Mes)</h3>
      <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-gold)' }}>12.450.000 <span style={{ fontSize: '1rem' }}>PYG</span></p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <span className="badge badge-clinic">24 CITAS CLÍNICA</span>
        <span className="badge badge-delivery">12 CITAS DELIVERY</span>
      </div>
    </div>

    <div style={{ marginTop: '2.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem' }}>Acciones Premium</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.5rem' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
            <Plus color="var(--primary)" size={24} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nueva Cita</span>
        </div>
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.5rem' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
            <Users color="var(--primary)" size={24} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Expediente</span>
        </div>
      </div>
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
const Ops = () => <OpsComponent />;

const App = () => {
  return (
    <Router>
      <div className="app-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/ops" element={<Ops />} />
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
          <NavLink to="/finance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calculator size={22} />
            <span>Finanzas</span>
          </NavLink>
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
