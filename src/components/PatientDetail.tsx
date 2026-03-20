import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  FileText, 
  Activity, 
  Camera, 
  PenTool, 
  ClipboardList, 
  Save, 
  User, 
  Smartphone, 
  MapPin as MapPinIcon, 
  Loader2, 
  Clipboard as ClipboardIcon,
  Archive
} from 'lucide-react';
import { PhotoGallery } from './Clinical/PhotoGallery';
import { DigitalConsent } from './Clinical/DigitalConsent';
import { Odontogram } from './Odontogram/Odontogram';
import { ClinicalEvolution } from './Clinical/ClinicalEvolution';
import { BudgetManager } from './Clinical/BudgetManager';
import { ClinicalHistory } from './Clinical/ClinicalHistory';
import { TreatmentArchive } from './Clinical/TreatmentArchive';
import { TreatmentPayments } from './Clinical/TreatmentPayments';
import { DollarSign } from 'lucide-react';

export const PatientDetail = ({ 
  patient, 
  profile,
  doctorName,
  onBack, 
  defaultTab = 'clinical', 
  autoAddNew = false 
}: { 
  patient: any, 
  profile: any,
  doctorName?: string,
  onBack: () => void, 
  defaultTab?: string, 
  autoAddNew?: boolean 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [locationFilter, setLocationFilter] = useState<'all' | 'clinic' | 'delivery'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedPatient, setEditedPatient] = useState({...patient});

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          full_name: editedPatient.full_name,
          document_id: editedPatient.document_id,
          phone: editedPatient.phone,
          profession: editedPatient.profession,
          birth_date: editedPatient.birth_date,
          address: editedPatient.address
        })
        .eq('id', patient.id)
        .eq('doctor_id', profile.id);

      if (error) throw error;
      setIsEditing(false);
      alert('Datos actualizados correctamente.');
      // Update local state if parent refetches or just update the object
      patient.full_name = editedPatient.full_name;
      patient.document_id = editedPatient.document_id;
      patient.phone = editedPatient.phone;
      patient.profession = editedPatient.profession;
      patient.birth_date = editedPatient.birth_date;
      patient.address = editedPatient.address;
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };



  return (
    <div style={{ paddingBottom: '6rem', backgroundColor: 'var(--bg-dark)', minHeight: '100vh' }}>
      <div style={{ padding: '1.2rem', background: 'var(--surface-dark)', borderBottom: '1px solid var(--border-luxury)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={onBack}><ArrowLeft size={20} /></button>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{patient.full_name}</h2>
            <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <span>ID: {patient.document_id}</span>
              <span>• {patient.profession || 'Profesión n/a'}</span>
              <span>• {patient.phone}</span>
            </div>
          </div>
        </div>
        <button className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }} onClick={() => setIsEditing(true)}>
          <PenTool size={14} /> Editar
        </button>
      </div>

      {isEditing && (
        <div className="auth-container" style={{ position: 'fixed', zIndex: 1000, background: 'rgba(0,0,0,0.8)' }}>
          <form onSubmit={handleUpdate} className="auth-card glass" style={{ width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Editar Paciente</h3>
              <button type="button" className="btn glass" onClick={() => setIsEditing(false)}><ArrowLeft size={16} /></button>
            </div>
            
            <div className="input-group">
              <User size={18} />
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                value={editedPatient.full_name}
                onChange={e => setEditedPatient({...editedPatient, full_name: e.target.value})}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <Smartphone size={18} />
                <input 
                  type="text" 
                  placeholder="Teléfono" 
                  value={editedPatient.phone}
                  onChange={e => setEditedPatient({...editedPatient, phone: e.target.value})}
                />
              </div>
              <div className="input-group">
                <ClipboardList size={18} />
                <input 
                  type="text" 
                  placeholder="ID / Cédula" 
                  value={editedPatient.document_id}
                  onChange={e => setEditedPatient({...editedPatient, document_id: e.target.value})}
                />
              </div>
            </div>

            <div className="input-group">
              <MapPinIcon size={18} />
              <input 
                type="text" 
                placeholder="Dirección" 
                value={editedPatient.address}
                onChange={e => setEditedPatient({...editedPatient, address: e.target.value})}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Guardar Cambios</>}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem', overflowX: 'auto', background: 'rgba(212, 175, 55, 0.05)', scrollbarWidth: 'none' }}>
        {[
          { id: 'clinical', label: 'Odontograma', icon: <Activity size={16} /> },
          { id: 'evolution', label: 'Evolución', icon: <ClipboardList size={16} /> },
          { id: 'history', label: 'Historia', icon: <ClipboardIcon size={16} /> },
          { id: 'budget', label: 'Presupuesto', icon: <FileText size={16} /> },
          { id: 'gallery', label: 'Galería', icon: <Camera size={16} /> },
          { id: 'archive', label: 'Archivo', icon: <Archive size={16} /> },
          { id: 'consent', label: 'Firma', icon: <PenTool size={16} /> },
          { id: 'payments', label: 'Pagos', icon: <DollarSign size={16} /> }
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
            <MapPinIcon size={12} /> {locationFilter === 'all' ? 'Mostrando todo el historial' : `Filtrado por: ${locationFilter}`}
          </p>
          <Odontogram patientId={patient.id} profile={profile} />
        </div>
      )}

      {activeTab === 'evolution' && (
        <div style={{ padding: '1rem' }}>
          <ClinicalEvolution patientId={patient.id} profile={profile} autoAddNew={autoAddNew} />
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ padding: '1rem' }}>
          <ClinicalHistory patientId={patient.id} profile={profile} />
        </div>
      )}

      {activeTab === 'gallery' && (
        <div style={{ padding: '1rem' }}>
          <PhotoGallery patientId={patient.id} profile={profile} />
        </div>
      )}

      {activeTab === 'consent' && (
        <div style={{ padding: '1rem' }}>
          <DigitalConsent patientName={patient.full_name} />
        </div>
      )}

      {activeTab === 'budget' && (
        <div style={{ padding: '1rem' }}>
          <BudgetManager 
            patientId={patient.id} 
            profile={profile}
            patientName={patient.full_name} 
            patientPhone={patient.phone} 
            doctorName={doctorName}
            onStartTreatment={() => setActiveTab('clinical')}
          />
        </div>
      )}

      {activeTab === 'archive' && (
        <div style={{ padding: '1rem' }}>
          <TreatmentArchive patientId={patient.id} profile={profile} />
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ padding: '1rem' }}>
          <TreatmentPayments patientId={patient.id} profile={profile} />
        </div>
      )}
    </div>
  );
};
