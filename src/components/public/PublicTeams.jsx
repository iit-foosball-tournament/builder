import React, { useState, useMemo } from 'react';
import { Users, Search, Mail, Trophy, UserCheck, Camera, Shield } from 'lucide-react';

function PublicTeams({ edition, standings = [], getTeamColor }) {
  const [searchQuery, setSearchQuery] = useState('');

  const teams = edition.teams || [];

  // Map standings by team name or id
  const statsMap = useMemo(() => {
    const map = {};
    standings.forEach((s, idx) => {
      map[s.name.toLowerCase()] = {
        rank: idx + 1,
        points: s.points || 0,
        played: s.played || 0,
        won: s.won || 0,
        drawn: s.drawn || 0,
        lost: s.lost || 0
      };
      if (s.id) {
        map[s.id] = map[s.name.toLowerCase()];
      }
    });
    return map;
  }, [standings]);

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(t => {
      const nameMatch = t.name.toLowerCase().includes(q);
      const p1Match = (t.player1 || '').toLowerCase().includes(q);
      const p2Match = (t.player2 || '').toLowerCase().includes(q);
      return nameMatch || p1Match || p2Match;
    });
  }, [teams, searchQuery]);

  return (
    <div className="teams-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Users className="page-icon text-primary" /> Squadre Partecipanti &amp; Foto Ufficiali
          </h2>
          <p className="page-description">
            Le 30 squadre del torneo IIT Foosball 2026. Scheda di ogni squadra con i componenti registrati e foto ufficiale.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-controls-card mb-4">
        <div className="search-single-row">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cerca squadra o giocatore (es. Silvestri, Drago, Steccata, Softenham...)" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input-lg"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          <span className="search-count">Squadre: <strong>{filteredTeams.length}</strong> / {teams.length}</span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="teams-cards-grid">
        {filteredTeams.map((team, idx) => {
          const stats = statsMap[team.name.toLowerCase()] || statsMap[team.id] || { rank: '-', points: 0, played: 0, won: 0 };
          const teamColor = team.logoColor || getTeamColor(team.name);
          const hasPhoto = team.photo && team.photo.trim() !== '';

          return (
            <div key={team.id || idx} className="team-card">
              {/* Card Photo / Emblem Header */}
              <div className="team-card-media" style={{ borderColor: teamColor }}>
                {hasPhoto ? (
                  <img 
                    src={team.photo} 
                    alt={`Foto squadra ${team.name}`} 
                    className="team-photo-img" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="team-emblem-fallback" style={{ background: `linear-gradient(135deg, ${teamColor}22 0%, ${teamColor}66 100%)` }}>
                    <div className="team-avatar-circle" style={{ backgroundColor: teamColor }}>
                      <span className="team-avatar-initials">
                        {team.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="pending-photo-badge">
                      <Camera size={13} /> In attesa di foto
                    </div>
                  </div>
                )}
                {stats.rank !== '-' && (
                  <div className="team-rank-overlay">
                    #{stats.rank}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="team-card-content">
                <div className="team-header-row">
                  <span className="team-color-dot" style={{ backgroundColor: teamColor }}></span>
                  <h3 className="team-title">{team.name}</h3>
                </div>

                {/* Players / Roster */}
                <div className="roster-box">
                  <div className="roster-title">
                    <UserCheck size={14} className="text-accent" />
                    <span>Componenti Squadra (Doppio):</span>
                  </div>

                  <div className="player-entry">
                    <span className="player-role-badge">P1</span>
                    <span className="player-details">
                      {team.player1 || <em className="text-muted">Da registrare</em>}
                    </span>
                  </div>

                  <div className="player-entry">
                    <span className="player-role-badge">P2</span>
                    <span className="player-details">
                      {team.player2 || <em className="text-muted">Da registrare</em>}
                    </span>
                  </div>
                </div>

                {/* Card Quick Stats Footer */}
                <div className="team-stats-strip">
                  <div className="stat-mini">
                    <span className="stat-mini-val">{stats.points}</span>
                    <span className="stat-mini-lbl">Punti</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-val">{stats.played}</span>
                    <span className="stat-mini-lbl">Giocate</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-val">{stats.won}</span>
                    <span className="stat-mini-lbl">Vinte</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="no-matches-found mt-4">
          <Users size={48} className="text-muted mb-2" />
          <h3>Nessuna squadra corrisponde ai criteri di ricerca</h3>
          <p>Verifica l'ortografia del nome o del giocatore cercato.</p>
        </div>
      )}
    </div>
  );
}

export default PublicTeams;
