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
    { id: 'absent', label: 'Ausente', color: '#111' },
    { id: 'protesis', label: 'Prótesis', color: '#D946EF' }
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
    
    // Update main odontogram
    const { error } = await supabase
      .from('odontograms')
      .upsert({ 
        patient_id: patientId, 
        data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'patient_id' });

    if (!error) {
       // Also add to history
       await supabase.from('odontogram_history').insert({
         odontogram_id: (await supabase.from('odontograms').select('id').eq('patient_id', patientId).single()).data?.id,
         data
       });
       alert('Mapa dental actualizado con éxito.');
    }
    setSaving(false);
  };

  const handleToothClick = (id: number, surface: string) => {
    const wholeToothStates = ['crown', 'implant', 'absent', 'protesis'];
    
    if (wholeToothStates.includes(selectedState)) {
      setData(prev => ({
        ...prev,
        [id]: {
          top: selectedState,
          bottom: selectedState,
          left: selectedState,
          right: selectedState,
          center: selectedState
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

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando mapa dental...</div>;

  return (
    <div className="odontogram-container" style={{ padding: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem' }}>Odontograma Boutique</h3>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {states.map(s => (
          <button 
            key={s.id}
            className={`btn ${selectedState === s.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.6rem 1.2rem',
              whiteSpace: 'nowrap',
              borderLeft: selectedState !== s.id ? `4px solid ${s.color}` : 'none'
            }}
            onClick={() => setSelectedState(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="odontogram-section">
        <span className="section-label">Superior</span>
        <div className="tooth-grid">
          {upperTeeth.map(id => (
            <Tooth key={id} id={id} surfaces={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>

      <div className="odontogram-section" style={{ marginTop: '2rem' }}>
        <span className="section-label">Inferior</span>
        <div className="tooth-grid">
          {lowerTeeth.map(id => (
            <Tooth key={id} id={id} surfaces={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>

      <div className="card glass" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderStyle: 'dashed' }}>
        <ShieldCheck color="var(--primary)" size={32} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Seguimiento de Garantía</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mantenemos el historial visual de cada tratamiento por 5 años.</p>
        </div>
      </div>
    </div>
  );
};
