import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { PatientSearch } from '../PatientSearch';
import { Tooth } from '../Odontogram/Tooth';
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, User, CheckCircle, Calculator } from 'lucide-react';

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const NewBudgetWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [odontogramData, setOdontogramData] = useState<Record<number, any>>({});
  const [items, setItems] = useState<{ description: string, price: number }[]>([{ description: '', price: 0 }]);
  const [description, setDescription] = useState('');
  const [numSessions, setNumSessions] = useState(1);
  const [selectedState, setSelectedState] = useState('caries');

  const states = [
    { id: 'caries', label: 'Caries (Planear)', color: '#EF4444' },
    { id: 'crown', label: 'Corona', color: 'var(--primary)' },
    { id: 'implant', label: 'Implante', color: '#8B5CF6' },
  ];

  const handleToothClick = (id: number, surface: string) => {
    setOdontogramData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [surface]: prev[id]?.[surface] === selectedState ? 'healthy' : selectedState
      }
    }));
  };

  const addItem = () => setItems([...items, { description: '', price: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = val;
    setItems(newItems);
  };

  const total = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  const handleSave = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('budgets').insert({
        patient_id: selectedPatient.id,
        description: description || 'Plan de Tratamiento',
        items,
        total_cost: total,
        num_sessions: numSessions,
        odontogram_data: odontogramData,
        status: 'active'
      });

      if (error) throw error;
      
      alert('Presupuesto guardado con éxito.');
      navigate('/patients', { state: { selectedPatientId: selectedPatient.id, autoOpenTab: 'budgets' } });
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} className="btn glass" style={{ padding: '0.5rem' }}><ArrowLeft size={20} /></button>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-gold)' }}>Nuevo Presupuesto</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paso {step} de 4: {['Paciente', 'Planificación Dental', 'Procedimientos', 'Finalizar'][step-1]}</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '2rem', display: 'flex' }}>
        <div style={{ width: `${(step/4)*100}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
      </div>

      {step === 1 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="card glass" style={{ padding: '2rem', textAlign: 'center' }}>
            <User size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3>Seleccionar Paciente</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Busca el paciente para iniciar su cotización.</p>
            <PatientSearch onSelect={(p) => { setSelectedPatient(p); setStep(2); }} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="card glass" style={{ padding: '1.2rem', marginBottom: '1.5rem' }}>
             <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Paciente: <span style={{ color: 'var(--text-gold)' }}>{selectedPatient?.full_name}</span></p>
             <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {states.map(s => (
                  <button 
                    key={s.id}
                    className={`btn ${selectedState === s.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.7rem', padding: '0.5rem 1rem', borderLeft: selectedState !== s.id ? `4px solid ${s.color}` : 'none' }}
                    onClick={() => setSelectedState(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
             </div>

             <div className="odontogram-section">
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', overflowX: 'auto', padding: '0.5rem' }}>
                  {upperTeeth.map(id => <Tooth key={id} id={id} surfaces={odontogramData[id] || {}} onClick={handleToothClick} />)}
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', overflowX: 'auto', padding: '0.5rem', marginTop: '1rem' }}>
                  {lowerTeeth.map(id => <Tooth key={id} id={id} surfaces={odontogramData[id] || {}} onClick={handleToothClick} />)}
                </div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Continuar <ArrowRight size={18} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="card glass" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Desglose de Tratamiento</h3>
            {items.map((item, i) => (
              <div key={i} className="grid-3">
                <div className="input-group">
                  <input 
                    className="input-field" 
                    placeholder="Procedimiento (ej: Resina Molar)" 
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input 
                    type="number"
                    className="input-field" 
                    placeholder="Precio" 
                    value={item.price}
                    onChange={e => updateItem(i, 'price', e.target.value)}
                  />
                </div>
                <button 
                  className="btn glass" 
                  style={{ color: 'var(--error)', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                ><Trash2 size={18} /></button>
              </div>
            ))}
            <button className="btn btn-outline w-full" onClick={addItem} style={{ marginTop: '0.5rem', height: '45px' }}><Plus size={16} /> Agregar Procedimiento</button>
            <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(212,175,55,0.08)', borderRadius: '12px', textAlign: 'right', border: '1px solid rgba(212,175,55,0.1)' }}>
              <span style={{ fontSize: '0.9rem', marginRight: '1rem', color: 'var(--text-muted)' }}>Total estimado:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-gold)' }}>{total.toLocaleString()} PYG</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>Atrás</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Continuar <ArrowRight size={18} /></button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="card glass" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}><CheckCircle size={32} color="var(--success)" style={{ display: 'block', margin: '0 auto 1rem' }} /> Resumen Final</h3>
            
            <div className="input-group-vertical" style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Título del Presupuesto / Plan</label>
              <input 
                className="input-field"
                placeholder="Ej: Rehabilitación Estética Integral"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ padding: '0.5rem 0' }}
              />
            </div>

            <div className="input-group-vertical" style={{ marginBottom: '2rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuotas / Sesiones sugeridas</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                <Calculator size={20} color="var(--primary)" />
                <input 
                  type="number"
                  className="input-field"
                  min={1}
                  value={numSessions}
                  onChange={e => setNumSessions(Number(e.target.value))}
                  style={{ padding: '0.5rem 0' }}
                />
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(212,175,55,0.1)', borderRadius: '12px', border: '1px solid var(--primary)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Total del Plan:</span>
                <span style={{ fontWeight: 700 }}>{total.toLocaleString()} PYG</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Estimado por {numSessions > 1 ? 'sesión' : 'pago'}:</span>
                <span>{(total / numSessions).toLocaleString()} PYG</span>
              </div>
            </div>

            <button className="btn btn-primary w-full" style={{ height: '50px' }} onClick={handleSave} disabled={loading}>
              <Save size={20} /> {loading ? 'Sincronizando...' : 'Confirmar y Guardar'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
            <button className="btn glass" onClick={() => setStep(3)}>Atrás</button>
          </div>
        </div>
      )}
    </div>
  );
};
