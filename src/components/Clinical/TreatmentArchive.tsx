import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, CheckCircle2, FlaskConical, History } from 'lucide-react';

export const TreatmentArchive = ({ patientId }: { patientId: string }) => {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchive = async () => {
      const { data } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'finished')
        .order('finished_at', { ascending: false });
      
      if (data) setTreatments(data);
      setLoading(false);
    };

    fetchArchive();
  }, [patientId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Consultando archivos...</div>;

  if (treatments.length === 0) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
        <History size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p style={{ fontSize: '0.9rem' }}>No hay tratamientos archivados para este paciente.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Los tratamientos aparecerán aquí una vez que se marquen como finalizados en el odontograma.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {treatments.map(t => (
        <div key={t.id} className="card glass" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-gold)' }}>{t.description}</h4>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} /> Inicio: {new Date(t.created_at).toLocaleDateString()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)' }}>
                    <CheckCircle2 size={14} /> Fin: {new Date(t.finished_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="badge badge-clinic" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              ARCHIVADO
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FlaskConical size={12} /> Estado Final del Odontograma guardado
            </p>
            <p style={{ fontSize: '0.8rem' }}>
                Este registro contiene la morfología dental al concluir el tratamiento. Puedes consultarla seleccionando este tratamiento en la pestaña de Odontograma.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
