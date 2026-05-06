import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, flightAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AgentPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [airports, setAirports] = useState([]);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState('bookings');
  const [form, setForm] = useState({ origin: '', destination: '', departure_date: '', cabin_class: 'economy', passengers: 1 });

  useEffect(() => {
    bookingAPI.getAll().then(r => setBookings(r.data));
    flightAPI.getAirports().then(r => setAirports(r.data));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await flightAPI.search(form);
      setResults(data.outbound);
    } catch { toast.error('Search failed'); }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>Travel Agent Portal</h2>
        <span style={s.badge}>Agent: {user?.first_name} {user?.last_name}</span>
      </div>

      <div style={s.tabs}>
        {['bookings','search'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
            {t === 'bookings' ? 'All Bookings' : 'Search and Book'}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Search Flights for Client</h3>
          <form onSubmit={handleSearch} style={s.searchForm}>
            <select value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} style={s.input} required>
              <option value="">From</option>{airports.map(a => <option key={a.id} value={a.code}>{a.city} ({a.code})</option>)}
            </select>
            <select value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} style={s.input} required>
              <option value="">To</option>{airports.map(a => <option key={a.id} value={a.code}>{a.city} ({a.code})</option>)}
            </select>
            <input type="date" value={form.departure_date} onChange={e => setForm(p => ({ ...p, departure_date: e.target.value }))} style={s.input} required />
            <select value={form.cabin_class} onChange={e => setForm(p => ({ ...p, cabin_class: e.target.value }))} style={s.input}>
              <option value="economy">Economy</option><option value="business">Business</option><option value="first">First</option>
            </select>
            <input type="number" min="1" max="9" value={form.passengers} onChange={e => setForm(p => ({ ...p, passengers: e.target.value }))} style={s.input} />
            <button type="submit" style={s.searchBtn}>Search</button>
          </form>
          {results.map(f => (
            <div key={f.id} style={s.flightCard}>
              <div style={s.flightInfo}>
                <strong>{f.flight_number}</strong>
                <span>{f.origin_code} to {f.dest_code}</span>
                <span>{new Date(f.departure_time).toLocaleString()}</span>
                <span style={{ color: '#e31837', fontWeight: 'bold' }}>${f[form.cabin_class + '_price']}/person</span>
                <span>{f['available_' + form.cabin_class + '_seats']} seats</span>
              </div>
              <button onClick={() => navigate('/book', { state: { flight: f, cabinClass: form.cabin_class, tripType: 'one-way', passengers: parseInt(form.passengers) } })} style={s.bookBtn}>
                Book for Client
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'bookings' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>All Bookings ({bookings.length})</h3>
          <table style={s.table}>
            <thead><tr style={s.thead}>{['Reference','Passenger','Route','Flight','Amount','Payment','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={s.tr}>
                  <td style={s.td}><strong style={{ color: '#6f42c1' }}>{b.booking_reference}</strong></td>
                  <td style={s.td}>{b.first_name} {b.last_name}</td>
                  <td style={s.td}>{b.origin_code} to {b.dest_code}</td>
                  <td style={s.td}>{b.flight_number}</td>
                  <td style={s.td}>${b.total_amount}</td>
                  <td style={s.td}><span style={{ ...s.badge2, background: b.payment_status === 'paid' ? '#28a745' : '#ffc107' }}>{b.payment_status}</span></td>
                  <td style={s.td}><span style={{ ...s.badge2, background: b.status === 'confirmed' ? '#28a745' : b.status === 'cancelled' ? '#dc3545' : '#ffc107' }}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#6f42c1', fontSize: '1.8rem', margin: 0 },
  badge: { background: '#6f42c1', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' },
  tab: { padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: '#666', borderBottom: '3px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#6f42c1', fontWeight: 'bold', borderBottom: '3px solid #6f42c1' },
  section: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { color: '#6f42c1', marginBottom: '1.5rem' },
  searchForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' },
  input: { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', width: '100%' },
  searchBtn: { padding: '0.75rem', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  flightCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '0.75rem' },
  flightInfo: { display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.9rem' },
  bookBtn: { background: '#6f42c1', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  thead: { background: '#6f42c1' },
  th: { color: '#fff', padding: '0.75rem', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.75rem', color: '#333' },
  badge2: { color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'capitalize' },
};

export default AgentPortal;
