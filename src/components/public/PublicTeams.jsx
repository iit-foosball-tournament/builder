import { useState, useMemo } from 'react';
import { Users, Search, UserCheck, Camera } from 'lucide-react';
import { supabase } from '../../supabase';
import { resolveTeamPhoto } from '../../tournamentData';
import PhotoWithFallback from '../PhotoWithFallback';

function PublicTeams({ edition, standings = [], getTeamColor, t }) {
  const [searchQuery, setSearchQuery] = useState('');

  const teams = useMemo(() => edition.teams || [], [edition.teams]);

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

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const p1Match = (item.player1 || '').toLowerCase().includes(q);
      const p2Match = (item.player2 || '').toLowerCase().includes(q);
      return nameMatch || p1Match || p2Match;
    });
  }, [teams, searchQuery]);

  return (
    <div className="teams-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Users className="page-icon text-primary" /> {t.teamsPageTitle}
          </h2>
          <p className="page-description">{t.teamsPageDesc}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-controls-card mb-4">
        <div className="search-single-row">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={t.searchTeamOrPlayer} 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input-lg"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
          <span className="search-count">{t.teamsCountLabel} <strong>{filteredTeams.length}</strong> / {teams.length}</span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="teams-cards-grid">
        {filteredTeams.map((team, idx) => {
          const stats = statsMap[team.name.toLowerCase()] || statsMap[team.id] || { rank: '-', points: 0, played: 0, won: 0 };
          const teamColor = team.logoColor || getTeamColor(team.name);

          return (
            <div key={team.id || idx} className="team-card">
              {/* Card Photo / Emblem Header */}
              <div className="team-card-media" style={{ borderColor: teamColor }}>
                <PhotoWithFallback key={team.photo || ''} src={resolveTeamPhoto(team.photo, supabase)} alt={`Team ${team.name}`} className="team-photo-img">
                  <div className="team-emblem-fallback" style={{ background: `linear-gradient(135deg, ${teamColor}22 0%, ${teamColor}66 100%)` }}>
                    <div className="team-avatar-circle" style={{ backgroundColor: teamColor }}>
                      <span className="team-avatar-initials">
                        {team.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="pending-photo-badge">
                      <Camera size={13} /> {t.pendingPhoto}
                    </div>
                  </div>
                </PhotoWithFallback>
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
                    <span>{t.rosterLabel}</span>
                  </div>

                  <div className="player-entry">
                    <span className="player-role-badge">P1</span>
                    <span className="player-details">
                      {team.player1 || <em className="text-muted">{t.toRegister}</em>}
                    </span>
                  </div>

                  <div className="player-entry">
                    <span className="player-role-badge">P2</span>
                    <span className="player-details">
                      {team.player2 || <em className="text-muted">{t.toRegister}</em>}
                    </span>
                  </div>
                </div>

                {/* Card Quick Stats Footer */}
                <div className="team-stats-strip">
                  <div className="stat-mini">
                    <span className="stat-mini-val">{stats.points}</span>
                    <span className="stat-mini-lbl">{t.statPts}</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-val">{stats.played}</span>
                    <span className="stat-mini-lbl">{t.statPl}</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-val">{stats.won}</span>
                    <span className="stat-mini-lbl">{t.statW}</span>
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
          <h3>{t.noTeamsMatch}</h3>
          <p>{t.noTeamsMatchSub}</p>
        </div>
      )}
    </div>
  );
}

export default PublicTeams;
