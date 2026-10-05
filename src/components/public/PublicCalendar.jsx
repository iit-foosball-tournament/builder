import React, { useState, useMemo } from 'react';
import { Calendar, Filter, Search, MapPin, Clock, ArrowRight, Shield } from 'lucide-react';

function PublicCalendar({ edition, getTeamName, getTeamColor }) {
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const matches = edition.matches || [];
  const teams = edition.teams || [];

  // Filter only scheduled matches or all
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Must be scheduled or pending
      if (m.status === 'played') return false;

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

  // Group by round for clear schedule view
  const matchesByRound = useMemo(() => {
    const groups = {};
    filteredMatches.forEach(m => {
      if (!groups[m.round]) {
        groups[m.round] = [];
      }
      groups[m.round].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const roundsList = [];
  for (let i = 1; i <= 29; i++) {
    roundsList.push(`Giornata ${i}`);
  }

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Calendar className="page-icon text-accent" /> Calendario Eventi in Programma
          </h2>
          <p className="page-description">
            Consulta il calendario completo delle 29 Giornate di campionato (435 partite).
            Le partite vengono concordate autonomamente tra le squadre presso il tavolo della mensa CCT Morego (08:00 – 15:00).
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
              <option value="all">Tutte le 29 Giornate</option>
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
                placeholder="Es. Pupi, Muffins, Softenham..." 
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
          <span>Incontri da disputare trovati: <strong>{filteredMatches.length}</strong></span>
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

      {/* Schedule Display */}
      {Object.keys(matchesByRound).length > 0 ? (
        <div className="rounds-container">
          {Object.entries(matchesByRound).map(([roundName, roundMatches]) => (
            <div key={roundName} className="round-group-card">
              <div className="round-group-header">
                <h3>{roundName}</h3>
                <span className="round-match-count">{roundMatches.length} incontri da giocare</span>
              </div>
              <div className="matches-grid">
                {roundMatches.map(m => (
                  <div key={m.id} className="schedule-match-card">
                    <div className="match-top-meta">
                      <span className="status-pill scheduled">In Programma</span>
                      <span className="pitch-info">
                        <MapPin size={12} /> {m.pitch || 'Mensa CCT Morego'}
                      </span>
                    </div>

                    <div className="match-teams-box">
                      <div className="team-entry home-team">
                        <span className="team-dot" style={{ backgroundColor: getTeamColor(m.team1) }}></span>
                        <span className="team-title">{m.team1}</span>
                      </div>
                      <div className="match-versus-badge">VS</div>
                      <div className="team-entry away-team">
                        <span className="team-dot" style={{ backgroundColor: getTeamColor(m.team2) }}></span>
                        <span className="team-title">{m.team2}</span>
                      </div>
                    </div>

                    <div className="match-bottom-bar">
                      <div className="timing-info">
                        <Clock size={13} />
                        <span>{m.date ? `${m.date} ${m.time}` : 'Orario: da concordare (8:00 - 15:00)'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-matches-found">
          <Calendar size={48} className="text-muted mb-2" />
          <h3>Nessun incontro trovato con i filtri selezionati</h3>
          <p>Prova a modificare o azzerare i filtri per vedere tutti gli incontri del calendario.</p>
        </div>
      )}
    </div>
  );
}

export default PublicCalendar;
