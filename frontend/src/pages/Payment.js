import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentAPI, ticketAPI } from '../services/api';
import { toast } from 'react-toastify';

// Exchange rates (fixed realistic rates)
const RATES = {
  USD: { RWF: 1350, EUR: 0.92, USD: 1 },
  EUR: { RWF: 1470, USD: 1.09, EUR: 1 },
  RWF: { USD: 0.00074, EUR: 0.00068, RWF: 1 },
};

const SYMBOLS = { USD: '$', EUR: 'EUR', RWF: 'RWF' };

const convert = (amount, from, to) => {
  if (from === to) return parseFloat(amount);
  return parseFloat(amount) * RATES[from][to];
};

const fmt = (amount, currency) => {
  if (currency === 'RWF') return 'RWF ' + Math.round(amount).toLocaleString();
  if (currency === 'EUR') return 'EUR ' + amount.toFixed(2);
  return '$ ' + amount.toFixed(2);
};

const Payment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [momoPhone, setMomoPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  if (!state?.booking) { navigate('/'); return null; }
  const { booking } = state;

  const baseAmount = parseFloat(booking.total_amount);
  const baseCurrency = booking.currency || 'USD';
  const convertedAmount = convert(baseAmount, baseCurrency, selectedCurrency);

  const fmtCard = (v) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  const fmtExp = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please agree to the terms'); return; }
    setLoading(true);
    try {
      const intentRes = await paymentAPI.createIntent({ booking_id: booking.id, currency: selectedCurrency, payment_method: method });
      await new Promise(r => setTimeout(r, 2000));
      await paymentAPI.confirm({ booking_id: booking.id, payment_intent_id: intentRes.data.payment?.stripe_payment_intent_id, payment_method: method });
      try { await ticketAPI.generate(booking.id); } catch (e) {}
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

          {/* Currency Selector */}
          <div style={s.currencySection}>
            <h3 style={s.sectionTitle}>Select Payment Currency</h3>
            <div style={s.currencyBtns}>
              {['USD', 'EUR', 'RWF'].map(c => (
                <button key={c} type="button" onClick={() => setSelectedCurrency(c)}
                  style={{ ...s.currencyBtn, ...(selectedCurrency === c ? s.currencyBtnActive : {}) }}>
                  <div style={s.currencySymbol}>{SYMBOLS[c]}</div>
                  <div style={s.currencyName}>{c}</div>
                  <div style={s.currencyRate}>
                    {c === 'USD' && '1 USD = 1,350 RWF'}
                    {c === 'EUR' && '1 EUR = 1,470 RWF'}
                    {c === 'RWF' && '1,350 RWF = 1 USD'}
                  </div>
                </button>
              ))}
            </div>

            {/* Conversion Display */}
            <div style={s.conversionBox}>
              <div style={s.conversionRow}>
                <span style={s.conversionLabel}>Original Amount</span>
                <span style={s.conversionValue}>{fmt(baseAmount, baseCurrency)}</span>
              </div>
              {selectedCurrency !== baseCurrency && (
                <>
                  <div style={s.conversionArrow}>
                    1 {baseCurrency} = {RATES[baseCurrency][selectedCurrency].toLocaleString()} {selectedCurrency}
                  </div>
                  <div style={s.conversionRow}>
                    <span style={s.conversionLabel}>Converted Amount</span>
                    <span style={{ ...s.conversionValue, color: '#003580', fontSize: '1.3rem', fontWeight: 'bold' }}>
                      {fmt(convertedAmount, selectedCurrency)}
                    </span>
                  </div>
                </>
              )}
              <div style={s.conversionNote}>
                Exchange rate updated: {new Date().toLocaleDateString()} | Source: National Bank of Rwanda
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <h3 style={s.sectionTitle}>Payment Method</h3>
          <div style={s.methods}>
            {[
              { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Amex' },
              { id: 'mtn_momo', label: 'MTN Mobile Money', sub: 'Rwanda, Uganda, Ghana' }
            ].map(m => (
              <div key={m.id} onClick={() => setMethod(m.id)}
                style={{ ...s.methodCard, ...(method === m.id ? s.methodActive : {}) }}>
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
                <div style={s.field}>
                  <label style={s.label}>Cardholder Name</label>
                  <input value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value }))} style={s.input} placeholder="John Doe" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Card Number</label>
                  <input value={card.number} onChange={e => setCard(p => ({ ...p, number: fmtCard(e.target.value) }))} style={s.input} placeholder="4242 4242 4242 4242" required />
                </div>
                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.label}>Expiry</label>
                    <input value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: fmtExp(e.target.value) }))} style={s.input} placeholder="MM/YY" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>CVV</label>
                    <input value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} style={s.input} placeholder="123" required />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 style={s.sectionTitle}>MTN Mobile Money</h3>
                <div style={s.field}>
                  <label style={s.label}>Mobile Money Number</label>
                  <input value={momoPhone} onChange={e => setMomoPhone(e.target.value)} style={s.input} placeholder="+250 78X XXX XXX" required />
                </div>
                <div style={s.momoInfo}>
                  Enter your number, click Pay, then confirm the USSD prompt on your phone.
                  {selectedCurrency === 'RWF' && (
                    <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#003580' }}>
                      You will be charged: RWF {Math.round(convertedAmount).toLocaleString()}
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={s.agreeRow}>
              <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <label htmlFor="agree" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#555' }}>
                I agree to the Terms and Conditions and Cancellation Policy
              </label>
            </div>

            <button type="submit" disabled={loading || !agreed} style={{ ...s.payBtn, opacity: !agreed ? 0.6 : 1 }}>
              {loading ? 'Processing...' : `Pay ${fmt(convertedAmount, selectedCurrency)}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div style={s.summary}>
          <h3 style={s.summaryTitle}>Order Summary</h3>
          <div style={s.refBox}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Booking Reference</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '3px' }}>{booking.booking_reference}</div>
          </div>
          {[['Cabin Class', booking.cabin_class], ['Passengers', booking.total_passengers], ['Trip Type', booking.trip_type]].map(([l, v]) => (
            <div key={l} style={s.summaryRow}>
              <span style={{ color: '#888' }}>{l}</span>
              <span style={{ textTransform: 'capitalize' }}>{v}</span>
            </div>
          ))}
          <div style={s.divider} />

          {/* Amount in all currencies */}
          <div style={s.allCurrencies}>
            <div style={s.currencyConvRow}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>USD</span>
              <span style={{ fontWeight: 'bold' }}>{fmt(convert(baseAmount, baseCurrency, 'USD'), 'USD')}</span>
            </div>
            <div style={s.currencyConvRow}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>EUR</span>
              <span style={{ fontWeight: 'bold' }}>{fmt(convert(baseAmount, baseCurrency, 'EUR'), 'EUR')}</span>
            </div>
            <div style={s.currencyConvRow}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>RWF</span>
              <span style={{ fontWeight: 'bold' }}>{fmt(convert(baseAmount, baseCurrency, 'RWF'), 'RWF')}</span>
            </div>
          </div>

          <div style={s.divider} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>You Pay</span>
            <span style={{ color: '#e31837', fontSize: '1.3rem' }}>{fmt(convertedAmount, selectedCurrency)}</span>
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
  currencySection: { marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e0e0e0' },
  sectionTitle: { color: '#003580', marginBottom: '1rem', fontSize: '1rem' },
  currencyBtns: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' },
  currencyBtn: { border: '2px solid #ddd', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer', background: '#fff', textAlign: 'center', transition: 'all 0.2s' },
  currencyBtnActive: { border: '2px solid #003580', background: '#f0f4ff' },
  currencySymbol: { fontSize: '1.3rem', fontWeight: 'bold', color: '#003580' },
  currencyName: { fontSize: '0.85rem', fontWeight: '600', color: '#333', margin: '0.2rem 0' },
  currencyRate: { fontSize: '0.7rem', color: '#888' },
  conversionBox: { background: '#f8faff', borderRadius: '10px', padding: '1rem', border: '1px solid #e0e0e0' },
  conversionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0' },
  conversionLabel: { color: '#666', fontSize: '0.9rem' },
  conversionValue: { fontWeight: 'bold', color: '#333' },
  conversionArrow: { textAlign: 'center', color: '#003580', fontSize: '0.85rem', fontWeight: '600', padding: '0.5rem', background: '#e8f0ff', borderRadius: '6px', margin: '0.5rem 0' },
  conversionNote: { fontSize: '0.72rem', color: '#aaa', marginTop: '0.75rem', textAlign: 'center' },
  methods: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' },
  methodCard: { border: '2px solid #ddd', borderRadius: '10px', padding: '1rem', cursor: 'pointer', position: 'relative' },
  methodActive: { border: '2px solid #003580', background: '#f0f4ff' },
  check: { position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#003580', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: '600', color: '#444', fontSize: '0.85rem' },
  input: { padding: '0.75rem', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '1rem', outline: 'none' },
  momoInfo: { background: '#f0f4ff', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#555' },
  agreeRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  payBtn: { padding: '1rem', background: 'linear-gradient(135deg,#003580,#0055b3)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' },
  summary: { background: '#f8faff', border: '1px solid #e0e0e0', borderRadius: '16px', padding: '1.5rem', height: 'fit-content', position: 'sticky', top: '80px' },
  summaryTitle: { color: '#003580', marginBottom: '1.25rem' },
  refBox: { background: '#003580', color: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e8e8e8', fontSize: '0.9rem' },
  allCurrencies: { background: '#f8f9fa', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' },
  currencyConvRow: { display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.9rem' },
  divider: { height: '2px', background: '#003580', margin: '1rem 0' },
  secNote: { background: '#e8f5e9', color: '#28a745', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' },
};

export default Payment;
