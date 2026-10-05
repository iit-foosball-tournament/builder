import React, { useState } from 'react';
import { Calendar, Filter, CheckCircle2, Clock, RotateCcw, Search, Trophy } from 'lucide-react';

function MatchEditor({ matches = [], teams = [], onUpdateMatch, onBatchUpdateMatches }) {
  const [selectedRound, setSelectedRound] = useState('Giornata 1');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Generate 29 rounds list
  const roundsList = [];
  for (let i = 1; i <= 29; i++) {
    roundsList.push(`Giornata ${i}`);
  }

  // Filter matches
  const filteredMatches = matches.filter(m => {
    if (selectedRound !== 'all' && m.round !== selectedRound) return false;
    if (teamFilter !== 'all') {
      const match = m.team1.toLowerCase() === teamFilter.toLowerCase() || 
                    m.team2.toLowerCase() === teamFilter.toLowerCase();
      if (!match) return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q);
    }
    return true;
  });

  // Handle score change
  const handleScoreChange = (matchId, s1, s2, isPlayed = true) => {
    const score1 = s1 !== '' && s1 !== null ? parseInt(s1, 10) : null;
    const score2 = s2 !== '' && s2 !== null ? parseInt(s2, 10) : null;
    const status = isPlayed && score1 !== null && score2 !== null ? 'played' : 'scheduled';
    onUpdateMatch(matchId, { score1, score2, status });
  };

  // Reset match to scheduled
  const handleResetMatch = (matchId) => {
    onUpdateMatch(matchId, { score1: null, score2: null, status: 'scheduled' });
  };

  // Quick preset: Team 1 win 10-x
  const handleTeam1Win = (matchId, team2Score = 0) => {
    handleScoreChange(matchId, 10, team2Score, true);
  };

  // Quick preset: Team 2 win x-10
  const handleTeam2Win = (matchId, team1Score = 0) => {
    handleScoreChange(matchId, team1Score, 10, true);
  };

  // Quick preset: Draw 9-9
  const handleDraw = (matchId) => {
    handleScoreChange(matchId, 9, 9, true);
  };

  return (
    <div className="match-editor-container">
      {/* Header */}
      <div className="card-header-banner">
        <div>
          <h3><Calendar className="inline-icon mr-2 text-accent" /> Inserimento Risultati e Calendario</h3>
          <p className="subtitle">
            Seleziona la Giornata o cerca la squadra per inserire il risultato della partita.
            Vittoria a 10 gol (3 pt) o Pareggio a 9-9 (1 pt). La classifica si aggiorna automaticamente.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card filter-controls-card mb-4">
        <div className="filter-row">
          <div className="filter-item">
            <label><Filter size={14} /> Seleziona Giornata:</label>
            <select 
              value={selectedRound} 
              onChange={e => setSelectedRound(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tutte le 29 Giornate</option>
              {roundsList.map(r => (
                <option key={r} value={r}>{r}</option>
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
              <option value="all">Tutte le 30 Squadre</option>
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
          <span>Partite mostrate: <strong>{filteredMatches.length}</strong></span>
          <span className="text-muted">
            Giocate in questa selezione: <strong>{filteredMatches.filter(m => m.status === 'played').length}</strong>
          </span>
        </div>
      </div>

      {/* Matches List */}
      <div className="matches-editor-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredMatches.map(m => {
          const isPlayed = m.status === 'played';
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className="badge badge-primary">{m.round}</span>
                  <span className="text-muted" style={{ fontSize: '12px' }}>Incontro #{m.matchNum}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Status indicator */}
                  {isPlayed ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>
                      <CheckCircle2 size={16} /> Giocata
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '13px' }}>
                      <Clock size={16} /> In programma
                    </span>
                  )}

                  {/* Reset button */}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 30px 70px 1fr', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                {/* Home Team */}
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                  {m.team1}
                </div>

                {/* Score 1 */}
                <div>
                  <input 
                    type="number" 
                    min="0" 
                    max="30"
                    value={s1}
                    onChange={(e) => handleScoreChange(m.id, e.target.value, s2, true)}
                    placeholder="Gol"
                    style={{
                      width: '60px',
                      height: '42px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: isPlayed ? '2px solid #16a34a' : '1px solid #cbd5e1'
                    }}
                  />
                </div>

                {/* Separator */}
                <div style={{ fontWeight: 'bold', color: '#94a3b8' }}>-</div>

                {/* Score 2 */}
                <div>
                  <input 
                    type="number" 
                    min="0" 
                    max="30"
                    value={s2}
                    onChange={(e) => handleScoreChange(m.id, s1, e.target.value, true)}
                    placeholder="Gol"
                    style={{
                      width: '60px',
                      height: '42px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderRadius: '8px',
                      border: isPlayed ? '2px solid #16a34a' : '1px solid #cbd5e1'
                    }}
                  />
                </div>

                {/* Away Team */}
                <div style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '15px' }}>
                  {m.team2}
                </div>
              </div>

              {/* Quick Presets & Scheduling Metadata */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                {/* Date & Time fields */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#64748b' }}>Data:</label>
                  <input 
                    type="date" 
                    value={m.date || ''} 
                    onChange={e => onUpdateMatch(m.id, { date: e.target.value })}
                    style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <label style={{ fontSize: '12px', color: '#64748b' }}>Ora:</label>
                  <input 
                    type="time" 
                    value={m.time || ''} 
                    onChange={e => onUpdateMatch(m.id, { time: e.target.value })}
                    style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                {/* Quick Presets */}
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

      {filteredMatches.length === 0 && (
        <div className="no-matches-found mt-4">
          <p>Nessuna partita trovata con i filtri correnti.</p>
        </div>
      )}
    </div>
  );
}

export default MatchEditor;
