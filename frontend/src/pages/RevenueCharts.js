import React, { useState, useEffect } from 'react';
import { enhancedAPI } from '../services/api';
import { toast } from 'react-toastify';

const RevenueCharts = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('daily');

  useEffect(() => {
    enhancedAPI.getRevenueStats().then(r => setStats(r.data)).catch(() => toast.error('Failed to load stats')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Loading revenue data...</div>;
  if (!stats) return null;

  const maxDaily = Math.max(...(stats.daily.map(d => parseFloat(d.revenue)) || [1]));
  const maxMonthly = Math.max(...(stats.monthly.map(m => parseFloat(m.revenue)) || [1]));

  return (
    <div style={s.container}>
      <h2 style={s.title}>Revenue Analytics</h2>

      <div style={s.tabs}>
        {['daily','monthly','routes','class'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Daily Revenue (Last 30 Days)</h3>
          {stats.daily.length === 0 ? <p style={s.noData}>No data available</p> : (
            <div style={s.barChart}>
              {stats.daily.map((d, i) => (
                <div key={i} style={s.barGroup}>
                  <div style={s.barLabel}>${parseFloat(d.revenue).toFixed(0)}</div>
                  <div style={{ ...s.bar, height: `${(parseFloat(d.revenue) / maxDaily) * 200}px`, background: '#003580' }} />
                  <div style={s.barDate}>{new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'monthly' && (
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Monthly Revenue</h3>
          {stats.monthly.length === 0 ? <p style={s.noData}>No data available</p> : (
            <div style={s.barChart}>
              {stats.monthly.map((m, i) => (
                <div key={i} style={s.barGroup}>
                  <div style={s.barLabel}>${parseFloat(m.revenue).toFixed(0)}</div>
                  <div style={{ ...s.bar, height: `${(parseFloat(m.revenue) / maxMonthly) * 200}px`, background: '#e31837' }} />
                  <div style={s.barDate}>{m.month}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'routes' && (
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Revenue by Route (Top 10)</h3>
          {stats.byRoute.length === 0 ? <p style={s.noData}>No data available</p> : (
            <table style={s.table}>
              <thead><tr style={s.thead}>{['Route','Bookings','Revenue'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.byRoute.map((r, i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.td}><strong>{r.origin} to {r.destination}</strong></td>
                    <td style={s.td}>{r.bookings}</td>
                    <td style={s.td}><strong style={{ color: '#28a745' }}>${parseFloat(r.revenue).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'class' && (
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Revenue by Cabin Class</h3>
          {stats.byClass.length === 0 ? <p style={s.noData}>No data available</p> : (
            <div style={s.classGrid}>
              {stats.byClass.map((c, i) => {
                const colors = { economy: '#003580', business: '#ffd700', first: '#e31837' };
                return (
                  <div key={i} style={{ ...s.classCard, borderTop: `4px solid ${colors[c.cabin_class] || '#666'}` }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors[c.cabin_class] || '#666', textTransform: 'capitalize' }}>{c.cabin_class}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', margin: '0.5rem 0' }}>${parseFloat(c.revenue).toFixed(0)}</div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{c.bookings} bookings</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const s = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  loading: { textAlign: 'center', padding: '4rem', color: '#666' },
  title: { color: '#003580', fontSize: '1.8rem', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' },
  tab: { padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.95rem', color: '#666', borderBottom: '3px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#003580', fontWeight: 'bold', borderBottom: '3px solid #003580' },
  chartCard: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  chartTitle: { color: '#003580', marginBottom: '1.5rem' },
  noData: { textAlign: 'center', color: '#888', padding: '2rem' },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem', overflowX: 'auto', padding: '1rem 0', minHeight: '250px' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '50px' },
  barLabel: { fontSize: '0.65rem', color: '#666', textAlign: 'center' },
  bar: { width: '40px', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s' },
  barDate: { fontSize: '0.65rem', color: '#888', textAlign: 'center', transform: 'rotate(-45deg)', marginTop: '0.5rem', whiteSpace: 'nowrap' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  thead: { background: '#003580' },
  th: { color: '#fff', padding: '0.75rem', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.75rem', color: '#333' },
  classGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem' },
  classCard: { background: '#f8faff', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' },
};

export default RevenueCharts;
