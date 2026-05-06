import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flightAPI } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [airports, setAirports] = useState([]);
  const [form, setForm] = useState({ origin: '', destination: '', departure_date: '', return_date: '', cabin_class: 'economy', passengers: 1, trip_type: 'one-way' });

  useEffect(() => { flightAPI.getAirports().then(r => setAirports(r.data)).catch(() => {}); }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSearch = (e) => { e.preventDefault(); navigate('/flights?' + new URLSearchParams(form).toString()); };

  const routes = [
    { from: 'Kigali', to: 'Nairobi', fromCode: 'KGL', toCode: 'NBO', price: '$250', duration: '2h 00m', color: '#e31837' },
    { from: 'Kigali', to: 'London', fromCode: 'KGL', toCode: 'LHR', price: '$850', duration: '9h 00m', color: '#003580' },
    { from: 'Kigali', to: 'Johannesburg', fromCode: 'KGL', toCode: 'JNB', price: '$450', duration: '4h 00m', color: '#28a745' },
    { from: 'Kigali', to: 'Dubai', fromCode: 'KGL', toCode: 'DXB', price: '$350', duration: '3h 00m', color: '#ffc107' },
    { from: 'Kigali', to: 'Brussels', fromCode: 'KGL', toCode: 'BRU', price: '$900', duration: '9h 30m', color: '#6f42c1' },
    { from: 'Kigali', to: 'Entebbe', fromCode: 'KGL', toCode: 'EBB', price: '$150', duration: '1h 00m', color: '#17a2b8' },
  ];

  return (
    <div>
      <div style={s.hero}>
        <div style={s.heroContent}>
          <div style={s.badge}>Rwanda's National Carrier</div>
          <h1 style={s.heroTitle}>Fly with Rwanda's Pride</h1>
          <p style={s.heroSub}>Book flights to 30+ destinations across Africa, Europe and Middle East</p>
          <div style={s.stats}>
            {[['30+','Destinations'],['1M+','Passengers'],['99%','On-Time'],['24/7','Support']].map(([v,l]) => (
              <div key={l} style={s.stat}><span style={s.statVal}>{v}</span><span style={s.statLabel}>{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.searchWrap}>
        <div style={s.searchBox}>
          <div style={s.tripToggle}>
            {['one-way','round-trip'].map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, trip_type: t }))}
                style={{ ...s.tripBtn, ...(form.trip_type === t ? s.tripBtnActive : {}) }}>
                {t === 'one-way' ? 'One Way' : 'Round Trip'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} style={s.form}>
            <div style={s.fg}><label style={s.fl}>From</label>
              <select name="origin" value={form.origin} onChange={handleChange} style={s.input} required>
                <option value="">Select origin</option>
                {airports.map(a => <option key={a.id} value={a.code}>{a.city} ({a.code})</option>)}
              </select>
            </div>
            <div style={s.fg}><label style={s.fl}>To</label>
              <select name="destination" value={form.destination} onChange={handleChange} style={s.input} required>
                <option value="">Select destination</option>
                {airports.map(a => <option key={a.id} value={a.code}>{a.city} ({a.code})</option>)}
              </select>
            </div>
            <div style={s.fg}><label style={s.fl}>Departure</label>
              <input type="date" name="departure_date" value={form.departure_date} onChange={handleChange} style={s.input} required min={new Date().toISOString().split('T')[0]} />
            </div>
            {form.trip_type === 'round-trip' && (
              <div style={s.fg}><label style={s.fl}>Return</label>
                <input type="date" name="return_date" value={form.return_date} onChange={handleChange} style={s.input} min={form.departure_date} />
              </div>
            )}
            <div style={s.fg}><label style={s.fl}>Class</label>
              <select name="cabin_class" value={form.cabin_class} onChange={handleChange} style={s.input}>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
            <div style={s.fg}><label style={s.fl}>Passengers</label>
              <input type="number" name="passengers" min="1" max="9" value={form.passengers} onChange={handleChange} style={s.input} />
            </div>
            <div style={s.fg}><label style={s.fl}>&nbsp;</label>
              <button type="submit" style={s.searchBtn}>Search Flights</button>
            </div>
          </form>
        </div>
      </div>

      <div style={s.features}>
        {[
          { title: '30+ Destinations', desc: 'Africa, Europe, Middle East and beyond', color: '#003580' },
          { title: 'Multi-Currency', desc: 'Pay in RWF, USD, EUR or MTN Mobile Money', color: '#e31837' },
          { title: 'Secure Booking', desc: '256-bit SSL encrypted payments', color: '#28a745' },
          { title: '24/7 Support', desc: 'Round-the-clock customer assistance', color: '#ffc107' },
          { title: 'Modern Fleet', desc: 'Boeing 737 and Airbus A330 aircraft', color: '#17a2b8' },
          { title: 'Easy Cancellation', desc: 'Flexible booking and cancellation policy', color: '#6f42c1' },
        ].map((f, i) => (
          <div key={i} style={{ ...s.featureCard, borderTop: `4px solid ${f.color}` }}>
            <h3 style={{ color: f.color, marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={s.routesSection}>
        <h2 style={s.sectionTitle}>Popular Routes</h2>
        <p style={s.sectionSub}>Discover our most booked destinations</p>
        <div style={s.routeGrid}>
          {routes.map((r, i) => (
            <div key={i} style={{ ...s.routeCard, borderLeft: `4px solid ${r.color}` }}
              onClick={() => navigate(`/flights?origin=${r.fromCode}&destination=${r.toCode}&departure_date=${new Date(Date.now()+7*86400000).toISOString().split('T')[0]}&cabin_class=economy&passengers=1&trip_type=one-way`)}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>{r.from} to {r.to}</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>{r.fromCode} - {r.toCode} | {r.duration}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: r.color, fontSize: '1.1rem' }}>From {r.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.whySection}>
        <h2 style={s.whyTitle}>Why Choose RwandAir?</h2>
        <p style={s.whySub}>Rwanda's national carrier connecting you to the world with comfort, safety and reliability.</p>
        <div style={s.whyGrid}>
          {['Award-winning African airline','Modern Boeing and Airbus fleet','Complimentary meals on all flights','Generous baggage allowance','Frequent flyer rewards program','Hub at Kigali International Airport'].map((p, i) => (
            <div key={i} style={s.whyItem}>+ {p}</div>
          ))}
        </div>
      </div>

      <footer style={s.footer}>
        <div style={s.footerLogo}>RwandAir</div>
        <p style={s.footerSub}>Fly with Rwanda's Pride</p>
        <div style={s.footerLinks}>
          {['About Us','Contact','Privacy Policy','Terms of Service'].map(l => <span key={l} style={s.footerLink}>{l}</span>)}
        </div>
        <p style={{ color: '#555', fontSize: '0.8rem', marginTop: '1rem' }}>2024 RwandAir. All rights reserved.</p>
      </footer>
    </div>
  );
};

const s = {
  hero: { background: 'linear-gradient(135deg,#003580 0%,#0055b3 60%,#e31837 100%)', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  heroContent: { color: '#fff', padding: '2rem' },
  badge: { display: 'inline-block', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '0.4rem 1.2rem', fontSize: '0.85rem', marginBottom: '1rem' },
  heroTitle: { fontSize: '3.5rem', fontWeight: '800', margin: '0 0 1rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' },
  heroSub: { fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem' },
  stats: { display: 'flex', gap: '3rem', justifyContent: 'center', marginTop: '2rem' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statVal: { fontSize: '2rem', fontWeight: 'bold' },
  statLabel: { fontSize: '0.8rem', opacity: 0.8 },
  searchWrap: { display: 'flex', justifyContent: 'center', padding: '2rem', background: '#f0f4ff' },
  searchBox: { background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 30px rgba(0,53,128,0.15)', width: '100%', maxWidth: '1000px' },
  tripToggle: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' },
  tripBtn: { padding: '0.5rem 1.5rem', border: '2px solid #003580', borderRadius: '20px', cursor: 'pointer', background: 'transparent', color: '#003580', fontWeight: '600' },
  tripBtnActive: { background: '#003580', color: '#fff' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', alignItems: 'end' },
  fg: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  fl: { fontSize: '0.8rem', fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
  searchBtn: { padding: '0.75rem', background: 'linear-gradient(135deg,#e31837,#c0142d)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 'bold' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem', padding: '4rem 2rem', background: '#fff' },
  featureCard: { textAlign: 'center', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  routesSection: { padding: '4rem 2rem', background: '#f0f4ff' },
  sectionTitle: { textAlign: 'center', color: '#003580', fontSize: '2rem', marginBottom: '0.5rem' },
  sectionSub: { textAlign: 'center', color: '#666', marginBottom: '2rem' },
  routeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' },
  routeCard: { background: '#fff', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  whySection: { padding: '4rem 2rem', background: '#003580', color: '#fff', textAlign: 'center' },
  whyTitle: { fontSize: '2rem', marginBottom: '1rem' },
  whySub: { opacity: 0.85, marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' },
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', maxWidth: '800px', margin: '0 auto', textAlign: 'left' },
  whyItem: { background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem' },
  footer: { background: '#111', color: '#fff', padding: '2rem', textAlign: 'center' },
  footerLogo: { fontSize: '1.5rem', fontWeight: 'bold' },
  footerSub: { color: '#aaa', fontSize: '0.85rem', marginTop: '0.25rem' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1rem 0', flexWrap: 'wrap' },
  footerLink: { color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' },
};

export default Home;
