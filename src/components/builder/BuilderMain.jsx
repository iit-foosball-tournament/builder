import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  Users, 
  Calendar, 
  Award, 
  Download, 
  Upload, 
  Play, 
  HelpCircle,
  Trophy,
  Save,
  CheckCircle2
} from 'lucide-react';
import TeamEditor from './TeamEditor';
import MatchEditor from './MatchEditor';
import KnockoutEditor from './KnockoutEditor';
import ColleagueGuide from './ColleagueGuide';

function BuilderMain({
  editions,
  activeEditionYear,
  onUpdateEdition,
  onPreviewToggle,
  standings = []
}) {
  const [activeBuilderTab, setActiveBuilderTab] = useState('matches');
  const [saveFeedback, setSaveFeedback] = useState('');

  const currentEdition = editions[activeEditionYear] || {};
  const teams = currentEdition.teams || [];
  const matches = currentEdition.matches || [];
  const knockout = currentEdition.knockout || {};

  // Show temporary feedback banner
  const triggerFeedback = (msg) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(''), 3500);
  };

  // Team mutations
  const handleAddTeam = (name, logoColor, extra = {}) => {
    const newId = `team-${Date.now()}`;
    const newTeam = {
      id: newId,
      name,
      logoColor,
      player1: extra.player1 || '',
      player2: extra.player2 || '',
      photo: extra.photo || ''
    };
    const updatedTeams = [...teams, newTeam];
    onUpdateEdition({ ...currentEdition, teams: updatedTeams });
    triggerFeedback(`Squadra "${name}" aggiunta con successo!`);
  };

  const handleDeleteTeam = (teamId) => {
    const updatedTeams = teams.filter(t => t.id !== teamId);
    onUpdateEdition({ ...currentEdition, teams: updatedTeams });
    triggerFeedback('Squadra rimossa.');
  };

  const handleUpdateTeam = (teamId, patch) => {
    const updatedTeams = teams.map(t => t.id === teamId ? { ...t, ...patch } : t);
    onUpdateEdition({ ...currentEdition, teams: updatedTeams });
    triggerFeedback('Dati squadra aggiornati!');
  };

  // Match mutations
  const handleUpdateMatch = (matchId, patch) => {
    const updatedMatches = matches.map(m => m.id === matchId ? { ...m, ...patch } : m);
    onUpdateEdition({ ...currentEdition, matches: updatedMatches });
    triggerFeedback('Risultato partita salvato!');
  };

  // Knockout mutations
  const handleUpdateKnockout = (key, patch) => {
    const updatedKnockout = { ...knockout, [key]: patch };
    onUpdateEdition({ ...currentEdition, knockout: updatedKnockout });
    triggerFeedback('Dati playoff salvati!');
  };

  // Export ZIP Bundle
  const handleExportZip = async () => {
    const zip = new JSZip();

    // Deep clone database for exporting
    const dbToExport = {
      activeEditionYear,
      editions: JSON.parse(JSON.stringify(editions))
    };

    const imgFolder = zip.folder("images");

    // Extract base64 team photos to files inside ZIP
    Object.keys(dbToExport.editions).forEach(yr => {
      const ed = dbToExport.editions[yr];
      if (ed.teams) {
        ed.teams.forEach(t => {
          if (t.photo && t.photo.startsWith('data:image')) {
            try {
              const parts = t.photo.split(',');
              const mime = parts[0].match(/:(.*?);/)[1];
              const ext = mime.split('/')[1] || 'png';
              const base64Data = parts[1];
              const filename = `team_${t.id}.${ext}`;
              
              imgFolder.file(filename, base64Data, { base64: true });
              t.photo = `images/${filename}`;
            } catch (err) {
              console.warn('Error extracting image for zip:', err);
            }
          }
        });
      }
    });

    zip.file("data.json", JSON.stringify(dbToExport, null, 2));

    const content = await zip.generateAsync({ type: "blob" });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(content);
    downloadLink.download = `iit_foosball_database_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    triggerFeedback('Pacchetto ZIP esportato con successo!');
  };

  // Import ZIP Backup
  const handleImportZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const dataJsonFile = zip.file("data.json");
      if (!dataJsonFile) {
        alert("File non valido: data.json non trovato all'interno del file ZIP.");
        return;
      }

      const dataText = await dataJsonFile.async("text");
      const parsedDb = JSON.parse(dataText);

      // Re-populate base64 photos from image files in ZIP if present
      for (const yr of Object.keys(parsedDb.editions || {})) {
        const ed = parsedDb.editions[yr];
        if (ed.teams) {
          for (const t of ed.teams) {
            if (t.photo && t.photo.startsWith('images/')) {
              const imageZipFile = zip.file(t.photo);
              if (imageZipFile) {
                const b64 = await imageZipFile.async("base64");
                const ext = t.photo.split('.').pop() || 'png';
                t.photo = `data:image/${ext};base64,${b64}`;
              }
            }
          }
        }
      }

      if (parsedDb.editions && parsedDb.editions[activeEditionYear]) {
        onUpdateEdition(parsedDb.editions[activeEditionYear]);
        triggerFeedback('Backup ZIP ripristinato con successo!');
      } else {
        alert('Nessuna edizione compatibile trovata nel backup.');
      }
    } catch (err) {
      alert("Errore durante l'importazione del file ZIP: " + err.message);
    }
  };

  return (
    <div className="builder-main-workspace">
      {/* Top Admin Bar */}
      <div className="admin-top-bar">
        <div className="admin-title-box">
          <span className="badge badge-accent">Builder Workspace</span>
          <h2>IIT Foosball Manager 2026</h2>
        </div>

        <div className="admin-actions-group">
          {/* Preview Toggle */}
          <button className="cta-btn primary-btn" onClick={onPreviewToggle}>
            <Play size={15} /> Anteprima Sito Live
          </button>

          {/* Export ZIP */}
          <button className="cta-btn success-btn" onClick={handleExportZip}>
            <Download size={15} /> Esporta Pacchetto ZIP
          </button>

          {/* Import ZIP */}
          <label className="cta-btn outline-btn file-upload-label">
            <Upload size={15} /> Importa Backup ZIP
            <input type="file" accept=".zip" onChange={handleImportZip} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Save feedback alert */}
      {saveFeedback && (
        <div className="save-feedback-banner">
          <CheckCircle2 size={16} /> {saveFeedback}
        </div>
      )}

      {/* Builder Navigation Tabs */}
      <div className="builder-tabs-bar">
        <button 
          className={`builder-tab-btn ${activeBuilderTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveBuilderTab('matches')}
        >
          <Calendar size={16} /> ⚽ Risultati &amp; Partite ({matches.length})
        </button>
        <button 
          className={`builder-tab-btn ${activeBuilderTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveBuilderTab('teams')}
        >
          <Users size={16} /> 👥 Squadre &amp; Foto ({teams.length})
        </button>
        <button 
          className={`builder-tab-btn ${activeBuilderTab === 'knockout' ? 'active' : ''}`}
          onClick={() => setActiveBuilderTab('knockout')}
        >
          <Award size={16} /> 🏆 Playoff (Top 8)
        </button>
        <button 
          className={`builder-tab-btn ${activeBuilderTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveBuilderTab('guide')}
        >
          <HelpCircle size={16} /> 📖 Guida per il Collega
        </button>
      </div>

      {/* Tab Panels */}
      <div className="builder-tab-content mt-3">
        {activeBuilderTab === 'matches' && (
          <MatchEditor 
            matches={matches} 
            teams={teams}
            onUpdateMatch={handleUpdateMatch}
          />
        )}

        {activeBuilderTab === 'teams' && (
          <TeamEditor 
            teams={teams}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onUpdateTeam={handleUpdateTeam}
          />
        )}

        {activeBuilderTab === 'knockout' && (
          <KnockoutEditor 
            knockout={knockout}
            standings={standings}
            onUpdateKnockout={handleUpdateKnockout}
          />
        )}

        {activeBuilderTab === 'guide' && (
          <ColleagueGuide />
        )}
      </div>
    </div>
  );
}

export default BuilderMain;
