import { useState } from 'react';
import { Tooth } from './Tooth';
import './Odontogram.css';

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const Odontogram = () => {
  const [data, setData] = useState<Record<number, Record<string, string>>>({});
  const [selectedState, setSelectedState] = useState('caries');

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
      <div className="controls" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {['caries', 'done', 'absent', 'protesis'].map(s => (
          <button 
            key={s}
            className={`btn ${selectedState === s ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            onClick={() => setSelectedState(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
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
