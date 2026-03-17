import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, Trash2, MessageCircle, FileText } from 'lucide-react';

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
  created_at: string;
}

export const BudgetManager = ({ patientId, patientName, patientPhone }: { patientId: string, patientName: string, patientPhone?: string }) => {
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

    const total = calculateTotal();
    const { error } = await supabase.from('budgets').insert({
      patient_id: patientId,
      description: newBudget.description,
      items: newBudget.items,
      total_cost: total,
      num_sessions: newBudget.num_sessions,
      status: 'active'
    });

    if (!error) {
      setIsCreating(false);
      setNewBudget({
        description: '',
        num_sessions: 1,
        items: [{ description: '', price: 0 }]
      });
      fetchBudgets();
    }
    setSaving(false);
  };

  const handlePrint = (budget: Budget) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = budget.items.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
        <span>${item.description}</span>
        <span style="font-weight: bold;">${item.price.toLocaleString()} PYG</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Presupuesto - Lumini Dental Studio</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #D4AF37; }
            .patient-info { margin-bottom: 30px; }
            .total { margin-top: 30px; text-align: right; font-size: 20px; color: #D4AF37; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">LUMINI DENTAL STUDIO</div>
            <p>Presupuesto de Tratamiento</p>
          </div>
          <div class="patient-info">
            <p><strong>Paciente:</strong> ${patientName}</p>
            <p><strong>Fecha:</strong> ${new Date(budget.created_at).toLocaleDateString()}</p>
            <p><strong>Plan:</strong> ${budget.description}</p>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="total">
            Total Estimado: ${budget.total_cost.toLocaleString()} PYG
          </div>
          <p style="margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Este presupuesto tiene una validez de 15 días. Las sesiones son estimadas y pueden variar según la evolución clínica.
          </p>
          <script>
            window.onload = () => {
              window.print();
              // window.close();
            }
          </script>
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
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Procedimientos</label>
            {newBudget.items.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ padding: '0.4rem', fontSize: '0.7rem', width: '100%', marginTop: '0.5rem' }}
              onClick={addItem}
            >
              <Plus size={14} /> Agregar Item
            </button>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Número de Sesiones Estimadas</label>
            <input 
              type="number" 
              className="input-field" 
              min={1}
              value={newBudget.num_sessions}
              onChange={e => setNewBudget({...newBudget, num_sessions: parseInt(e.target.value)})}
              required
            />
          </div>

          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Total Estimado:</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-gold)' }}>{calculateTotal().toLocaleString()} PYG</span>
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
                <div className={`badge ${budget.status === 'active' ? 'badge-clinic' : 'badge-delivery'}`} style={{ fontSize: '0.65rem' }}>
                  {budget.status.toUpperCase()}
                </div>
              </div>

              <div style={{ margin: '1rem 0', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.8rem' }}>
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
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
                  onClick={() => shareViaWhatsApp(budget)}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button 
                  className="btn glass" 
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
                  onClick={() => handlePrint(budget)}
                >
                  <FileText size={16} /> PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
