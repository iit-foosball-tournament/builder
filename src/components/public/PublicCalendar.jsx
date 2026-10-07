import { useState, useMemo } from 'react';
import { Calendar, Filter, Search, MapPin, Clock, Shield } from 'lucide-react';
import { formatDateLabel, matchDate, hasDate, matchDateKey, groupMatchesByDate, NO_DATE } from '../../roundDates';

function PublicCalendar({ edition, getTeamColor, t, lang }) {
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const matches = edition.matches || [];
  const teams = edition.teams || [];

  const dateOptions = useMemo(() => {
    const dates = new Set(matches.map(m => matchDate(m)).filter(Boolean));
    return Array.from(dates).sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (m.status === 'played') return false;

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

  const matchesByDate = useMemo(() => groupMatchesByDate(filteredMatches), [filteredMatches]);

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Calendar className="page-icon text-accent" /> {t.calendarPageTitle}
          </h2>
          <p className="page-description">{t.calendarPageDesc}</p>
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
          <span>{t.matchesFoundCount} <strong>{filteredMatches.length}</strong></span>
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

      {/* Schedule Display */}
      {Object.keys(matchesByDate).length > 0 ? (
        <div className="rounds-container">
          {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <div key={date} className="round-group-card">
              <div className="round-group-header">
                <h3>{date === NO_DATE ? t.noDateLabel : formatDateLabel(date, lang)}</h3>
                <span className="round-match-count">{dateMatches.length} {t.matchesToPlay}</span>
              </div>
              <div className="matches-grid">
                {dateMatches.map(m => (
                  <div key={m.id} className="schedule-match-card">
                    <div className="match-top-meta">
                      <span className="status-pill scheduled">{t.scheduledBadge}</span>
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
                        <span>{hasDate(m) ? formatDateLabel(matchDate(m), lang) : t.noDateLabel}{m.time ? ` · ${m.time}` : ''}</span>
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
          <h3>{t.noMatchesFiltered}</h3>
          <p>{t.noMatchesFilteredSub}</p>
        </div>
      )}
    </div>
  );
}

export default PublicCalendar;
