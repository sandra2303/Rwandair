import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError(''); // clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(form);
      toast.success('Welcome back, ' + data.user.first_name + '!');
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'agent') navigate('/agent');
      else navigate('/');
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const msg = err.response?.data?.message || 'Invalid credentials';

      if (msg === 'Invalid credentials') {
        setError('Incorrect email or password. Please check your credentials and try again.');
      } else if (msg.includes('inactive')) {
        setError('Your account has been deactivated. Please contact support.');
      } else {
        setError(msg);
      }

      // Shake the form after 3 failed attempts
      if (newAttempts >= 3) {
        setError('Too many failed attempts. Please use "Forgot Password?" to reset your password.');
      }
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>RwandAir</div>
          <h2 style={s.title}>Welcome Back</h2>
          <p style={s.sub}>Sign in to your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={s.errorAlert}>
            <span style={s.errorIcon}>!</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={{ ...s.input, borderColor: error ? '#dc3545' : '#ddd' }}
              placeholder="you@example.com"
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                style={{ ...s.input, paddingRight: '3rem', borderColor: error ? '#dc3545' : '#ddd' }}
                placeholder="Password"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={s.demo}>
          <p style={s.demoTitle}>Quick Demo Login:</p>
          <div style={s.demoBtns}>
            <button onClick={() => { setForm({ email: 'admin@rwandair.com', password: 'Admin@2024' }); setError(''); }} style={s.demoBtn}>Admin</button>
            <button onClick={() => { setForm({ email: 'agent@rwandair.com', password: 'Agent@2024' }); setError(''); }} style={s.demoBtn}>Agent</button>
            <button onClick={() => { setForm({ email: 'john@example.com', password: 'Pass@2024' }); setError(''); }} style={s.demoBtn}>Passenger</button>
          </div>
        </div>

        <p style={s.footer}>
          No account? <Link to="/register" style={s.link}>Register</Link>
          {' | '}
          <Link to="/forgot-password" style={s.link}>Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#003580,#0066cc)', padding: '2rem' },
  card: { background: '#fff', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '2rem', fontWeight: '800', color: '#003580', marginBottom: '0.5rem' },
  title: { color: '#003580', fontSize: '1.5rem', margin: 0 },
  sub: { color: '#888', fontSize: '0.9rem', marginTop: '0.25rem' },
  errorAlert: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff5f5', border: '1.5px solid #dc3545', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#dc3545', fontSize: '0.9rem', lineHeight: 1.5 },
  errorIcon: { background: '#dc3545', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0, marginTop: '0.1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: '600', color: '#333', fontSize: '0.85rem' },
  input: { padding: '0.8rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '1rem', width: '100%', boxSizing: 'border-box', outline: 'none' },
  eyeBtn: { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#003580', fontSize: '0.8rem' },
  btn: { padding: '0.9rem', background: 'linear-gradient(135deg,#003580,#0066cc)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  demo: { background: '#f8faff', borderRadius: '10px', padding: '1rem', marginTop: '1.5rem' },
  demoTitle: { fontWeight: '600', color: '#003580', marginBottom: '0.75rem', fontSize: '0.85rem' },
  demoBtns: { display: 'flex', gap: '0.5rem' },
  demoBtn: { flex: 1, padding: '0.4rem', background: '#fff', border: '1px solid #003580', color: '#003580', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' },
  link: { color: '#003580', fontWeight: 'bold' },
};

export default Login;
