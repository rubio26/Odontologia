import React from 'react';

interface ToothProps {
  id: number;
  surfaces: Record<string, string>; // surface -> state (e.g., 'caries', 'healthy')
  onClick: (id: number, surface: string) => void;
}

export const Tooth: React.FC<ToothProps> = ({ id, surfaces, onClick }) => {
  const isCrown = Object.values(surfaces).every(s => s === 'crown');
  const isImplant = Object.values(surfaces).every(s => s === 'implant');
  const isAbsent = Object.values(surfaces).every(s => s === 'absent');
  const isProtesis = Object.values(surfaces).every(s => s === 'protesis');
  const isExodoncia = Object.values(surfaces).every(s => s === 'exodoncia');

  return (
    <div className={`tooth-container ${isAbsent ? 'absent' : ''}`} style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px', display: 'block' }}>{id}</span>
      <div className="tooth-wrapper" style={{ position: 'relative', width: '45px', height: '55px', margin: '0 auto' }}>
        <svg viewBox="0 0 100 120" className="tooth-svg">
          {/* Main Tooth Shape / Outline */}
          <path 
            d="M20,20 Q20,5 50,5 Q80,5 80,20 L85,60 Q85,115 50,115 Q15,115 15,60 Z" 
            fill="rgba(255,255,255,0.05)" 
            stroke="rgba(212,175,55,0.3)" 
            strokeWidth="2"
          />

          {!isAbsent && !isImplant && (
            <g className="tooth-surfaces">
              {/* Vestibular / Top */}
              <path 
                d="M30,30 L70,30 L80,25 Q50,15 20,25 Z" 
                className={`surface-path ${surfaces.top || 'healthy'}`}
                onClick={() => onClick(id, 'top')}
              />
              {/* Lingual / Bottom */}
              <path 
                d="M30,70 L70,70 L80,75 Q50,85 20,75 Z" 
                className={`surface-path ${surfaces.bottom || 'healthy'}`}
                onClick={() => onClick(id, 'bottom')}
              />
              {/* Mesial / Left */}
              <path 
                d="M30,30 L20,25 L20,75 L30,70 Z" 
                className={`surface-path ${surfaces.left || 'healthy'}`}
                onClick={() => onClick(id, 'left')}
              />
              {/* Distal / Right */}
              <path 
                d="M70,30 L80,25 L80,75 L70,70 Z" 
                className={`surface-path ${surfaces.right || 'healthy'}`}
                onClick={() => onClick(id, 'right')}
              />
              {/* Occlusal / Center */}
              <rect 
                x="30" y="30" width="40" height="40" rx="4"
                className={`surface-path ${surfaces.center || 'healthy'}`}
                onClick={() => onClick(id, 'center')}
              />
            </g>
          )}

          {isCrown && (
            <path d="M15,20 L85,20 L80,50 L20,50 Z" fill="var(--primary)" fillOpacity="0.4" stroke="var(--primary)" />
          )}
          
          {isImplant && (
            <g transform="translate(50, 60)">
              <rect x="-5" y="-30" width="10" height="60" rx="2" fill="#8B5CF6" />
              <path d="M-15,-10 L15,-10 M-15,0 L15,0 M-15,10 L15,10" stroke="#8B5CF6" strokeWidth="3" />
            </g>
          )}

          {isProtesis && (
            <path d="M10,40 Q50,30 90,40" stroke="#D946EF" strokeWidth="4" fill="none" strokeDasharray="4 2" />
          )}

          {isExodoncia && (
            <g>
              <line x1="20" y1="20" x2="80" y2="80" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
