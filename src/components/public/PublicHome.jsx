import { Calendar, Trophy, Clock, MapPin, Mail, ChevronRight, Award, Flame } from 'lucide-react';
import { formatDateLabel, matchDate, hasDate, sortByDate } from '../../roundDates';

function PublicHome({ edition, standings = [], onNavigateTab, t, lang }) {
  const matches = edition.matches || [];

  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const playedMatches = matches.filter(m => m.status === 'played');

  // Upcoming: dated matches first (oldest first, even if already past), then undated.
  const nextMatches = sortByDate(scheduledMatches).slice(0, 6);
  const recentResults = [...playedMatches].reverse().slice(0, 6);
  const topTeams = standings.slice(0, 4);

  return (
    <div className="home-dashboard">
      {/* Hero Welcome Glassmorphic Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badges">
            <span className="badge badge-primary">{t.badgeEdition}</span>
            <span className="badge badge-accent">{t.badgeFormat}</span>
            <span className="badge badge-subtle">{t.badgeStyle}</span>
          </div>
          <h1 className="hero-title">{t.heroTitle}</h1>
          <p className="hero-subtitle">{t.heroSubtitle}</p>

          <div className="hero-info-pills">
            <div className="info-pill">
              <MapPin size={16} className="pill-icon" />
              <span>{t.canteenLocation}</span>
            </div>
            <div className="info-pill">
              <Clock size={16} className="pill-icon" />
              <span>{t.accessHours}</span>
            </div>
          </div>


        </div>
      </section>

      {/* Quick Statistics Bar */}
      <section className="stats-bar">
        <div className="stat-card">
          <span className="stat-number">{edition.teams?.length || 30}</span>
          <span className="stat-label">{t.statTeams}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <span className="stat-number">{matches.length}</span>
          <span className="stat-label">{t.statRounds}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <span className="stat-number">{playedMatches.length} / {matches.length}</span>
          <span className="stat-label">{t.statPlayed}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <span className="stat-number">8</span>
          <span className="stat-label">{t.statPlayoffs}</span>
        </div>
      </section>

      {/* Main Grid: Standings Preview & Recent / Upcoming Matches */}
      <div className="home-content-grid">
        {/* Left Column: Quick Standings */}
        <div className="grid-card">
          <div className="grid-card-header">
            <div className="header-title">
              <Trophy size={20} className="text-warning" />
              <h3>{t.topStandingsTitle}</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('standings')}>
              {t.viewAll} <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-card-body">
            {standings.length > 0 ? (
              <table className="mini-standings-table">
                <thead>
                  <tr>
                    <th>{t.thRank}</th>
                    <th className="text-left">{t.thTeam}</th>
                    <th>{t.thPlayed}</th>
                    <th>{t.thWon}</th>
                    <th>{t.thDrawn}</th>
                    <th>{t.thLost}</th>
                    <th>{t.thPoints}</th>
                  </tr>
                </thead>
                <tbody>
                  {topTeams.map((team, idx) => (
                    <tr key={team.id || idx} className={idx < 8 ? 'playoff-zone-row' : ''}>
                      <td>
                        <span className={`pos-badge pos-${idx + 1}`}>{idx + 1}</span>
                      </td>
                      <td className="text-left font-bold team-cell">
                        <span className="team-color-dot" style={{ backgroundColor: team.logoColor }}></span>
                        {team.name}
                      </td>
                      <td>{team.played || 0}</td>
                      <td>{team.won || 0}</td>
                      <td>{team.drawn || 0}</td>
                      <td>{team.lost || 0}</td>
                      <td className="points-cell">{team.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-message">{t.noMatchesYet}</p>
            )}
            <div className="playoff-info-note">
              <Award size={14} /> {t.topEightNote}
            </div>
          </div>
        </div>

        {/* Right Column: Prossimi Eventi in Programma */}
        <div className="grid-card">
          <div className="grid-card-header">
            <div className="header-title">
              <Calendar size={20} className="text-accent" />
              <h3>{t.upcomingTitle}</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('calendar')}>
              {t.fullCalendar} <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-card-body">
            {nextMatches.length > 0 ? (
              <div className="mini-matches-list">
                {nextMatches.map(m => (
                  <div key={m.id} className="mini-match-row">
                    <div className="match-meta-tag">
                      {hasDate(m) ? (
                        <span className="round-badge">{formatDateLabel(matchDate(m), lang)}</span>
                      ) : (
                        <span className="round-badge no-date-badge">{t.noDateLabel}</span>
                      )}
                      {m.time ? <span className="date-badge">{m.time}</span> : null}
                    </div>
                    <div className="match-teams-display">
                      <span className="team-name team-home">{m.team1}</span>
                      <span className="vs-tag">VS</span>
                      <span className="team-name team-away">{m.team2}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">{t.allPlayedOrEmpty}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Results Section */}
      <div className="section-container mt-4">
        <div className="grid-card">
          <div className="grid-card-header">
            <div className="header-title">
              <Flame size={20} className="text-danger" />
              <h3>{t.recentResultsTitle}</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('results')}>
              {t.allResults} <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-card-body">
            {recentResults.length > 0 ? (
              <div className="recent-results-grid">
                {recentResults.map(m => (
                  <div key={m.id} className="result-card">
                    <div className="result-header">
                      {hasDate(m) ? (
                        <span className="round-tag">{formatDateLabel(matchDate(m), lang)}</span>
                      ) : (
                        <span className="round-tag no-date-badge">{t.noDateLabel}</span>
                      )}
                      {m.time && <span className="date-tag">{m.time}</span>}
                    </div>
                    <div className="result-score-line">
                      <div className={`result-team ${m.score1 > m.score2 ? 'winner' : ''}`}>
                        <span>{m.team1}</span>
                        <span className="score-num">{m.score1}</span>
                      </div>
                      <div className="score-separator">-</div>
                      <div className={`result-team ${m.score2 > m.score1 ? 'winner' : ''}`}>
                        <span className="score-num">{m.score2}</span>
                        <span>{m.team2}</span>
                      </div>
                    </div>
                    {m.score1 === 9 && m.score2 === 9 && (
                      <div className="draw-pill">{t.drawPill}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="waiting-results-notice">
                <p>{t.waitingResultsText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regolamento Rapido & Comunicazione Risultati */}
      <section className="notice-banner">
        <div className="notice-icon">
          <Mail size={32} />
        </div>
        <div className="notice-content">
          <h4>{t.noticeTitle}</h4>
          <p>
            {t.noticeTextBefore} <strong>filippo.drago@iit.it</strong>, <strong>simone.nitti@iit.it</strong>, <strong>calogero.boscarini@iit.it</strong> {t.noticeSubject} <code>Table football tournament</code>, {t.noticeCc}
          </p>
        </div>
        <div className="notice-action">
          <button className="cta-btn secondary-btn" onClick={() => onNavigateTab('rules')}>
            {t.readRulesBtn}
          </button>
        </div>
      </section>
    </div>
  );
}

export default PublicHome;
