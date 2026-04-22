import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LogIn, UserPlus, Sparkles, Loader2, Mail, Lock, User, IdCard, Gift, Heart } from 'lucide-react';

interface AuthProps {
  onSession: () => void;
}

export const Auth = ({ onSession }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Separate for registration
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        let loginEmail = identifier;
        
        // If it's not an email, try to find the email associated with the username
        if (!identifier.includes('@')) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', identifier)
            .single();
          
          if (profileError || !profileData) {
            throw new Error('Usuario no encontrado.');
          }
          loginEmail = profileData.email;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password
        });
        if (error) throw error;
        onSession();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              document_id: documentId,
              preferred_name: preferredName,
              birth_date: birthDate,
              username: username
            }
          }
        });
        if (error) throw error;
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('VENTA_AUTH_ERROR_FULL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Por favor ingresa tu correo o usuario.');
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      let resetEmail = identifier;
      if (!identifier.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier)
          .single();
        
        if (profileError || !profileData) {
          throw new Error('Usuario no encontrado.');
        }
        resetEmail = profileData.email;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      
      if (error) throw error;
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('RESET_PASSWORD_ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card glass" style={{ textAlign: 'center' }}>
          <div className="logo-section">
            <Sparkles className="sparkle-icon" color="var(--primary)" size={48} />
            <h1>Lumini</h1>
            <p className="subtitle">Dental Studio</p>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>¡Registro Exitoso!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Tu solicitud ha sido enviada al equipo administrador. 
              Te notificaremos una vez que tu acceso sea aprobado.
            </p>
            <button className="btn btn-primary w-full" onClick={() => { setSuccess(false); setIsLogin(true); }}>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resetEmailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card glass" style={{ textAlign: 'center' }}>
          <div className="logo-section">
            <Sparkles className="sparkle-icon" color="var(--primary)" size={48} />
            <h1>Lumini</h1>
            <p className="subtitle">Recuperar Contraseña</p>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>¡Correo Enviado!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Hemos enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada o spam.
            </p>
            <button className="btn btn-primary w-full" onClick={() => { setResetEmailSent(false); setIsForgotPassword(false); }}>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card glass">
          <div className="logo-section">
            <Sparkles className="sparkle-icon" color="var(--primary)" size={48} />
            <h1>Lumini</h1>
            <p className="subtitle">Recuperar Contraseña</p>
          </div>

          <form onSubmit={handleForgotPassword} className="auth-form">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Ingresa tu correo o usuario y te enviaremos un enlace para recuperar tu contraseña.
            </p>
            <div className="input-group">
              <Mail size={18} />
              <input 
                type="text" 
                placeholder="Email o Usuario" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required 
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Mail size={18} /> Enviar Enlace</>}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              ¿Recordaste tu contraseña?{' '}
              <button onClick={() => { setIsForgotPassword(false); setError(null); }}>
                Vuelve al inicio de sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="logo-section">
          <Sparkles className="sparkle-icon" color="var(--primary)" size={48} />
          <h1>Lumini</h1>
          <p className="subtitle">Dental Studio</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {isLogin ? 'Bienvenido de Nuevo' : 'Únete a Lumini'}
          </h2>

          {!isLogin ? (
            <>
              <div className="input-group">
                <User size={18} />
                <input 
                  type="text" 
                  placeholder="Nombre Completo" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group">
                <Heart size={18} />
                <input 
                  type="text" 
                  placeholder="¿Cómo te gustaría ser referido?" 
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  required 
                />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <UserPlus size={18} />
                  <input 
                    type="text" 
                    placeholder="Usuario" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                </div>
                <div className="input-group">
                  <IdCard size={18} />
                  <input 
                    type="text" 
                    placeholder="Documento" 
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="input-group">
                <Gift size={18} />
                <input 
                  type="date" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required 
                />
              </div>
              <div className="input-group">
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="Correo Electrónico" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </>
          ) : (
            <div className="input-group">
              <Mail size={18} />
              <input 
                type="text" 
                placeholder="Email o Usuario" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required 
              />
            </div>
          )}


          <div className="input-group">
            <Lock size={18} />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Crear Cuenta</>)}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin && (
            <p style={{ marginBottom: '0.5rem' }}>
              ¿Olvidaste tu contraseña?{' '}
              <button onClick={() => { setIsForgotPassword(true); setError(null); }}>
                Recupérala aquí
              </button>
            </p>
          )}
          <p>
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }}>
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
