import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordAPI } from '../services/api';
import { toast } from 'react-toastify';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await passwordAPI.forgot(email);
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>RwandAir</div>
          <h2 style={s.title}>Forgot Password</h2>
          <p style={s.sub}>Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <div style={s.success}>
            <div style={s.successIcon}>✓</div>
            <h3>Email Sent!</h3>
            <p>Check your inbox for the password reset link. It expires in 1 hour.</p>
            <Link to="/login" style={s.backBtn}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={s.input} placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading} style={s.btn}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            <Link to="/login" style={s.link}>Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const token = new URLSearchParams(window.location.search).get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await passwordAPI.reset(token, form.password);
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>RwandAir</div>
          <h2 style={s.title}>Reset Password</h2>
        </div>
        {done ? (
          <div style={s.success}>
            <div style={s.successIcon}>✓</div>
            <h3>Password Reset!</h3>
            <p>Your password has been reset successfully.</p>
            <Link to="/login" style={s.backBtn}>Login Now</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>New Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={s.input} placeholder="Min 8 characters" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} style={s.input} placeholder="Repeat password" required />
            </div>
            <button type="submit" disabled={loading} style={s.btn}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export const ChangePassword = () => {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await passwordAPI.change(form.current_password, form.new_password);
      toast.success('Password changed successfully!');
      setForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.section}>
      <h3 style={s.sectionTitle}>Change Password</h3>
      <form onSubmit={handleSubmit} style={s.form}>
        {[['current_password','Current Password'],['new_password','New Password'],['confirm','Confirm New Password']].map(([field, label]) => (
          <div key={field} style={s.field}>
            <label style={s.label}>{label}</label>
            <input type="password" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} style={s.input} required />
          </div>
        ))}
        <button type="submit" disabled={loading} style={s.btn}>{loading ? 'Changing...' : 'Change Password'}</button>
      </form>
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
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: '600', color: '#333', fontSize: '0.85rem' },
  input: { padding: '0.8rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
  btn: { padding: '0.9rem', background: 'linear-gradient(135deg,#003580,#0066cc)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  link: { textAlign: 'center', color: '#003580', textDecoration: 'none', fontSize: '0.9rem' },
  success: { textAlign: 'center', padding: '1rem' },
  successIcon: { width: '60px', height: '60px', borderRadius: '50%', background: '#28a745', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1rem' },
  backBtn: { display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.5rem', background: '#003580', color: '#fff', textDecoration: 'none', borderRadius: '8px' },
  section: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' },
  sectionTitle: { color: '#003580', marginBottom: '1.25rem' },
};

export default ForgotPassword;
