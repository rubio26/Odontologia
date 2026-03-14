import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Users, Calendar, Calculator, ClipboardList, Plus, FileSpreadsheet } from 'lucide-react';
import { PatientSearch } from './components/PatientSearch';
import { PatientDetail } from './components/PatientDetail';

const Dashboard = () => (
  <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
    <h1 style={{ marginBottom: '0.5rem' }}>Hola, Dra. 👋</h1>
    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Gestión Dental Delivery & Clínica</p>
    
    <div className="card" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)', color: 'white', border: 'none' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>Citas de hoy</h3>
      <p style={{ fontSize: '2rem', fontWeight: 700 }}>4</p>
      <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>2 en Local / 2 Delivery</p>
    </div>

    <div style={{ marginTop: '2rem' }}>
      <h3>Acciones Rápidas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Plus color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nueva Cita</span>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Users color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nuevo Paciente</span>
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
    <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
      <h1>Pacientes</h1>
      <div style={{ marginTop: '1rem' }}>
        <PatientSearch onSelect={setSelectedPatient} />
      </div>
    </div>
  );
};

import { HybridAgenda } from './components/HybridAgenda';
import { Operations as OpsComponent } from './components/Operations';
import { Financials } from './components/Financials';

const Agenda = () => <HybridAgenda />;
const Finance = () => <Financials />;
const Ops = () => <OpsComponent />;

const App = () => {
  return (
    <Router>
      <div className="app-container">
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
            <span>Operac.</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  );
};

export default App;
