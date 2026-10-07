import { useState, useMemo } from 'react';
import { Calendar, Filter, CheckCircle2, Clock, RotateCcw, Search, Info, AlertTriangle } from 'lucide-react';
import { formatDateLabel, matchDate, hasDate, matchRoundNum } from '../../roundDates';

function MatchEditor({ matches = [], teams = [], onUpdateMatch }) {
  const [roundFilter, setRoundFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Distinct Excel rounds present in the data, in order.
  const roundOptions = useMemo(() => {
    const set = new Set();
    matches.forEach(m => { const rn = matchRoundNum(m); if (Number.isFinite(rn)) set.add(rn); });
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  // Filter by team and free text first (round grouping is applied afterwards).
  const filteredMatches = matches.filter(m => {
    if (teamFilter !== 'all') {
      const inTeam = m.team1.toLowerCase() === teamFilter.toLowerCase() ||
                     m.team2.toLowerCase() === teamFilter.toLowerCase();
      if (!inTeam) return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q);
    }
    return true;
  });

  // Group the filtered matches under their "Giornata N" (Excel round). Matches are
  // always shown by round here; the optional date is just an editable field on each card.
  const groups = useMemo(() => {
    const byRound = {};
    for (const m of filteredMatches) {
      if (roundFilter !== 'all' && matchRoundNum(m) !== roundFilter) continue;
      const rn = matchRoundNum(m);
      (byRound[rn] = byRound[rn] || []).push(m);
    }
    return Object.keys(byRound)
      .map(Number)
      .sort((a, b) => (Number.isFinite(a) ? a : Infinity) - (Number.isFinite(b) ? b : Infinity))
      .map(rn => ({
        rn,
        label: Number.isFinite(rn) ? `Giornata ${rn}` : 'Giornata',
        matches: byRound[rn]
      }));
  }, [filteredMatches, roundFilter]);

  const totalShown = groups.reduce((sum, g) => sum + g.matches.length, 0);
  const totalPlayed = groups.reduce((sum, g) => sum + g.matches.filter(m => m.status === 'played').length, 0);

  const handleScoreChange = (matchId, s1, s2, isPlayed = true) => {
    const score1 = s1 !== '' && s1 !== null ? parseInt(s1, 10) : null;
    const score2 = s2 !== '' && s2 !== null ? parseInt(s2, 10) : null;
    const status = isPlayed && score1 !== null && score2 !== null ? 'played' : 'scheduled';
    onUpdateMatch(matchId, { score1, score2, status });
  };

  const handleResetMatch = (matchId) => {
    onUpdateMatch(matchId, { score1: null, score2: null, status: 'scheduled' });
  };

  const handleDraw = (matchId) => {
    handleScoreChange(matchId, 9, 9, true);
  };

  return (
    <div className="match-editor-container">
      <div className="card-header-banner">
        <div>
          <h3><Calendar className="inline-icon mr-2 text-accent" /> Inserimento Risultati e Calendario</h3>
          <p className="subtitle">
            Le partite sono organizzate per <strong>Giornata</strong> (come dall'Excel). Inserisci i punteggi e,
            per ogni partita giocata, è <strong>obbligatoria la data</strong> (campo evidenziato in rosso se mancante).
            Vittoria a 10 gol (3 pt) o Pareggio a 9-9 (1 pt). La classifica si aggiorna automaticamente.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card filter-controls-card mb-4">
        <div className="filter-row">
          <div className="filter-item">
            <label><Filter size={14} /> Filtra per Giornata:</label>
            <select
              value={roundFilter}
              onChange={e => setRoundFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="filter-select"
            >
              <option value="all">Tutte le giornate</option>
              {roundOptions.map(rn => (
                <option key={rn} value={rn}>Giornata {rn}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Filtra per Squadra:</label>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tutte le Squadre</option>
              {teams.map(t => (
                <option key={t.id || t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item search-item">
            <label><Search size={14} /> Cerca Partita:</label>
            <input
              type="text"
              placeholder="Cerca nome squadra..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-summary">
          <span>Partite mostrate: <strong>{totalShown}</strong></span>
          <span className="text-muted">
            Giocate in questa selezione: <strong>{totalPlayed}</strong>
          </span>
        </div>
      </div>

      {/* Matches grouped by Giornata */}
      {groups.map(group => (
        <section key={group.rn} className="shore-group">
          <div className="round-group-header">
            <h3>{group.label}</h3>
            <span className="round-match-count">{group.matches.length} partite</span>
          </div>
          <div className="matches-editor-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {group.matches.map(m => {
              const isPlayed = m.status === 'played';
              const missingDate = isPlayed && !hasDate(m);
              const s1 = m.score1 !== null ? m.score1 : '';
              const s2 = m.score2 !== null ? m.score2 : '';

              return (
                <div
                  key={m.id}
                  className={`card match-edit-card ${isPlayed ? 'border-played' : ''}`}
                  style={{
                    borderLeft: isPlayed ? '6px solid #16a34a' : '6px solid #cbd5e1',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {hasDate(m) ? (
                        <span className="badge badge-primary">{formatDateLabel(matchDate(m))}</span>
                      ) : (
                        <span className="badge badge-subtle">Nessuna data fissata</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {isPlayed ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>
                          <CheckCircle2 size={16} /> Giocata
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '13px' }}>
                          <Clock size={16} /> In programma
                        </span>
                      )}

                      {isPlayed && (
                        <button
                          onClick={() => handleResetMatch(m.id)}
                          className="outline-btn btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px', color: '#ef4444' }}
                          title="Azzera risultato e rimetti in programma"
                        >
                          <RotateCcw size={12} /> Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teams & Score Row */}
                  <div className="mce-score-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 70px 30px 70px 1fr', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                    <div className="mce-team-name" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                      {m.team1}
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={s1}
                        onChange={(e) => handleScoreChange(m.id, e.target.value, s2, true)}
                        placeholder="Gol"
                        style={{
                          width: '60px', height: '42px', fontSize: '18px', fontWeight: 'bold',
                          textAlign: 'center', borderRadius: '8px',
                          border: isPlayed ? '2px solid #16a34a' : '1px solid #cbd5e1'
                        }}
                      />
                    </div>

                    <div style={{ fontWeight: 'bold', color: '#94a3b8' }}>-</div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={s2}
                        onChange={(e) => handleScoreChange(m.id, s1, e.target.value, true)}
                        placeholder="Gol"
                        style={{
                          width: '60px', height: '42px', fontSize: '18px', fontWeight: 'bold',
                          textAlign: 'center', borderRadius: '8px',
                          border: isPlayed ? '2px solid #16a34a' : '1px solid #cbd5e1'
                        }}
                      />
                    </div>

                    <div className="mce-team-name" style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '15px' }}>
                      {m.team2}
                    </div>
                  </div>

                  {/* Scheduling: date/time editable; red highlight when a played match lacks a date */}
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '12px', color: missingDate ? '#ef4444' : '#64748b', fontWeight: missingDate ? 'bold' : 'normal' }}>
                        Data{missingDate ? ' (obbligatoria)' : ''}:
                      </label>
                      <input
                        type="date"
                        value={m.date || ''}
                        onChange={e => onUpdateMatch(m.id, { date: e.target.value })}
                        style={{
                          padding: '4px 8px', fontSize: '12px', borderRadius: '6px',
                          border: missingDate ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          background: missingDate ? '#fef2f2' : '#fff'
                        }}
                      />
                      <label style={{ fontSize: '12px', color: '#64748b' }}>Ora:</label>
                      <input
                        type="time"
                        value={m.time || ''}
                        onChange={e => onUpdateMatch(m.id, { time: e.target.value })}
                        style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      {missingDate && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>
                          <AlertTriangle size={13} /> Data obbligatoria: non puoi salvare finché non la imposti.
                        </span>
                      )}
                    </div>

                    <span className="text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <Info size={13} /> Lascia l'ora vuota se non è ancora fissata.
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleDraw(m.id)}
                        style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Pareggio 9-9
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(m.id, 10, 0, true)}
                        style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        10 - 0 (Tavolino)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScoreChange(m.id, 0, 10, true)}
                        style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        0 - 10 (Tavolino)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {totalShown === 0 && (
        <div className="no-matches-found mt-4">
          <p>Nessuna partita trovata con i filtri correnti.</p>
        </div>
      )}
    </div>
  );
}

export default MatchEditor;
