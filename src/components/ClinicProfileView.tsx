import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Building2, Phone, MapPin, Users, Wallet, Plus,
  FileText, Activity, CheckCircle2, Clock, Loader2, User, Trash2
} from 'lucide-react';

export const ClinicProfileView = ({ profile }: { profile: any }) => {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'patients' | 'payments'>('patients');
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  useEffect(() => {
    if (clinicId) fetchAll();
  }, [clinicId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [clinicRes, cpRes, paymentsRes, patientsRes] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicId).eq('doctor_id', profile.id).single(),
        supabase.from('clinic_patients').select('*, patients(id, full_name, phone, email, profession)').eq('clinic_id', clinicId).eq('doctor_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('clinic_payments').select('*, patients(full_name)').eq('clinic_id', clinicId).eq('doctor_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('patients').select('id, full_name').eq('doctor_id', profile.id).order('full_name'),
      ]);

      if (clinicRes.data) setClinic(clinicRes.data);
      if (cpRes.data) setPatients(cpRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (patientsRes.data) setAllPatients(patientsRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPatient = async () => {
    if (!selectedPatientId) return;
    try {
      const { error } = await supabase.from('clinic_patients').insert({
        doctor_id: profile.id,
        clinic_id: clinicId,
        patient_id: selectedPatientId,
      });
      if (error && error.code !== '23505') throw error; // ignore duplicate
      setShowAddPatient(false);
      setSelectedPatientId('');
      fetchAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleUnlinkPatient = async (cpId: string) => {
    if (!confirm('¿Eliminar la relación con este paciente?')) return;
    await supabase.from('clinic_patients').delete().eq('id', cpId).eq('doctor_id', profile.id);
    setPatients(patients.filter(p => p.id !== cpId));
  };

  const handleMarkPaid = async (paymentId: string) => {
    const { error } = await supabase
      .from('clinic_payments')
      .update({ status: 'paid', paid_amount: payments.find(p => p.id === paymentId)?.total_amount })
      .eq('id', paymentId)
      .eq('doctor_id', profile.id);
    if (!error) setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'paid' } : p));
  };

  const pendingTotal = payments.filter(p => p.status !== 'paid').reduce((acc, p) => acc + (p.total_amount - p.paid_amount), 0);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Cargando perfil de clínica...</p>
    </div>
  );

  if (!clinic) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--error)' }}>Clínica no encontrada.</p>
      <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>Volver</button>
    </div>
  );

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn glass" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={22} color="var(--primary)" /> {clinic.name}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', flexWrap: 'wrap' }}>
            {clinic.phone && <span><Phone size={12} style={{ marginRight: '4px' }} />{clinic.phone}</span>}
            {clinic.address && <span><MapPin size={12} style={{ marginRight: '4px' }} />{clinic.address}</span>}
          </div>
        </div>
        {pendingTotal > 0 && (
          <div className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.4rem 0.8rem' }}>
            💰 {pendingTotal.toLocaleString()} PYG
          </div>
        )}
      </header>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '12px' }}>
        <button
          className={`btn w-full ${activeTab === 'patients' ? 'btn-primary' : ''}`}
          style={{ fontSize: '0.78rem', height: '38px' }}
          onClick={() => setActiveTab('patients')}
        >
          <Users size={16} /> Pacientes ({patients.length})
        </button>
        <button
          className={`btn w-full ${activeTab === 'payments' ? 'btn-primary' : ''}`}
          style={{ fontSize: '0.78rem', height: '38px' }}
          onClick={() => setActiveTab('payments')}
        >
          <Wallet size={16} /> Cobros ({payments.filter(p => p.status !== 'paid').length} pend.)
        </button>
      </div>

      {/* ── TAB PATIENTS ── */}
      {activeTab === 'patients' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Pacientes que atendiste en esta clínica
            </p>
            <button
              className="btn btn-primary"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem', height: 'auto' }}
              onClick={() => setShowAddPatient(!showAddPatient)}
            >
              <Plus size={14} /> Asociar Paciente
            </button>
          </div>

          {showAddPatient && (
            <div className="card glass" style={{ marginBottom: '1rem', padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
              <p style={{ fontSize: '0.8rem', marginBottom: '0.8rem', color: 'var(--text-gold)' }}>Seleccionar paciente existente</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <User size={16} />
                  <select
                    style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', padding: '0.6rem' }}
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                  >
                    <option value="" disabled style={{ background: '#111' }}>Elegir paciente...</option>
                    {allPatients
                      .filter(p => !patients.find(cp => cp.patient_id === p.id))
                      .map(p => <option key={p.id} value={p.id} style={{ background: '#111' }}>{p.full_name}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleLinkPatient} disabled={!selectedPatientId}>Vincular</button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
                * También puedes registrar un nuevo paciente en la sección de Pacientes y luego vincularlo aquí.
              </p>
            </div>
          )}

          {patients.length === 0 ? (
            <div className="card glass" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, borderStyle: 'dashed' }}>
              <Users size={40} style={{ margin: '0 auto 1rem' }} color="var(--text-muted)" />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay pacientes vinculados a esta clínica.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {patients.map(cp => (
                <div key={cp.id} className="card glass" style={{ borderLeft: '3px solid #8B5CF6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cp.patients?.full_name}</p>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {cp.patients?.phone && `📱 ${cp.patients.phone}`}
                        {cp.patients?.profession && ` • ${cp.patients.profession}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.7rem', padding: '0.4rem 0.7rem', height: 'auto' }}
                        onClick={() => navigate('/patients', { state: { selectedPatientId: cp.patient_id, autoOpenTab: 'odontogram' } })}
                      >
                        <Activity size={13} /> Odontograma
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.7rem', padding: '0.4rem 0.7rem', height: 'auto' }}
                        onClick={() => navigate('/new-budget', { state: { preselectedPatientId: cp.patient_id, clinicId } })}
                      >
                        <FileText size={13} /> Presupuesto
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.3rem' }}
                        onClick={() => handleUnlinkPatient(cp.id)}
                        title="Desvincular"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB PAYMENTS ── */}
      {activeTab === 'payments' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {pendingTotal > 0 && (
            <div className="card glass" style={{ marginBottom: '1.5rem', padding: '1rem', borderLeft: '4px solid var(--error)', background: 'rgba(239,68,68,0.06)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Total pendiente de cobro</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>
                {pendingTotal.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>PYG</span>
              </p>
            </div>
          )}

          {payments.length === 0 ? (
            <div className="card glass" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, borderStyle: 'dashed' }}>
              <Wallet size={40} style={{ margin: '0 auto 1rem' }} color="var(--text-muted)" />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay registros de cobros con esta clínica.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {payments.map(pay => (
                <div key={pay.id} className="card glass" style={{ borderLeft: `3px solid ${pay.status === 'paid' ? 'var(--success)' : 'var(--error)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{pay.description || 'Tratamiento'}</p>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {pay.patients?.full_name && `Paciente: ${pay.patients.full_name} • `}
                        <Clock size={11} style={{ marginRight: '2px' }} />
                        {new Date(pay.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                      <span style={{ fontWeight: 700, color: pay.status === 'paid' ? 'var(--success)' : 'var(--error)', fontSize: '0.95rem' }}>
                        {(pay.total_amount - pay.paid_amount).toLocaleString()} PYG
                      </span>
                      {pay.status !== 'paid' ? (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.68rem', padding: '0.3rem 0.7rem', height: 'auto' }}
                          onClick={() => handleMarkPaid(pay.id)}
                        >
                          <CheckCircle2 size={12} /> Marcar Cobrado
                        </button>
                      ) : (
                        <span className="badge badge-clinic" style={{ fontSize: '0.62rem' }}>✓ COBRADO</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
