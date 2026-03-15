import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tooth } from './Tooth';
import { Save, ShieldCheck } from 'lucide-react';
import './Odontogram.css';

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const Odontogram = ({ patientId }: { patientId?: string }) => {
  const [data, setData] = useState<Record<number, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedState, setSelectedState] = useState('caries');

  const states = [
    { id: 'caries', label: 'Caries', color: '#EF4444' },
    { id: 'done', label: 'Realizado', color: 'var(--success)' },
    { id: 'crown', label: 'Corona', color: 'var(--primary)' },
    { id: 'implant', label: 'Implante', color: '#8B5CF6' },
    { id: 'absent', label: 'Ausente', color: '#333' },
    { id: 'protesis', label: 'Prótesis', color: '#D946EF' },
    { id: 'exodoncia', label: 'Exodoncia', color: '#EF4444' }
  ];

  useEffect(() => {
    if (patientId) {
      loadOdontogram();
    }
  }, [patientId]);

  const loadOdontogram = async () => {
    setLoading(true);
    const { data: odontogram } = await supabase
      .from('odontograms')
      .select('data')
      .eq('patient_id', patientId)
      .single();
    
    if (odontogram) {
      setData(odontogram.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('odontograms')
        .upsert({ 
          patient_id: patientId, 
          data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'patient_id' });

      if (error) throw error;

       // Also add to history
       const { data: currentO } = await supabase.from('odontograms').select('id').eq('patient_id', patientId).single();
       if (currentO) {
         await supabase.from('odontogram_history').insert({
           odontogram_id: currentO.id,
           data
         });
       }
       alert('Mapa dental actualizado con éxito.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToothClick = (id: number, surface: string) => {
    const wholeToothStates = ['crown', 'implant', 'absent', 'protesis', 'exodoncia'];
    
    if (wholeToothStates.includes(selectedState)) {
      const newState = data[id]?.center === selectedState ? 'healthy' : selectedState;
      setData(prev => ({
        ...prev,
        [id]: {
          top: newState,
          bottom: newState,
          left: newState,
          right: newState,
          center: newState
        }
      }));
    } else {
      setData(prev => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          [surface]: prev[id]?.[surface] === selectedState ? 'healthy' : selectedState
        }
      }));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>Cargando evolución dental...</div>;

  return (
    <div className="odontogram-container" style={{ animation: 'fadeIn 0.5s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-luxury)', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-gold)' }}>Morfología Dental</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registro visual de patologías y tratamientos</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ height: '40px' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '...' : <><Save size={16} /> Guardar Mapa</>}
        </button>
      </header>

      <div className="controls glass" style={{ marginBottom: '2rem', display: 'flex', gap: '0.8rem', overflowX: 'auto', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        {states.map(s => (
          <button 
            key={s.id}
            className={`btn ${selectedState === s.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              fontSize: '0.7rem', 
              padding: '0.5rem 1rem',
              whiteSpace: 'nowrap',
              borderLeft: selectedState !== s.id ? `4px solid ${s.color}` : 'none',
              background: selectedState === s.id ? s.color : 'transparent',
              color: selectedState === s.id ? (s.id === 'absent' ? '#fff' : '#000') : 'inherit'
            }}
            onClick={() => setSelectedState(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="odontogram-section">
        <span className="section-label">Arcada Superior</span>
        <div className="tooth-grid glass">
          {upperTeeth.map(id => (
            <Tooth key={id} id={id} surfaces={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>

      <div className="odontogram-section" style={{ marginTop: '2.5rem' }}>
        <span className="section-label">Arcada Inferior</span>
        <div className="tooth-grid glass">
          {lowerTeeth.map(id => (
            <Tooth key={id} id={id} surfaces={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>

      <div className="card glass" style={{ marginTop: '3rem', borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ background: 'var(--primary-glow)', padding: '0.8rem', borderRadius: '50%' }}>
          <ShieldCheck color="var(--primary)" size={32} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-gold)' }}>Protocolo Lumini Studio</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Los registros de odontograma se sincronizan con el historial clínico del paciente.</p>
        </div>
      </div>
    </div>
  );
};
