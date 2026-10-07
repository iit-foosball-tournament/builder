import { CalendarDays, Info } from 'lucide-react';
import { formatDateLabel } from '../../roundDates';

// Per-round (giornata) date editor. Each group giornata is mapped to a calendar date which
// is what /calendar and /risultati show (the "Giornata N" number is kept only underneath as
// a legacy grouping). Dates are always editable and are shared by every match of the giornata.
function RoundDatesEditor({ matches = [], roundDates = {}, onUpdateRoundDate }) {
  // Distinct giornate present among the group matches, in schedule order.
  const roundNums = Array.from(new Set(matches.map(m => m.roundNum).filter(Number.isFinite))).sort((a, b) => a - b);

  if (roundNums.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-muted">Nessuna giornata disponibile da configurare.</p>
      </div>
    );
  }

  return (
    <div className="round-dates-editor">
      <div className="card-header-banner">
        <div>
          <h3><CalendarDays className="inline-icon mr-2 text-accent" /> Giornate &amp; Date</h3>
          <p className="subtitle">
            Assegna la data di ogni giornata. Il numero della giornata resta solo come raggruppamento:
            il calendario e i risultati mostrano la <strong>data</strong> che imposti qui.
            Le date di default partono dal 5 ottobre e proseguono nei soli giorni feriali (lun–ven), ma
            puoi modificarle in qualsiasi momento.
          </p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: 0 }}>
            <Info size={14} /> Ogni modifica diventa efficace dopo aver premuto <strong>Salva</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,260px),1fr))', gap: '12px' }}>
            {roundNums.map(num => {
              const key = String(num);
              const date = roundDates[key] || '';
              const count = matches.filter(m => m.roundNum === num).length;
              return (
                <div key={key} className="card round-date-card" style={{ padding: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Giornata {num}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <input
                      type="date"
                      value={date}
                      onChange={e => onUpdateRoundDate(num, e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <span className="text-muted" style={{ fontSize: '11px', display: 'block', marginTop: '6px' }}>
                    {count} incontri · {formatDateLabel(date) || 'nessuna data'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoundDatesEditor;
