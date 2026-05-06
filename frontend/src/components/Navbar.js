import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };
  const active = (path) => location.pathname === path ? styles.linkActive : {};

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>RwandAir</Link>
      <div style={styles.links}>
        <Link to="/" style={{ ...styles.link, ...active('/') }}>Home</Link>
        <Link to="/flights" style={{ ...styles.link, ...active('/flights') }}>Flights</Link>
        {isAuthenticated && <Link to="/bookings" style={{ ...styles.link, ...active('/bookings') }}>My Bookings</Link>}
        {user?.role === 'admin' && <Link to="/admin" style={{ ...styles.link, ...active('/admin') }}>Admin</Link>}
        {(user?.role === 'agent' || user?.role === 'admin') && (
          <>
            <Link to="/agent" style={{ ...styles.link, ...active('/agent') }}>Agent Portal</Link>
            <Link to="/validate" style={{ ...styles.link, ...active('/validate') }}>Validate Ticket</Link>
          </>
        )}
      </div>
      <div style={styles.right}>
        {isAuthenticated ? (
          <div style={styles.userMenu}>
            <button onClick={() => setOpen(!open)} style={styles.userBtn}>
              <div style={styles.avatar}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
              <span>{user?.first_name}</span>
              <span style={{ fontSize: '0.7rem' }}>{open ? 'v' : '>'}</span>
            </button>
            {open && (
              <div style={styles.dropdown}>
                <div style={styles.dropHeader}>
                  <strong>{user?.first_name} {user?.last_name}</strong>
                  <span style={{ ...styles.roleBadge, background: user?.role === 'admin' ? '#003580' : user?.role === 'agent' ? '#6f42c1' : '#17a2b8' }}>{user?.role}</span>
                </div>
                <Link to="/profile" onClick={() => setOpen(false)} style={styles.dropItem}>My Profile</Link>
                <Link to="/bookings" onClick={() => setOpen(false)} style={styles.dropItem}>My Bookings</Link>
                {user?.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)} style={styles.dropItem}>Admin Dashboard</Link>}
                <div style={styles.dropDivider} />
                <button onClick={handleLogout} style={styles.dropLogout}>Sign Out</button>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.authBtns}>
            <Link to="/login" style={styles.loginBtn}>Sign In</Link>
            <Link to="/register" style={styles.registerBtn}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', height: '64px', background: '#003580', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
  brand: { color: '#fff', textDecoration: 'none', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '1px' },
  links: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  link: { color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.9rem' },
  linkActive: { background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: '600' },
  right: { display: 'flex', alignItems: 'center' },
  authBtns: { display: 'flex', gap: '0.75rem' },
  loginBtn: { color: '#fff', textDecoration: 'none', padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.9rem' },
  registerBtn: { background: '#e31837', color: '#fff', textDecoration: 'none', padding: '0.4rem 1.25rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600' },
  userMenu: { position: 'relative' },
  userBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#e31837', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' },
  dropdown: { position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', minWidth: '220px', overflow: 'hidden', zIndex: 300 },
  dropHeader: { padding: '1rem', background: '#f8faff', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  roleBadge: { color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', textTransform: 'capitalize' },
  dropItem: { display: 'block', padding: '0.75rem 1rem', color: '#333', textDecoration: 'none', fontSize: '0.9rem' },
  dropDivider: { height: '1px', background: '#e0e0e0' },
  dropLogout: { display: 'block', width: '100%', padding: '0.75rem 1rem', color: '#dc3545', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem' },
};

export default Navbar;
