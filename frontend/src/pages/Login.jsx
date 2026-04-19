import { useState } from 'react';
import api from '../api';
import { User, Mail, Lock, UserPlus, LogIn, Shield, GraduationCap, ArrowRight } from 'lucide-react';

const Login = ({ setUser }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorObj(null);
    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const payload = isSignup ? { name, email, password, role } : { email, password };
      
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      setErrorObj(err.response?.data?.error || (isSignup ? 'Signup failed.' : 'Login failed. Check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setErrorObj(null);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 40%), radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.05), transparent 40%)',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', margin: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: 50, height: 50, borderRadius: '12px', background: 'var(--accent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
          }}>
            {isSignup ? <UserPlus color="white" size={24} /> : <LogIn color="white" size={24} />}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isSignup ? 'Join UniSync to manage and participate in hackathons.' : 'Log in to access your personalised portal.'}
          </p>
        </div>
        
        {errorObj && (
          <div className="mb-4 p-3 text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.85rem', animation: 'shake 0.4s ease' }}>
            {errorObj}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex-col gap-4">
          {isSignup && (
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  required
                  placeholder="John Doe"
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="email"
                required
                placeholder="student@unisync.ai"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          {isSignup && (
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Join As</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div 
                  onClick={() => setRole('student')}
                  style={{ 
                    padding: '0.75rem', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                    borderColor: role === 'student' ? 'var(--accent)' : '#334155',
                    background: role === 'student' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                  }}
                >
                  <GraduationCap size={16} color={role === 'student' ? 'var(--accent)' : '#64748b'} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: role === 'student' ? '#fff' : '#94a3b8' }}>Student</span>
                </div>
                <div 
                  onClick={() => setRole('admin')}
                  style={{ 
                    padding: '0.75rem', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                    borderColor: role === 'admin' ? 'var(--success)' : '#334155',
                    background: role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                  }}
                >
                  <Shield size={16} color={role === 'admin' ? 'var(--success)' : '#64748b'} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: role === 'admin' ? '#fff' : '#94a3b8' }}>Admin</span>
                </div>
              </div>
            </div>
          )}
          
          <button type="submit" className="btn mt-2 justify-center" disabled={loading} style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
            {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
            <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={toggleMode} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {!isSignup && (
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Demo Accounts</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'left' }}>
              <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #1e293b' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>🎓 Students</span><br/>
                student[1-3]@unisync.ai<br/>
                <span style={{ color: '#475569' }}>Pass: demo123</span>
              </div>
              <div style={{ background: '#0f172a', padding: '0.6rem', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #1e293b' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>🛡️ Admins</span><br/>
                admin[1-2]@unisync.ai<br/>
                <span style={{ color: '#475569' }}>Pass: admin123</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
