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
    location: 'Clínica Propia',
    phone: '0973111222'
  }
];

export const HybridAgenda = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Agenda Híbrida</h2>
        <div style={{ background: 'white', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={18} color="var(--primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Hoy, 14 Mar</span>
        </div>
      </div>

      <div className="legend" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
          <span>Delivery</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FACC15' }}></div>
          <span>Clínica</span>
        </div>
      </div>

      <div className="timeline">
        {mockAppointments.map((apt, index) => (
          <div key={apt.id} style={{ marginBottom: '1rem', position: 'relative', paddingLeft: '1.5rem' }}>
            {/* Travel Buffer Warning */}
            {index > 0 && mockAppointments[index-1].type !== apt.type && (
              <div style={{ 
                margin: '0.5rem 0 0.5rem -1rem', 
                padding: '0.5rem', 
                background: '#FEF9C3', 
                borderRadius: '8px', 
                fontSize: '0.75rem', 
                color: '#854D0E',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid #FEF08A'
              }}>
                <Clock size={14} /> <span>Buffer: 30 min traslado estimado</span>
              </div>
            )}

            <div className="card" style={{ 
              borderLeft: `4px solid ${apt.type === 'delivery' ? 'var(--primary)' : '#FACC15'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{apt.time} - {apt.patient_name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    <MapPin size={14} />
                    <span>{apt.location}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" style={{ padding: '0.4rem', background: '#F1F5F9' }} onClick={() => window.open(`tel:${apt.phone}`)}>
                    <Phone size={16} />
                  </button>
                  {apt.type === 'delivery' && (
                    <button className="btn" style={{ padding: '0.4rem', background: '#E0F2FE' }} onClick={() => window.open(apt.maps_url)}>
                      <ExternalLink size={16} color="var(--primary)" />
                    </button>
                  )}
                </div>
              </div>
              
              {apt.type === 'delivery' && (
                <div style={{ padding: '0.5rem', background: '#F8FAFC', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                   📦 Check: Lámpara de fotocurado y Micromotor.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
