import { useState, useEffect } from 'react';
import { Camera, Grid, Maximize2, Share2, MousePointer2, FileSearch, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PhotoGallery = ({ patientId, profile }: { patientId: string, profile: any }) => {
  const [view, setView] = useState<'grid' | 'compare'>('grid');
  const [category, setCategory] = useState<'photos' | 'xrays'>('photos');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [xrays, setXrays] = useState<any[]>([]);

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
        setPhotos(data.filter(i => i.category === 'photos'));
        setXrays(data.filter(i => i.category === 'xrays'));
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
      const fileName = `${patientId}/${category}/${Date.now()}.${fileExt}`;
      
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
          category,
          type: category === 'photos' ? 'Nueva Foto' : 'Nueva Placa'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (category === 'photos') {
        setPhotos([...photos, data]);
      } else {
        setXrays([...xrays, data]);
      }
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Error al cargar la imagen. Asegúrate de que el bucket "patient-media" existe en tu Supabase.');
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

      if (category === 'photos') {
        setPhotos(photos.filter(p => p.id !== id));
      } else {
        setXrays(xrays.filter(x => x.id !== id));
      }
    } catch (err) {
      console.error('Error removing:', err);
    }
  };

  const currentItems = category === 'photos' ? photos : xrays;

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ marginTop: '1rem' }}>

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
              category === 'photos' ? <Camera size={24} color="var(--primary)" /> : <FileSearch size={24} color="var(--primary)" />
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {uploading ? 'Cargando...' : `Cargar ${category === 'photos' ? 'Foto' : 'Placa'}`}
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
    </div>
  );
};
