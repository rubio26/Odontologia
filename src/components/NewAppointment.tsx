import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, User, FileText, MapPin, Save, ArrowLeft, FileSpreadsheet } from 'lucide-react';

export const NewAppointment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      const { data: clinicsData } = await supabase.from('clinics').select('id, name').order('name');
      if (patientsData) setPatients(patientsData);
      if (clinicsData) setClinics(clinicsData);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const start_time = new Date(`${formData.date}T${formData.time}:00`).toISOString();
    const end_time = new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour

    const { error } = await supabase.from('appointments').insert({
      patient_id: formData.patient_id,
      clinic_id: formData.clinic_id || null,
      start_time,
      end_time,
      type: formData.type,
      location_type: formData.type,
      notes: formData.notes
    });

    if (error) {
      alert('Error al crear la cita: ' + error.message);
    } else {
      alert('Cita creada con éxito');
      navigate('/agenda');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '1.4rem' }}>Nueva Cita</h2>
      </div>

      <form onSubmit={handleSubmit} className="auth-card glass" style={{ padding: '1.5rem' }}>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <User size={16} color="var(--primary)" /> Paciente
          </label>
          <select 
            required
            className="input-field"
            value={formData.patient_id}
            onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
            style={{ appearance: 'none' }}
          >
            <option value="">Seleccionar Paciente</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <Calendar size={16} color="var(--primary)" /> Fecha
            </label>
            <input 
              type="date"
              required
              className="input-field"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <Clock size={16} color="var(--primary)" /> Hora
            </label>
            <input 
              type="time"
              required
              className="input-field"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <MapPin size={16} color="var(--primary)" /> Modalidad
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              className={`btn ${formData.type === 'clinic' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, fontSize: '0.8rem' }}
              onClick={() => setFormData({ ...formData, type: 'clinic' })}
            >
              Clínica
            </button>
            <button 
              type="button"
              className={`btn ${formData.type === 'delivery' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, fontSize: '0.8rem' }}
              onClick={() => setFormData({ ...formData, type: 'delivery' })}
            >
              Delivery
            </button>
          </div>
        </div>

        {formData.type === 'clinic' && (
          <div className="input-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <FileSpreadsheet size={16} color="var(--primary)" /> Consultorio
            </label>
            <select 
              className="input-field"
              value={formData.clinic_id}
              onChange={e => setFormData({ ...formData, clinic_id: e.target.value })}
              style={{ appearance: 'none' }}
            >
              <option value="">Seleccionar Consultorio</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="input-group" style={{ marginTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <FileText size={16} color="var(--primary)" /> Notas Adicionales
          </label>
          <textarea 
            className="input-field"
            rows={3}
            placeholder="Motivo de consulta, recordatorios..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-full" 
          style={{ marginTop: '2rem' }}
          disabled={loading}
        >
          <Save size={18} /> {loading ? 'Creando...' : 'Confirmar Cita'}
        </button>
      </form>
    </div>
  );
};
