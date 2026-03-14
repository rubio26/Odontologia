import React from 'react';

interface ToothProps {
  id: number;
  surfaces: Record<string, string>; // surface -> state (e.g., 'caries', 'healthy')
  onClick: (id: number, surface: string) => void;
}

export const Tooth: React.FC<ToothProps> = ({ id, surfaces, onClick }) => {
  return (
    <div className="tooth-container" style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{id}</span>
      <svg viewBox="0 0 100 100" width="40" height="40" className="tooth">
        {/* Top Surface */}
        <polygon 
          points="0,0 100,0 75,25 25,25" 
          className={`surface ${surfaces.top || 'healthy'}`}
          onClick={() => onClick(id, 'top')}
        />
        {/* Bottom Surface */}
        <polygon 
          points="25,75 75,75 100,100 0,100" 
          className={`surface ${surfaces.bottom || 'healthy'}`}
          onClick={() => onClick(id, 'bottom')}
        />
        {/* Left Surface */}
        <polygon 
          points="0,0 25,25 25,75 0,100" 
          className={`surface ${surfaces.left || 'healthy'}`}
          onClick={() => onClick(id, 'left')}
        />
        {/* Right Surface */}
        <polygon 
          points="100,0 100,100 75,75 75,25" 
          className={`surface ${surfaces.right || 'healthy'}`}
          onClick={() => onClick(id, 'right')}
        />
        {/* Center Surface */}
        <rect 
          x="25" y="25" width="50" height="50" 
          className={`surface ${surfaces.center || 'healthy'}`}
          onClick={() => onClick(id, 'center')}
        />
      </svg>
    </div>
  );
};
