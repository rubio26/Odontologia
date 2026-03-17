import { useState, useRef } from 'react';
import { Camera, Grid, Maximize2, Share2, MousePointer2, FileSearch, Trash2 } from 'lucide-react';

export const PhotoGallery = () => {
  const [view, setView] = useState<'grid' | 'compare'>('grid');
  const [category, setCategory] = useState<'photos' | 'xrays'>('photos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState([
    { id: 1, type: 'Antes', url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=400&q=80' },
    { id: 2, type: 'Después', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80' }
  ]);

  const [xrays, setXrays] = useState([
    { id: 1, type: 'Panorámica', url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&q=80' },
    { id: 2, type: 'Periapical', url: 'https://images.unsplash.com/photo-1576091160550-217359f4268a?w=400&q=80' }
  ]);

  const currentItems = category === 'photos' ? photos : xrays;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newItem = {
        id: Date.now(),
        type: category === 'photos' ? 'Nueva Foto' : 'Nueva Placa',
        url
      };

      if (category === 'photos') {
        setPhotos([...photos, newItem]);
      } else {
        setXrays([...xrays, newItem]);
      }
    }
  };

  const removeHandle = (id: number) => {
    if (category === 'photos') {
      setPhotos(photos.filter(p => p.id !== id));
    } else {
      setXrays(xrays.filter(x => x.id !== id));
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleFileChange}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${category === 'photos' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: 1, fontSize: '0.8rem' }}
          onClick={() => setCategory('photos')}
        >
          Fotos Clínicas
        </button>
        <button 
          className={`btn ${category === 'xrays' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ flex: 1, fontSize: '0.8rem' }}
          onClick={() => setCategory('xrays')}
        >
          Radiografías
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '1.1rem' }}>{category === 'photos' ? 'Galería de Casos' : 'Archivo Radiográfico'}</h3>
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
          {currentItems.map(p => (
            <div key={p.id} className="card glass" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
              <img src={p.url} alt={p.type} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
              <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-delivery" style={{ fontSize: '0.6rem' }}>{p.type}</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn" style={{ padding: '0.2rem', color: 'var(--primary)' }}><Share2 size={14} /></button>
                  <button className="btn" style={{ padding: '0.2rem', color: 'var(--error)' }} onClick={() => removeHandle(p.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          <div 
            className="card glass" 
            style={{ height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderStyle: 'dashed', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
             {category === 'photos' ? <Camera size={24} color="var(--primary)" /> : <FileSearch size={24} color="var(--primary)" />}
             <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargar {category === 'photos' ? 'Foto' : 'Placa'}</span>
          </div>
        </div>
      ) : (
        <div className="card glass" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'var(--primary)' }}>
            <img src={currentItems[0].url} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
            <img src={currentItems[1].url} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
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
