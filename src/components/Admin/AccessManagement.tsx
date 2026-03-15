import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCheck, UserX, Clock, ShieldAlert } from 'lucide-react';

export const AccessManagement = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) {
      setPendingUsers(data);
    }
    setLoading(false);
  };

  const handleAction = async (userId: string, status: 'approved' | 'rejected') => {
    setProcessingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    }
    setProcessingId(null);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando solicitudes...</div>;

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>Gestión de Accesos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aprueba o rechaza solicitudes de nuevos usuarios.</p>
      </header>

      {pendingUsers.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
          <Clock size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <p>No hay solicitudes pendientes en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingUsers.map(user => (
            <div key={user.id} className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>{user.full_name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-white)' }}>
                  <strong>ID:</strong> {user.document_id} | <strong>Ref:</strong> {user.preferred_name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Solicitado el {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                  onClick={() => handleAction(user.id, 'rejected')}
                  disabled={!!processingId}
                >
                  <UserX size={18} />
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem' }}
                  onClick={() => handleAction(user.id, 'approved')}
                  disabled={!!processingId}
                >
                  <UserCheck size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem', borderStyle: 'dashed', borderColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert color="var(--warning)" />
          <div style={{ fontSize: '0.8rem' }}>
            <p style={{ fontWeight: 700 }}>Seguridad Lumina</p>
            <p style={{ color: 'var(--text-muted)' }}>Solo usuarios aprobados pueden visualizar datos sensibles de la clínica.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
