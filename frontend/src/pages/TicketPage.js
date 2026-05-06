import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { toast } from 'react-toastify';

const TicketPage = () => {
  const { booking_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    ticketAPI.getByBooking(booking_id).then(r => { if (r.data.tickets.length) setData(r.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [booking_id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await ticketAPI.generate(booking_id);
      const r = await ticketAPI.getByBooking(booking_id);
      setData(r.data);
      toast.success('Tickets generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div style={s.loading}>Loading tickets...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>Back</button>
        <h2 style={s.title}>Boarding Passes</h2>
        {data && <button onClick={() => window.print()} style={s.printBtn}>Print All</button>}
      </div>

      {!data ? (
        <div style={s.noTickets}>
          <h3>No tickets generated yet</h3>
          <p style={{ color: '#666', margin: '1rem 0' }}>Tickets are generated after payment is confirmed.</p>
          <button onClick={handleGenerate} disabled={generating} style={s.generateBtn}>
            {generating ? 'Generating...' : 'Generate Boarding Passes'}
          </button>
        </div>
      ) : data.tickets.map((ticket, i) => {
        const dep = new Date(data.booking.departure_time);
        const arr = new Date(data.booking.arrival_time);
        const dur = Math.round((arr - dep) / 60000);
        return (
          <div key={i} style={s.bpWrapper}>
            <div style={s.bp}>
              <div style={s.bpHeader}>
                <div style={s.bpAirline}>
                  <div style={s.bpAirlineName}>RwandAir</div>
                  <div style={s.bpAirlineSub}>BOARDING PASS</div>
                </div>
                <span style={{ ...s.classBadge, background: data.booking.cabin_class === 'business' ? '#ffd700' : data.booking.cabin_class === 'first' ? '#e31837' : '#003580' }}>
                  {data.booking.cabin_class.toUpperCase()}
                </span>
              </div>

              <div style={s.bpRoute}>
                <div style={s.bpAirport}>
                  <div style={s.bpCode}>{data.booking.origin_code}</div>
                  <div style={s.bpCity}>{data.booking.origin_city}</div>
                  <div style={s.bpTime}>{dep.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style={s.bpDate}>{dep.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
                </div>
                <div style={s.bpMid}>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{Math.floor(dur/60)}h {dur%60}m</div>
                  <div style={{ color: '#003580', fontSize: '1.5rem', margin: '0.25rem 0' }}>----&gt;</div>
                  <div style={{ fontSize: '0.75rem', color: '#28a745' }}>Direct</div>
                </div>
                <div style={s.bpAirport}>
                  <div style={s.bpCode}>{data.booking.dest_code}</div>
                  <div style={s.bpCity}>{data.booking.dest_city}</div>
                  <div style={s.bpTime}>{arr.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style={s.bpDate}>{arr.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
                </div>
              </div>

              <div style={s.bpDivider}><div style={s.bpCircle}/><div style={s.bpDash}/><div style={{ ...s.bpCircle, marginLeft: 'auto' }}/></div>

              <div style={s.bpInfo}>
                <div style={s.bpInfoGrid}>
                  {[['PASSENGER',ticket.first_name+' '+ticket.last_name],['FLIGHT',data.booking.flight_number],['SEAT',ticket.seat_number],['GATE','B'+Math.floor(Math.random()*20+1)],['BOARDING',new Date(dep-45*60000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})],['PASSPORT',ticket.passport_number],['BAGGAGE',(ticket.baggage_kg||23)+(ticket.extra_baggage_kg||0)+'kg'],['MEAL',ticket.meal_preference]].map(([l,v]) => (
                    <div key={l} style={s.bpInfoItem}>
                      <div style={s.bpInfoLabel}>{l}</div>
                      <div style={{ ...s.bpInfoValue, ...(l==='SEAT'?{color:'#e31837',fontSize:'1.5rem'}:{}) }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.bpBottom}>
                <div>
                  <div style={s.bpInfoLabel}>TICKET NUMBER</div>
                  <div style={{ fontWeight: 'bold', color: '#003580', letterSpacing: '2px', fontFamily: 'monospace' }}>{ticket.ticket_number}</div>
                  <div style={s.bpInfoLabel}>BOOKING REF</div>
                  <div style={{ fontWeight: 'bold', color: '#e31837', letterSpacing: '3px', fontSize: '1.2rem', fontFamily: 'monospace' }}>{data.booking.booking_reference}</div>
                  <div style={{ ...s.statusBadge, background: ticket.checked_in ? '#28a745' : '#ffc107' }}>
                    {ticket.checked_in ? 'CHECKED IN' : 'NOT CHECKED IN'}
                  </div>
                </div>
                {ticket.qr_code && (
                  <div style={{ textAlign: 'center' }}>
                    <img src={ticket.qr_code} alt="QR Code" style={{ width: '100px', height: '100px' }} />
                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem' }}>Scan at gate</div>
                  </div>
                )}
              </div>
            </div>
            <div style={s.ticketActions}>
              <button onClick={() => window.print()} style={s.printTicketBtn}>Print Boarding Pass</button>
              <button onClick={() => navigate('/checkin/' + booking_id)} style={s.checkinTicketBtn}>
                {ticket.checked_in ? 'Already Checked In' : 'Online Check-In'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const s = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  backBtn: { background: 'transparent', border: '1px solid #003580', color: '#003580', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' },
  printBtn: { background: '#003580', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer' },
  noTickets: { textAlign: 'center', padding: '4rem', background: '#f8faff', borderRadius: '16px' },
  generateBtn: { marginTop: '1rem', padding: '0.85rem 2rem', background: '#003580', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
  bpWrapper: { marginBottom: '2rem' },
  bp: { background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', overflow: 'hidden', maxWidth: '700px', margin: '0 auto', fontFamily: 'monospace' },
  bpHeader: { background: 'linear-gradient(135deg,#003580,#0055b3)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bpAirline: {},
  bpAirlineName: { fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '2px' },
  bpAirlineSub: { fontSize: '0.75rem', opacity: 0.8, letterSpacing: '3px' },
  classBadge: { color: '#fff', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' },
  bpRoute: { display: 'flex', alignItems: 'center', padding: '1.5rem', background: '#f8faff' },
  bpAirport: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  bpCode: { fontSize: '2.5rem', fontWeight: 'bold', color: '#003580', letterSpacing: '2px' },
  bpCity: { fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' },
  bpTime: { fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginTop: '0.5rem' },
  bpDate: { fontSize: '0.75rem', color: '#888' },
  bpMid: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  bpDivider: { display: 'flex', alignItems: 'center', padding: '0 -1rem' },
  bpCircle: { width: '24px', height: '24px', borderRadius: '50%', background: '#f0f4ff', border: '2px solid #e0e0e0', flexShrink: 0 },
  bpDash: { flex: 1, borderTop: '2px dashed #ddd' },
  bpInfo: { padding: '1.25rem 1.5rem' },
  bpInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' },
  bpInfoItem: {},
  bpInfoLabel: { fontSize: '0.65rem', color: '#999', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' },
  bpInfoValue: { fontSize: '0.95rem', fontWeight: 'bold', color: '#333', marginTop: '0.2rem' },
  bpBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: '#f8faff', borderTop: '1px solid #e0e0e0' },
  statusBadge: { display: 'inline-block', color: '#fff', padding: '0.2rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: 'bold' },
  ticketActions: { display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' },
  printTicketBtn: { padding: '0.6rem 1.5rem', background: '#003580', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  checkinTicketBtn: { padding: '0.6rem 1.5rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default TicketPage;
