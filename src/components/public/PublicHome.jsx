import React from 'react';
import { Calendar, Trophy, Users, ShieldAlert, Clock, MapPin, Mail, ChevronRight, Award, Flame } from 'lucide-react';
import KnockoutBracket from './KnockoutBracket';

function PublicHome({ edition, getTeamName, getTeamColor, standings = [], onNavigateTab }) {
  const matches = edition.matches || [];
  
  // Filter scheduled and played matches
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const playedMatches = matches.filter(m => m.status === 'played');

  // Next scheduled matches (up to 6)
  const nextMatches = scheduledMatches.slice(0, 6);

  // Latest played matches (last 6)
  const recentResults = [...playedMatches].reverse().slice(0, 6);

  // Top 4 in standings for quick preview
  const topTeams = standings.slice(0, 4);

  return (
    <div className="home-dashboard">
      {/* Hero Welcome Banner */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badges">
            <span className="badge badge-primary">Edizione 2026</span>
            <span className="badge badge-accent">Double Open</span>
            <span className="badge badge-subtle">Stile Tradizionale</span>
          </div>
          <h1 className="hero-title">IIT Foosball Tournament 2026</h1>
          <p className="hero-subtitle">
            Campionato ufficiale di Calcio Balilla dell'Istituto Italiano di Tecnologia. 
            30 Squadre · 29 Giornate · 435 Partite · Fase Finale a Eliminazione Diretta (Top 8).
          </p>

          <div className="hero-info-pills">
            <div className="info-pill">
              <MapPin size={16} className="pill-icon" />
              <span>Tavolo Sala Mensa CCT Morego</span>
            </div>
            <div className="info-pill">
              <Clock size={16} className="pill-icon" />
              <span>Orario di gioco: 08:00 – 15:00</span>
            </div>
          </div>

          <div className="hero-cta-group">
            <button className="cta-btn primary-btn" onClick={() => onNavigateTab('calendar')}>
              <Calendar size={18} /> Vedi Calendario
            </button>
            <button className="cta-btn secondary-btn" onClick={() => onNavigateTab('standings')}>
              <Trophy size={18} /> Classifica Live
            </button>
            <button className="cta-btn outline-btn" onClick={() => onNavigateTab('teams')}>
              <Users size={18} /> Squadre & Foto
            </button>
          </div>
        </div>
      </section>

      {/* Quick Statistics Bar */}
      <section className="stats-bar">
        <div className="stat-card">
          <span className="stat-number">{edition.teams?.length || 30}</span>
          <span className="stat-label">Squadre Iscritte</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <span className="stat-number">29</span>
          <span className="stat-label">Giornate di Campionato</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <span className="stat-number">{playedMatches.length} / {matches.length}</span>
          <span className="stat-label">Partite Disputate</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <span className="stat-number">8</span>
          <span className="stat-label">Posti Playoff (Top 8)</span>
        </div>
      </section>

      {/* Main Grid: Standings Preview & Recent / Upcoming Matches */}
      <div className="home-content-grid">
        {/* Left Column: Quick Standings */}
        <div className="grid-card">
          <div className="grid-card-header">
            <div className="header-title">
              <Trophy size={20} className="text-warning" />
              <h3>Classifica (Top 4)</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('standings')}>
              Vedi tutta <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-card-body">
            {standings.length > 0 ? (
              <table className="mini-standings-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th className="text-left">Squadra</th>
                    <th>G</th>
                    <th>V</th>
                    <th>N</th>
                    <th>P</th>
                    <th>PT</th>
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
              <p className="empty-message">Nessuna partita giocata finora. La classifica si aggiornerà con i primi risultati!</p>
            )}
            <div className="playoff-info-note">
              <Award size={14} /> Le prime 8 squadre al termine delle 29 giornate si qualificano alla Fase Finale (Quarti di finale).
            </div>
          </div>
        </div>

        {/* Right Column: Prossimi Eventi in Programma */}
        <div className="grid-card">
          <div className="grid-card-header">
            <div className="header-title">
              <Calendar size={20} className="text-accent" />
              <h3>Prossimi Incontri in Programma</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('calendar')}>
              Tutto il Calendario <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-card-body">
            {nextMatches.length > 0 ? (
              <div className="mini-matches-list">
                {nextMatches.map(m => (
                  <div key={m.id} className="mini-match-row">
                    <div className="match-meta-tag">
                      <span className="round-badge">{m.round}</span>
                      {m.date ? <span className="date-badge">{m.date} {m.time}</span> : <span className="tbd-badge">Da concordare</span>}
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
              <p className="empty-message">Tutti gli incontri sono stati disputati o nessun incontro in programma.</p>
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
              <h3>Ultimi Risultati Registrati</h3>
            </div>
            <button className="link-button" onClick={() => onNavigateTab('results')}>
              Tutti i Risultati <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid-card-body">
            {recentResults.length > 0 ? (
              <div className="recent-results-grid">
                {recentResults.map(m => (
                  <div key={m.id} className="result-card">
                    <div className="result-header">
                      <span className="round-tag">{m.round}</span>
                      {m.date && <span className="date-tag">{m.date}</span>}
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
                      <div className="draw-pill">Pareggio (1 pt)</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="waiting-results-notice">
                <p>Nessun risultato ancora registrato. Non appena le squadre completeranno le prime partite, i risultati appariranno qui!</p>
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
          <h4>Come comunicare i risultati delle partite?</h4>
          <p>
            Al termine di ogni incontro, il mittente deve obbligatoriamente inviare un'e-mail a:
            <strong> filippo.drago@iit.it</strong>, <strong>simone.nitti@iit.it</strong> e <strong>calogero.boscarini@iit.it</strong>
            con oggetto <code>Table football tournament</code>, mettendo <strong>obbligatoriamente in CC tutti gli avversari</strong> e indicando i nomi delle squadre e il punteggio finale.
          </p>
        </div>
        <div className="notice-action">
          <button className="cta-btn secondary-btn" onClick={() => onNavigateTab('rules')}>
            Leggi il Regolamento
          </button>
        </div>
      </section>
    </div>
  );
}

export default PublicHome;
