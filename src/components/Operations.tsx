import { Terminal, Droplets, CheckCircle2, History, FlaskConical, Beaker } from 'lucide-react';

export const Operations = () => {
  const labOrders = [
    { id: 101, patient: 'Juan Pérez', item: 'Corona Zirconio', status: 'En Prueba', price: '450.000 PYG' },
    { id: 102, patient: 'Maria Rossi', item: 'Perno Muñón', status: 'Pendiente', price: '120.000 PYG' },
  ];

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Centro Operativo</h2>
        <div className="badge badge-clinic">Bioseguridad Nivel A</div>
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
