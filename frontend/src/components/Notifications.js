import React, { useState, useEffect } from 'react';
import { enhancedAPI } from '../services/api';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enhancedAPI.getNotifications().then(r => setNotifications(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await enhancedAPI.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  const typeColor = { flight_status: '#ffc107', payment: '#28a745', booking: '#003580', refund: '#17a2b8' };

  if (loading) return <div style={s.loading}>Loading notifications...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>Notifications</h2>
        <span style={s.count}>{notifications.filter(n => !n.is_read).length} unread</span>
      </div>
      {notifications.length === 0 ? (
        <div style={s.empty}>No notifications yet.</div>
      ) : notifications.map(n => (
        <div key={n.id} style={{ ...s.card, background: n.is_read ? '#fff' : '#f0f4ff', borderLeft: `4px solid ${typeColor[n.type] || '#003580'}` }}>
          <div style={s.cardHeader}>
            <div>
              <span style={{ ...s.badge, background: typeColor[n.type] || '#003580' }}>{n.type.replace('_', ' ')}</span>
              <strong style={s.notifTitle}>{n.title}</strong>
            </div>
            <div style={s.cardRight}>
              <span style={s.time}>{new Date(n.created_at).toLocaleString()}</span>
              {!n.is_read && <button onClick={() => handleMarkRead(n.id)} style={s.readBtn}>Mark Read</button>}
            </div>
          </div>
          <p style={s.message}>{n.message}</p>
        </div>
      ))}
    </div>
  );
};

const s = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  count: { background: '#e31837', color: '#fff', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.9rem' },
  empty: { textAlign: 'center', padding: '3rem', background: '#f5f5f5', borderRadius: '12px', color: '#666' },
  card: { borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' },
  badge: { color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', textTransform: 'capitalize', marginRight: '0.5rem' },
  notifTitle: { color: '#333', fontSize: '0.95rem' },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' },
  time: { fontSize: '0.75rem', color: '#888' },
  readBtn: { background: 'transparent', border: '1px solid #003580', color: '#003580', padding: '0.2rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' },
  message: { color: '#555', fontSize: '0.9rem', margin: 0 },
};

export default Notifications;
