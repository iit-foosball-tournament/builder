import React from 'react';
import { HelpCircle, CheckCircle2, Upload, Download, Globe, Terminal, FileCode, Shield } from 'lucide-react';

function ColleagueGuide() {
  return (
    <div className="colleague-guide-container">
      <div className="card-header-banner">
        <div>
          <h3><HelpCircle className="inline-icon mr-2 text-accent" /> Guida Operativa per la Gestione del Torneo</h3>
          <p className="subtitle">
            Questa guida spiega in modo semplice passo dopo passo come aggiornare le partite, le classifiche, le foto delle squadre e come pubblicare le modifiche online.
          </p>
        </div>
      </div>

      <div className="steps-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Step 1: Ricezione mail & inserimento punteggio */}
        <div className="card" style={{ borderLeft: '6px solid #0284c7' }}>
          <div className="card-body">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', margin: '0 0 10px 0' }}>
              <span className="step-num-circle">1</span> Ricevi l'e-mail con il risultato e inseriscilo
            </h4>
            <p>
              I giocatori che disputano una partita inviano un'e-mail con oggetto <code>Table football tournament</code> e gli avversari in CC.
            </p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Vai nella scheda <strong>"⚽ Risultati &amp; Partite"</strong> qui nel Builder.</li>
              <li>Seleziona la <strong>Giornata</strong> corrispondente o cerca il nome di una delle squadre nel campo di ricerca.</li>
              <li>Inserisci i gol realizzati da ciascuna squadra (es. <code>10</code> a <code>7</code>, oppure <code>9</code> a <code>9</code> in caso di pareggio).</li>
              <li>La partita passa automaticamente a <strong>"Giocata"</strong> e la classifica con i punti e la differenza reti si aggiorna istantaneamente in tempo reale!</li>
            </ul>
          </div>
        </div>

        {/* Step 2: Caricamento foto squadra */}
        <div className="card" style={{ borderLeft: '6px solid #16a34a' }}>
          <div className="card-body">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', margin: '0 0 10px 0' }}>
              <span className="step-num-circle">2</span> Carica la foto ufficiale di una squadra
            </h4>
            <p>
              Quando scatti o ricevi la foto di una coppia/squadra:
            </p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Vai nella scheda <strong>"👥 Squadre &amp; Foto"</strong>.</li>
              <li>Trova la squadra e clicca sul pulsante <strong>"Carica Foto"</strong>.</li>
              <li>Seleziona l'immagine dal tuo computer. L'anteprima si aggiornerà subito.</li>
              <li>Puoi anche completare o correggere i nominativi dei due giocatori e le loro email se mancavano.</li>
            </ul>
          </div>
        </div>

        {/* Step 3: Esportazione bundle ZIP */}
        <div className="card" style={{ borderLeft: '6px solid #eab308' }}>
          <div className="card-body">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', margin: '0 0 10px 0' }}>
              <span className="step-num-circle">3</span> Esporta il pacchetto dati aggiornato
            </h4>
            <p>
              Una volta inseriti i nuovi risultati o foto, clicca sul pulsante in alto:
            </p>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', margin: '10px 0' }}>
              <strong style={{ color: '#0f172a' }}>📦 Clicca su "Esporta Pacchetto ZIP" nella barra in alto</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Verrà scaricato un file <code>iit_foosball_database_YYYY-MM-DD.zip</code> contenente il file <code>data.json</code> e la cartella delle immagini <code>images/</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Pubblicazione su GitHub Pages */}
        <div className="card" style={{ borderLeft: '6px solid #8b5cf6' }}>
          <div className="card-body">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6d28d9', margin: '0 0 10px 0' }}>
              <span className="step-num-circle">4</span> Pubblica online sul sito pubblico (GitHub Pages)
            </h4>
            <p>
              Per aggiornare il sito web visibile a tutti i colleghi, ci sono due metodi semplicissimi:
            </p>

            <div style={{ marginTop: '12px' }}>
              <h5>Metodo A (Consigliato - Script automatico a 1 comando):</h5>
              <div style={{ background: '#0f172a', color: '#38bdf8', padding: '12px 16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
                ./publish_public.sh ../iit-foosball-tournament.github.io
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                Questo script compila il sito con i nuovi dati, lo copia nel repository del sito e prepara il deploy. Poi basta fare:
              </p>
              <div style={{ background: '#0f172a', color: '#cbd5e1', padding: '12px 16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
                cd ../iit-foosball-tournament.github.io<br />
                git add .<br />
                git commit -m "Aggiornamento risultati e classifiche"<br />
                git push origin main
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h5>Metodo B (Copia manuale file ZIP):</h5>
              <ol style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '13px' }}>
                <li>Estrai lo ZIP scaricato al Passo 3.</li>
                <li>Copia il file <code>data.json</code> e la cartella <code>images/</code> dentro la cartella <code>data/</code> del repository <code>iit-foosball-tournament.github.io</code>.</li>
                <li>Fai commit e push su GitHub: in 60 secondi GitHub Pages aggiornerà automaticamente il sito online!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColleagueGuide;
