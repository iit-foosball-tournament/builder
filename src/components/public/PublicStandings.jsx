import React, { useState } from 'react';
import { Trophy, Award, Info, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// Knockout matches are stored in edition.knockout keyed qf1..fin with simple team-name fields.
// The public bracket is rendered directly from that real data model.
const KO_KEYS = {
  quarters: ['qf1', 'qf2', 'qf3', 'qf4'],
  semis: ['sf1', 'sf2'],
  final: ['fin'],
  third_place: ['f3p']
};

function KnockoutMatchCard({ match, getTeamColor }) {
  const played = match && match.status === 'played';
  const s1 = played ? parseInt(match.score1, 10) : null;
  const s2 = played ? parseInt(match.score2, 10) : null;
  const t1w = played && s1 !== null && s2 !== null && s1 > s2;
  const t2w = played && s1 !== null && s2 !== null && s2 > s1;
  const name1 = match ? match.team1 : '—';
  const name2 = match ? match.team2 : '—';
  return (
    <div className="result-match-card ko-match-card">
      <div className="result-meta-top">
        <span className={`status-pill ${played ? 'played' : 'scheduled'}`}>
          {played ? <CheckCircle size={12} /> : <Clock size={12} />}
          {played ? 'Concluso' : 'Da disputare'}
        </span>
      </div>
      <div className="result-scoreboard">
        <div className={`score-team-row ${t1w ? 'winner-row' : ''}`}>
          <div className="score-team-info">
            <span className="team-dot" style={{ backgroundColor: getTeamColor(name1) }}></span>
            <span className="score-team-name">{name1}</span>
          </div>
          <span className={`score-badge ${t1w ? 'score-winner' : ''}`}>{played ? s1 : '–'}</span>
        </div>
        <div className={`score-team-row ${t2w ? 'winner-row' : ''}`}>
          <div className="score-team-info">
            <span className="team-dot" style={{ backgroundColor: getTeamColor(name2) }}></span>
            <span className="score-team-name">{name2}</span>
          </div>
          <span className={`score-badge ${t2w ? 'score-winner' : ''}`}>{played ? s2 : '–'}</span>
        </div>
      </div>
    </div>
  );
}

function KnockoutBracketView({ edition, getTeamColor }) {
  const knockout = edition && edition.knockout ? edition.knockout : {};
  const knockoutRounds = (edition && Array.isArray(edition.rounds) ? edition.rounds : [])
    .filter(rd => rd && rd.type === 'knockout');
  const columns = knockoutRounds
    .map(rd => ({
      label: rd.name,
      stageType: rd.knockoutType,
      matches: (KO_KEYS[rd.knockoutType] || []).map(key => knockout[key]).filter(Boolean)
    }))
    .filter(col => col.matches.length > 0);
  // Display order: quarters, semis, final, third-place (main final before the 3rd/4th match).
  const DISPLAY_ORDER = { quarters: 0, semis: 1, final: 2, third_place: 3 };
  columns.sort((a, b) => (DISPLAY_ORDER[a.stageType] ?? 9) - (DISPLAY_ORDER[b.stageType] ?? 9));
  if (columns.length === 0) {
    for (const type of ['quarters', 'semis', 'final', 'third_place']) {
      const matches = (KO_KEYS[type] || []).map(key => knockout[key]).filter(Boolean);
      if (matches.length) columns.push({ label: type, matches });
    }
  }
  if (columns.length === 0) return null;
  return (
    <div className="ko-bracket">
      {columns.map(col => (
        <div className="ko-column" key={col.label}>
          <h4 className="ko-column-title">{col.label}</h4>
          <div className="ko-column-matches">
            {col.matches.map((m, idx) => (
              <KnockoutMatchCard key={m.id || `${col.label}-${idx}`} match={m} getTeamColor={getTeamColor} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicStandings({ edition, standings = [], getTeamColor, t }) {
  const [showBracket, setShowBracket] = useState(true);

  return (
    <div className="standings-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <Trophy className="page-icon text-warning" /> {t.standingsPageTitle}
          </h2>
          <p className="page-description">{t.standingsPageDesc}</p>
        </div>
      </div>

      {/* Rules Legend & Criteria */}
      <div className="standings-legend-card">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-marker winner-zone"></span>
            <span>{t.legendPlayoff}</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker mid-zone"></span>
            <span>{t.legendRegular}</span>
          </div>
        </div>
        <div className="points-rule-box">
          <Info size={14} />
          <span>{t.pointsRuleText}</span>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="card standings-card">
        <div className="table-responsive">
          <table className="standings-table main-table">
            <thead>
              <tr>
                <th className="th-pos">{t.thRank}</th>
                <th className="th-team text-left">{t.thTeam}</th>
                <th className="th-num">{t.thPlayed}</th>
                <th className="th-num">{t.thWon}</th>
                <th className="th-num">{t.thDrawn}</th>
                <th className="th-num">{t.thLost}</th>
                <th className="th-num">{t.thGoalsFor}</th>
                <th className="th-num">{t.thGoalsAgainst}</th>
                <th className="th-num">{t.thGoalDiff}</th>
                <th className="th-pts">{t.thPoints}</th>
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
                            <Award size={13} /> {t.cutoffLine}
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
                    {t.noTeamsInStandings}
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
                <h3>{t.bracketSectionTitle}</h3>
                <p className="subtitle">{t.bracketSectionSubtitle}</p>
              </div>
            </div>
            <button className="icon-btn-toggle">
              {showBracket ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {showBracket && (
            <div className="card-body">
              <KnockoutBracketView edition={edition} getTeamColor={getTeamColor} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicStandings;
