import React, { useState, useMemo } from 'react';
import { Flame, Filter, Search, Shield, CheckCircle, Clock, Trophy } from 'lucide-react';

function PublicResults({ edition, getTeamName, getTeamColor }) {
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const matches = edition.matches || [];
  const teams = edition.teams || [];

  // Filter played matches
  const playedMatches = useMemo(() => {
    return matches.filter(m => {
      // Must be played
      if (m.status !== 'played') return false;

      // Filter by round
      if (selectedRound !== 'all' && m.round !== selectedRound) {
        return false;
      }

      // Filter by team
      if (selectedTeam !== 'all') {
        const teamMatch = m.team1.toLowerCase() === selectedTeam.toLowerCase() || 
                          m.team2.toLowerCase() === selectedTeam.toLowerCase();
        if (!teamMatch) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = m.team1.toLowerCase().includes(q) || 
                             m.team2.toLowerCase().includes(q) ||
                             m.round.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [matches, selectedRound, selectedTeam, searchQuery]);

  // Group by round
  const resultsByRound = useMemo(() => {
    const groups = {};
    playedMatches.forEach(m => {
      if (!groups[m.round]) {
        groups[m.round] = [];
      }
      groups[m.round].push(m);
    });
    return groups;
  }, [playedMatches]);

  const roundsList = [];
  for (let i = 1; i <= 29; i++) {
    roundsList.push(`Giornata ${i}`);
  }

  return (
    <div className="results-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Flame className="page-icon text-danger" /> Risultati di Tutte le Partite
          </h2>
          <p className="page-description">
            Visualizza tutti i risultati ufficiali registrati nel campionato.
            Vittoria a 10 gol (3 punti), Pareggio a 9-9 (1 punto a testa).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <div className="filter-row">
          {/* Round Selector */}
          <div className="filter-item">
            <label><Filter size={14} /> Filtra per Giornata:</label>
            <select 
              value={selectedRound} 
              onChange={e => setSelectedRound(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tutte le Giornate</option>
              {roundsList.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Team Selector */}
          <div className="filter-item">
            <label><Shield size={14} /> Filtra per Squadra:</label>
            <select 
              value={selectedTeam} 
              onChange={e => setSelectedTeam(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tutte le 30 Squadre</option>
              {teams.map(t => (
                <option key={t.id || t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Free Text Search */}
          <div className="filter-item search-item">
            <label><Search size={14} /> Cerca Squadra:</label>
            <div className="search-input-wrap">
              <input 
                type="text" 
                placeholder="Cerca squadra..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>
        </div>

        {/* Quick summary line */}
        <div className="filter-summary">
          <span>Partite completate mostrate: <strong>{playedMatches.length}</strong></span>
          {(selectedRound !== 'all' || selectedTeam !== 'all' || searchQuery) && (
            <button 
              className="reset-filters-btn" 
              onClick={() => { setSelectedRound('all'); setSelectedTeam('all'); setSearchQuery(''); }}
            >
              Azzera Filtri
            </button>
          )}
        </div>
      </div>

      {/* Results Display */}
      {playedMatches.length > 0 ? (
        <div className="rounds-container">
          {Object.entries(resultsByRound).map(([roundName, roundResults]) => (
            <div key={roundName} className="round-group-card">
              <div className="round-group-header">
                <h3>{roundName}</h3>
                <span className="round-match-count">{roundResults.length} partite completate</span>
              </div>
              <div className="results-grid">
                {roundResults.map(m => {
                  const s1 = parseInt(m.score1, 10);
                  const s2 = parseInt(m.score2, 10);
                  const isDraw = s1 === s2;
                  const team1Won = s1 > s2;
                  const team2Won = s2 > s1;

                  return (
                    <div key={m.id} className="result-match-card">
                      <div className="result-meta-top">
                        <span className="status-pill played">
                          <CheckCircle size={12} /> Finale
                        </span>
                        {m.date && <span className="date-info">{m.date}</span>}
                      </div>

                      <div className="result-scoreboard">
                        {/* Team 1 */}
                        <div className={`score-team-row ${team1Won ? 'winner-row' : ''}`}>
                          <div className="score-team-info">
                            <span className="team-dot" style={{ backgroundColor: getTeamColor(m.team1) }}></span>
                            <span className="score-team-name">{m.team1}</span>
                          </div>
                          <span className={`score-badge ${team1Won ? 'score-winner' : ''}`}>{s1}</span>
                        </div>

                        {/* Team 2 */}
                        <div className={`score-team-row ${team2Won ? 'winner-row' : ''}`}>
                          <div className="score-team-info">
                            <span className="team-dot" style={{ backgroundColor: getTeamColor(m.team2) }}></span>
                            <span className="score-team-name">{m.team2}</span>
                          </div>
                          <span className={`score-badge ${team2Won ? 'score-winner' : ''}`}>{s2}</span>
                        </div>
                      </div>

                      <div className="result-outcome-footer">
                        {isDraw ? (
                          <span className="outcome-pill draw">Pareggio (1 pt a testa)</span>
                        ) : (
                          <span className="outcome-pill victory">
                            <Trophy size={12} /> Vincente: {team1Won ? m.team1 : m.team2} (3 pt)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-matches-found">
          <Clock size={48} className="text-muted mb-2" />
          <h3>Nessun risultato ancora registrato</h3>
          <p>
            Le partite non sono ancora state giocate o i risultati devono ancora essere inseriti dal gestore del torneo.
            Non appena i match saranno disputati e registrati, le schede con i punteggi compariranno automaticamente qui.
          </p>
        </div>
      )}
    </div>
  );
}

export default PublicResults;
