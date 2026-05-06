import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, flightAPI, bookingAPI } from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [flights, setFlights] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [airports, setAirports] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [flightForm, setFlightForm] = useState({ flight_number: '', origin_airport_id: '', destination_airport_id: '', aircraft_id: '', departure_time: '', arrival_time: '', economy_price: '', business_price: '', first_class_price: 0, available_economy_seats: '', available_business_seats: '', available_first_class_seats: 0 });

  useEffect(() => {
    Promise.all([adminAPI.getDashboard(), flightAPI.getAll(), adminAPI.getUsers(), flightAPI.getAirports(), flightAPI.getAircraft(), bookingAPI.getAll()])
      .then(([dash, fl, us, ap, ac, bk]) => { setStats(dash.data); setFlights(fl.data); setUsers(us.data); setAirports(ap.data); setAircraft(ac.data); setBookings(bk.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateFlight = async (e) => {
    e.preventDefault();
    try {
      const { data } = await flightAPI.create(flightForm);
      setFlights([data, ...flights]);
      setShowFlightForm(false);
      toast.success('Flight created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await flightAPI.updateStatus(id, status);
      setFlights(flights.map(f => f.id === id ? { ...f, status } : f));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const handleUserStatus = async (id, is_active) => {
    try {
      await adminAPI.updateUserStatus(id, is_active);
      setUsers(users.map(u => u.id === id ? { ...u, is_active } : u));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div style={s.loading}>Loading dashboard...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>Admin Dashboard</h2>
        <span style={s.badge}>RwandAir Control Center</span>
      </div>

      <div style={s.tabs}>
        {['overview','flights','users','bookings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div style={s.statsGrid}>
            {[
              { title: 'Total Bookings', value: stats.bookings.total, sub: stats.bookings.confirmed + ' confirmed', color: '#003580' },
              { title: 'Revenue (USD)', value: '$' + parseFloat(stats.revenue.usd || 0).toFixed(0), sub: 'EUR ' + parseFloat(stats.revenue.eur || 0).toFixed(0), color: '#e31837' },
              { title: 'Total Flights', value: stats.flights.total, sub: stats.flights.scheduled + ' scheduled', color: '#28a745' },
              { title: 'Total Users', value: stats.users.total, sub: stats.users.passengers + ' passengers', color: '#ffc107' },
            ].map((st, i) => (
              <div key={i} style={{ ...s.statCard, borderTop: '4px solid ' + st.color }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: st.color }}>{st.value}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{st.title}</div>
                <div style={{ color: '#999', fontSize: '0.8rem', marginTop: '0.25rem' }}>{st.sub}</div>
              </div>
            ))}
          </div>
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Recent Bookings</h3>
            <table style={s.table}>
              <thead><tr style={s.thead}>{['Reference','Passenger','Route','Flight','Amount','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.recentBookings.map(b => (
                  <tr key={b.booking_reference} style={s.tr}>
                    <td style={s.td}><strong style={{ color: '#003580' }}>{b.booking_reference}</strong></td>
                    <td style={s.td}>{b.first_name} {b.last_name}</td>
                    <td style={s.td}>{b.origin} to {b.destination}</td>
                    <td style={s.td}>{b.flight_number}</td>
                    <td style={s.td}>${b.total_amount}</td>
                    <td style={s.td}><span style={{ ...s.statusBadge, background: b.status === 'confirmed' ? '#28a745' : b.status === 'cancelled' ? '#dc3545' : '#ffc107' }}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'flights' && (
        <div style={s.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={s.sectionTitle}>Flight Management</h3>
            <button onClick={() => setShowFlightForm(!showFlightForm)} style={s.addBtn}>+ Add Flight</button>
          </div>
          {showFlightForm && (
            <form onSubmit={handleCreateFlight} style={s.flightForm}>
              <h4 style={{ color: '#003580', marginBottom: '1rem' }}>New Flight</h4>
              <div style={s.formGrid}>
                <div style={s.field}><label style={s.label}>Flight Number</label><input value={flightForm.flight_number} onChange={e => setFlightForm(p => ({ ...p, flight_number: e.target.value }))} style={s.input} placeholder="WB501" required /></div>
                <div style={s.field}><label style={s.label}>Origin</label>
                  <select value={flightForm.origin_airport_id} onChange={e => setFlightForm(p => ({ ...p, origin_airport_id: e.target.value }))} style={s.input} required>
                    <option value="">Select Airport</option>{airports.map(a => <option key={a.id} value={a.id}>{a.city} ({a.code})</option>)}
                  </select></div>
                <div style={s.field}><label style={s.label}>Destination</label>
                  <select value={flightForm.destination_airport_id} onChange={e => setFlightForm(p => ({ ...p, destination_airport_id: e.target.value }))} style={s.input} required>
                    <option value="">Select Airport</option>{airports.map(a => <option key={a.id} value={a.id}>{a.city} ({a.code})</option>)}
                  </select></div>
                <div style={s.field}><label style={s.label}>Aircraft</label>
                  <select value={flightForm.aircraft_id} onChange={e => setFlightForm(p => ({ ...p, aircraft_id: e.target.value }))} style={s.input} required>
                    <option value="">Select Aircraft</option>{aircraft.map(a => <option key={a.id} value={a.id}>{a.model} ({a.registration})</option>)}
                  </select></div>
                <div style={s.field}><label style={s.label}>Departure</label><input type="datetime-local" value={flightForm.departure_time} onChange={e => setFlightForm(p => ({ ...p, departure_time: e.target.value }))} style={s.input} required /></div>
                <div style={s.field}><label style={s.label}>Arrival</label><input type="datetime-local" value={flightForm.arrival_time} onChange={e => setFlightForm(p => ({ ...p, arrival_time: e.target.value }))} style={s.input} required /></div>
                <div style={s.field}><label style={s.label}>Economy Price ($)</label><input type="number" value={flightForm.economy_price} onChange={e => setFlightForm(p => ({ ...p, economy_price: e.target.value }))} style={s.input} required /></div>
                <div style={s.field}><label style={s.label}>Business Price ($)</label><input type="number" value={flightForm.business_price} onChange={e => setFlightForm(p => ({ ...p, business_price: e.target.value }))} style={s.input} required /></div>
                <div style={s.field}><label style={s.label}>Economy Seats</label><input type="number" value={flightForm.available_economy_seats} onChange={e => setFlightForm(p => ({ ...p, available_economy_seats: e.target.value }))} style={s.input} required /></div>
                <div style={s.field}><label style={s.label}>Business Seats</label><input type="number" value={flightForm.available_business_seats} onChange={e => setFlightForm(p => ({ ...p, available_business_seats: e.target.value }))} style={s.input} required /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={s.addBtn}>Create Flight</button>
                <button type="button" onClick={() => setShowFlightForm(false)} style={s.cancelBtn}>Cancel</button>
              </div>
            </form>
          )}
          <table style={s.table}>
            <thead><tr style={s.thead}>{['Flight','Route','Departure','Economy','Business','Seats','Status','Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {flights.map(f => (
                <tr key={f.id} style={s.tr}>
                  <td style={s.td}><strong>{f.flight_number}</strong></td>
                  <td style={s.td}>{f.origin_code} to {f.dest_code}</td>
                  <td style={s.td}>{new Date(f.departure_time).toLocaleString()}</td>
                  <td style={s.td}>${f.economy_price}</td>
                  <td style={s.td}>${f.business_price}</td>
                  <td style={s.td}>{f.available_economy_seats}E / {f.available_business_seats}B</td>
                  <td style={s.td}><span style={{ ...s.statusBadge, background: f.status === 'scheduled' ? '#28a745' : f.status === 'cancelled' ? '#dc3545' : '#ffc107' }}>{f.status}</span></td>
                  <td style={s.td}>
                    <select onChange={e => handleStatusChange(f.id, e.target.value)} value={f.status} style={{ padding: '0.3rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {['scheduled','boarding','departed','arrived','cancelled','delayed'].map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>User Management</h3>
          <table style={s.table}>
            <thead><tr style={s.thead}>{['Name','Email','Phone','Role','Status','Joined','Action'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>{u.first_name} {u.last_name}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.phone}</td>
                  <td style={s.td}><span style={{ ...s.statusBadge, background: u.role === 'admin' ? '#003580' : u.role === 'agent' ? '#6f42c1' : '#17a2b8' }}>{u.role}</span></td>
                  <td style={s.td}><span style={{ ...s.statusBadge, background: u.is_active ? '#28a745' : '#dc3545' }}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={s.td}>
                    <button onClick={() => handleUserStatus(u.id, !u.is_active)} style={{ ...s.actionBtn, background: u.is_active ? '#dc3545' : '#28a745' }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>All Bookings ({bookings.length})</h3>
          <table style={s.table}>
            <thead><tr style={s.thead}>{['Reference','Passenger','Route','Flight','Class','Amount','Payment','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={s.tr}>
                  <td style={s.td}><strong style={{ color: '#003580' }}>{b.booking_reference}</strong></td>
                  <td style={s.td}>{b.first_name} {b.last_name}</td>
                  <td style={s.td}>{b.origin_code} to {b.dest_code}</td>
                  <td style={s.td}>{b.flight_number}</td>
                  <td style={{ ...s.td, textTransform: 'capitalize' }}>{b.cabin_class}</td>
                  <td style={s.td}>${b.total_amount}</td>
                  <td style={s.td}><span style={{ ...s.statusBadge, background: b.payment_status === 'paid' ? '#28a745' : '#ffc107' }}>{b.payment_status}</span></td>
                  <td style={s.td}><span style={{ ...s.statusBadge, background: b.status === 'confirmed' ? '#28a745' : b.status === 'cancelled' ? '#dc3545' : '#ffc107' }}>{b.status}</span></td>
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
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  badge: { background: '#003580', color: '#fff', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' },
  tab: { padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: '#666', borderBottom: '3px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#003580', fontWeight: 'bold', borderBottom: '3px solid #003580' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  section: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.5rem' },
  sectionTitle: { color: '#003580', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginTop: '1rem' },
  thead: { background: '#003580' },
  th: { color: '#fff', padding: '0.75rem', textAlign: 'left', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.75rem', color: '#333' },
  statusBadge: { color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'capitalize' },
  addBtn: { background: '#003580', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { background: 'transparent', color: '#dc3545', border: '1px solid #dc3545', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer' },
  flightForm: { background: '#f0f4ff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: '600', color: '#333', fontSize: '0.85rem' },
  input: { padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', width: '100%' },
  actionBtn: { color: '#fff', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
};

export default AdminDashboard;
