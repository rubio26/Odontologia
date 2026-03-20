import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, Trash2, MessageCircle, FileText, Activity } from 'lucide-react';

interface BudgetItem {
  description: string;
  price: number;
}

interface Budget {
  id: string;
  description: string;
  items: BudgetItem[];
  total_cost: number;
  num_sessions: number;
  status: 'draft' | 'active' | 'completed';
  odontogram_data?: Record<number, any>;
  created_at: string;
  clinic_id?: string;
}

export const BudgetManager = ({ patientId, profile, patientName, patientPhone, doctorName, onStartTreatment }: { patientId: string, profile: any, patientName: string, patientPhone?: string, doctorName?: string, onStartTreatment?: () => void }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newBudget, setNewBudget] = useState<{
    description: string;
    num_sessions: number;
    items: BudgetItem[];
  }>({
    description: '',
    num_sessions: 1,
    items: [{ description: '', price: 0 }]
  });

  useEffect(() => {
    fetchBudgets();
  }, [patientId]);

  const fetchBudgets = async () => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('patient_id', patientId)
      .eq('doctor_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBudgets(data);
    }
    setLoading(false);
  };

  const addItem = () => {
    setNewBudget({
      ...newBudget,
      items: [...newBudget.items, { description: '', price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = newBudget.items.filter((_, i) => i !== index);
    setNewBudget({ ...newBudget, items: updatedItems });
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: string | number) => {
    const updatedItems = [...newBudget.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewBudget({ ...newBudget, items: updatedItems });
  };

  const calculateTotal = () => {
    return newBudget.items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const total = calculateTotal();
      const { error } = await supabase.from('budgets').insert({
        patient_id: patientId,
        doctor_id: profile.id,
        description: newBudget.description || 'Plan de Tratamiento',
        items: newBudget.items,
        total_cost: total,
        num_sessions: newBudget.num_sessions,
        status: 'active'
      });

      if (error) throw error;
      
      setIsCreating(false);
      setNewBudget({
        description: '',
        num_sessions: 1,
        items: [{ description: '', price: 0 }]
      });
      fetchBudgets();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (budget: Budget) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = budget.items.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="flex: 1;">${item.description}</span>
        <span style="font-weight: 600; min-width: 120px; text-align: right; color: #1a1a1a;">${item.price.toLocaleString()} PYG</span>
      </div>
    `).join('');

    const affectedTeeth = budget.odontogram_data 
      ? Object.entries(budget.odontogram_data)
          .filter(([_, surfaces]) => Object.values(surfaces as any).some(s => s !== 'healthy'))
          .map(([id]) => id)
          .join(', ')
      : null;

    printWindow.document.write(`
      <html>
        <head>
          <title>Presupuesto - Lumini Studio</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 50px; color: #2D3436; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 30px; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #1a1a1a; margin-bottom: 5px; }
            .subtitle { font-size: 10px; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase; font-weight: 600; }
            .doc-type { font-size: 18px; color: #636E72; margin-top: 20px; font-weight: 400; }
            .section-title { font-size: 12px; font-weight: 700; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; margin-top: 30px; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { font-size: 13px; }
            .info-label { color: #636E72; font-weight: 600; margin-right: 8px; }
            .total-box { margin-top: 40px; padding: 25px; background: #fdfaf0; border-radius: 8px; border-left: 5px solid #D4AF37; display: flex; justify-content: space-between; align-items: center; }
            .total-label { font-size: 14px; font-weight: 700; color: #1a1a1a; }
            .total-amount { font-size: 24px; font-weight: 800; color: #D4AF37; }
            .footer { margin-top: 60px; font-size: 11px; color: #a0a0a0; text-align: center; border-top: 1px solid #eee; padding-top: 30px; }
            @media print { body { padding: 0; } .container { box-shadow: none; border: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 10px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                LUMINI
              </div>
              <div class="subtitle">Studio Dental Premium</div>
              <div class="doc-type">PRESUPUESTO DE TRATAMIENTO</div>
            </div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Paciente:</span> ${patientName}</div>
              <div class="info-item" style="text-align: right;"><span class="info-label">Fecha:</span> ${new Date(budget.created_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div class="info-item"><span class="info-label">Plan:</span> ${budget.description}</div>
              <div class="info-item" style="text-align: right;"><span class="info-label">Vencimiento:</span> 15 días</div>
            </div>
            ${affectedTeeth ? `<div class="section-title">Análisis Clínico</div><div style="font-size: 13px; background: white; padding: 10px; border: 1px solid #eee; border-radius: 6px;"><span class="info-label">Dientes bajo tratamiento:</span> ${affectedTeeth}</div>` : ''}
            <div class="section-title">Procedimientos e Inversión</div>
            <div class="items">${itemsHtml}</div>
            <div class="total-box">
              <div><div class="total-label">Inversión Final Sugerida</div><div style="font-size: 11px; color: #636E72; margin-top: 5px;">${budget.num_sessions} ${budget.num_sessions === 1 ? 'Sesión' : 'Sesiones de tratamiento'}</div></div>
              <div class="total-amount">${budget.total_cost.toLocaleString()} PYG</div>
            </div>
            <div class="footer">
              <p>Este documento es una cotización profesional sujeta a variaciones según respuesta clínica del paciente.</p>
              <p style="margin-top: 15px; font-weight: 600; font-size: 13px; color: #1a1a1a;">Emitido por el ${doctorName || 'Dr. Encargado'}</p>
              <p style="margin-top: 10px; font-weight: 600; color: #D4AF37;">LUMINI STUDIO DENTAL • EXCELENCIA EN CADA DETALLE</p>
            </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareViaWhatsApp = (budget: Budget) => {
    const itemsText = budget.items.map(item => `- ${item.description}: ${item.price.toLocaleString()} PYG`).join('\n');
    const text = `Hola ${patientName}, adjunto el presupuesto detallado de su tratamiento dental:\n\n*${budget.description}*\n${itemsText}\n\n*Total:* ${budget.total_cost.toLocaleString()} PYG\n*Sesiones estimadas:* ${budget.num_sessions}\n\nQuedamos a las órdenes para agendar su primera sesión.`;
    window.open(`https://wa.me/${patientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`);
  };
 
  const handleStartTreatment = async (budget: Budget) => {
    if (!confirm(`¿Deseas iniciar el tratamiento "${budget.description}"? Esto actualizará el odontograma activo con los cambios propuestos.`)) return;
    
    setSaving(true);
    try {
      // 1. Create entry in treatments table
      const { error: treatmentError } = await supabase
        .from('treatments')
        .insert([{
          patient_id: patientId,
          doctor_id: profile.id,
          budget_id: budget.id,
          description: budget.description,
          status: 'active',
          initial_state: budget.odontogram_data || {},
          total_amount: budget.total_cost || 0,
          paid_amount: 0,
          clinic_id: budget.clinic_id || null,
          created_at: new Date().toISOString()
        }]);

      if (treatmentError) throw treatmentError;

      // 2. Update current odontogram if budget has data
      if (budget.odontogram_data) {
        await supabase
          .from('odontograms')
          .upsert({ 
            patient_id: patientId, 
            doctor_id: profile.id,
            data: budget.odontogram_data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'patient_id' });
      }

      // 3. Mark budget as completed
      await supabase.from('budgets').update({ status: 'completed' }).eq('id', budget.id).eq('doctor_id', profile.id);

      alert('¡Tratamiento iniciado! Ahora puedes seguir la evolución en el Odontograma.');
      fetchBudgets();
      if (onStartTreatment) onStartTreatment();
    } catch (err: any) {
      alert('Error al iniciar tratamiento: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando presupuestos...</div>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--primary)" /> Presupuestos y Planes
        </h3>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancelar' : <><Plus size={16} /> Nuevo Presupuesto</>}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="card glass" style={{ marginBottom: '2rem', padding: '1.2rem' }}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Título del Plan</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej: Rehabilitación Superior"
              value={newBudget.description}
              onChange={e => setNewBudget({...newBudget, description: e.target.value})}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            {newBudget.items.map((item, index) => (
              <div key={index} className="grid-3" style={{ marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ fontSize: '0.8rem' }}
                  placeholder="Procedimiento"
                  value={item.description}
                  onChange={e => updateItem(index, 'description', e.target.value)}
                  required
                />
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ fontSize: '0.8rem' }}
                  placeholder="Precio"
                  value={item.price}
                  onChange={e => updateItem(index, 'price', parseInt(e.target.value))}
                  required
                />
                <button 
                  type="button" 
                  className="btn glass" 
                  style={{ padding: 0, color: 'var(--error)' }}
                  onClick={() => removeItem(index)}
                  disabled={newBudget.items.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-outline w-full" onClick={addItem} style={{ fontSize: '0.7rem' }}>
              <Plus size={14} /> Agregar Item
            </button>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sesiones Estimadas</label>
            <input 
              type="number" 
              className="input-field" 
              min={1}
              value={newBudget.num_sessions}
              onChange={e => setNewBudget({...newBudget, num_sessions: parseInt(e.target.value)})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Crear Presupuesto'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {budgets.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay presupuestos registrados.</p>
        ) : (
          budgets.map(budget => (
            <div key={budget.id} className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{budget.description}</h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(budget.created_at).toLocaleDateString()} • {budget.num_sessions} {budget.num_sessions === 1 ? 'sesión' : 'sesiones'}
                  </p>
                </div>
              </div>

              <div style={{ margin: '1rem 0', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.8rem' }}>
                {budget.odontogram_data && (
                   <p style={{ fontSize: '0.7rem', color: 'var(--text-gold)', marginBottom: '0.5rem' }}>
                      Impacto: {Object.keys(budget.odontogram_data).join(', ')}
                   </p>
                )}
                {budget.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span>{item.description}</span>
                    <span style={{ color: 'var(--text-gold)' }}>{item.price.toLocaleString()} PYG</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>{budget.total_cost.toLocaleString()} PYG</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {budget.status === 'active' && (
                  <button className="btn btn-primary" style={{ flex: 1.5, fontSize: '0.75rem' }} onClick={() => handleStartTreatment(budget)}>
                    <Activity size={16} /> Iniciar Tratamiento
                  </button>
                )}
                <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => shareViaWhatsApp(budget)}><MessageCircle size={16} /> WhatsApp</button>
                <button className="btn glass" style={{ flex: 1, fontSize: '0.75rem', color: 'white' }} onClick={() => handlePrint(budget)}><FileText size={16} /> Imprimir</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
