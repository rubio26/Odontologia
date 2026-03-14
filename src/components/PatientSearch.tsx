import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User } from 'lucide-react';

export const PatientSearch = ({ onSelect }: { onSelect: (p: any) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const search = async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .or(`full_name.ilike.%${query}%,document_id.ilike.%${query}%`)
        .limit(5);
      setResults(data || []);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="patient-search">
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '10px', top: '12px', color: '#94A3B8' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar por Nombre o Cédula..." 
          className="card"
          style={{ width: '100%', paddingLeft: '2.5rem', height: '45px', border: '1px solid var(--border)' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        {results.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => onSelect(p)}>
            <div style={{ background: '#E0F2FE', padding: '0.5rem', borderRadius: '50%' }}>
              <User size={20} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontWeight: 600 }}>{p.full_name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CI: {p.document_id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
