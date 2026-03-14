import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, FileCheck, Trash2, Download } from 'lucide-react';

export const DigitalConsent = ({ patientName }: { patientName: string }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    console.log('Signature saved:', dataURL);
    setIsSigned(true);
    alert('Consentimiento firmado y guardado como PDF (simulado)');
  };

  return (
    <div className="card glass" style={{ marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileCheck size={20} color="var(--primary)" /> Consentimiento Informado
      </h3>
      
      <div style={{ fontSize: '0.85rem', color: 'var(--text-white)', marginBottom: '1.5rem', maxHeight: '150px', overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <p>Yo, <strong>{patientName}</strong>, autorizo a la Dra. a realizar el tratamiento dental propuesto. Entiendo los riesgos, beneficios y alternativas presentados...</p>
        <p style={{ marginTop: '0.5rem' }}>El profesional ha explicado detalladamente el procedimiento de rehabilitación oral.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '5px' }}>
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ width: 320, height: 150, className: 'sigCanvas' }}
          onBegin={() => setIsSigned(true)}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={clear}>
          <Trash2 size={16} /> Borrar
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>
          <PenTool size={16} /> Firmar
        </button>
      </div>

      {isSigned && (
        <p style={{ color: 'var(--success)', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
          ✓ Documento firmado digitalmente.
        </p>
      )}
    </div>
  );
};
