import { MapPin, Clock, ExternalLink, Calendar as CalendarIcon, Phone } from 'lucide-react';

const mockAppointments = [
  {
    id: 1,
    patient_name: 'Juan Pérez',
    type: 'delivery',
    time: '14:00',
    location: 'Consultorio Externo - Edif. Panorama',
    maps_url: 'https://maps.apple.com/?address=Ciudad%20del%20Este',
    phone: '0981123456'
  },
  {
    id: 2,
    patient_name: 'Maria Rossi',
    type: 'clinic',
    time: '16:00',
    location: 'Clínica Propia Boutique',
    phone: '0973111222'
  }
];

export const HybridAgenda = () => {
  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Agenda Híbrida</h2>
        <div className="badge badge-delivery" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CalendarIcon size={14} />
          <span>Sábado, 14 Mar</span>
        </div>
      </div>

      <div className="timeline">
        {mockAppointments.map((apt, index) => (
          <div key={apt.id} style={{ marginBottom: '1.5rem', position: 'relative' }}>
            {index > 0 && mockAppointments[index-1].type !== apt.type && (
              <div style={{ 
                margin: '1rem 0', 
                padding: '0.6rem', 
                background: 'rgba(212, 175, 55, 0.1)', 
                borderRadius: '8px', 
                fontSize: '0.75rem', 
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                border: '1px solid var(--border-luxury)'
              }}>
                <Clock size={14} /> <span>Buffer: 30 min traslado (CDE Traffic)</span>
              </div>
            )}

            <div className="card glass" style={{ 
              borderLeft: `4px solid ${apt.type === 'delivery' ? 'var(--primary)' : 'var(--success)'}`,
              padding: '1.2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)' }}>{apt.time}</span>
                    {apt.type === 'delivery' ? 
                      <span className="badge badge-delivery">Delivery</span> : 
                      <span className="badge badge-clinic">Clínica</span>
                    }
                  </div>
                  <h4 style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'white' }}>{apt.patient_name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                    <MapPin size={14} />
                    <span>{apt.location}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => window.open(`tel:${apt.phone}`)}>
                    <Phone size={18} />
                  </button>
                  {apt.type === 'delivery' && (
                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => window.open(apt.maps_url)}>
                      <ExternalLink size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              {apt.type === 'delivery' && (
                <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.3rem' }}>🔔 CHECKLIST DELIVERY:</p>
                   <ul style={{ listStyle: 'none', color: 'var(--text-muted)' }}>
                     <li>• Kit de resinas Premium</li>
                     <li>• Lámpara de fotocurado cargada</li>
                   </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
