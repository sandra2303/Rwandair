import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { flightAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const fmt = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const duration = (dep, arr) => { const d = (new Date(arr) - new Date(dep)) / 60000; return `${Math.floor(d/60)}h ${d%60}m`; };

const FlightCard = ({ flight, cabin, onSelect, selected }) => (
  <div style={{ ...s.card, ...(selected ? s.cardSelected : {}) }} onClick={() => onSelect(flight)}>
    {selected && <div style={s.selectedBadge}>Selected</div>}
    <div style={s.cardTop}>
      <div style={s.route}>
        <div style={s.timeBlock}>
          <div style={s.time}>{fmt(flight.departure_time)}</div>
          <div style={s.code}>{flight.origin_code}</div>
          <div style={s.city}>{flight.origin_city}</div>
        </div>
        <div style={s.mid}>
          <div style={s.dur}>{duration(flight.departure_time, flight.arrival_time)}</div>
          <div style={s.line}><div style={s.lineBar}/><span style={s.plane}>--&gt;</span><div style={s.lineBar}/></div>
          <div style={s.direct}>Direct</div>
        </div>
        <div style={s.timeBlock}>
          <div style={s.time}>{fmt(flight.arrival_time)}</div>
          <div style={s.code}>{flight.dest_code}</div>
          <div style={s.city}>{flight.dest_city}</div>
        </div>
      </div>
      <div style={s.priceBlock}>
        <div style={s.price}>${flight[cabin + '_price']}</div>
        <div style={s.perPerson}>per person</div>
        <div style={{ ...s.seats, color: flight['available_' + cabin + '_seats'] < 10 ? '#e31837' : '#28a745' }}>
          {flight['available_' + cabin + '_seats']} seats left
        </div>
      </div>
    </div>
    <div style={s.cardBottom}>
      <span style={s.tag}>Flight {flight.flight_number}</span>
      <span style={s.tag}>{flight.aircraft_model}</span>
      <span style={s.tag}>{fmtDate(flight.departure_time)}</span>
    </div>
  </div>
);

const Flights = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [results, setResults] = useState({ outbound: [], return: [] });
  const [loading, setLoading] = useState(true);
  const [outbound, setOutbound] = useState(null);
  const [ret, setRet] = useState(null);
  const [sort, setSort] = useState('time');

  const cabin = searchParams.get('cabin_class') || 'economy';
  const tripType = searchParams.get('trip_type') || 'one-way';
  const pax = parseInt(searchParams.get('passengers') || 1);

  useEffect(() => {
    setLoading(true);
    flightAPI.search(Object.fromEntries(searchParams.entries()))
      .then(r => setResults(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  const sorted = (flights) => [...flights].sort((a, b) => {
    if (sort === 'price') return a[cabin + '_price'] - b[cabin + '_price'];
    return new Date(a.departure_time) - new Date(b.departure_time);
  });

  const total = outbound ? (parseFloat(outbound[cabin + '_price']) + (ret ? parseFloat(ret[cabin + '_price']) : 0)) * pax : 0;

  const handleBook = () => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/book', { state: { flight: outbound, returnFlight: ret, cabinClass: cabin, tripType, passengers: pax } });
  };

  if (loading) return <div style={s.loading}>Searching flights...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>{searchParams.get('origin')} to {searchParams.get('destination')}</h2>
          <p style={s.sub}>{results.outbound.length} flights found | {cabin} class | {pax} passenger(s)</p>
        </div>
        <button onClick={() => navigate(-1)} style={s.backBtn}>Modify Search</button>
      </div>

      <div style={s.sortBar}>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>Sort by:</span>
        {[['time','Departure Time'],['price','Price']].map(([v,l]) => (
          <button key={v} onClick={() => setSort(v)} style={{ ...s.sortBtn, ...(sort === v ? s.sortActive : {}) }}>{l}</button>
        ))}
      </div>

      <h3 style={s.sectionTitle}>Outbound Flights</h3>
      {results.outbound.length === 0 ? (
        <div style={s.empty}>No flights found for this route and date.</div>
      ) : sorted(results.outbound).map(f => (
        <FlightCard key={f.id} flight={f} cabin={cabin} onSelect={setOutbound} selected={outbound?.id === f.id} />
      ))}

      {tripType === 'round-trip' && results.return.length > 0 && (
        <>
          <h3 style={s.sectionTitle}>Return Flights</h3>
          {sorted(results.return).map(f => (
            <FlightCard key={f.id} flight={f} cabin={cabin} onSelect={setRet} selected={ret?.id === f.id} />
          ))}
        </>
      )}

      {outbound && (
        <div style={s.bookBar}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{outbound.origin_code} to {outbound.dest_code} {ret ? '+ Return' : ''}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{pax} passenger(s) | {cabin}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffd700' }}>${total.toFixed(2)}</span>
            <button onClick={handleBook} style={s.bookBtn}>Continue to Book</button>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '960px', margin: '0 auto', padding: '2rem', paddingBottom: '6rem' },
  loading: { textAlign: 'center', padding: '6rem', color: '#666', fontSize: '1.2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  sub: { color: '#666', marginTop: '0.4rem', fontSize: '0.9rem' },
  backBtn: { background: 'transparent', border: '1px solid #003580', color: '#003580', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' },
  sortBar: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  sortBtn: { padding: '0.4rem 1rem', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', background: '#fff', fontSize: '0.85rem' },
  sortActive: { background: '#003580', color: '#fff', border: '1px solid #003580' },
  sectionTitle: { color: '#003580', borderBottom: '2px solid #003580', paddingBottom: '0.5rem', marginBottom: '1rem' },
  empty: { textAlign: 'center', padding: '3rem', background: '#f5f5f5', borderRadius: '12px', color: '#666' },
  card: { background: '#fff', border: '2px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', cursor: 'pointer', position: 'relative' },
  cardSelected: { border: '2px solid #003580', background: '#f8faff', boxShadow: '0 4px 20px rgba(0,53,128,0.15)' },
  selectedBadge: { position: 'absolute', top: '1rem', right: '1rem', background: '#003580', color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  route: { display: 'flex', alignItems: 'center', gap: '2rem' },
  timeBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  time: { fontSize: '1.6rem', fontWeight: 'bold', color: '#003580' },
  code: { fontSize: '1rem', fontWeight: '700', color: '#333' },
  city: { fontSize: '0.75rem', color: '#888' },
  mid: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' },
  dur: { fontSize: '0.85rem', color: '#555', marginBottom: '0.25rem' },
  line: { display: 'flex', alignItems: 'center', width: '100%', gap: '0.25rem' },
  lineBar: { flex: 1, height: '2px', background: '#003580' },
  plane: { color: '#003580', fontSize: '0.9rem' },
  direct: { fontSize: '0.75rem', color: '#28a745', marginTop: '0.25rem' },
  priceBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  price: { fontSize: '2rem', fontWeight: 'bold', color: '#e31837' },
  perPerson: { fontSize: '0.8rem', color: '#888' },
  seats: { fontSize: '0.8rem', fontWeight: '600', marginTop: '0.25rem' },
  cardBottom: { display: 'flex', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' },
  tag: { background: '#f0f4ff', color: '#003580', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem' },
  bookBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#003580', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 20px rgba(0,0,0,0.2)' },
  bookBtn: { background: '#e31837', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};

export default Flights;
