import { useState } from 'react';
import { Camera, Image as ImageIcon, Grid, Maximize2, Share2, MousePointer2 } from 'lucide-react';

export const PhotoGallery = () => {
  const [view, setView] = useState<'grid' | 'compare'>('grid');

  const photos = [
    { id: 1, type: 'Antes', url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&q=80' },
    { id: 2, type: 'Después', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80' }
  ];

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Galería de Casos</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem' }} onClick={() => setView('grid')}>
            <Grid size={18} />
          </button>
          <button className={`btn ${view === 'compare' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem' }} onClick={() => setView('compare')}>
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {photos.map(p => (
            <div key={p.id} className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
              <img src={p.url} alt={p.type} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
              <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-delivery" style={{ fontSize: '0.6rem' }}>{p.type}</span>
                <button className="btn" style={{ padding: '0.2rem', color: 'var(--primary)' }}><Share2 size={14} /></button>
              </div>
            </div>
          ))}
          <div className="card glass" style={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderStyle: 'dashed' }}>
             <Camera size={24} color="var(--primary)" />
             <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargar Foto</span>
          </div>
        </div>
      ) : (
        <div className="card glass" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'var(--primary)' }}>
            <img src={photos[0].url} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <img src={photos[1].url} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
            <button className="btn btn-primary" style={{ padding: '0.5rem' }}>
              <MousePointer2 size={18} /> Señalar Hallazgos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
