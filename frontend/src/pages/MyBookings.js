import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { toast } from 'react-toastify';

const statusColor = { confirmed: '#28a745', pending: '#ffc107', cancelled: '#dc3545', completed: '#17a2b8' };

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    bookingAPI.getMyBookings().then(r => setBookings(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    if (!reason) { toast.error('Please select a reason'); return; }
    try {
      await bookingAPI.cancel(cancelModal.id);
      setBookings(bookings.map(b => b.id === cancelModal.id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
      setCancelModal(null);
      setReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return <div style={s.loading}>Loading bookings...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>My Bookings</h2>
        <span style={s.count}>{bookings.length} total</span>
      </div>

      <div style={s.filters}>
        {['all','confirmed','pending','cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? bookings.length : bookings.filter(b => b.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <p>No bookings found.</p>
          <Link to="/" style={s.emptyBtn}>Search Flights</Link>
        </div>
      ) : filtered.map(b => (
        <div key={b.id} style={{ ...s.card, borderLeft: `4px solid ${statusColor[b.status] || '#666'}` }}>
          <div style={s.cardHeader}>
            <div style={s.cardHeaderLeft}>
              <span style={s.ref}>{b.booking_reference}</span>
              <span style={{ ...s.badge, background: statusColor[b.status] || '#666' }}>{b.status}</span>
              <span style={{ ...s.badge, background: b.payment_status === 'paid' ? '#28a745' : '#ffc107' }}>{b.payment_status}</span>
              {b.checked_in && <span style={{ ...s.badge, background: '#17a2b8' }}>Checked In</span>}
            </div>
            <span style={s.amount}>${b.total_amount}</span>
          </div>
          <div style={s.routeBox}>
            <div style={s.routeItem}><div style={s.airportCode}>{b.origin_code}</div><div style={s.airportCity}>{b.origin_city}</div></div>
            <div style={s.routeMid}><div style={s.flightNum}>{b.flight_number}</div><div style={s.routeLine}>----&gt;</div><div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'capitalize' }}>{b.trip_type}</div></div>
            <div style={s.routeItem}><div style={s.airportCode}>{b.dest_code}</div><div style={s.airportCity}>{b.dest_city}</div></div>
          </div>
          <div style={s.details}>
            <span>Departure: {new Date(b.departure_time).toLocaleString()}</span>
            <span>Class: {b.cabin_class}</span>
            <span>Passengers: {b.total_passengers}</span>
            <span>Booked: {new Date(b.created_at).toLocaleDateString()}</span>
          </div>
          <div style={s.actions}>
            <Link to={'/bookings/' + b.id} style={s.viewBtn}>View Details</Link>
            {b.payment_status === 'paid' && <Link to={'/tickets/' + b.id} style={s.ticketBtn}>View Ticket</Link>}
            {b.payment_status === 'paid' && !b.checked_in && b.status === 'confirmed' && <Link to={'/checkin/' + b.id} style={s.checkinBtn}>Check In</Link>}
            {b.status === 'pending' && b.payment_status === 'unpaid' && <Link to="/payment" state={{ booking: b, currency: b.currency }} style={s.payBtn}>Pay Now</Link>}
            {['pending','confirmed'].includes(b.status) && <button onClick={() => setCancelModal(b)} style={s.cancelBtn}>Cancel</button>}
          </div>
        </div>
      ))}

      {cancelModal && (
        <div style={s.overlay} onClick={() => setCancelModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>Cancel Booking</h3>
            <div style={s.modalInfo}>
              <p>Booking: <strong>{cancelModal.booking_reference}</strong></p>
              <p>Route: <strong>{cancelModal.origin_code} to {cancelModal.dest_code}</strong></p>
              <p>Amount: <strong>${cancelModal.total_amount}</strong></p>
            </div>
            <div style={s.warning}>This action cannot be undone. Refund policy applies.</div>
            <div style={s.field}>
              <label style={s.label}>Reason for cancellation *</label>
              <select value={reason} onChange={e => setReason(e.target.value)} style={s.input}>
                <option value="">Select reason</option>
                <option value="flight_postponed">Flight postponed / schedule change</option>
                <option value="personal">Personal reasons</option>
                <option value="medical">Medical emergency</option>
                <option value="visa_issue">Visa issue</option>
                <option value="duplicate">Duplicate booking</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setCancelModal(null)} style={s.keepBtn}>Keep Booking</button>
              <button onClick={handleCancel} style={s.confirmCancelBtn}>Confirm Cancellation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  count: { background: '#003580', color: '#fff', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.9rem' },
  filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.5rem 1.25rem', border: '1.5px solid #ddd', borderRadius: '20px', cursor: 'pointer', background: '#fff', color: '#555', fontSize: '0.9rem' },
  filterActive: { background: '#003580', color: '#fff', border: '1.5px solid #003580' },
  empty: { textAlign: 'center', padding: '4rem', background: '#f5f5f5', borderRadius: '12px' },
  emptyBtn: { display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.5rem', background: '#003580', color: '#fff', textDecoration: 'none', borderRadius: '8px' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  ref: { fontWeight: 'bold', fontSize: '1.1rem', color: '#003580', letterSpacing: '2px' },
  badge: { color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', textTransform: 'capitalize' },
  amount: { fontSize: '1.4rem', fontWeight: 'bold', color: '#e31837' },
  routeBox: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: '#f8faff', borderRadius: '10px', marginBottom: '1.25rem' },
  routeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' },
  airportCode: { fontSize: '1.8rem', fontWeight: 'bold', color: '#003580' },
  airportCity: { fontSize: '0.75rem', color: '#888', marginTop: '0.2rem' },
  routeMid: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  flightNum: { fontSize: '0.8rem', color: '#003580', fontWeight: 'bold', marginBottom: '0.25rem' },
  routeLine: { color: '#003580', fontSize: '1.2rem' },
  details: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.9rem', color: '#555' },
  actions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  viewBtn: { padding: '0.5rem 1.25rem', background: '#003580', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '0.9rem' },
  ticketBtn: { padding: '0.5rem 1.25rem', background: '#6f42c1', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '0.9rem' },
  checkinBtn: { padding: '0.5rem 1.25rem', background: '#17a2b8', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '0.9rem' },
  payBtn: { padding: '0.5rem 1.25rem', background: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '0.9rem' },
  cancelBtn: { padding: '0.5rem 1.25rem', background: 'transparent', color: '#dc3545', border: '1.5px solid #dc3545', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px' },
  modalInfo: { background: '#f8f9fa', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.8 },
  warning: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#856404' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontWeight: '600', color: '#333', fontSize: '0.9rem', marginBottom: '0.4rem' },
  input: { width: '100%', padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' },
  keepBtn: { flex: 1, padding: '0.75rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  confirmCancelBtn: { flex: 1, padding: '0.75rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
};

export default MyBookings;
