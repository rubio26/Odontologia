import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCheck, UserX, Clock, ShieldAlert, Users, CheckCircle2, XCircle } from 'lucide-react';

type UserStatus = 'pending' | 'approved' | 'rejected';

export const AccessManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<UserStatus>('pending');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    console.log('Cargando usuarios con filtro:', filter);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error cargando usuarios: ' + error.message);
    } else {
      console.log('Usuarios cargados:', data);
      setUsers(data || []);
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
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
    setProcessingId(null);
  };

  return (
    <div style={{ padding: '1.2rem', paddingBottom: '6rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={28} color="var(--primary)" />
            Gestión de Usuarios
          </div>
          <button 
            onClick={fetchUsers} 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
            disabled={loading}
          >
            {loading ? '...' : 'Recargar'}
          </button>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Administra el acceso y los permisos de los miembros del equipo.
        </p>
      </header>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '0.4rem',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        <button 
          onClick={() => setFilter('pending')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'pending' ? 'var(--primary)' : 'transparent',
            color: filter === 'pending' ? 'white' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} /> Pendientes
        </button>
        <button 
          onClick={() => setFilter('approved')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'approved' ? 'var(--success)' : 'transparent',
            color: filter === 'approved' ? 'white' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <CheckCircle2 size={16} /> Aprobados
        </button>
        <button 
          onClick={() => setFilter('rejected')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'rejected' ? 'var(--error)' : 'transparent',
            color: filter === 'rejected' ? 'white' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            transition: 'all 0.2s'
          }}
        >
          <XCircle size={16} /> Rechazados
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
          {filter === 'pending' ? <Clock size={48} color="var(--primary)" style={{ opacity: 0.3, marginBottom: '1rem' }} /> :
           filter === 'approved' ? <CheckCircle2 size={48} color="var(--success)" style={{ opacity: 0.3, marginBottom: '1rem' }} /> :
           <XCircle size={48} color="var(--error)" style={{ opacity: 0.3, marginBottom: '1rem' }} />}
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron usuarios {
            filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobados' : 'rechazados'
          }.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {users.map(user => (
            <div key={user.id} className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: filter === 'approved' ? 'var(--success)' : filter === 'rejected' ? 'var(--error)' : 'var(--primary)' }}>
                  {user.full_name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-white)' }}>
                  <strong>ID:</strong> {user.document_id || 'N/A'} | <strong>Ref:</strong> {user.preferred_name || 'N/A'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  {user.email} • {filter === 'approved' ? 'Aprobado' : filter === 'rejected' ? 'Rechazado' : 'Solicitado'} el {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {filter !== 'rejected' && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.5rem', borderColor: 'var(--error)', color: 'var(--error)' }}
                    onClick={() => handleAction(user.id, 'rejected')}
                    disabled={!!processingId}
                    title="Rechazar"
                  >
                    <UserX size={18} />
                  </button>
                )}
                {filter !== 'approved' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem' }}
                    onClick={() => handleAction(user.id, 'approved')}
                    disabled={!!processingId}
                    title="Aprobar"
                  >
                    <UserCheck size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem', borderStyle: 'dashed', borderColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert color="var(--warning)" />
          <div style={{ fontSize: '0.8rem' }}>
            <p style={{ fontWeight: 700 }}>Seguridad Lumini</p>
            <p style={{ color: 'var(--text-muted)' }}>Solo usuarios aprobados pueden visualizar datos sensibles de la clínica.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
