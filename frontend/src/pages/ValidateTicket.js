import React, { useState } from 'react';
import { ticketAPI } from '../services/api';

const ValidateTicket = () => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await ticketAPI.validate(ticketNumber.trim().toUpperCase());
      setResult(data);
    } catch (err) {
      setResult({ valid: false, message: err.response?.data?.message || 'Ticket not found' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Ticket Validation</h2>
      <p style={s.sub}>Enter ticket number to validate at gate</p>
      <form onSubmit={handleValidate} style={s.form}>
        <input value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} style={s.input} placeholder="e.g. WB1234567890" required />
        <button type="submit" disabled={loading} style={s.btn}>{loading ? 'Validating...' : 'Validate Ticket'}</button>
      </form>

      {result && (
        <div style={{ ...s.result, background: result.valid ? '#d4edda' : '#f8d7da', border: '1px solid ' + (result.valid ? '#28a745' : '#dc3545') }}>
          <div style={s.resultHeader}>
            <span style={{ fontSize: '2rem' }}>{result.valid ? 'OK' : 'X'}</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: result.valid ? '#155724' : '#721c24' }}>
              {result.valid ? 'VALID TICKET' : 'INVALID TICKET'}
            </span>
          </div>
          <p style={{ color: result.valid ? '#155724' : '#721c24', fontWeight: '600' }}>{result.message}</p>
          {result.ticket && (
            <div style={s.details}>
              <div style={s.detailGrid}>
                {[['Ticket Number',result.ticket.ticket_number],['Passenger',result.ticket.first_name+' '+result.ticket.last_name],['Passport',result.ticket.passport_number],['Flight',result.ticket.flight_number],['Route',result.ticket.origin_code+' to '+result.ticket.dest_code],['Departure',new Date(result.ticket.departure_time).toLocaleString()],['Seat',result.ticket.seat_number],['Class',result.ticket.cabin_class],['Booking Ref',result.ticket.booking_reference],['Check-in',result.ticket.checked_in ? 'Checked In' : 'Not Checked In'],['Flight Status',result.ticket.flight_status],['Booking Status',result.ticket.booking_status]].map(([l,v]) => (
                  <div key={l} style={s.detailItem}>
                    <span style={s.detailLabel}>{l}</span>
                    <span style={{ fontWeight: 'bold', color: '#333', textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  title: { color: '#003580', fontSize: '1.8rem', marginBottom: '0.5rem' },
  sub: { color: '#666', marginBottom: '2rem' },
  form: { display: 'flex', gap: '1rem', marginBottom: '2rem' },
  input: { flex: 1, padding: '0.85rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '1px', outline: 'none' },
  btn: { padding: '0.85rem 1.5rem', background: '#003580', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' },
  result: { borderRadius: '12px', padding: '1.5rem' },
  resultHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' },
  details: { marginTop: '1.5rem', background: '#fff', borderRadius: '8px', padding: '1.25rem' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  detailLabel: { fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase' },
};

export default ValidateTicket;
