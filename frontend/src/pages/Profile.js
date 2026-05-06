import React, { useState, useEffect } from 'react';
import { authAPI, passwordAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', passport_number: '', nationality: '', date_of_birth: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    authAPI.getProfile().then(r => {
      const p = r.data;
      setForm({ first_name: p.first_name || '', last_name: p.last_name || '', phone: p.phone || '', passport_number: p.passport_number || '', nationality: p.nationality || '', date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : '' });
    });
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(form);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await passwordAPI.change(pwForm.current_password, pwForm.new_password);
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.avatar}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
          <div>
            <h2 style={s.name}>{user?.first_name} {user?.last_name}</h2>
            <span style={{ ...s.role, background: user?.role === 'admin' ? '#003580' : user?.role === 'agent' ? '#6f42c1' : '#17a2b8' }}>{user?.role}</span>
          </div>
        </div>

        <div style={s.tabs}>
          {['profile','password'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
              {t === 'profile' ? 'Profile Info' : 'Change Password'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={handleProfileSubmit} style={s.form}>
            <div style={s.grid}>
              {[['first_name','First Name','text'],['last_name','Last Name','text'],['phone','Phone','text'],['passport_number','Passport Number','text'],['nationality','Nationality','text'],['date_of_birth','Date of Birth','date']].map(([name, label, type]) => (
                <div key={name} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input name={name} type={type} value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} style={s.input} />
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading} style={s.btn}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Current Password</label>
              <input type="password" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} style={s.input} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>New Password</label>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} style={s.input} placeholder="Min 8 characters" required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} style={s.input} required />
            </div>
            <button type="submit" disabled={pwLoading} style={s.btn}>{pwLoading ? 'Changing...' : 'Change Password'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

const s = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  header: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' },
  avatar: { width: '70px', height: '70px', borderRadius: '50%', background: '#003580', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' },
  name: { margin: 0, color: '#003580', fontSize: '1.5rem' },
  role: { color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'capitalize' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' },
  tab: { padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: '#666', borderBottom: '3px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#003580', fontWeight: 'bold', borderBottom: '3px solid #003580' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: '600', color: '#333', fontSize: '0.9rem' },
  input: { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', width: '100%' },
  btn: { padding: '0.85rem 2rem', background: '#003580', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' },
};

export default Profile;
