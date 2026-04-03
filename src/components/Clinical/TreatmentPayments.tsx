import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, PlusCircle, History, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CurrencyInput } from '../CurrencyInput';

export const TreatmentPayments = ({ patientId, profile }: { patientId: string, profile: any }) => {
  const [activeTreatment, setActiveTreatment] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState('Abono a tratamiento');

  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [isDelivery, setIsDelivery] = useState(false);

  useEffect(() => {
    fetchData();
    fetchClinics();
  }, [patientId]);

  const fetchClinics = async () => {
    const { data } = await supabase.from('clinics').select('*').eq('doctor_id', profile.id).order('is_home', { ascending: false });
    if (data) {
      setClinics(data);
      if (data.length > 0) setSelectedClinicId(data[0].id);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Active Treatment (taking the most recent one in case of duplicates)
      const { data: treatsArr } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const treats = treatsArr && treatsArr.length > 0 ? treatsArr[0] : null;
      setActiveTreatment(treats);
      setIsDelivery(!!treats?.clinic_id);
      if (treats?.clinic_id) setSelectedClinicId(treats.clinic_id);

      // 2. Fetch all transactions for this patient related to treatments
      const { data: txs } = await supabase
        .from('transactions')
        .select('*, clinics(name)')
        .eq('patient_id', patientId)
        .eq('doctor_id', profile.id)
        .eq('category', 'Tratamiento')
        .order('created_at', { ascending: false });
      
      setTransactions(txs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!activeTreatment || paymentAmount <= 0) return;
    setSaving(true);
    try {
      const amount = paymentAmount;
      
      // 1. Create Transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          patient_id: patientId,
          doctor_id: profile.id,
          description: `Pago: ${activeTreatment.description} - ${paymentNote}`,
          amount_pyg: amount,
          type: 'income',
          category: 'Tratamiento',
          treatment_id: activeTreatment.id,
          clinic_id: selectedClinicId
        }]);

      if (txError) throw txError;

      // 2. Update Treatment paid_amount
      const newPaid = (activeTreatment.paid_amount || 0) + amount;
      const { error: treatError } = await supabase
        .from('treatments')
        .update({ paid_amount: newPaid })
        .eq('id', activeTreatment.id)
        .eq('doctor_id', profile.id);

      if (treatError) throw treatError;
      
        // 3. If delivery, update clinic_payments tracking
        if (isDelivery) {
          const { data: existingCP } = await supabase
            .from('clinic_payments')
            .select('id')
            .eq('treatment_id', activeTreatment.id)
            .single();

          // Upsert clinic payment record for this treatment/budget
          const { error: cpError } = await supabase
            .from('clinic_payments')
            .upsert({
              id: existingCP?.id,
              doctor_id: profile.id,
              clinic_id: activeTreatment.clinic_id,
              patient_id: patientId,
              budget_id: activeTreatment.budget_id,
              treatment_id: activeTreatment.id,
              description: `Abono: ${activeTreatment.description}`,
              total_amount: activeTreatment.total_amount,
              paid_amount: newPaid,
              status: newPaid >= activeTreatment.total_amount ? 'paid' : 'partial'
            }, { onConflict: 'id' });
        
        if (cpError) console.error("Error updating clinic_payments:", cpError);
      }

      setShowPaymentModal(false);
      setPaymentAmount(0);
      setPaymentNote('Abono a tratamiento');
      await fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Consultando estado financiero...</div>;

  if (!activeTreatment && transactions.length === 0) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
        <DollarSign size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p style={{ fontSize: '0.9rem' }}>No hay movimientos financieros registrados.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Los pagos aparecerán aquí una vez que inicies un tratamiento desde un presupuesto.</p>
      </div>
    );
  }

  const saldo = activeTreatment ? (activeTreatment.total_amount - activeTreatment.paid_amount) : 0;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Delivery Banner */}
      {isDelivery && (
        <div className="card glass" style={{ 
          marginBottom: '1rem', 
          padding: '0.8rem 1.2rem', 
          background: 'rgba(139, 92, 246, 0.1)', 
          border: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.8rem',
          color: '#A78BFA'
        }}>
          <AlertCircle size={20} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tratamiento por Delivery</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>Los cobros se registran contra la clínica externa asociada.</p>
          </div>
        </div>
      )}

      {/* Active Treatment Summary */}
      {activeTreatment && (
        <div className="card glass" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-gold)', marginBottom: '0.3rem' }}>Estado de Cuenta: {activeTreatment.description}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Iniciado el {new Date(activeTreatment.created_at).toLocaleDateString()}</p>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ gap: '0.5rem' }}
              onClick={() => setShowPaymentModal(true)}
            >
              <PlusCircle size={18} /> {isDelivery ? 'Registrar Pago Clínica' : 'Registrar Cobro'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <div className="stat-card">
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Presupuesto Total</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeTreatment.total_amount?.toLocaleString()} <small>PYG</small></p>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monto Pagado</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{activeTreatment.paid_amount?.toLocaleString()} <small>PYG</small></p>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saldo Pendiente</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: saldo > 0 ? '#EF4444' : 'var(--success)' }}>{saldo.toLocaleString()} <small>PYG</small></p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min(100, (activeTreatment.paid_amount / activeTreatment.total_amount) * 100)}%`, 
              background: 'var(--primary)',
              transition: 'width 1s ease-out'
            }} />
          </div>
        </div>
      )}

      {/* History of Payments */}
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <History size={18} color="var(--primary)" /> Historial de Entregas
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {transactions.length === 0 ? (
          <div className="card glass" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>
            No hay pagos registrados aún.
          </div>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="card glass hover-effect" style={{ padding: '0.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem', borderRadius: '50%' }}>
                  <Receipt size={18} color="var(--success)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tx.description}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleString()} | 📍 {tx.clinics?.name || 'Sede Principal'}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, color: 'var(--success)' }}>+ {tx.amount_pyg?.toLocaleString()} PYG</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: 'var(--text-muted)', justifyContent: 'flex-end' }}>
                  <CheckCircle2 size={10} /> Procesado
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed-center" style={{ zIndex: 9999 }}>
          <div className="card glass" style={{ width: '90%', maxWidth: '400px', borderTop: '4px solid var(--primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} color="var(--primary)" /> Registrar Cobro
              </h3>
              <button className="btn glass p-1" onClick={() => setShowPaymentModal(false)}><PlusCircle style={{ transform: 'rotate(45deg)' }} size={20} /></button>
            </div>
            <h3>{isDelivery ? 'Registrar Pago de Clínica' : 'Registrar Cobro al Paciente'}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {isDelivery 
                ? 'Ingresa el monto que la clínica te ha entregado para este tratamiento.'
                : 'Registra el abono realizado por el paciente para su tratamiento.'}
            </p>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Tratamiento Activo: <strong>{activeTreatment?.description}</strong>
            </p>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <DollarSign size={18} />
              <CurrencyInput 
                placeholder="Monto solicitado (PYG)" 
                value={paymentAmount}
                onChange={setPaymentAmount}
                autoFocus
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <Receipt size={18} />
              <input 
                type="text" 
                placeholder="Referencia (ej. Primera entrega)" 
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <History size={18} />
              <select 
                value={selectedClinicId}
                onChange={e => setSelectedClinicId(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', padding: '0.5rem' }}
              >
                {clinics.map(c => <option key={c.id} value={c.id} style={{ background: '#111' }}>📍 {c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowPaymentModal(false)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleRegisterPayment}
                disabled={saving || !paymentAmount}
              >
                {saving ? 'Procesando...' : 'Confirmar Cobro'}
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '0.8rem', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <AlertCircle size={16} color="var(--primary)" />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Este monto se sumará al total pagado del tratamiento y se registrará en el flujo de caja global.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .stat-card {
          background: rgba(255,255,255,0.02);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .hover-effect:hover {
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
          transition: all 0.2s;
        }
      `}</style>
    </div>
  );
};
