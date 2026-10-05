import React from 'react';
import { BookOpen, Download, MapPin, Clock, Award, Mail } from 'lucide-react';

function PublicRules({ lang, setLang, t }) {
  return (
    <div className="rules-page">
      <div className="page-header">
        <div className="page-header-text">
          <h2>
            <BookOpen className="page-icon text-accent" /> {t.rulesPageTitle}
          </h2>
          <p className="page-description">{t.rulesPageDesc}</p>
        </div>

        {/* Language Switcher & Downloads */}
        <div className="rules-actions-bar">
          <div className="lang-switch-group">
            <button 
              className={`lang-btn ${lang === 'it' ? 'active' : ''}`}
              onClick={() => setLang('it')}
            >
              🇮🇹 Italiano
            </button>
            <button 
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              🇬🇧 English
            </button>
          </div>

          <div className="download-buttons-group">
            <a href="./regolamento_it.pdf" download="IIT_Regolamento_Torneo_Calcio_Balilla.pdf" className="doc-download-btn">
              <Download size={15} /> {t.downloadPdfIt}
            </a>
            <a href="./rules_en.pdf" download="IIT_Table_Football_Tournament_Rules.pdf" className="doc-download-btn">
              <Download size={15} /> {t.downloadPdfEn}
            </a>
            <a href="./locandina.pdf" download="locandina_calcio_balilla_IIT.pdf" className="doc-download-btn locandina-btn">
              <Download size={15} /> {t.downloadFlyer}
            </a>
          </div>
        </div>
      </div>

      {/* Rules Content */}
      {lang === 'it' ? (
        <div className="rules-content-body">
          {/* Section 1 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">1</span>
              <h3>Formato del Torneo</h3>
            </div>
            <div className="rule-card-body">
              <p>
                <strong>Campionato a girone unico a partita secca (tutti contro tutti).</strong> Al termine del campionato, le prime <strong>8 squadre classificate</strong> si qualificheranno alla fase finale a eliminazione diretta secondo il seguente schema:
              </p>
              <div className="bracket-table-wrap">
                <table className="mini-rules-table">
                  <thead>
                    <tr>
                      <th>Fase</th>
                      <th>Incontro</th>
                      <th>Accoppiamento Squadre</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Quarti di Finale</td><td><strong>QF1</strong></td><td>1ª Classificata vs 8ª Classificata</td></tr>
                    <tr><td>Quarti di Finale</td><td><strong>QF2</strong></td><td>4ª Classificata vs 5ª Classificata</td></tr>
                    <tr><td>Quarti di Finale</td><td><strong>QF3</strong></td><td>2ª Classificata vs 7ª Classificata</td></tr>
                    <tr><td>Quarti di Finale</td><td><strong>QF4</strong></td><td>3ª Classificata vs 6ª Classificata</td></tr>
                    <tr><td>Semifinali</td><td><strong>SF1</strong></td><td>Vincente QF1 vs Vincente QF2</td></tr>
                    <tr><td>Semifinali</td><td><strong>SF2</strong></td><td>Vincente QF3 vs Vincente QF4</td></tr>
                    <tr><td>Finale 3°/4° Posto</td><td><strong>F3P</strong></td><td>Perdente SF1 vs Perdente SF2</td></tr>
                    <tr><td>Finale 1°/2° Posto</td><td><strong>FIN</strong></td><td>Vincente SF1 vs Vincente SF2</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">2</span>
              <h3>Organizzazione delle Partite</h3>
            </div>
            <div className="rule-card-body">
              <p>
                Una volta pubblicato il calendario, <strong>ciascuna squadra organizzerà autonomamente</strong> lo svolgimento delle proprie partite contattando i rispettivi avversari.
              </p>
              <div className="details-boxes-grid">
                <div className="detail-box">
                  <MapPin className="text-accent" size={18} />
                  <div>
                    <strong>Location:</strong>
                    <p>Tavolo da gioco presso la <strong>sala mensa del CCT Morego</strong>.</p>
                  </div>
                </div>
                <div className="detail-box">
                  <Clock className="text-accent" size={18} />
                  <div>
                    <strong>Orari di accesso:</strong>
                    <p>Dalle <strong>8:00 alle 15:00</strong> (chiusura sala mensa ore 15:30).</p>
                  </div>
                </div>
              </div>
              <p className="mt-2">
                <strong>Turno di recupero:</strong> Verrà previsto un turno di recupero dedicato alle eventuali partite non disputate durante il campionato. Qualora una partita non dovesse svolgersi neppure entro tale termine, entrambe le squadre subiranno la <strong>sconfitta a tavolino (0-10, 0 punti in classifica)</strong>.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">3</span>
              <h3>Punteggio e Risultati</h3>
            </div>
            <div className="rule-card-body">
              <h4>Fase a Gironi:</h4>
              <ul className="rules-list">
                <li><strong>Vittoria (3 punti):</strong> Assegnati alla squadra che raggiunge per prima i 10 gol.</li>
                <li><strong>Pareggio (1 punto a testa):</strong> Se il punteggio raggiunge il <strong>9-9</strong>, la partita termina immediatamente in parità.</li>
                <li>
                  <strong>Criterio di Parità in Classifica:</strong> In caso di parità di punti in classifica tra due o più squadre al termine della fase a gironi, la posizione sarà determinata da:
                  <ol className="sub-criteria-list">
                    <li>Migliore <strong>differenza reti</strong> (gol fatti meno gol subiti).</li>
                    <li>In caso di ulteriore parità, <strong>scontro diretto</strong>.</li>
                    <li>Infine, <strong>gol totali segnati</strong>.</li>
                  </ol>
                </li>
              </ul>

              <h4 className="mt-3">Fase a Eliminazione Diretta (Quarti, Semifinali e Finali):</h4>
              <div className="highlight-callout">
                <Award size={18} />
                <p>
                  <strong>Vantaggi (No Pareggio):</strong> Sul punteggio di 9-9, la partita prosegue ai vantaggi: per vincere l'incontro una squadra dovrà <strong>staccare l'avversaria di 2 gol di scarto</strong> (es. 11-9, 12-10, 13-11, ecc.). Non sono previsti pareggi nella fase finale.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="card rule-section-card alert-border">
            <div className="rule-card-header">
              <span className="section-number">4</span>
              <h3>Comunicazione Risultati</h3>
            </div>
            <div className="rule-card-body">
              <div className="email-rule-box">
                <Mail className="text-primary" size={24} />
                <div>
                  <p>
                    Al termine di ogni match, il punteggio finale deve essere comunicato via e-mail agli organizzatori:
                  </p>
                  <div className="emails-list">
                    <code>filippo.drago@iit.it</code>
                    <code>simone.nitti@iit.it</code>
                    <code>calogero.boscarini@iit.it</code>
                  </div>
                  <p className="mt-2">
                    <strong>Oggetto obbligatorio:</strong> <code>Table football tournament</code>
                  </p>
                  <p className="cc-warning">
                    ⚠️ <strong>Regola d'invio:</strong> Il mittente deve <u>obbligatoriamente mettere in CC tutti gli altri giocatori</u> partecipanti alla partita e specificare chiaramente nel testo i nomi delle due squadre e il risultato finale.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">5</span>
              <h3>Servizio e Messa in Gioco</h3>
            </div>
            <div className="rule-card-body">
              <ul className="rules-list">
                <li>Il primo servizio della partita viene sorteggiato.</li>
                <li>I servizi successivi spettano alla squadra che ha appena subito il gol.</li>
                <li>La pallina può essere rimessa in gioco dal centro campo oppure inserita dal foro centrale senza imprimere alcun effetto.</li>
                <li><strong>Prima di poter effettuare un tiro in porta direttamente dal servizio</strong>, la pallina deve toccare almeno una volta la sponda del tavolo e un omino del centrocampo.</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="card rule-section-card danger-accent">
            <div className="rule-card-header">
              <span className="section-number">6</span>
              <h3>Falli e Infrangimento delle Regole</h3>
            </div>
            <div className="rule-card-body">
              <p className="mb-2">
                Se un gol scaturisce da un'azione viziata da un fallo, il punto viene annullato e il gioco riprende dalla difesa di chi ha subito l'infrazione. Sono considerati falli:
              </p>
              <div className="fouls-grid">
                <div className="foul-item">
                  <div className="foul-title">🚫 Rullare</div>
                  <p>Far compiere alla stecca una rotazione superiore a 360° prima o dopo l'impatto con la palla.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Gancio</div>
                  <p>Il passaggio della palla tra un omino e l'altro della stessa stecca o doppio tocco con lo stesso omino; carambola in tiro unico su due omini della stessa stecca (gancio involontario).</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Trascinamento</div>
                  <p>Trascinare la palla con l'omino prima del tiro o del passaggio.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Pallonetto</div>
                  <p>Far alzare la pallina scavalcando una o più stecche.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Urti e Vibrazioni</div>
                  <p>Urtare o sbattere violentemente le sbarre contro le sponde per disturbare l'avversario o spostare il tavolo influenzando la traiettoria della pallina.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Invasione e Tocco di Mano</div>
                  <p>Severamente vietato toccare la pallina con le mani, soffiarci sopra o influenzarne il movimento con parti del corpo o oggetti mentre è in gioco. Consentito solo a palla completamente ferma (palla morta) o prima del servizio.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">7</span>
              <h3>Palla Morta, Fuori Campo e Cambio Ruolo</h3>
            </div>
            <div className="rule-card-body">
              <ul className="rules-list">
                <li>
                  <strong>Palla morta:</strong> Se la pallina si ferma in una zona non raggiungibile da alcuna stecca:
                  <ul>
                    <li><em>A centrocampo:</em> Durante il servizio ribatte chi ha lanciato la palla; durante il gioco la palla viene rimessa in gioco dalla squadra con meno punti (in caso di parità decisione a discrezione delle squadre).</li>
                    <li><em>In zona difensiva:</em> La palla viene riassegnata al portiere/difesa di quel lato.</li>
                  </ul>
                </li>
                <li><strong>Palla fuori dal campo:</strong> Se la pallina schizza fuori dal tavolo, la ripresa spetta alla difesa della squadra che stava subendo l'azione.</li>
                <li><strong>Cambio ruolo:</strong> Il cambio di ruolo tra attaccante e difensore si può fare esclusivamente a <strong>gioco fermo</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ENGLISH VERSION */
        <div className="rules-content-body">
          {/* Section 1 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">1</span>
              <h3>Tournament Format</h3>
            </div>
            <div className="rule-card-body">
              <p>
                <strong>Single round-robin league (every team plays against every other team in a single match).</strong> At the end of the league stage, the top <strong>8 teams</strong> will qualify for the knockout final stage according to the following bracket:
              </p>
              <div className="bracket-table-wrap">
                <table className="mini-rules-table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Match</th>
                      <th>Teams</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Quarter-Finals</td><td><strong>QF1</strong></td><td>1st Seed vs 8th Seed</td></tr>
                    <tr><td>Quarter-Finals</td><td><strong>QF2</strong></td><td>4th Seed vs 5th Seed</td></tr>
                    <tr><td>Quarter-Finals</td><td><strong>QF3</strong></td><td>2nd Seed vs 7th Seed</td></tr>
                    <tr><td>Quarter-Finals</td><td><strong>QF4</strong></td><td>3rd Seed vs 6th Seed</td></tr>
                    <tr><td>Semi-Finals</td><td><strong>SF1</strong></td><td>Winner QF1 vs Winner QF2</td></tr>
                    <tr><td>Semi-Finals</td><td><strong>SF2</strong></td><td>Winner QF3 vs Winner QF4</td></tr>
                    <tr><td>3rd/4th Place Final</td><td><strong>3PM</strong></td><td>Loser SF1 vs Loser SF2</td></tr>
                    <tr><td>1st/2nd Place Final</td><td><strong>FIN</strong></td><td>Winner SF1 vs Winner SF2</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">2</span>
              <h3>Match Organization</h3>
            </div>
            <div className="rule-card-body">
              <p>
                Once the schedule is published, <strong>each team will independently arrange their matches</strong> by contacting their opponents.
              </p>
              <div className="details-boxes-grid">
                <div className="detail-box">
                  <MapPin className="text-accent" size={18} />
                  <div>
                    <strong>Location:</strong>
                    <p>Table located in the <strong>CCT Morego cafeteria</strong>.</p>
                  </div>
                </div>
                <div className="detail-box">
                  <Clock className="text-accent" size={18} />
                  <div>
                    <strong>Access hours:</strong>
                    <p>From <strong>8:00 AM to 3:00 PM</strong> (cafeteria closes at 3:30 PM).</p>
                  </div>
                </div>
              </div>
              <p className="mt-2">
                <strong>Make-up round:</strong> A dedicated make-up round will be scheduled for unplayed matches. If still unplayed, both teams receive a <strong>forfeit loss (0-10, 0 points)</strong>.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">3</span>
              <h3>Scoring and Standings</h3>
            </div>
            <div className="rule-card-body">
              <h4>Group Stage:</h4>
              <ul className="rules-list">
                <li><strong>Win (3 points):</strong> Awarded to the team that reaches 10 goals first.</li>
                <li><strong>Draw (1 point each):</strong> If the score reaches <strong>9-9</strong>, the match ends immediately in a draw.</li>
                <li>
                  <strong>Tie-breaking criteria:</strong> 
                  <ol className="sub-criteria-list">
                    <li>Goal difference (goals scored minus goals conceded).</li>
                    <li>Head-to-head result.</li>
                    <li>Total goals scored.</li>
                  </ol>
                </li>
              </ul>

              <h4 className="mt-3">Knockout Stage (Quarter-Finals, Semi-Finals, and Finals):</h4>
              <div className="highlight-callout">
                <Award size={18} />
                <p>
                  <strong>Advantage Rule (No Draws):</strong> At 9-9, the match continues under the advantage rule: to win, a team must <strong>lead by 2 goals</strong> (e.g., 11-9, 12-10). No draws in knockout stage.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="card rule-section-card alert-border">
            <div className="rule-card-header">
              <span className="section-number">4</span>
              <h3>Reporting Results</h3>
            </div>
            <div className="rule-card-body">
              <div className="email-rule-box">
                <Mail className="text-primary" size={24} />
                <div>
                  <p>
                    After each match, the final score must be sent via email to:
                  </p>
                  <div className="emails-list">
                    <code>filippo.drago@iit.it</code>
                    <code>simone.nitti@iit.it</code>
                    <code>calogero.boscarini@iit.it</code>
                  </div>
                  <p className="mt-2">
                    <strong>Mandatory subject:</strong> <code>Table football tournament</code>
                  </p>
                  <p className="cc-warning">
                    ⚠️ <strong>Submission rule:</strong> The sender must <u>CC all other players</u> who participated in the match and clearly specify both team names and final score.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">5</span>
              <h3>Service and Ball Placement</h3>
            </div>
            <div className="rule-card-body">
              <ul className="rules-list">
                <li>First service is determined by coin toss/draw.</li>
                <li>Subsequent services belong to the team conceding the goal.</li>
                <li>Served from center or central hole without spin.</li>
                <li>Before direct goal from service, ball must touch at least one side-wall and one midfield figure.</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="card rule-section-card danger-accent">
            <div className="rule-card-header">
              <span className="section-number">6</span>
              <h3>Fouls and Infractions</h3>
            </div>
            <div className="rule-card-body">
              <div className="fouls-grid">
                <div className="foul-item">
                  <div className="foul-title">🚫 Spinning (Rullare)</div>
                  <p>Rotating the rod more than 360° before or after hitting the ball.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Passing / Carom (Gancio)</div>
                  <p>Passing ball between figures on the same rod or double touching with same figure.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Dragging (Trascinamento)</div>
                  <p>Dragging the ball with the player figure before shooting or passing.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Aerial Shots / Lobs (Pallonetto)</div>
                  <p>Raising the ball into the air over one or more rods.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Jars and Vibrations</div>
                  <p>Banging or slamming rods against side-walls or shaking the table.</p>
                </div>
                <div className="foul-item">
                  <div className="foul-title">🚫 Hand Contact / Interference</div>
                  <p>Touching ball with hands or blowing on it while in play. Allowed only when completely dead.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className="card rule-section-card">
            <div className="rule-card-header">
              <span className="section-number">7</span>
              <h3>Dead Ball, Out of Bounds, Position Swaps</h3>
            </div>
            <div className="rule-card-body">
              <ul className="rules-list">
                <li><strong>Dead ball:</strong> In midfield, re-served by serving team or team with fewer points. In defense, awarded to that side's goalie.</li>
                <li><strong>Out of bounds:</strong> Play resumes from defense of the team defending at the time.</li>
                <li><strong>Position swaps:</strong> Allowed only when play is stopped.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicRules;
