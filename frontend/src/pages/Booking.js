import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const empty = { first_name: '', last_name: '', date_of_birth: '', passport_number: '', nationality: '', meal_preference: 'standard' };

const Booking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [passengers, setPassengers] = useState(
    Array.from({ length: state?.passengers || 1 }, (_, i) =>
      i === 0 ? { ...empty, first_name: user?.first_name || '', last_name: user?.last_name || '', passport_number: user?.passport_number || '', nationality: user?.nationality || '' } : { ...empty }
    )
  );
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  if (!state?.flight) { navigate('/flights'); return null; }
  const { flight, returnFlight, cabinClass, tripType } = state;
  const pricePerPerson = parseFloat(flight[cabinClass + '_price']);
  const returnPrice = returnFlight ? parseFloat(returnFlight[cabinClass + '_price']) : 0;
  const total = (pricePerPerson + returnPrice) * passengers.length;

  const update = (i, field, value) => setPassengers(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await bookingAPI.create({ flight_id: flight.id, return_flight_id: returnFlight?.id, trip_type: tripType, cabin_class: cabinClass, passengers, currency });
      toast.success('Booking created! Proceed to payment.');
      navigate('/payment', { state: { booking: data.booking, currency } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.layout}>
        <div style={s.main}>
          <h2 style={s.title}>Passenger Details</h2>
          <form onSubmit={handleSubmit} id="bookForm">
            {passengers.map((p, i) => (
              <div key={i} style={s.pCard}>
                <h3 style={s.pTitle}>Passenger {i + 1} {i === 0 && <span style={s.primaryBadge}>Primary</span>}</h3>
                <div style={s.grid}>
                  {[['first_name','First Name','text'],['last_name','Last Name','text'],['passport_number','Passport Number','text'],['nationality','Nationality','text'],['date_of_birth','Date of Birth','date']].map(([field, label, type]) => (
                    <div key={field} style={s.field}>
                      <label style={s.label}>{label} *</label>
                      <input type={type} value={p[field]} onChange={e => update(i, field, e.target.value)} style={s.input} required />
                    </div>
                  ))}
                  <div style={s.field}>
                    <label style={s.label}>Meal Preference</label>
                    <select value={p.meal_preference} onChange={e => update(i, 'meal_preference', e.target.value)} style={s.input}>
                      <option value="standard">Standard</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="halal">Halal</option>
                      <option value="kosher">Kosher</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <div style={s.currencyCard}>
              <h3 style={s.pTitle}>Payment Currency</h3>
              <div style={s.currencyBtns}>
                {['USD','EUR','RWF'].map(c => (
                  <button key={c} type="button" onClick={() => setCurrency(c)}
                    style={{ ...s.currBtn, ...(currency === c ? s.currBtnActive : {}) }}>{c}</button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div style={s.sidebar}>
          <div style={s.summaryCard}>
            <h3 style={s.summaryTitle}>Flight Summary</h3>
            <div style={s.summaryRoute}>
              <span style={s.summaryCode}>{flight.origin_code}</span>
              <span style={{ color: '#003580', flex: 1, textAlign: 'center' }}>----&gt;</span>
              <span style={s.summaryCode}>{flight.dest_code}</span>
            </div>
            <div style={s.summaryDetail}>{flight.flight_number} | {new Date(flight.departure_time).toLocaleDateString()}</div>
            {returnFlight && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #ddd' }}>
                <div style={s.summaryRoute}>
                  <span style={s.summaryCode}>{returnFlight.origin_code}</span>
                  <span style={{ color: '#003580', flex: 1, textAlign: 'center' }}>----&gt;</span>
                  <span style={s.summaryCode}>{returnFlight.dest_code}</span>
                </div>
                <div style={s.summaryDetail}>{returnFlight.flight_number} | Return</div>
              </div>
            )}
            <div style={s.divider} />
            {[['Class', cabinClass],['Passengers', passengers.length],['Price/person', '$' + pricePerPerson]].map(([l,v]) => (
              <div key={l} style={s.summaryRow}><span style={{ color: '#888' }}>{l}</span><span style={{ textTransform: 'capitalize' }}>{v}</span></div>
            ))}
            <div style={s.divider} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
              <span>Total</span><span style={{ color: '#e31837', fontSize: '1.3rem' }}>{currency} {total.toFixed(2)}</span>
            </div>
          </div>
          <button type="submit" form="bookForm" disabled={loading} style={s.submitBtn}>
            {loading ? 'Processing...' : 'Proceed to Payment - $' + total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

const s = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' },
  main: {},
  title: { color: '#003580', fontSize: '1.5rem', marginBottom: '1.5rem' },
  pCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  pTitle: { color: '#003580', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  primaryBadge: { background: '#003580', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'normal' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontWeight: '600', color: '#444', fontSize: '0.85rem' },
  input: { padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', width: '100%' },
  currencyCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem' },
  currencyBtns: { display: 'flex', gap: '1rem', marginTop: '0.75rem' },
  currBtn: { flex: 1, padding: '0.75rem', border: '2px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: '#fff', fontWeight: '600' },
  currBtnActive: { border: '2px solid #003580', background: '#f0f4ff', color: '#003580' },
  sidebar: { position: 'sticky', top: '80px' },
  summaryCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' },
  summaryTitle: { color: '#003580', marginBottom: '1.25rem' },
  summaryRoute: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' },
  summaryCode: { fontSize: '1.3rem', fontWeight: 'bold', color: '#003580' },
  summaryDetail: { fontSize: '0.85rem', color: '#666' },
  divider: { height: '1px', background: '#e0e0e0', margin: '1rem 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0' },
  submitBtn: { width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#e31837,#c0142d)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};

export default Booking;
