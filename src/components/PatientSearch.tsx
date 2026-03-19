import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, CreditCard, ChevronRight, X, Smartphone, User, IdCard, Briefcase, MapPin, Loader2, Save } from 'lucide-react';

export const PatientSearch = ({ onSelect }: { onSelect: (patient: any) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    document_id: '',
    phone: '',
    profession: '',
    address: ''
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([newPatient])
        .select()
        .single();

      if (error) throw error;
      
      setIsAdding(false);
      setNewPatient({ full_name: '', document_id: '', phone: '', profession: '', address: '' });
      if (data) onSelect(data);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      let queryBuilder = supabase
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true });

      if (query.length > 0) {
        queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,document_id.ilike.%${query}%`);
      }

      const { data } = await queryBuilder.limit(50);
      setResults(data || []);
      setLoading(false);
    };

    if (query === '') {
      fetchPatients();
    } else {
      const timer = setTimeout(fetchPatients, 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Buscar por Nombre o Cédula..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="card glass"
            style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', fontSize: '1rem', color: 'white', border: '1px solid var(--border-luxury)' }}
          />
          <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} color="var(--primary)" size={22} />
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0 1.2rem', height: 'auto' }}
          onClick={() => setIsAdding(true)}
          title="Nuevo Paciente"
        >
          <UserPlus size={22} />
        </button>
      </div>

      {isAdding && (
        <div className="fixed-center">
          <form onSubmit={handleCreatePatient} className="auth-card glass" style={{ width: '90%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Nuevo Expediente</h3>
              <button type="button" className="btn glass" style={{ padding: '0.4rem' }} onClick={() => setIsAdding(false)}><X size={20} /></button>
            </div>
            
            <div className="input-group">
              <User size={18} />
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                value={newPatient.full_name}
                onChange={e => setNewPatient({...newPatient, full_name: e.target.value})}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <Smartphone size={18} />
                <input 
                  type="text" 
                  placeholder="Teléfono" 
                  value={newPatient.phone}
                  onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                  required
                />
              </div>
              <div className="input-group">
                <IdCard size={18} />
                <input 
                  type="text" 
                  placeholder="Cédula / ID" 
                  value={newPatient.document_id}
                  onChange={e => setNewPatient({...newPatient, document_id: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <Briefcase size={18} />
                <input 
                  type="text" 
                  placeholder="Profesión" 
                  value={newPatient.profession}
                  onChange={e => setNewPatient({...newPatient, profession: e.target.value})}
                />
              </div>
              <div className="input-group">
                <MapPin size={18} />
                <input 
                  type="text" 
                  placeholder="Dirección" 
                  value={newPatient.address}
                  onChange={e => setNewPatient({...newPatient, address: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ marginTop: '1rem' }}>
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Crear Paciente</>}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((p) => (
          <div 
            key={p.id} 
            className="card glass" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1.2rem',
              cursor: 'pointer'
            }}
            onClick={() => onSelect(p)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard color="var(--primary)" size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{p.full_name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cédula: {p.document_id}</p>
              </div>
            </div>
            <ChevronRight color="var(--primary)" size={20} />
          </div>
        ))}
        {query.length > 1 && results.length === 0 && !loading && (
          <div className="card glass" style={{ textAlign: 'center', borderStyle: 'dashed', padding: '2rem' }}>
             <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No se encontraron pacientes para "{query}".</p>
             <button className="btn btn-primary" onClick={() => {
               setNewPatient({...newPatient, full_name: query});
               setIsAdding(true);
             }}>
               <UserPlus size={18} /> Crear Expediente para "{query}"
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
