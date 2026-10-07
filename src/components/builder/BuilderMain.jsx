import { useState } from 'react';
import {
  Users,
  Calendar,
  Award,
  CalendarDays,
  HelpCircle,
  Save,
  CheckCircle2,
  LogOut,
  LoaderCircle
} from 'lucide-react';
import TeamEditor from './TeamEditor';
import MatchEditor from './MatchEditor';
import KnockoutEditor from './KnockoutEditor';
import RoundDatesEditor from './RoundDatesEditor';
import ColleagueGuide from './ColleagueGuide';

function BuilderMain({
  editions,
  activeEditionYear,
  onUpdateEdition,
  onUploadPhoto,
  onSave,
  onSignOut,
  saveError = false,
  standings = [],
  isDirty = false,
  isSaving = false,
  saveMessage = '',
  dataLoadError = ''
}) {
  const [activeBuilderTab, setActiveBuilderTab] = useState('matches');

  const currentEdition = editions[activeEditionYear] || {};
  const teams = currentEdition.teams || [];
  const matches = currentEdition.matches || [];
  const knockout = currentEdition.knockout || {};

  const handleAddTeam = (name, logoColor, extra = {}) => {
    const newTeam = {
      id: `team-${Date.now()}`,
      name,
      logoColor,
      player1: extra.player1 || '',
      player2: extra.player2 || '',
      photo: extra.photo || ''
    };
    onUpdateEdition(edition => ({ ...edition, teams: [...edition.teams, newTeam] }));
  };

  const handleDeleteTeam = (teamId) => {
    onUpdateEdition(edition => ({ ...edition, teams: edition.teams.filter(team => team.id !== teamId) }));
  };

  const handleUpdateTeam = (teamId, patch) => {
    onUpdateEdition(edition => ({
      ...edition,
      teams: edition.teams.map(team => team.id === teamId ? { ...team, ...patch } : team)
    }));
  };

  const handleUpdateMatch = (matchId, patch) => {
    onUpdateEdition(edition => ({
      ...edition,
      matches: edition.matches.map(match => match.id === matchId ? { ...match, ...patch } : match)
    }));
  };

  const handleUpdateKnockout = (key, patch) => {
    onUpdateEdition(edition => ({ ...edition, knockout: { ...edition.knockout, [key]: patch } }));
  };

  const handleUpdateRoundDate = (roundNum, date) => {
    onUpdateEdition(edition => ({
      ...edition,
      roundDates: { ...(edition.roundDates || {}), [String(roundNum)]: date }
    }));
  };

  const messageIsError = saveError;

  return (
    <fieldset className="builder-main-workspace builder-workspace-fieldset" disabled={isSaving} aria-busy={isSaving}>
      <div className="admin-top-bar">
        <div className="admin-title-box">
          <span className="badge badge-accent">Builder Workspace</span>
          <h2>IIT Foosball Manager 2026</h2>
          <p className="builder-cloud-caption">I dati condivisi vengono pubblicati sul sito quando premi Salva.</p>
        </div>

        <div className="admin-actions-group">
          <button
            className="cta-btn success-btn builder-save-button"
            onClick={onSave}
            disabled={!isDirty || isSaving || Boolean(dataLoadError)}
          >
            {isSaving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {isSaving ? 'Salvataggio…' : 'Salva'}
          </button>
          <button className="cta-btn outline-btn" onClick={onSignOut}>
            <LogOut size={15} /> Esci
          </button>
        </div>
      </div>

      <div className={`save-feedback-banner ${isDirty ? 'is-pending' : ''} ${messageIsError || dataLoadError ? 'is-error' : ''}`} role="status">
        {messageIsError || dataLoadError ? null : <CheckCircle2 size={16} />}
        <span>
          {saveMessage || (dataLoadError
            ? `Impossibile aggiornare il cloud: ${dataLoadError}`
            : isDirty
              ? 'Modifiche non salvate: premi Salva per pubblicarle.'
              : 'Tutti i dati sono salvati online.')}
        </span>
      </div>

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
          className={`builder-tab-btn ${activeBuilderTab === 'dates' ? 'active' : ''}`}
          onClick={() => setActiveBuilderTab('dates')}
        >
          <CalendarDays size={16} /> 🗓️ Giornate &amp; Date
        </button>
        <button
          className={`builder-tab-btn ${activeBuilderTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveBuilderTab('guide')}
        >
          <HelpCircle size={16} /> 📖 Guida per il collega
        </button>
      </div>

      <div className="builder-tab-content mt-3">
        {activeBuilderTab === 'matches' && (
          <MatchEditor matches={matches} teams={teams} roundDates={currentEdition.roundDates || {}} onUpdateMatch={handleUpdateMatch} />
        )}
        {activeBuilderTab === 'teams' && (
          <TeamEditor
            teams={teams}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onUpdateTeam={handleUpdateTeam}
            onUploadPhoto={onUploadPhoto}
          />
        )}
        {activeBuilderTab === 'knockout' && (
          <KnockoutEditor
            knockout={knockout}
            standings={standings}
            onUpdateKnockout={handleUpdateKnockout}
          />
        )}
        {activeBuilderTab === 'dates' && (
          <RoundDatesEditor
            matches={matches}
            roundDates={currentEdition.roundDates || {}}
            onUpdateRoundDate={handleUpdateRoundDate}
          />
        )}
        {activeBuilderTab === 'guide' && <ColleagueGuide />}
      </div>
    </fieldset>
  );
}

export default BuilderMain;
