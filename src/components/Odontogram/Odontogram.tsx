import { useState } from 'react';
import { Tooth } from './Tooth';
import './Odontogram.css';

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const Odontogram = () => {
  const [data, setData] = useState<Record<number, Record<string, string>>>({});
  const [selectedState, setSelectedState] = useState('caries');

  const states = [
    { id: 'caries', label: 'Caries', color: '#EF4444' },
    { id: 'done', label: 'Realizado', color: 'var(--success)' },
    { id: 'crown', label: 'Corona', color: 'var(--primary)' },
    { id: 'implant', label: 'Implante', color: '#8B5CF6' },
    { id: 'absent', label: 'Ausente', color: '#111' },
    { id: 'protesis', label: 'Prótesis', color: '#D946EF' }
  ];

  const handleToothClick = (id: number, surface: string) => {
    setData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [surface]: prev[id]?.[surface] === selectedState ? 'healthy' : selectedState
      }
    }));
  };

  return (
    <div className="odontogram-container" style={{ padding: '1rem' }}>
      <div className="controls" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {states.map(s => (
          <button 
            key={s.id}
            className={`btn ${selectedState === s.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.6rem 1.2rem',
              whiteSpace: 'nowrap',
              borderLeft: selectedState !== s.id ? `4px solid ${s.color}` : 'none'
            }}
            onClick={() => setSelectedState(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="odontogram-section">
        <span className="section-label">Superior</span>
        <div className="tooth-grid">
          {upperTeeth.map(id => (
            <Tooth key={id} id={id} state={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>

      <div className="odontogram-section">
        <span className="section-label">Inferior</span>
        <div className="tooth-grid">
          {lowerTeeth.map(id => (
            <Tooth key={id} id={id} state={data[id] || {}} onClick={handleToothClick} />
          ))}
        </div>
      </div>
    </div>
  );
};
