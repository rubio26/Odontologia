import { Beaker, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export const Operations = () => {
  return (
    <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Operaciones y Bioseguridad</h2>

      <div className="odontogram-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}>
          <Beaker size={20} color="var(--primary)" /> Control de Laboratorio
        </h3>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ fontWeight: 600 }}>Prótesis Total - Sup.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paciente: Juan Pérez</p>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: '#FEF9C3', color: '#854D0E', borderRadius: '4px', fontWeight: 600 }}>En Prueba</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={12} /> Envío: 10/03/2026</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={12} /> Entrega Final: 18/03/2026</div>
          </div>
        </div>
      </div>

      <div className="odontogram-section">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}>
          <ShieldCheck size={20} color="var(--success)" /> Registro de Esterilización
        </h3>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Ciclo #442</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hoy, 08:30 AM</span>
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Autoclave: Nivel 121°C / 20 min</p>
          <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckCircle2 size={16} /> Resultado: Exitosa (Integridad OK)
          </div>
        </div>
        
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.9rem' }}>
           Iniciar Nuevo Ciclo
        </button>
      </div>
    </div>
  );
};
