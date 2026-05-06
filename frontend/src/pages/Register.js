import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '', phone: '', passport_number: '', nationality: '', date_of_birth: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim()) errs.last_name = 'Required';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const { confirm_password, ...data } = form;
      await register(data);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const inp = (name) => ({ ...s.input, borderColor: errors[name] ? '#dc3545' : '#ddd' });

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>RwandAir</div>
          <h2 style={s.title}>Create Account</h2>
        </div>
        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>First Name *</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} style={inp('first_name')} placeholder="John" />
              {errors.first_name && <span style={s.err}>{errors.first_name}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Last Name *</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} style={inp('last_name')} placeholder="Doe" />
              {errors.last_name && <span style={s.err}>{errors.last_name}</span>}
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} style={inp('email')} placeholder="you@example.com" />
            {errors.email && <span style={s.err}>{errors.email}</span>}
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} style={inp('password')} placeholder="Min 8 chars" />
              {errors.password && <span style={s.err}>{errors.password}</span>}
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirm Password *</label>
              <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} style={inp('confirm_password')} placeholder="Repeat password" />
              {errors.confirm_password && <span style={s.err}>{errors.confirm_password}</span>}
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} style={inp('phone')} placeholder="+250 788 000 000" />
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Passport Number</label>
              <input name="passport_number" value={form.passport_number} onChange={handleChange} style={inp('passport_number')} placeholder="RW123456" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Nationality</label>
              <input name="nationality" value={form.nationality} onChange={handleChange} style={inp('nationality')} placeholder="Rwandan" />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Date of Birth</label>
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} style={inp('date_of_birth')} />
          </div>
          <button type="submit" disabled={loading} style={s.btn}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign In</Link></p>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#003580,#0066cc)', padding: '2rem' },
  card: { background: '#fff', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '2rem', fontWeight: '800', color: '#003580', marginBottom: '0.5rem' },
  title: { color: '#003580', fontSize: '1.5rem', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { fontWeight: '600', color: '#333', fontSize: '0.85rem' },
  input: { padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', width: '100%' },
  err: { color: '#dc3545', fontSize: '0.78rem' },
  btn: { padding: '0.9rem', background: 'linear-gradient(135deg,#003580,#0066cc)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#666' },
  link: { color: '#003580', fontWeight: 'bold' },
};

export default Register;
