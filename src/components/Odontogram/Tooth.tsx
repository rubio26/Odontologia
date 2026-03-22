import React from 'react';

interface ToothProps {
  id: number;
  surfaces: Record<string, string>; // surface -> state (e.g., 'caries', 'healthy')
  onClick: (id: number, surface: string) => void;
}

export const Tooth: React.FC<ToothProps> = ({ id, surfaces, onClick }) => {
  const isCorona       = Object.values(surfaces).every(s => s === 'corona'  || s === 'crown');
  const isImplant      = Object.values(surfaces).every(s => s === 'implant');
  const isAbsent       = Object.values(surfaces).every(s => s === 'absent');
  const isProtesis     = Object.values(surfaces).every(s => s === 'protesis');
  const isExtraccion   = Object.values(surfaces).every(s => s === 'extraccion' || s === 'exodoncia');
  const isEndodoncia   = Object.values(surfaces).some(s => s === 'endodoncia');
  const isLimpieza     = Object.values(surfaces).every(s => s === 'limpieza');
  const isIncrustacion = Object.values(surfaces).every(s => s === 'incrustacion');

  return (
    <div className={`tooth-container ${isAbsent ? 'absent' : ''}`}>
      <span className="tooth-id">{id}</span>
      <div className="tooth-wrapper">
        <svg viewBox="0 0 100 120" className="tooth-svg">
          {/* Main Tooth Shape / Outline */}
          <path 
            d="M20,20 Q20,5 50,5 Q80,5 80,20 L85,60 Q85,115 50,115 Q15,115 15,60 Z" 
            fill="rgba(255,255,255,0.05)" 
            stroke="rgba(212,175,55,0.3)" 
            strokeWidth="2"
            onClick={() => onClick(id, 'center')}
            style={{ cursor: 'pointer' }}
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

          {isCorona && (
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

          {isExtraccion && (
            <g>
              <line x1="20" y1="20" x2="80" y2="80" stroke="#F97316" strokeWidth="8" strokeLinecap="round" />
              <line x1="80" y1="20" x2="20" y2="80" stroke="#F97316" strokeWidth="8" strokeLinecap="round" />
            </g>
          )}

          {isEndodoncia && (
            <circle cx="50" cy="60" r="10" fill="#EC4899" fillOpacity="0.9" stroke="#9D174D" strokeWidth="2" />
          )}

          {isLimpieza && (
            <path d="M15,60 Q30,50 50,60 Q70,70 85,60" stroke="#06B6D4" strokeWidth="4" fill="none" />
          )}

          {isIncrustacion && (
            <polygon points="50,25 70,50 50,75 30,50" fill="#F59E0B" fillOpacity="0.5" stroke="#92400E" strokeWidth="2" />
          )}
        </svg>
      </div>
    </div>
  );
};
