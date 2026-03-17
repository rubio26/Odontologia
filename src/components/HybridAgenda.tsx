import { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar as CalendarIcon, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const HybridAgenda = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00.000Z`;
      const endOfDay = `${today}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, full_name, phone),
          clinics (id, name, address)
        `)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true });

      if (error) throw error;
      if (data) setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando agenda del día...</p>
    </div>
  );

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Agenda Híbrida</h2>
        <div className="badge badge-delivery" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CalendarIcon size={14} />
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      <div className="timeline">
        {appointments.length === 0 ? (
          <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No hay citas agendadas para hoy.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/new-appointment')}>Agendar Primera Cita</button>
          </div>
        ) : (
          appointments.map((apt, index) => (
            <div key={apt.id} style={{ marginBottom: '1.5rem', position: 'relative' }}>
              {index > 0 && appointments[index-1].type !== apt.type && (
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
                  <Clock size={14} /> <span>Buffer: traslado entre sedes</span>
                </div>
              )}

              <div className="card glass" style={{ 
                borderLeft: `4px solid ${apt.type === 'delivery' ? 'var(--primary)' : 'var(--success)'}`,
                padding: '1.2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-gold)' }}>
                        {new Date(apt.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {apt.type === 'delivery' ? 
                        <span className="badge badge-delivery">Delivery</span> : 
                        <span className="badge badge-clinic">Clínica</span>
                      }
                    </div>
                    <h4 style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'white' }}>{apt.patients?.full_name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                      <MapPin size={14} />
                      <span>{apt.type === 'clinic' ? apt.clinics?.name : 'Atención a Domicilio'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => navigate('/patients', { 
                        state: { 
                          selectedPatientId: apt.patient_id,
                          autoOpenTab: 'evolution',
                          autoAddNew: true
                        } 
                      })}
                    >
                      <CheckCircle2 size={16} /> Confirmar Llegada
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => window.open(`tel:${apt.patients?.phone}`)}>
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
                
                {apt.notes && (
                  <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                     <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.3rem' }}>📝 NOTAS DE CITA:</p>
                     <p style={{ color: 'var(--text-muted)' }}>{apt.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
