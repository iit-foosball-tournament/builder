import { HelpCircle, Save, Users, Globe } from 'lucide-react';

function ColleagueGuide() {
  return (
    <div className="colleague-guide-container">
      <div className="card-header-banner">
        <div>
          <h3><HelpCircle className="inline-icon mr-2 text-accent" /> Come aggiornare il torneo</h3>
          <p className="subtitle">Niente file da esportare e nessuna pubblicazione manuale: basta salvare le modifiche.</p>
        </div>
      </div>

      <div className="steps-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card" style={{ borderLeft: '6px solid #0284c7' }}>
          <div className="card-body">
            <h4><Users className="inline-icon mr-2" /> Aggiorna risultati, squadre o foto</h4>
            <p>Apri la scheda corrispondente e modifica i campi. Le foto selezionate restano nel tuo browser fino al salvataggio: controlla l’anteprima. Non chiudere la pagina prima di salvare.</p>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '6px solid #16a34a' }}>
          <div className="card-body">
            <h4><Save className="inline-icon mr-2" /> Premi «Salva»</h4>
            <p>Le modifiche non sono pubbliche finché non premi il pulsante verde in alto. Attendi il messaggio «Salvato online».</p>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '6px solid #8b5cf6' }}>
          <div className="card-body">
            <h4><Globe className="inline-icon mr-2" /> Il sito pubblico si aggiorna da solo</h4>
            <p>I dati e le foto vengono letti dal database condiviso. Non servono ZIP, Git, terminale o una nuova pubblicazione.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h4>Se un altro editor ha modificato gli stessi dati</h4>
            <p>Il salvataggio viene bloccato per non sovrascrivere il suo lavoro. La tua bozza rimane aperta: confronta le modifiche prima di premere «Ricarica dati online», che chiede conferma prima di scartarla. Puoi annullare per mantenerla.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColleagueGuide;
