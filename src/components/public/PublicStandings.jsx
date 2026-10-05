import React, { useState } from 'react';
import { Trophy, Award, Info, ChevronDown, ChevronUp } from 'lucide-react';
import KnockoutBracket from './KnockoutBracket';

function PublicStandings({ edition, standings = [], getTeamName, getTeamColor }) {
  const [showBracket, setShowBracket] = useState(true);

  return (
    <div className="standings-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Trophy className="page-icon text-warning" /> Classifica Ufficiale con i Punti
          </h2>
          <p className="page-description">
            Campionato a girone unico (30 squadre, 29 giornate). Le prime 8 classificate accedono alla Fase Finale ad eliminazione diretta.
          </p>
        </div>
      </div>

      {/* Rules Legend & Criteria */}
      <div className="standings-legend-card">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-marker winner-zone"></span>
            <span><strong>Posizioni 1 – 8:</strong> Qualificazione ai Quarti di Finale (Playoff)</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker mid-zone"></span>
            <span><strong>Posizioni 9 – 30:</strong> Girone Unico Regolare</span>
          </div>
        </div>
        <div className="points-rule-box">
          <Info size={14} />
          <span>
            <strong>Punteggi:</strong> Vittoria a 10 gol = <strong>3 pt</strong> | Pareggio a 9-9 = <strong>1 pt</strong> | Sconfitta = <strong>0 pt</strong>.
            Criteri in caso di parità punti: <em>1° Differenza Reti</em> &rarr; <em>2° Scontro Diretto</em> &rarr; <em>3° Gol Segnati</em>.
          </span>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="card standings-card">
        <div className="table-responsive">
          <table className="standings-table main-table">
            <thead>
              <tr>
                <th className="th-pos">#</th>
                <th className="th-team text-left">Squadra</th>
                <th className="th-num">G</th>
                <th className="th-num">V</th>
                <th className="th-num">N</th>
                <th className="th-num">P</th>
                <th className="th-num">GF</th>
                <th className="th-num">GS</th>
                <th className="th-num">DR</th>
                <th className="th-pts">PT</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, idx) => {
                const pos = idx + 1;
                const isPlayoffZone = pos <= 8;
                const isEighthCutoff = pos === 8;

                return (
                  <React.Fragment key={team.id || team.name || idx}>
                    <tr className={`standings-row ${isPlayoffZone ? 'playoff-zone' : ''} ${isEighthCutoff ? 'playoff-border-bottom' : ''}`}>
                      <td className="td-pos">
                        <span className={`rank-badge ${pos <= 3 ? `top-three top-${pos}` : isPlayoffZone ? 'top-eight' : ''}`}>
                          {pos}
                        </span>
                      </td>
                      <td className="text-left td-team font-bold">
                        <div className="team-cell-content">
                          <span 
                            className="team-color-swatch" 
                            style={{ backgroundColor: team.logoColor || getTeamColor(team.name) }}
                          ></span>
                          <span className="team-name-text">{team.name}</span>
                          {pos <= 8 && <span className="playoff-indicator-badge">Q</span>}
                        </div>
                      </td>
                      <td className="td-num">{team.played || 0}</td>
                      <td className="td-num stat-v">{team.won || 0}</td>
                      <td className="td-num stat-n">{team.drawn || 0}</td>
                      <td className="td-num stat-p">{team.lost || 0}</td>
                      <td className="td-num">{team.gf || 0}</td>
                      <td className="td-num">{team.ga || 0}</td>
                      <td className={`td-num font-semibold ${team.gd > 0 ? 'text-success' : team.gd < 0 ? 'text-danger' : ''}`}>
                        {team.gd > 0 ? `+${team.gd}` : team.gd || 0}
                      </td>
                      <td className="td-pts font-extrabold">{team.points || 0}</td>
                    </tr>
                    {isEighthCutoff && (
                      <tr className="cutoff-divider-row">
                        <td colSpan="10">
                          <div className="cutoff-line-label">
                            <Award size={13} /> Linea di Qualificazione Quarti di Finale (Top 8)
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {standings.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-6 text-muted">
                    Nessuna squadra presente in archivio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Knockout Playoff Bracket Section */}
      <div className="bracket-wrapper mt-4">
        <div className="card">
          <div className="card-header flex-between cursor-pointer" onClick={() => setShowBracket(!showBracket)}>
            <div className="bracket-title-header">
              <Award size={22} className="text-warning" />
              <div>
                <h3>Tabellone Fase Finale a Eliminazione Diretta (Playoff)</h3>
                <p className="subtitle">
                  Accoppiamenti ufficiali: 1ª vs 8ª (QF1), 4ª vs 5ª (QF2), 2ª vs 7ª (QF3), 3ª vs 6ª (QF4). Regola vantaggi a 2 gol (no pareggi).
                </p>
              </div>
            </div>
            <button className="icon-btn-toggle">
              {showBracket ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {showBracket && (
            <div className="card-body">
              <KnockoutBracket 
                edition={edition} 
                standings={standings} 
                getTeamName={getTeamName} 
                getTeamColor={getTeamColor} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicStandings;
