import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, ChevronRight, AlertCircle, Clock } from 'lucide-react';

export const PendingTreatments = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingPatients();
  }, []);

  const fetchPendingPatients = async () => {
    setLoading(true);
    try {
      const { data: odontograms, error } = await supabase
        .from('odontograms')
        .select('patient_id, data, patients(full_name, phone, document_id)')
        .eq('doctor_id', profile.id);

      if (error) throw error;

      const pendingList = (odontograms || []).filter(o => {
        const teethData = o.data as Record<string, any>;
        return Object.values(teethData).some(surfaces => 
          Object.values(surfaces).some(state => state === 'caries' || state === 'exodoncia')
        );
      }).map(o => ({
        id: o.patient_id,
        fullName: (o.patients as any)?.full_name,
        documentId: (o.patients as any)?.document_id,
        phone: (o.patients as any)?.phone,
        pendingCount: Object.values(o.data as Record<string, any>).reduce((acc, surfaces) => {
          const surfacesArray = Object.values(surfaces as Record<string, string>);
          const count = surfacesArray.filter(s => s === 'caries' || s === 'exodoncia').length;
          return acc + (count > 0 ? 1 : 0); // Count teeth with pending issues
        }, 0)
      }));

      setPatients(pendingList);
    } catch (err: any) {
      console.error('Error fetching pending treatments:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className="btn glass" 
          style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }} 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', letterSpacing: '0.05em' }}>Pacientes Pendientes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Casos con caries o extracciones por realizar</p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>Sincronizando casos...</div>
      ) : patients.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)' }}>No hay tratamientos pendientes registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {patients.map(p => (
            <div 
              key={p.id} 
              className="card glass" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1.2rem',
                cursor: 'pointer',
                borderLeft: '4px solid #EF4444',
                transition: 'transform 0.2s ease'
              }}
              onClick={() => navigate(`/patients`, { state: { selectedPatientId: p.id } })}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
                  <User color="#EF4444" size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{p.fullName}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {p.documentId}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    background: 'rgba(239, 68, 68, 0.2)', 
                    color: '#EF4444', 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '10px',
                    fontWeight: 'bold'
                  }}>
                    {p.pendingCount} {p.pendingCount === 1 ? 'Pieza' : 'Piezas'}
                  </span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ver Evolución</p>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card glass" style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Clock size={20} color="var(--primary)" />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          Este listado se actualiza en tiempo real basado en el <strong>Odontograma Morfológico</strong> de cada paciente.
        </p>
      </div>
    </div>
  );
};
