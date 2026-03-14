import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, CreditCard, ChevronRight } from 'lucide-react';

export const PatientSearch = ({ onSelect }: { onSelect: (patient: any) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        const { data } = await supabase
          .from('patients')
          .select('*')
          .or(`full_name.ilike.%${query}%,document_id.ilike.%${query}%`)
          .limit(5);
        setResults(data || []);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
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
          <div className="card glass" style={{ textAlign: 'center', borderStyle: 'dashed' }}>
             <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No se encontraron pacientes.</p>
             <button className="btn btn-primary">
               <UserPlus size={18} /> Crear Nuevo Expediente
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
