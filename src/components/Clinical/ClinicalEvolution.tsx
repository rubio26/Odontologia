import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, Activity, Heart, Calendar, Clock } from 'lucide-react';

interface EvolutionNote {
  id: string;
  session_date: string;
  procedure_notes: string;
  amount_paid: number;
  pa_max: number;
  pa_min: number;
  anesthesia_sensitivity: string;
  antibiotic_sensitivity: string;
  next_appointment_date: string | null;
  budget_id: string | null;
}

interface Budget {
  id: string;
  description: string;
}

export const ClinicalEvolution = ({ 
  patientId, 
  autoAddNew = false 
}: { 
  patientId: string, 
  autoAddNew?: boolean 
}) => {
  const [notes, setNotes] = useState<EvolutionNote[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(autoAddNew);
  const [saving, setSaving] = useState(false);
  
  const [newNote, setNewNote] = useState({
    procedure_notes: '',
    amount_paid: 0,
    pa_max: 120,
    pa_min: 80,
    anesthesia_sensitivity: 'Ninguna',
    antibiotic_sensitivity: 'Ninguna',
    next_appointment_date: '',
    budget_id: ''
  });

  useEffect(() => {
    fetchNotes();
    fetchBudgets();
    if (autoAddNew) {
      setAddingNote(true);
    }
  }, [patientId, autoAddNew]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('evolution_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

  const fetchBudgets = async () => {
    const { data } = await supabase
      .from('budgets')
      .select('id, description')
      .eq('patient_id', patientId)
      .eq('status', 'active');
    
    if (data) setBudgets(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from('evolution_notes').insert({
      patient_id: patientId,
      procedure_notes: newNote.procedure_notes,
      amount_paid: newNote.amount_paid,
      pa_max: newNote.pa_max,
      pa_min: newNote.pa_min,
      anesthesia_sensitivity: newNote.anesthesia_sensitivity,
      antibiotic_sensitivity: newNote.antibiotic_sensitivity,
      next_appointment_date: newNote.next_appointment_date || null,
      budget_id: newNote.budget_id || null
    });

    if (!error) {
      setAddingNote(false);
      setNewNote({
        procedure_notes: '',
        amount_paid: 0,
        pa_max: 120,
        pa_min: 80,
        anesthesia_sensitivity: 'Ninguna',
        antibiotic_sensitivity: 'Ninguna',
        next_appointment_date: '',
        budget_id: ''
      });
      fetchNotes();
      
      if (newNote.amount_paid > 0) {
        const { data: homeClinic } = await supabase.from('clinics').select('id').eq('is_home', true).maybeSingle();
        await supabase.from('transactions').insert({
          patient_id: patientId,
          description: `Pago en sesión: ${newNote.procedure_notes.substring(0, 30)}...`,
          amount_pyg: newNote.amount_paid,
          type: 'income',
          category: 'Sesión',
          clinic_id: homeClinic?.id
        });
      }
    }
    setSaving(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando evolución...</div>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--primary)" /> Evolución Clínica
        </h3>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          onClick={() => setAddingNote(!addingNote)}
        >
          {addingNote ? 'Cancelar' : <><Plus size={16} /> Nueva Nota</>}
        </button>
      </div>

      {addingNote && (
        <form onSubmit={handleSave} className="card glass" style={{ marginBottom: '2rem', padding: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presión Arterial (PA-MAX)</label>
              <input 
                type="number" 
                className="input-field" 
                value={newNote.pa_max} 
                onChange={e => setNewNote({...newNote, pa_max: parseInt(e.target.value)})} 
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mínima (PA-MIN)</label>
              <input 
                type="number" 
                className="input-field" 
                value={newNote.pa_min} 
                onChange={e => setNewNote({...newNote, pa_min: parseInt(e.target.value)})} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sensib. Anestesia</label>
              <input 
                type="text" 
                className="input-field" 
                value={newNote.anesthesia_sensitivity} 
                onChange={e => setNewNote({...newNote, anesthesia_sensitivity: e.target.value})} 
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sensib. Antibióticos</label>
              <input 
                type="text" 
                className="input-field" 
                value={newNote.antibiotic_sensitivity} 
                onChange={e => setNewNote({...newNote, antibiotic_sensitivity: e.target.value})} 
              />
            </div>
          </div>

          <div className="input-group-vertical" style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Vincular a Presupuesto</label>
            <select 
              value={newNote.budget_id}
              onChange={e => setNewNote({...newNote, budget_id: e.target.value})}
            >
              <option value="">Ninguno</option>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.description}</option>
              ))}
            </select>
          </div>

          <div className="input-group-vertical" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.4rem' }}>Procedimiento / Notas</label>
            <textarea 
              rows={12} 
              value={newNote.procedure_notes} 
              onChange={e => setNewNote({...newNote, procedure_notes: e.target.value})}
              placeholder="Ej: Instrumentación a 21mm, Medicación, Re-evaluación..."
              required
              style={{ 
                background: 'var(--bg-dark)', 
                color: 'white', 
                border: '1px solid var(--border-luxury)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '1rem',
                width: '100%',
                resize: 'vertical',
                marginTop: '0.4rem'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entrega de Pago (PYG)</label>
              <input 
                type="number" 
                className="input-field" 
                value={newNote.amount_paid} 
                onChange={e => setNewNote({...newNote, amount_paid: parseInt(e.target.value)})} 
              />
            </div>
            <div className="input-group">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Próxima Cita</label>
              <input 
                type="date" 
                className="input-field" 
                value={newNote.next_appointment_date} 
                onChange={e => setNewNote({...newNote, next_appointment_date: e.target.value})} 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Registrar Sesión'}
          </button>
        </form>
      )}

      <div className="timeline" style={{ position: 'relative' }}>
        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay notas registradas para este paciente.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="card glass" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Calendar size={14} /> {new Date(note.session_date).toLocaleDateString('es-ES')}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="badge badge-clinic" style={{ fontSize: '0.65rem' }}>
                    <Heart size={10} /> PA {note.pa_max}/{note.pa_min}
                  </div>
                  {note.amount_paid > 0 && (
                    <div className="badge badge-delivery" style={{ fontSize: '0.65rem' }}>
                      ${note.amount_paid.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', marginBottom: '0.8rem', lineHeight: '1.4' }}>{note.procedure_notes}</p>

              {note.next_appointment_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-gold)', marginBottom: '0.8rem', background: 'rgba(212, 175, 55, 0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px', width: 'fit-content' }}>
                  <Clock size={14} /> Próxima Cita: {new Date(note.next_appointment_date).toLocaleDateString('es-ES')}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem', marginTop: '0.6rem' }}>
                <div style={{ fontSize: '0.75rem', color: note.anesthesia_sensitivity === 'Ninguna' ? 'var(--text-muted)' : 'var(--error)' }}>
                  <strong>Anestesia:</strong> {note.anesthesia_sensitivity}
                </div>
                <div style={{ fontSize: '0.75rem', color: note.antibiotic_sensitivity === 'Ninguna' ? 'var(--text-muted)' : 'var(--error)' }}>
                  <strong>Antibióticos:</strong> {note.antibiotic_sensitivity}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
