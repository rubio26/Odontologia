import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clipboard, Save, Loader2, AlertCircle } from 'lucide-react';

interface ClinicalHistoryData {
  id?: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  previous_surgeries: string;
  family_history: string;
  habits: string;
}

export const ClinicalHistory = ({ patientId }: { patientId: string }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ClinicalHistoryData>({
    medical_conditions: '',
    allergies: '',
    medications: '',
    previous_surgeries: '',
    family_history: '',
    habits: ''
  });

  useEffect(() => {
    fetchHistory();
  }, [patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: history, error } = await supabase
        .from('clinical_histories')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching history:', error);
      }
      
      if (history) {
        setData(history);
      }
    } catch (err) {
      console.log('Error in fetchHistory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinical_histories')
        .upsert({
          patient_id: patientId,
          ...data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'patient_id' });

      if (error) throw error;
      alert('Historia clínica actualizada correctamente.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clipboard size={20} color="var(--primary)" /> Historia Clínica (Anamnesis)
        </h3>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '...' : <><Save size={16} /> Guardar Cambios</>}
        </button>
      </div>

      <div className="card glass" style={{ marginBottom: '2rem', padding: '1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
          
          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Condiciones Médicas (Diabetes, HTA, etc.)</label>
            <textarea 
              rows={3} 
              className="input-field"
              style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
              value={data.medical_conditions}
              onChange={e => setData({...data, medical_conditions: e.target.value})}
              placeholder="Describa enfermedades sistémicas..."
            />
          </div>

          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} color="var(--error)" /> Alergias
            </label>
            <textarea 
              rows={2} 
              className="input-field"
              style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'white', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              value={data.allergies}
              onChange={e => setData({...data, allergies: e.target.value})}
              placeholder="Alergias a medicamentos, látex, etc."
            />
          </div>

          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Medicamentos en Uso</label>
            <textarea 
              rows={2} 
              className="input-field"
              style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
              value={data.medications}
              onChange={e => setData({...data, medications: e.target.value})}
              placeholder="Anticoagulantes, anticonceptivos, etc."
            />
          </div>

          <div className="input-row">
            <div className="input-group-vertical" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Cirugías Previas</label>
              <textarea 
                rows={2} 
                className="input-field"
                style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
                value={data.previous_surgeries}
                onChange={e => setData({...data, previous_surgeries: e.target.value})}
              />
            </div>
            <div className="input-group-vertical" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Hereditarios / Familia</label>
              <textarea 
                rows={2} 
                className="input-field"
                style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
                value={data.family_history}
                onChange={e => setData({...data, family_history: e.target.value})}
              />
            </div>
          </div>

          <div className="input-group-vertical">
            <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Hábitos (Tabaco, Alcohol, etc.)</label>
            <input 
              type="text" 
              className="input-field"
              style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}
              value={data.habits}
              onChange={e => setData({...data, habits: e.target.value})}
            />
          </div>

        </div>
      </div>
    </div>
  );
};
