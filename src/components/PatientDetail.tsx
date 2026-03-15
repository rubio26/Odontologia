import { useState } from 'react';
import { ArrowLeft, MessageCircle, FileText, Activity, Camera, PenTool, MapPin } from 'lucide-react';
import { PhotoGallery } from './Clinical/PhotoGallery';
import { DigitalConsent } from './Clinical/DigitalConsent';
import { Odontogram } from './Odontogram/Odontogram';

export const PatientDetail = ({ patient, onBack }: { patient: any, onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('clinical'); // clinical, budget, gallery, consent
  const [locationFilter, setLocationFilter] = useState<'all' | 'clinic' | 'delivery'>('all');

  const shareViaWhatsApp = () => {
    const text = `Hola ${patient.full_name}, adjunto el presupuesto detallado de su tratamiento dental.`;
    window.open(`https://wa.me/${patient.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`);
  };

  return (
    <div style={{ paddingBottom: '6rem', backgroundColor: 'var(--bg-dark)', minHeight: '100vh' }}>
      <div style={{ padding: '1.2rem', background: 'var(--surface-dark)', borderBottom: '1px solid var(--border-luxury)', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={onBack}><ArrowLeft size={20} /></button>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{patient.full_name}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {patient.document_id}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem', overflowX: 'auto', background: 'rgba(212, 175, 55, 0.05)', scrollbarWidth: 'none' }}>
        {[
          { id: 'clinical', label: 'Clínica', icon: <Activity size={16} /> },
          { id: 'budget', label: 'Presupuesto', icon: <FileText size={16} /> },
          { id: 'gallery', label: 'Galería', icon: <Camera size={16} /> },
          { id: 'consent', label: 'Firma', icon: <PenTool size={16} /> }
        ].map(t => (
          <button 
            key={t.id}
            className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: '100px' }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'clinical' && (
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Odontograma</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${locationFilter === 'clinic' ? 'btn-primary' : 'glass'}`} 
                style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setLocationFilter('clinic')}
              >Clínica</button>
              <button 
                className={`btn ${locationFilter === 'delivery' ? 'btn-primary' : 'glass'}`} 
                style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem' }}
                onClick={() => setLocationFilter('delivery')}
              >Delivery</button>
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <MapPin size={12} /> {locationFilter === 'all' ? 'Mostrando todo el historial' : `Filtrado por: ${locationFilter}`}
          </p>
          <Odontogram patientId={patient.id} />
        </div>
      )}

      {activeTab === 'gallery' && (
        <div style={{ padding: '1rem' }}>
          <PhotoGallery />
        </div>
      )}

      {activeTab === 'consent' && (
        <div style={{ padding: '1rem' }}>
          <DigitalConsent patientName={patient.full_name} />
        </div>
      )}

      {activeTab === 'budget' && (
        <div style={{ padding: '1rem' }}>
          <div className="card glass">
            <h3>Presupuesto Elite</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Proyección estética y funcional del tratamiento.</p>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={shareViaWhatsApp}>
              <MessageCircle size={20} /> Compartir vía WhatsApp
            </button>
            <button className="btn btn-outline" style={{ width: '100%' }}>
              <FileText size={20} /> Generar PDF HD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
