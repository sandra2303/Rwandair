import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingAPI, ticketAPI } from '../services/api';
import { toast } from 'react-toastify';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingAPI.getById(id).then(r => setBooking(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      const r = await bookingAPI.getById(id);
      setBooking(r.data);
      toast.success('Booking cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div style={s.loading}>Loading...</div>;
  if (!booking) return <div style={s.loading}>Booking not found</div>;

  const dep = new Date(booking.departure_time);
  const arr = new Date(booking.arrival_time);
  const isPaid = booking.payment_status === 'paid';

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <div style={s.refRow}>
            <h2 style={s.ref}>{booking.booking_reference}</h2>
            <span style={{ ...s.badge, background: booking.status === 'confirmed' ? '#28a745' : booking.status === 'cancelled' ? '#dc3545' : '#ffc107' }}>{booking.status}</span>
            <span style={{ ...s.badge, background: isPaid ? '#28a745' : '#ffc107' }}>{booking.payment_status}</span>
            {booking.checked_in && <span style={{ ...s.badge, background: '#17a2b8' }}>Checked In</span>}
          </div>
          <p style={{ opacity: 0.8, fontSize: '0.85rem', margin: 0 }}>Booked on {new Date(booking.created_at).toLocaleDateString()}</p>
        </div>
        <div style={s.totalAmount}>${booking.total_amount} <span style={{ fontSize: '1rem', opacity: 0.8 }}>{booking.currency}</span></div>
      </div>

      {isPaid && (
        <div style={s.actionBar}>
          <button onClick={() => navigate('/tickets/' + booking.id)} style={s.actionBtn}>View Boarding Pass</button>
          {!booking.checked_in && booking.status === 'confirmed' && (
            <button onClick={() => navigate('/checkin/' + booking.id)} style={{ ...s.actionBtn, background: '#28a745' }}>Online Check-In</button>
          )}
        </div>
      )}
      {!isPaid && booking.status !== 'cancelled' && (
        <div style={s.actionBar}>
          <Link to="/payment" state={{ booking, currency: booking.currency }} style={{ ...s.actionBtn, textDecoration: 'none', display: 'inline-block' }}>Complete Payment</Link>
        </div>
      )}

      <div style={s.card}>
        <h3 style={s.cardTitle}>Flight Details</h3>
        <div style={s.flightRoute}>
          <div style={s.airport}>
            <div style={s.airportCode}>{booking.origin_code}</div>
            <div style={s.airportName}>{booking.origin_name}</div>
            <div style={s.flightTime}>{dep.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            <div style={s.flightDate}>{dep.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
          </div>
          <div style={s.flightMid}>
            <div style={{ fontSize: '0.85rem', color: '#003580', fontWeight: 'bold' }}>{booking.flight_number}</div>
            <div style={{ color: '#003580', fontSize: '1.5rem', margin: '0.25rem 0' }}>----&gt;</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>{booking.aircraft_model}</div>
          </div>
          <div style={s.airport}>
            <div style={s.airportCode}>{booking.dest_code}</div>
            <div style={s.airportName}>{booking.dest_name}</div>
            <div style={s.flightTime}>{arr.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            <div style={s.flightDate}>{arr.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
          </div>
        </div>
        <div style={s.flightMeta}>
          {[['Class',booking.cabin_class],['Trip',booking.trip_type],['Passengers',booking.total_passengers],['Flight Status',booking.flight_status]].map(([l,v]) => (
            <div key={l} style={s.metaItem}><span style={s.metaLabel}>{l}</span><span style={{ textTransform: 'capitalize' }}>{v}</span></div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Passengers</h3>
        {booking.passengers?.map((p, i) => (
          <div key={i} style={s.pCard}>
            <div style={s.pHeader}>
              <div>
                <span style={s.pName}>{p.first_name} {p.last_name}</span>
                {p.is_primary && <span style={s.primaryBadge}>Primary</span>}
                {p.checked_in && <span style={{ ...s.primaryBadge, background: '#28a745' }}>Checked In</span>}
              </div>
              <span style={s.seatBadge}>Seat: {p.seat_number}</span>
            </div>
            <div style={s.pInfo}>
              {[['Passport',p.passport_number],['Nationality',p.nationality],['DOB',p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '-'],['Meal',p.meal_preference],['Baggage',(p.baggage_kg||23)+(p.extra_baggage_kg||0)+'kg']].map(([l,v]) => (
                <div key={l} style={s.infoItem}><span style={s.infoLabel}>{l}</span><span style={{ textTransform: 'capitalize' }}>{v}</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Payment</h3>
        {booking.payment ? (
          <div style={s.payGrid}>
            {[['Method',booking.payment.payment_method],['Status',booking.payment.status],['Amount',booking.payment.currency+' '+booking.payment.amount],['Paid At',booking.payment.paid_at ? new Date(booking.payment.paid_at).toLocaleString() : '-']].map(([l,v]) => (
              <div key={l} style={s.infoItem}><span style={s.infoLabel}>{l}</span><span style={{ textTransform: 'capitalize', color: l==='Status'&&v==='completed'?'#28a745':'#333' }}>{v}</span></div>
            ))}
          </div>
        ) : <p style={{ color: '#ffc107' }}>Payment not completed</p>}
      </div>

      {['pending','confirmed'].includes(booking.status) && (
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleCancel} style={s.cancelBtn}>Cancel Booking</button>
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(135deg,#003580,#0055b3)', color: '#fff', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.5rem' },
  refRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' },
  ref: { fontSize: '2rem', margin: 0, letterSpacing: '3px', fontFamily: 'monospace' },
  badge: { color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', textTransform: 'capitalize' },
  totalAmount: { fontSize: '2rem', fontWeight: 'bold', color: '#ffd700' },
  actionBar: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  actionBtn: { padding: '0.75rem 1.5rem', background: '#003580', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' },
  card: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { color: '#003580', marginBottom: '1.25rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '0.75rem' },
  flightRoute: { display: 'flex', alignItems: 'center', marginBottom: '1.25rem' },
  airport: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  airportCode: { fontSize: '2.5rem', fontWeight: 'bold', color: '#003580' },
  airportName: { fontSize: '0.75rem', color: '#888', textAlign: 'center', maxWidth: '120px' },
  flightTime: { fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginTop: '0.4rem' },
  flightDate: { fontSize: '0.75rem', color: '#888' },
  flightMid: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  flightMeta: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  metaLabel: { fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  pCard: { background: '#f8faff', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid #e8eeff' },
  pHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  pName: { fontWeight: 'bold', color: '#003580', fontSize: '1rem' },
  primaryBadge: { background: '#003580', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '0.5rem' },
  seatBadge: { background: '#e31837', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '8px', fontWeight: 'bold' },
  pInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  infoLabel: { fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  payGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem' },
  cancelBtn: { padding: '0.75rem 1.5rem', background: 'transparent', color: '#dc3545', border: '1.5px solid #dc3545', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
};

export default BookingDetail;
