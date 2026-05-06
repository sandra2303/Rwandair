import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI, bookingAPI } from '../services/api';
import { toast } from 'react-toastify';

const CheckIn = () => {
  const { booking_id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [seatMap, setSeatMap] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    bookingAPI.getById(booking_id).then(r => {
      setBooking(r.data);
      return ticketAPI.getSeats(r.data.flight_id);
    }).then(r => setSeatMap(r.data.seatMap)).catch(err => toast.error(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  }, [booking_id]);

  const handleSeatSelect = (seat) => {
    if (selected.includes(seat)) { setSelected(selected.filter(s => s !== seat)); return; }
    if (selected.length < booking.total_passengers) setSelected([...selected, seat]);
    else toast.warning('Max ' + booking.total_passengers + ' seat(s)');
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      await ticketAPI.checkIn(booking_id, { passenger_ids: booking.passengers.map(p => p.id), seat_selections: selected });
      toast.success('Check-in successful!');
      navigate('/tickets/' + booking_id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={s.loading}>Loading check-in...</div>;
  if (!booking) return <div style={s.loading}>Booking not found</div>;

  const dep = new Date(booking.departure_time);
  const hoursUntil = (dep - new Date()) / 3600000;
  const seats = seatMap?.[booking.cabin_class] || [];
  const cols = booking.cabin_class === 'economy' ? ['A','B','C','D','E','F'] : ['A','B','C','D'];
  const rows = {};
  seats.forEach(s => { const r = s.seat.slice(1,-1); if (!rows[r]) rows[r] = []; rows[r].push(s); });

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>Back</button>
        <h2 style={s.title}>Online Check-In</h2>
      </div>

      <div style={s.flightInfo}>
        <div style={s.flightRoute}>
          <span style={s.flightCode}>{booking.origin_code}</span>
          <span style={{ color: '#003580', flex: 1, textAlign: 'center', fontSize: '1.5rem' }}>----&gt;</span>
          <span style={s.flightCode}>{booking.dest_code}</span>
        </div>
        <div style={s.flightDetails}>
          <span>Flight: {booking.flight_number}</span>
          <span>Date: {dep.toLocaleDateString()}</span>
          <span>Time: {dep.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
          <span>Passengers: {booking.total_passengers}</span>
        </div>
        {hoursUntil > 24 && <div style={s.warning}>Check-in opens 24 hours before departure. Opens at {new Date(dep - 24*3600000).toLocaleString()}</div>}
        {hoursUntil < 1 && hoursUntil > 0 && <div style={s.error}>Check-in is closed (less than 1 hour to departure)</div>}
      </div>

      <div style={s.steps}>
        {['Select Seats','Confirm Check-In'].map((st, i) => (
          <div key={i} style={s.stepItem}>
            <div style={{ ...s.stepCircle, ...(step > i ? s.stepDone : step === i+1 ? s.stepActive : {}) }}>{step > i+1 ? 'OK' : i+1}</div>
            <span style={{ color: step === i+1 ? '#003580' : '#aaa', fontWeight: step === i+1 ? '600' : 'normal' }}>{st}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={s.seatInfo}>
            <p>Select <strong>{booking.passengers?.length}</strong> seat(s) | Selected: <strong>{selected.join(', ') || 'None'}</strong></p>
          </div>
          <div style={s.legend}>
            <span style={s.legendItem}><span style={{ ...s.legendBox, background: '#e8f5e9' }}/> Available</span>
            <span style={s.legendItem}><span style={{ ...s.legendBox, background: '#dc3545' }}/> Taken</span>
            <span style={s.legendItem}><span style={{ ...s.legendBox, background: '#003580' }}/> Selected</span>
          </div>
          <div style={s.seatMap}>
            <div style={s.planeNose}>Front of Aircraft</div>
            <div style={s.colLabels}>
              {cols.slice(0, Math.ceil(cols.length/2)).map(c => <span key={c} style={s.colLabel}>{c}</span>)}
              <span style={{ width: '24px' }}/>
              {cols.slice(Math.ceil(cols.length/2)).map(c => <span key={c} style={s.colLabel}>{c}</span>)}
            </div>
            {Object.entries(rows).map(([row, rowSeats]) => (
              <div key={row} style={s.seatRow}>
                <span style={s.rowNum}>{row}</span>
                <div style={s.rowSeats}>
                  {rowSeats.slice(0, Math.ceil(rowSeats.length/2)).map(seat => (
                    <button key={seat.seat} disabled={!seat.available} onClick={() => handleSeatSelect(seat.seat)}
                      style={{ ...s.seat, background: !seat.available ? '#dc3545' : selected.includes(seat.seat) ? '#003580' : '#e8f5e9', color: !seat.available || selected.includes(seat.seat) ? '#fff' : '#333', cursor: !seat.available ? 'not-allowed' : 'pointer' }}>
                      {seat.seat.slice(-1)}
                    </button>
                  ))}
                  <div style={{ width: '24px' }}/>
                  {rowSeats.slice(Math.ceil(rowSeats.length/2)).map(seat => (
                    <button key={seat.seat} disabled={!seat.available} onClick={() => handleSeatSelect(seat.seat)}
                      style={{ ...s.seat, background: !seat.available ? '#dc3545' : selected.includes(seat.seat) ? '#003580' : '#e8f5e9', color: !seat.available || selected.includes(seat.seat) ? '#fff' : '#333', cursor: !seat.available ? 'not-allowed' : 'pointer' }}>
                      {seat.seat.slice(-1)}
                    </button>
                  ))}
                </div>
                <span style={s.rowNum}>{row}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={selected.length !== booking.passengers?.length}
            style={{ ...s.nextBtn, opacity: selected.length !== booking.passengers?.length ? 0.5 : 1 }}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={s.confirmSection}>
          <h3 style={{ color: '#003580', marginBottom: '1.5rem' }}>Confirm Check-In</h3>
          {booking.passengers?.map((p, i) => (
            <div key={i} style={s.pItem}>
              <div style={{ fontWeight: 'bold', color: '#003580', marginBottom: '0.5rem' }}>{p.first_name} {p.last_name}</div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#555' }}>
                <span>Passport: {p.passport_number}</span>
                <span>Current Seat: {p.seat_number}</span>
                <span style={{ color: '#28a745', fontWeight: 'bold' }}>New Seat: {selected[i]}</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(1)} style={s.backStepBtn}>Change Seats</button>
            <button onClick={handleCheckIn} disabled={submitting} style={s.checkInBtn}>
              {submitting ? 'Processing...' : 'Confirm Check-In'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  backBtn: { background: 'transparent', border: '1px solid #003580', color: '#003580', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' },
  flightInfo: { background: '#f0f4ff', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' },
  flightRoute: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' },
  flightCode: { fontSize: '2rem', fontWeight: 'bold', color: '#003580' },
  flightDetails: { display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#555', flexWrap: 'wrap' },
  warning: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '0.75rem', marginTop: '1rem', fontSize: '0.9rem', color: '#856404' },
  error: { background: '#f8d7da', border: '1px solid #dc3545', borderRadius: '8px', padding: '0.75rem', marginTop: '1rem', fontSize: '0.9rem', color: '#721c24' },
  steps: { display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '2rem', padding: '1rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  stepCircle: { width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' },
  stepActive: { background: '#003580', color: '#fff' },
  stepDone: { background: '#28a745', color: '#fff' },
  seatInfo: { textAlign: 'center', marginBottom: '1rem', color: '#555' },
  legend: { display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1rem', fontSize: '0.85rem' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  legendBox: { width: '16px', height: '16px', borderRadius: '4px', display: 'inline-block' },
  seatMap: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.5rem', overflowX: 'auto' },
  planeNose: { textAlign: 'center', color: '#003580', fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.9rem' },
  colLabels: { display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.5rem' },
  colLabel: { width: '32px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' },
  seatRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.4rem' },
  rowNum: { width: '24px', textAlign: 'center', fontSize: '0.75rem', color: '#999' },
  rowSeats: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  seat: { width: '32px', height: '32px', borderRadius: '6px 6px 4px 4px', border: 'none', fontSize: '0.7rem', fontWeight: 'bold' },
  nextBtn: { display: 'block', width: '100%', padding: '1rem', background: '#003580', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  confirmSection: { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  pItem: { background: '#f8faff', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', border: '1px solid #e0e0e0' },
  backStepBtn: { flex: 1, padding: '0.85rem', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  checkInBtn: { flex: 2, padding: '0.85rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
};

export default CheckIn;
