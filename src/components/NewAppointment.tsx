import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, User, FileText, Save, ArrowLeft, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';

export const NewAppointment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    clinic_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'clinic',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: patientsData } = await supabase.from('patients').select('id, full_name').order('full_name');
      const { data: clinicsData } = await supabase.from('clinics').select('*').order('is_home', { ascending: false });
      
      if (patientsData) setPatients(patientsData);
      if (clinicsData) {
        setClinics(clinicsData);
        // Autoseleccionar la Sede Home si estamos en modo clínica
        const homeClinic = clinicsData.find(c => c.is_home);
        if (homeClinic && formData.type === 'clinic') {
          setFormData(prev => ({ ...prev, clinic_id: homeClinic.id }));
        }
      }
    };
    fetchData();
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.type === 'clinic' && !formData.clinic_id) {
      const homeClinic = clinics.find(c => c.is_home);
      if (!homeClinic) {
        alert('No tienes una Sede Principal configurada. Por favor, configúrala en Herramientas.');
        setLoading(false);
        return;
      }
    }

    try {
      const start_time = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      const end_time = new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('appointments').insert({
        patient_id: formData.patient_id,
        clinic_id: formData.clinic_id || null,
        start_time,
        end_time,
        type: formData.type,
        location_type: formData.type,
        notes: formData.notes
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => navigate('/agenda'), 2000);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatientName = patients.find(p => p.id === formData.patient_id)?.full_name;

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card glass" style={{ textAlign: 'center' }}>
          <CheckCircle2 color="var(--success)" size={64} style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--text-gold)', marginBottom: '1rem' }}>¡Cita Confirmada!</h2>
          <p style={{ color: 'var(--text-muted)' }}>La cita para {selectedPatientName} ha sido agendada con éxito.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn glass" 
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }} 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.05em' }}>Nueva Cita</h2>
        </div>
        <Sparkles color="var(--primary)" size={24} className="animate-pulse" />
      </header>

      <form onSubmit={handleSubmit}>
        <div className="card glass" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
          {/* Patient Selection */}
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <User size={18} />
            <select 
              required
              className="input-field"
              value={formData.patient_id}
              onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none', appearance: 'none' }}
            >
              <option value="" disabled style={{ background: '#111' }}>Seleccionar Paciente</option>
              {patients.map(p => <option key={p.id} value={p.id} style={{ background: '#111' }}>{p.full_name}</option>)}
            </select>
          </div>

          {/* Date & Time Row */}
          <div className="input-row" style={{ marginBottom: '1.5rem' }}>
            <div className="input-group">
              <Calendar size={18} />
              <input 
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
                style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none' }}
              />
            </div>
            <div className="input-group">
              <Clock size={18} />
              <input 
                type="time"
                required
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="input-field"
                style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none' }}
              />
            </div>
          </div>

          {/* Modality Toggle */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Modalidad de Atención
            </label>
            <div style={{ display: 'flex', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: 'var(--radius-md)' }}>
              <button 
                type="button"
                className={`btn w-full ${formData.type === 'clinic' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', height: '40px', border: formData.type === 'clinic' ? 'none' : '1px solid transparent' }}
                onClick={() => setFormData({ ...formData, type: 'clinic' })}
              >
                Clínica
              </button>
              <button 
                type="button"
                className={`btn w-full ${formData.type === 'delivery' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', height: '40px', border: formData.type === 'delivery' ? 'none' : '1px solid transparent' }}
                onClick={() => setFormData({ ...formData, type: 'delivery' })}
              >
                Delivery
              </button>
            </div>
          </div>

          {/* Clinic/Consultorio Selection */}
          <div className="input-group" style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <FileSpreadsheet size={18} />
            <select 
              required={formData.type === 'clinic'}
              className="input-field"
              value={formData.clinic_id}
              onChange={e => setFormData({ ...formData, clinic_id: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none', appearance: 'none' }}
            >
              <option value="" disabled style={{ background: '#111' }}>
                {formData.type === 'clinic' ? 'Seleccionar Sede (Home)' : 'Seleccionar Consultorio (Delivery)'}
              </option>
              {clinics.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#111' }}>
                  {c.name} {c.is_home ? '⭐ (Sede Principal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="input-group" style={{ alignItems: 'start', paddingTop: '0.8rem' }}>
            <FileText size={18} style={{ marginTop: '0.2rem' }} />
            <textarea 
              className="input-field"
              rows={3}
              placeholder="Motivo de la consulta o notas clínicas..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: 'white', border: 'none', resize: 'none' }}
            />
          </div>
        </div>

        {/* Dynamic Summary Section */}
        {formData.patient_id && (
          <div className="card glass" style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(212, 175, 55, 0.05)', borderStyle: 'dashed' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.8rem' }}>Resumen de Cita</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
              <p><strong>Paciente:</strong> {selectedPatientName}</p>
              <p><strong>Fecha y Hora:</strong> {new Date(formData.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {formData.time}hs</p>
              <p><strong>Modalidad:</strong> {formData.type === 'clinic' ? 'Atención en Clínica' : 'Atención Delivery'}</p>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary w-full" 
          style={{ marginTop: '2.5rem', height: '55px', fontSize: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Confirmando...' : <><Save size={20} /> Agendar Cita</>}
        </button>
      </form>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        .animate-pulse {
          animation: pulse 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
