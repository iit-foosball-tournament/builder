import React from 'react';
import { Award, Trophy, CheckCircle, ShieldAlert } from 'lucide-react';

function KnockoutEditor({ knockout = {}, standings = [], onUpdateKnockout }) {
  const top8Teams = standings.slice(0, 8);

  const stagesList = [
    { key: 'qf1', title: 'QF1: 1ª Classificata vs 8ª Classificata', defaultT1: top8Teams[0]?.name || '1ª Classificata', defaultT2: top8Teams[7]?.name || '8ª Classificata' },
    { key: 'qf2', title: 'QF2: 4ª Classificata vs 5ª Classificata', defaultT1: top8Teams[3]?.name || '4ª Classificata', defaultT2: top8Teams[4]?.name || '5ª Classificata' },
    { key: 'qf3', title: 'QF3: 2ª Classificata vs 7ª Classificata', defaultT1: top8Teams[1]?.name || '2ª Classificata', defaultT2: top8Teams[6]?.name || '7ª Classificata' },
    { key: 'qf4', title: 'QF4: 3ª Classificata vs 6ª Classificata', defaultT1: top8Teams[2]?.name || '3ª Classificata', defaultT2: top8Teams[5]?.name || '6ª Classificata' },
    { key: 'sf1', title: 'SF1: Vincente QF1 vs Vincente QF2', defaultT1: 'Vincente QF1', defaultT2: 'Vincente QF2' },
    { key: 'sf2', title: 'SF2: Vincente QF3 vs Vincente QF4', defaultT1: 'Vincente QF3', defaultT2: 'Vincente QF4' },
    { key: 'f3p', title: 'Finale 3°/4° Posto: Perdente SF1 vs Perdente SF2', defaultT1: 'Perdente SF1', defaultT2: 'Perdente SF2' },
    { key: 'fin', title: 'Finalissima 1°/2° Posto: Vincente SF1 vs Vincente SF2', defaultT1: 'Vincente SF1', defaultT2: 'Vincente SF2' }
  ];

  const handleScoreUpdate = (key, s1, s2) => {
    const current = knockout[key] || {};
    const score1 = s1 !== '' && s1 !== null ? parseInt(s1, 10) : null;
    const score2 = s2 !== '' && s2 !== null ? parseInt(s2, 10) : null;
    const status = score1 !== null && score2 !== null ? 'played' : 'scheduled';

    onUpdateKnockout(key, {
      ...current,
      score1,
      score2,
      status
    });
  };

  const handleTeamNameUpdate = (key, t1, t2) => {
    const current = knockout[key] || {};
    onUpdateKnockout(key, {
      ...current,
      team1: t1 !== undefined ? t1 : current.team1,
      team2: t2 !== undefined ? t2 : current.team2
    });
  };

  return (
    <div className="knockout-editor-container">
      <div className="card-header-banner">
        <div>
          <h3><Award className="inline-icon mr-2 text-warning" /> Gestione Fase Finale Playoff (Top 8)</h3>
          <p className="subtitle">
            Gestisci gli accoppiamenti e i punteggi dei Quarti di Finale, Semifinali e Finali. 
            Ricorda che nei playoff non è previsto il pareggio (regola dei vantaggi di 2 gol sul 9-9).
          </p>
        </div>
      </div>

      <div className="knockout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
        {stagesList.map(({ key, title, defaultT1, defaultT2 }) => {
          const match = knockout[key] || {};
          const team1 = match.team1 || defaultT1;
          const team2 = match.team2 || defaultT2;
          const s1 = match.score1 !== null && match.score1 !== undefined ? match.score1 : '';
          const s2 = match.score2 !== null && match.score2 !== undefined ? match.score2 : '';
          const isPlayed = match.status === 'played';

          return (
            <div key={key} className="card knockout-card" style={{ borderLeft: isPlayed ? '6px solid #eab308' : '6px solid #cbd5e1', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>{title}</strong>
                {isPlayed ? (
                  <span className="badge badge-accent"><CheckCircle size={12} /> Concluso</span>
                ) : (
                  <span className="badge badge-subtle">Da disputare</span>
                )}
              </div>

              <div className="ko-score-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 60px 20px 60px 1fr', gap: '8px', alignItems: 'center' }}>
                <div>
                  <input 
                    type="text" 
                    value={team1} 
                    onChange={e => handleTeamNameUpdate(key, e.target.value, undefined)}
                    style={{ width: '100%', fontSize: '13px', fontWeight: 'bold' }}
                    placeholder="Squadra 1"
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    value={s1} 
                    onChange={e => handleScoreUpdate(key, e.target.value, s2)}
                    placeholder="Gol"
                    style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}
                  />
                </div>
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>-</div>
                <div>
                  <input 
                    type="number" 
                    value={s2} 
                    onChange={e => handleScoreUpdate(key, s1, e.target.value)}
                    placeholder="Gol"
                    style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={team2} 
                    onChange={e => handleTeamNameUpdate(key, undefined, e.target.value)}
                    style={{ width: '100%', fontSize: '13px', fontWeight: 'bold' }}
                    placeholder="Squadra 2"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KnockoutEditor;
