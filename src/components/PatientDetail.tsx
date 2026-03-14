import { useState } from 'react';
import { Odontogram } from './Odontogram/Odontogram';
import { ArrowLeft, MessageCircle, FileText, Activity } from 'lucide-react';

export const PatientDetail = ({ patient, onBack }: { patient: any, onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('clinical'); // clinical, budget, records

  const shareViaWhatsApp = () => {
    const text = `Hola ${patient.full_name}, adjunto el presupuesto detallado de su tratamiento dental.`;
    window.open(`https://wa.me/${patient.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`);
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn" style={{ padding: '0.5rem' }} onClick={onBack}><ArrowLeft size={20} /></button>
        <div>
          <h2 style={{ fontSize: '1.1rem' }}>{patient.full_name}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CI: {patient.document_id}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', padding: '1rem', overflowX: 'auto', background: '#F1F5F9' }}>
        {['clinical', 'budget', 'records'].map(t => (
          <button 
            key={t}
            className={`btn ${activeTab === t ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(t)}
          >
            {t === 'clinical' && <Activity size={16} />}
            {t === 'budget' && <FileText size={16} />}
            {t === 'clinical' ? 'Clínica' : t === 'budget' ? 'Presupuesto' : 'Ficha'}
          </button>
        ))}
      </div>

      {activeTab === 'clinical' && (
        <div style={{ padding: '1rem' }}>
          <h3>Odontograma</h3>
          <Odontogram />
        </div>
      )}

      {activeTab === 'budget' && (
        <div style={{ padding: '1rem' }}>
          <div className="card">
            <h3>Generar Presupuesto</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Incluye el mapa dental y los costos estimados.</p>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }} onClick={shareViaWhatsApp}>
              <MessageCircle size={20} /> Compartir por WhatsApp
            </button>
            <button className="btn" style={{ width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
              <FileText size={20} /> Exportar como PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
