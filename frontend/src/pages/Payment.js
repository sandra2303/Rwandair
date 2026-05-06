import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI, ticketAPI } from '../services/api';
import { toast } from 'react-toastify';

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [momoPhone, setMomoPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!state?.booking) { navigate('/'); return null; }
  const { booking, currency } = state;

  const fmtCard = (v) => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19);
  const fmtExp = (v) => v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1/$2').slice(0,5);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please agree to the terms'); return; }
    setLoading(true);
    try {
      const intentRes = await paymentAPI.createIntent({ booking_id: booking.id, currency, payment_method: method });
      await new Promise(r => setTimeout(r, 2000));
      await paymentAPI.confirm({ booking_id: booking.id, payment_intent_id: intentRes.data.payment?.stripe_payment_intent_id, payment_method: method });
      try { await ticketAPI.generate(booking.id); } catch(e) {}
      toast.success('Payment successful! Tickets generated.');
      navigate('/bookings/' + booking.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>Secure Payment</h2>
        <div style={s.secBadges}>
          <span style={s.secBadge}>SSL Secured</span>
          <span style={s.secBadge}>PCI DSS</span>
        </div>
      </div>
      <div style={s.layout}>
        <div style={s.formCard}>
          <h3 style={s.sectionTitle}>Payment Method</h3>
          <div style={s.methods}>
            {[{id:'card',label:'Credit / Debit Card',sub:'Visa, Mastercard, Amex'},{id:'mtn_momo',label:'MTN Mobile Money',sub:'Rwanda, Uganda, Ghana'}].map(m => (
              <div key={m.id} onClick={() => setMethod(m.id)} style={{ ...s.methodCard, ...(method === m.id ? s.methodActive : {}) }}>
                <div style={{ fontWeight: '600' }}>{m.label}</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>{m.sub}</div>
                {method === m.id && <div style={s.check}>OK</div>}
              </div>
            ))}
          </div>

          <form onSubmit={handlePayment} style={s.form}>
            {method === 'card' ? (
              <>
                <h3 style={s.sectionTitle}>Card Details</h3>
                <div style={s.field}><label style={s.label}>Cardholder Name</label>
                  <input value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value }))} style={s.input} placeholder="John Doe" required /></div>
                <div style={s.field}><label style={s.label}>Card Number</label>
                  <input value={card.number} onChange={e => setCard(p => ({ ...p, number: fmtCard(e.target.value) }))} style={s.input} placeholder="4242 4242 4242 4242" required /></div>
                <div style={s.row}>
                  <div style={s.field}><label style={s.label}>Expiry</label>
                    <input value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: fmtExp(e.target.value) }))} style={s.input} placeholder="MM/YY" required /></div>
                  <div style={s.field}><label style={s.label}>CVV</label>
                    <input value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))} style={s.input} placeholder="123" required /></div>
                </div>
                <div style={s.note}>Accepted currencies: USD, EUR, RWF</div>
              </>
            ) : (
              <>
                <h3 style={s.sectionTitle}>MTN Mobile Money</h3>
                <div style={s.field}><label style={s.label}>Mobile Money Number</label>
                  <input value={momoPhone} onChange={e => setMomoPhone(e.target.value)} style={s.input} placeholder="+250 78X XXX XXX" required /></div>
                <div style={s.momoInfo}>Enter your number, click Pay, then confirm the USSD prompt on your phone.</div>
              </>
            )}
            <div style={s.agreeRow}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <label htmlFor="agree" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#555' }}>I agree to the Terms and Conditions and Cancellation Policy</label>
            </div>
            <button type="submit" disabled={loading || !agreed} style={{ ...s.payBtn, opacity: !agreed ? 0.6 : 1 }}>
              {loading ? 'Processing...' : 'Pay ' + currency + ' ' + parseFloat(booking.total_amount).toFixed(2)}
            </button>
          </form>
        </div>

        <div style={s.summary}>
          <h3 style={s.summaryTitle}>Order Summary</h3>
          <div style={s.refBox}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Booking Reference</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '3px' }}>{booking.booking_reference}</div>
          </div>
          {[['Cabin Class',booking.cabin_class],['Passengers',booking.total_passengers],['Trip Type',booking.trip_type]].map(([l,v]) => (
            <div key={l} style={s.summaryRow}><span style={{ color: '#888' }}>{l}</span><span style={{ textTransform: 'capitalize' }}>{v}</span></div>
          ))}
          <div style={s.divider} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total</span><span style={{ color: '#e31837', fontSize: '1.4rem' }}>{currency} {parseFloat(booking.total_amount).toFixed(2)}</span>
          </div>
          <div style={s.secNote}>Booking held for 30 minutes</div>
          <div style={s.secNote}>Tickets auto-generated after payment</div>
        </div>
      </div>
    </div>
  );
};

const s = {
  container: { maxWidth: '960px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: '#003580', fontSize: '1.8rem', margin: 0 },
  secBadges: { display: 'flex', gap: '0.75rem' },
  secBadge: { background: '#e8f5e9', color: '#28a745', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' },
  formCard: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '16px', padding: '2rem' },
  sectionTitle: { color: '#003580', marginBottom: '1rem', fontSize: '1rem' },
  methods: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' },
  methodCard: { border: '2px solid #ddd', borderRadius: '10px', padding: '1rem', cursor: 'pointer', position: 'relative' },
  methodActive: { border: '2px solid #003580', background: '#f0f4ff' },
  check: { position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#003580', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: '600', color: '#444', fontSize: '0.85rem' },
  input: { padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
  note: { background: '#f5f5f5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: '#555' },
  momoInfo: { background: '#f0f4ff', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#555' },
  agreeRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  payBtn: { padding: '1rem', background: 'linear-gradient(135deg,#003580,#0055b3)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' },
  summary: { background: '#f8faff', border: '1px solid #e0e0e0', borderRadius: '16px', padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '80px' },
  summaryTitle: { color: '#003580', marginBottom: '1.25rem' },
  refBox: { background: '#003580', color: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e8e8e8', fontSize: '0.9rem' },
  divider: { height: '2px', background: '#003580', margin: '1rem 0' },
  secNote: { background: '#e8f5e9', color: '#28a745', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' },
};

export default Payment;
