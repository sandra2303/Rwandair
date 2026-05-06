import React, { useState, useEffect } from 'react';
import { refundAPI } from '../services/api';
import { toast } from 'react-toastify';

const MyRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refundAPI.getMy().then(r => setRefunds(r.data)).catch(() => toast.error('Failed to load refunds')).finally(() => setLoading(false));
  }, []);

  const statusColor = { pending: '#ffc107', approved: '#28a745', rejected: '#dc3545', processed: '#17a2b8' };

  if (loading) return <div style={s.loading}>Loading refunds...</div>;

  return (
    <div style={s.container}>
      <h2 style={s.title}>My Refunds</h2>
      {refunds.length === 0 ? (
        <div style={s.empty}>No refund requests found.</div>
      ) : refunds.map(r => (
        <div key={r.id} style={s.card}>
          <div style={s.cardHeader}>
            <div>
              <span style={s.ref}>{r.booking_reference}</span>
              <span style={{ ...s.badge, background: statusColor[r.status] || '#666' }}>{r.status}</span>
            </div>
            <span style={s.amount}>{r.currency} {r.amount}</span>
          </div>
          <div style={s.details}>
            <span>Reason: {r.reason}</span>
            <span>Requested: {new Date(r.created_at).toLocaleDateString()}</span>
            {r.processed_at && <span>Processed: {new Date(r.processed_at).toLocaleDateString()}</span>}
          </div>
          {r.status === 'pending' && (
            <div style={s.note}>Your refund is being processed. It will appear in your account within 3-5 business days after approval.</div>
          )}
        </div>
      ))}
    </div>
  );
};

const s = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  title: { color: '#003580', fontSize: '1.8rem', marginBottom: '1.5rem' },
  empty: { textAlign: 'center', padding: '3rem', background: '#f5f5f5', borderRadius: '12px', color: '#666' },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  ref: { fontWeight: 'bold', color: '#003580', letterSpacing: '2px', marginRight: '0.75rem' },
  badge: { color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'capitalize' },
  amount: { fontSize: '1.3rem', fontWeight: 'bold', color: '#28a745' },
  details: { display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#555', flexWrap: 'wrap' },
  note: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem', color: '#856404' },
};

export default MyRefunds;
