import { useState, useEffect } from 'react';
import { Camera, Grid, Maximize2, Share2, MousePointer2, FileSearch, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PhotoGallery = ({ patientId, profile }: { patientId: string, profile: any }) => {
  const [view, setView] = useState<'grid' | 'compare'>('grid');
  const [filter, setFilter] = useState<'all' | 'photos' | 'xrays'>('all');
  const [uploadType, setUploadType] = useState<'photos' | 'xrays'>('photos');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [patientId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_images')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', profile.id);

      if (error) throw error;
      if (data) {
        setMedia(data);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Subir al Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${uploadType}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('patient-media')
        .getPublicUrl(fileName);

      // 3. Guardar en la tabla
      const { data, error: dbError } = await supabase
        .from('patient_images')
        .insert({
          patient_id: patientId,
          doctor_id: profile.id,
          url: publicUrl,
          category: uploadType,
          type: uploadType === 'photos' ? 'Nueva Foto' : 'Nueva Placa'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setMedia([...media, data]);
      setView('grid'); // Asegurar vista de cuadrícula
      alert('Imagen guardada exitosamente en el historial del paciente.');
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Error en la carga. Verifica que el bucket "patient-media" existe y tiene permisos públicos.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeHandle = async (id: string, url: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;

    try {
      // Intentar extraer el path relativo del URL para borrar del storage
      // Formato esperado: .../public/patient-media/patientId/category/filename.ext
      const pathParts = url.split('patient-media/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('patient-media').remove([filePath]);
      }

      const { error } = await supabase
        .from('patient_images')
        .delete()
        .eq('id', id)
        .eq('doctor_id', profile.id);

      if (error) throw error;

      setMedia(media.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error removing:', err);
    }
  };

  const currentItems = filter === 'all' ? media : media.filter(m => m.category === filter);

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ marginTop: '1rem' }}>

      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Todo el Contenido' },
          { id: 'photos', label: 'Fotos Clínicas' },
          { id: 'xrays', label: 'Radiografías' }
        ].map(f => (
          <button 
            key={f.id}
            className={`btn ${filter === f.id ? 'btn-primary' : 'btn-outline'}`} 
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem', borderRadius: '20px' }}
            onClick={() => setFilter(f.id as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontSize: '1.1rem' }}>Soportes de Diagnóstico</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="toggle-upload glass" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '2px' }}>
             <button 
                className={`btn ${uploadType === 'photos' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem', minWidth: '40px' }}
                onClick={() => setUploadType('photos')}
             >Foto</button>
             <button 
                className={`btn ${uploadType === 'xrays' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem', minWidth: '40px' }}
                onClick={() => setUploadType('xrays')}
             >Placa</button>
          </div>
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
            <div key={p.id} className="card glass image-grid-card" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
              <div 
                className="image-overlay-trigger"
                onClick={() => setSelectedImageUrl(p.url)}
                title="Click para pantalla completa"
              >
                <Maximize2 size={24} color="white" className="maximize-icon" />
              </div>
              <img src={p.url} alt={p.type} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }}>
                <span className="badge badge-delivery" style={{ fontSize: '0.6rem' }}>{p.type}</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    className="btn" 
                    style={{ padding: '0.2rem', color: 'var(--primary)' }}
                    onClick={() => setSelectedImageUrl(p.url)}
                  >
                    <Maximize2 size={14} />
                  </button>
                  <button className="btn" style={{ padding: '0.2rem', color: 'var(--error)' }} onClick={() => removeHandle(p.id, p.url)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}

          <label 
            className="card glass" 
            style={{ 
              height: '150px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem', 
              borderStyle: 'dashed', 
              cursor: uploading ? 'wait' : 'pointer',
              borderColor: 'var(--primary)',
              opacity: uploading ? 0.7 : 1
            }}
          >
            <input 
              type="file" 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
            ) : (
              uploadType === 'photos' ? <Camera size={24} color="var(--primary)" /> : <FileSearch size={24} color="var(--primary)" />
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {uploading ? 'Cargando...' : `Subir Nuevo (${uploadType === 'photos' ? 'Foto' : 'Radiografía'})`}
            </span>
          </label>
        </div>
      ) : (
        <div className="card glass" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'var(--primary)' }}>
            {currentItems.length >= 2 ? (
              <>
                <img src={currentItems[0].url} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                <img src={currentItems[1].url} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
              </>
            ) : (
              <div style={{ gridColumn: 'span 2', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Se necesitan al menos 2 imágenes para comparar.
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
            <button className="btn btn-primary" style={{ padding: '0.5rem' }}>
              <MousePointer2 size={18} /> Señalar Hallazgos
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARA PANTALLA COMPLETA */}
      {selectedImageUrl && (
        <div 
          className="fullscreen-modal"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImageUrl} alt="Pantalla completa" />
            <div className="modal-actions">
               <button className="btn btn-primary" onClick={() => setSelectedImageUrl(null)}>Cerrar</button>
               <a href={selectedImageUrl} download target="_blank" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={16} /> Abrir Original
               </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .image-grid-card {
           cursor: pointer;
           transition: transform 0.2s ease;
        }
        .image-grid-card:hover {
           transform: translateY(-2px);
        }
        .image-overlay-trigger {
           position: absolute;
           top: 0; left: 0; right: 0; bottom: 44px;
           background: rgba(0,0,0,0);
           display: flex;
           align-items: center;
           justify-content: center;
           z-index: 2;
           transition: background 0.2s ease;
        }
        .image-overlay-trigger:hover {
           background: rgba(0,0,0,0.4);
        }
        .maximize-icon {
           opacity: 0;
           transform: scale(0.8);
           transition: all 0.2s ease;
        }
        .image-overlay-trigger:hover .maximize-icon {
           opacity: 1;
           transform: scale(1);
        }
        
        /* MODAL STYLES */
        .fullscreen-modal {
           position: fixed;
           top: 0; left: 0; right: 0; bottom: 0;
           background: rgba(0,0,0,0.95);
           z-index: 10000;
           display: flex;
           align-items: center;
           justify-content: center;
           backdrop-filter: blur(10px);
           animation: fadeIn 0.3s ease;
        }
        .modal-content {
           max-width: 95vw;
           max-height: 95vh;
           display: flex;
           flex-direction: column;
           gap: 1.5rem;
           align-items: center;
        }
        .modal-content img {
           max-width: 100%;
           max-height: 80vh;
           border-radius: 12px;
           box-shadow: 0 0 50px rgba(212,175,55,0.2);
           border: 1px solid rgba(255,255,255,0.1);
        }
        .modal-actions {
           display: flex;
           gap: 1rem;
        }
        @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
