import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Tooth } from './Tooth';
import { Save, ShieldCheck, RotateCcw, History, Archive } from 'lucide-react';
import './Odontogram.css';

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const Odontogram = ({ patientId, profile }: { patientId?: string, profile: any }) => {
  const [data, setData] = useState<Record<number, Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedState, setSelectedState] = useState('restauracion');
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('active');
  const [activeTreatment, setActiveTreatment] = useState<any>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

  const states = [
    { id: 'restauracion', label: 'Restauración de caries', color: '#EF4444' },
    { id: 'extraccion',   label: 'Extracción',             color: '#F97316' },
    { id: 'implant',      label: 'Implante',               color: '#8B5CF6' },
    { id: 'endodoncia',   label: 'Endodoncia',             color: '#EC4899' },
    { id: 'incrustacion', label: 'Incrustación',           color: '#F59E0B' },
    { id: 'corona',       label: 'Corona / Perno',         color: 'var(--primary)' },
    { id: 'limpieza',     label: 'Limpieza de sarro',      color: '#06B6D4' },
    { id: 'protesis',     label: 'Prótesis',               color: '#D946EF' },
    { id: 'done',         label: 'Realizado',              color: 'var(--success)' },
    { id: 'absent',       label: 'Ausente',                color: '#555' },
  ];

  useEffect(() => {
    if (patientId) {
      fetchTreatments();
      loadOdontogram();
    }
  }, [patientId, selectedTreatmentId]);

  const fetchTreatments = async () => {
    const { data: list } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('doctor_id', profile.id)
      .order('created_at', { ascending: false });
    
    if (list) {
      setTreatments(list);
      const active = list.find(t => t.status === 'active');
      setActiveTreatment(active);
    }
  };

  const handleClear = () => {
    if (window.confirm('¿Estás seguro de que deseas limpiar todo el mapa dental? Esta acción no se puede deshacer hasta que guardes.')) {
      setData({});
    }
  };

  const loadOdontogram = async () => {
    setLoading(true);
    try {
      if (selectedTreatmentId === 'active') {
        const { data: odontogram } = await supabase
          .from('odontograms')
          .select('id, data')
          .eq('patient_id', patientId)
          .eq('doctor_id', profile.id)
          .single();
        
        setRecordId(odontogram?.id || null);
        setData(odontogram?.data || {});
      } else {
        const treatment = treatments.find(t => t.id === selectedTreatmentId);
        if (treatment) {
          setData(treatment.initial_state || {});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('odontograms')
        .upsert({ 
          id: recordId || undefined,
          patient_id: patientId, 
          doctor_id: profile.id,
          data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

       const { data: currentO } = await supabase.from('odontograms').select('id').eq('patient_id', patientId).eq('doctor_id', profile.id).single();
       if (currentO) {
         await supabase.from('odontogram_history').insert({
           odontogram_id: currentO.id,
           data
         });
       }
       return true;
    } catch (err: any) {
      alert('Error: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!activeTreatment) {
      alert('No hay un tratamiento activo para finalizar. Primero inicia uno desde un presupuesto.');
      return;
    }

    // Validación Financiera: No finalizar si hay saldo pendiente (A menos que sea Delivery)
    const saldo = (activeTreatment.total_amount || 0) - (activeTreatment.paid_amount || 0);
    const isDelivery = !!activeTreatment.clinic_id;

    if (saldo > 0 && !isDelivery) {
      alert(`⚠️ No se puede finalizar el tratamiento. \n\nEl paciente aún tiene un SALDO PENDIENTE de ${saldo.toLocaleString()} PYG. Por favor, registra el pago total en la pestaña de "Pagos" antes de archivar.`);
      return;
    }

    if (!window.confirm('¿Confirmas el fin del tratamiento actual? Se archivará el estado final y el odontograma activo se limpiará para futuros planes.')) {
      return;
    }

    setSaving(true);
    try {
      const { error: treatmentError } = await supabase
        .from('treatments')
        .update({ 
          status: 'finished',
          final_state: data,
          finished_at: new Date().toISOString()
        })
        .eq('id', activeTreatment.id)
        .eq('doctor_id', profile.id);

      if (treatmentError) throw treatmentError;

      // Ensure clinic_payments record exists and is up to date for delivery treatments
      if (activeTreatment.clinic_id) {
        const { data: existingCP } = await supabase
          .from('clinic_payments')
          .select('id')
          .eq('treatment_id', activeTreatment.id)
          .single();

        await supabase.from('clinic_payments').upsert({
          id: existingCP?.id,
          doctor_id: profile.id,
          clinic_id: activeTreatment.clinic_id,
          patient_id: patientId,
          budget_id: activeTreatment.budget_id,
          treatment_id: activeTreatment.id,
          description: `Tratamiento Finalizado: ${activeTreatment.description}`,
          total_amount: activeTreatment.total_amount,
          paid_amount: activeTreatment.paid_amount || 0,
          status: (activeTreatment.paid_amount || 0) >= activeTreatment.total_amount ? 'paid' : 'pending'
        }, { onConflict: 'id' });
      }

      const { error: clearError } = await supabase
        .from('odontograms')
        .update({ data: {}, updated_at: new Date().toISOString() })
        .eq('patient_id', patientId)
        .eq('doctor_id', profile.id);

      if (clearError) throw clearError;

      alert('¡Tratamiento finalizado y archivado correctamente!');
      setData({});
      fetchTreatments();
      setSelectedTreatmentId('active');
    } catch (err: any) {
      alert('Error al finalizar: ' + err.message);
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

  const isHistory = selectedTreatmentId !== 'active';

  return (
    <div className="odontogram-container" style={{ animation: 'fadeIn 0.5s ease' }}>
      <header className="odontogram-header">
        <div className="header-info">
          <div className="title-row">
            <h3 className="section-title-clinical">Morfología Dental</h3>
            <div className="history-selector glass">
              <History size={14} color="var(--primary)" />
              <select 
                value={selectedTreatmentId}
                onChange={(e) => setSelectedTreatmentId(e.target.value)}
                className="history-select"
              >
                <option value="active" style={{ background: '#111' }}>{activeTreatment ? `🟢 Activo: ${activeTreatment.description}` : '⚪ Sin activo'}</option>
                <optgroup label="Archivo" style={{ background: '#111' }}>
                  {treatments.filter(t => t.status === 'finished').map(t => (
                    <option key={t.id} value={t.id} style={{ background: '#111' }}>
                      📁 {new Date(t.finished_at).toLocaleDateString()}: {t.description}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
          <p className="subtitle-clinical">
            {isHistory ? 'Historial: Estado inicial' : 'Visual de patologías y tratamientos'}
          </p>
        </div>

        <div className="odontogram-actions">
          {!isHistory && (
            <>
              <button 
                className="btn btn-outline btn-compact btn-danger-outline" 
                onClick={handleClear}
                title="Limpiar"
              >
                <RotateCcw size={16} /> <span>Limpiar</span>
              </button>
              <button 
                className="btn btn-outline btn-compact btn-success-outline" 
                onClick={handleFinalize}
                disabled={saving || !activeTreatment}
              >
                <ShieldCheck size={16} /> <span>Finalizar</span>
              </button>
              <button 
                className="btn btn-primary btn-compact" 
                onClick={async () => {
                  const success = await handleSave();
                  if (success) alert('Guardado con éxito.');
                }}
                disabled={saving}
              >
                {saving ? '...' : <><Save size={16} /> <span>Guardar</span></>}
              </button>
            </>
          )}
          {isHistory && (
            <div className="badge badge-clinic archive-badge">
              <Archive size={14} /> MODO LECTURA
            </div>
          )}
        </div>
      </header>

      <div className={`controls glass ${isHistory ? 'disabled-controls' : ''}`} style={{ marginBottom: '2rem', display: 'flex', gap: '0.8rem', overflowX: 'auto', padding: '1rem', borderRadius: 'var(--radius-md)', opacity: isHistory ? 0.3 : 1, pointerEvents: isHistory ? 'none' : 'auto' }}>
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

      <div className={`odontogram-section ${isHistory ? 'read-only' : ''}`} style={{ pointerEvents: isHistory ? 'none' : 'auto' }}>
        <span className="section-label">Arcada Superior</span>
        <div className="tooth-grid glass">
          {upperTeeth.map(id => (
            <Tooth key={id} id={id} surfaces={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>

      <div className={`odontogram-section ${isHistory ? 'read-only' : ''}`} style={{ marginTop: '2.5rem', pointerEvents: isHistory ? 'none' : 'auto' }}>
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
