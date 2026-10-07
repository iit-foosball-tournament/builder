import { useState, useMemo } from 'react';
import { Flame, Filter, Search, Shield, Clock, Trophy } from 'lucide-react';
import { formatDateLabel, matchDate, matchDateKey, buildDisplayGroups, NO_DATE } from '../../roundDates';

function PublicResults({ edition, getTeamColor, t, lang }) {
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const matches = edition.matches || [];
  const teams = edition.teams || [];

  const dateOptions = useMemo(() => {
    const dates = new Set(matches.map(m => matchDate(m)).filter(Boolean));
    return Array.from(dates).sort();
  }, [matches]);

  const playedMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status !== 'played') return false;

      if (selectedDate === NO_DATE) {
        if (matchDate(m) !== '') return false;
      } else if (selectedDate !== 'all' && matchDateKey(m) !== selectedDate) {
        return false;
      }

      if (selectedTeam !== 'all') {
        const teamMatch = m.team1.toLowerCase() === selectedTeam.toLowerCase() ||
                          m.team2.toLowerCase() === selectedTeam.toLowerCase();
        if (!teamMatch) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q);
      }

      return true;
    });
  }, [matches, selectedDate, selectedTeam, searchQuery]);

  const groups = useMemo(() => buildDisplayGroups(playedMatches, lang), [playedMatches, lang]);

  return (
    <div className="results-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Flame className="page-icon text-danger" /> {t.resultsPageTitle}
          </h2>
          <p className="page-description">{t.resultsPageDesc}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-controls-card">
        <div className="filter-row">
          {/* Date Selector */}
          <div className="filter-item">
            <label><Filter size={14} /> {t.filterRoundLabel}</label>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t.allRounds}</option>
              <option value={NO_DATE}>{t.noDateLabel}</option>
              {dateOptions.map(date => (
                <option key={date} value={date}>{formatDateLabel(date, lang)}</option>
              ))}
            </select>
          </div>

          {/* Team Selector */}
          <div className="filter-item">
            <label><Shield size={14} /> {t.filterTeamLabel}</label>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t.allTeams}</option>
              {teams.map(tItem => (
                <option key={tItem.id || tItem.name} value={tItem.name}>{tItem.name}</option>
              ))}
            </select>
          </div>

          {/* Free Text Search */}
          <div className="filter-item search-item">
            <label><Search size={14} /> {t.searchTeamLabel}</label>
            <div className="search-input-wrap">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
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
          <span>{t.completedMatchesCount} <strong>{playedMatches.length}</strong></span>
          {(selectedDate !== 'all' || selectedTeam !== 'all' || searchQuery) && (
            <button
              className="reset-filters-btn"
              onClick={() => { setSelectedDate('all'); setSelectedTeam('all'); setSearchQuery(''); }}
            >
              {t.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* Results Display */}
      {playedMatches.length > 0 ? (
        <div className="rounds-container">
          {groups.map(g => (
            <div key={g.key} className="round-group-card">
              <div className="round-group-header">
                <h3>{g.label}</h3>
                <span className="round-match-count">{g.matches.length} {t.completedMatchesLabel}</span>
              </div>
              <div className="results-grid">
                {g.matches.map(m => {
                  const s1 = parseInt(m.score1, 10);
                  const s2 = parseInt(m.score2, 10);
                  const isDraw = s1 === s2;
                  const team1Won = s1 > s2;
                  const team2Won = s2 > s1;

                  return (
                    <div key={m.id} className="result-match-card">
                      <div className="result-meta-top">
                        {m.time && (
                          <span className="date-info">
                            <Clock size={12} /> {m.time}
                          </span>
                        )}
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
                          <span className="outcome-pill draw">{t.drawResultFooter}</span>
                        ) : (
                          <span className="outcome-pill victory">
                            <Trophy size={12} /> {t.victoryResultFooter} {team1Won ? m.team1 : m.team2}
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
          <Flame size={48} className="text-muted mb-2" />
          <h3>{t.noResultsFound}</h3>
          <p>{t.noResultsFoundDesc}</p>
        </div>
      )}
    </div>
  );
}

export default PublicResults;
