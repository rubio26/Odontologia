import { useState, useEffect, useRef } from 'react';
import { Camera, Maximize2, Share2, MousePointer2, FileSearch, Trash2, Loader2, ChevronLeft, ChevronRight, X, Layout } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PhotoGallery = ({ patientId, profile }: { patientId: string, profile: any }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  
  // Modal / Carousel State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewerCategory, setViewerCategory] = useState<'photos' | 'xrays' | null>(null);
  
  // Comparison State
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonIndex, setComparisonIndex] = useState<number | null>(null);

  // Touch Swipe Handling
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, [patientId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, viewerCategory, media]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_images')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMedia(data);
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photos' | 'xrays') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patientId}/${type}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('patient-media')
        .getPublicUrl(fileName);

      const { data, error: dbError } = await supabase
        .from('patient_images')
        .insert({
          patient_id: patientId,
          doctor_id: profile.id,
          url: publicUrl,
          category: type,
          type: type === 'photos' ? 'Foto Clínica' : 'Radiografía'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setMedia([...media, data]);
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Error en la carga.');
    } finally {
      setUploading(null);
      if (e.target) e.target.value = '';
    }
  };

  const removeHandle = async (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      const pathParts = url.split('patient-media/');
      if (pathParts.length > 1) {
        await supabase.storage.from('patient-media').remove([pathParts[1]]);
      }

      await supabase.from('patient_images').delete().eq('id', id);
      setMedia(media.filter(m => m.id !== id));
      if (selectedIndex !== null) closeViewer();
    } catch (err) {
      console.error('Error removing:', err);
    }
  };

  const openViewer = (index: number, category: 'photos' | 'xrays') => {
    const categoryMedia = media.filter(m => m.category === category);
    const globalMediaItem = categoryMedia[index];
    const globalIndex = media.findIndex(m => m.id === globalMediaItem.id);
    
    setSelectedIndex(globalIndex);
    setViewerCategory(category);
    setIsComparing(false);
    setComparisonIndex(null);
  };

  const closeViewer = () => {
    setSelectedIndex(null);
    setViewerCategory(null);
    setIsComparing(false);
    setComparisonIndex(null);
  };

  const navigate = (direction: number) => {
    if (selectedIndex === null || !viewerCategory) return;
    
    const categoryItems = media.filter(m => m.category === viewerCategory);
    const currentInCategoryIndex = categoryItems.findIndex(m => m.id === media[selectedIndex].id);
    
    let nextIndex = currentInCategoryIndex + direction;
    if (nextIndex < 0) nextIndex = categoryItems.length - 1;
    if (nextIndex >= categoryItems.length) nextIndex = 0;
    
    const nextGlobalIndex = media.findIndex(m => m.id === categoryItems[nextIndex].id);
    setSelectedIndex(nextGlobalIndex);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  const photos = media.filter(m => m.category === 'photos');
  const xrays = media.filter(m => m.category === 'xrays');

  const renderSection = (title: string, items: any[], type: 'photos' | 'xrays', icon: any) => (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-gold)' }}>
          {icon} {title} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({items.length})</span>
        </h3>
        <label className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', borderRadius: '8px' }}>
          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => handleUpload(e, type)} disabled={!!uploading} />
          {uploading === type ? 'Cargando...' : '+ Agregar'}
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
        {items.map((item, idx) => (
          <div 
            key={item.id} 
            className="gallery-card glass"
            onClick={() => openViewer(idx, type)}
          >
            <img src={item.url} alt="" />
            <button className="delete-btn" onClick={e => removeHandle(e, item.id, item.url)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Sin registros en esta sección.
          </div>
        )}
      </div>
    </div>
  );

  const viewerItems = viewerCategory ? media.filter(m => m.category === viewerCategory) : [];
  const currentViewerItem = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <div className="photo-gallery" style={{ paddingBottom: '2rem' }}>
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" /></div>
      ) : (
        <>
          {renderSection('Fotos Clínicas', photos, 'photos', <Camera size={18} />)}
          {renderSection('Radiografías y Placas', xrays, 'xrays', <FileSearch size={18} />)}
        </>
      )}

      {/* VIEWER MODAL */}
      {currentViewerItem && (
        <div className="viewer-overlay" onClick={closeViewer}>
          <div className="viewer-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeViewer}><X size={24} /></button>
            
            {/* Header / Actions */}
            <div className="viewer-header">
              <div className="viewer-info">
                <span className="badge badge-gold">{currentViewerItem.type}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  {viewerItems.findIndex(m => m.id === currentViewerItem.id) + 1} / {viewerItems.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button 
                  className={`btn ${isComparing ? 'btn-primary' : 'btn-outline'}`} 
                  onClick={() => setIsComparing(!isComparing)}
                  style={{ gap: '0.4rem', padding: '0.4rem 1rem' }}
                >
                  <Layout size={16} /> {isComparing ? 'Salir Comparación' : 'Comparar'}
                </button>
                <a href={currentViewerItem.url} download target="_blank" className="btn btn-outline" style={{ padding: '0.4rem' }}>
                  <Share2 size={16} />
                </a>
              </div>
            </div>

            {/* Main Stage */}
            <div 
              className="viewer-stage" 
              onTouchStart={handleTouchStart} 
              onTouchEnd={handleTouchEnd}
            >
              {!isComparing ? (
                <>
                  <button className="nav-btn prev" onClick={() => navigate(-1)}><ChevronLeft size={32} /></button>
                  <div className="main-image-container">
                    <img src={currentViewerItem.url} className="main-image" alt="" />
                  </div>
                  <button className="nav-btn next" onClick={() => navigate(1)}><ChevronRight size={32} /></button>
                </>
              ) : (
                <div className="comparison-grid">
                  <div className="compare-pane">
                    <div className="compare-label">ANTES</div>
                    <img src={currentViewerItem.url} alt="Antes" />
                  </div>
                  <div className="compare-pane">
                    <div className="compare-label" style={{ color: 'var(--success)' }}>DESPUÉS</div>
                    {comparisonIndex !== null ? (
                      <img src={media[comparisonIndex].url} alt="Después" />
                    ) : (
                      <div className="select-prompt">
                        <MousePointer2 size={32} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                        <p>Selecciona la foto de abajo para comparar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails Strip */}
            <div className="thumb-strip-container">
              <div className="thumb-strip">
                {viewerItems.map((item) => {
                  const itemGlobalIndex = media.findIndex(m => m.id === item.id);
                  const isSelected = itemGlobalIndex === (isComparing ? comparisonIndex : selectedIndex);
                  return (
                    <div 
                      key={item.id}
                      className={`thumb-item ${isSelected ? 'active' : ''}`}
                      onClick={() => isComparing ? setComparisonIndex(itemGlobalIndex) : setSelectedIndex(itemGlobalIndex)}
                    >
                      <img src={item.url} alt="" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .gallery-card {
           position: relative;
           height: 140px;
           border-radius: 12px;
           overflow: hidden;
           cursor: pointer;
           border: 1px solid rgba(255,255,255,0.05);
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gallery-card:hover {
           transform: scale(1.03);
           border-color: var(--primary);
           box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .gallery-card img {
           width: 100%;
           height: 100%;
           object-fit: cover;
        }
        .gallery-card .delete-btn {
           position: absolute;
           top: 8px;
           right: 8px;
           background: rgba(0,0,0,0.6);
           border: none;
           color: var(--error);
           padding: 4px;
           border-radius: 6px;
           opacity: 0;
           transition: opacity 0.2s;
        }
        .gallery-card:hover .delete-btn {
           opacity: 1;
        }

        /* VIEWER */
        .viewer-overlay {
           position: fixed;
           top: 0; left: 0; right: 0; bottom: 0;
           background: rgba(0,0,0,0.98);
           z-index: 9999;
           display: flex;
           align-items: center;
           justify-content: center;
           backdrop-filter: blur(20px);
        }
        .viewer-content {
           width: 100%;
           height: 100%;
           display: flex;
           flex-direction: column;
           position: relative;
        }
        .close-btn {
           position: absolute;
           top: 20px;
           right: 20px;
           background: none;
           border: none;
           color: white;
           cursor: pointer;
           z-index: 10;
           opacity: 0.6;
        }
        .close-btn:hover { opacity: 1; }

        .viewer-header {
           padding: 1.5rem 2rem;
           display: flex;
           justify-content: space-between;
           align-items: center;
           z-index: 5;
        }
        .viewer-info {
           display: flex;
           align-items: center;
           gap: 1rem;
        }

        .viewer-stage {
           flex: 1;
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 0 4rem;
           position: relative;
           min-height: 0;
        }
        .main-image-container {
           max-width: 100%;
           max-height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
        }
        .main-image {
           max-width: 100%;
           max-height: 70vh;
           border-radius: 8px;
           box-shadow: 0 20px 50px rgba(0,0,0,0.5);
           object-fit: contain;
           animation: zoomIn 0.3s ease;
        }

        .nav-btn {
           background: rgba(255,255,255,0.05);
           border: none;
           color: white;
           padding: 1rem;
           border-radius: 50%;
           cursor: pointer;
           transition: background 0.2s;
           display: flex;
           align-items: center;
           justify-content: center;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.15); }
        .nav-btn.prev { position: absolute; left: 2rem; }
        .nav-btn.next { position: absolute; right: 2rem; }

        /* THUMB STRIP */
        .thumb-strip-container {
           padding: 1.5rem;
           background: rgba(0,0,0,0.3);
           border-top: 1px solid rgba(255,255,255,0.05);
        }
        .thumb-strip {
           display: flex;
           gap: 0.8rem;
           overflow-x: auto;
           padding-bottom: 0.5rem;
           justify-content: center;
        }
        .thumb-strip::-webkit-scrollbar { height: 4px; }
        .thumb-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        
        .thumb-item {
           width: 80px;
           height: 54px;
           flex-shrink: 0;
           border-radius: 6px;
           overflow: hidden;
           cursor: pointer;
           border: 2px solid transparent;
           opacity: 0.4;
           transition: all 0.2s;
        }
        .thumb-item.active {
           opacity: 1;
           border-color: var(--primary);
           transform: translateY(-2px);
        }
        .thumb-item:hover { opacity: 1; }
        .thumb-item img { width: 100%; height: 100%; object-fit: cover; }

        /* COMPARISON */
        .comparison-grid {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 1.5rem;
           width: 100%;
           max-width: 1200px;
           height: 80%;
        }
        .compare-pane {
           position: relative;
           background: rgba(255,255,255,0.02);
           border-radius: 12px;
           overflow: hidden;
           display: flex;
           align-items: center;
           justify-content: center;
           border: 1px solid rgba(255,255,255,0.05);
        }
        .compare-pane img {
           max-width: 100%;
           max-height: 100%;
           object-fit: contain;
        }
        .compare-label {
           position: absolute;
           top: 1rem;
           left: 1rem;
           background: rgba(0,0,0,0.6);
           padding: 0.4rem 1rem;
           border-radius: 6px;
           font-size: 0.7rem;
           font-weight: 700;
           color: var(--primary);
           letter-spacing: 1px;
           border: 1px solid currentColor;
           z-index: 2;
        }
        .select-prompt {
           text-align: center;
           color: var(--text-muted);
           font-size: 0.9rem;
        }

        @keyframes zoomIn {
           from { opacity: 0; transform: scale(0.95); }
           to { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 768px) {
           .viewer-stage { padding: 0 1rem; }
           .nav-btn { display: none; }
           .comparison-grid { grid-template-columns: 1fr; gap: 0.5rem; }
           .compare-pane { height: 180px; }
        }
      `}</style>
    </div>
  );
};
