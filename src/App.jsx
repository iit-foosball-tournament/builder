import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Home,
  Calendar,
  Flame,
  Trophy,
  Users,
  BookOpen,
  Wrench,
  Eye
} from 'lucide-react';

import databaseFallback from './data/database_fallback.json';
import { translations } from './translations';
import { supabase, updatePasswordForSession } from './supabase';
import { parseInvitation, signOutInvitationSession } from './authInvitation';
import {
  cleanupAbandonedTeamPhotos,
  loadTournamentEditions,
  removeTeamPhotos,
  saveTournamentEdition,
  uploadTeamPhoto
} from './tournamentData';
import { initialTournamentState, tournamentDraftReducer } from './tournamentDraft';
import PublicHome from './components/public/PublicHome';
import PublicCalendar from './components/public/PublicCalendar';
import PublicResults from './components/public/PublicResults';
import PublicStandings from './components/public/PublicStandings';
import PublicTeams from './components/public/PublicTeams';
import PublicRules from './components/public/PublicRules';
import BuilderMain from './components/builder/BuilderMain';
import BuilderLogin from './components/builder/BuilderLogin';
import BuilderActivation from './components/builder/BuilderActivation';

import './App.css';

const isBuilderAvailable = import.meta.env.VITE_BUILDER !== 'false';

function App() {
  // Global language state (it / en), persisted in localStorage
  const [lang, setLang] = useState(() => {
    try {
      const savedLang = localStorage.getItem('iit_foosball_lang');
      if (savedLang === 'en' || savedLang === 'it') return savedLang;
    } catch (e) {
      console.warn('Could not read lang from localStorage:', e);
    }
    return 'it';
  });

  const t = translations[lang] || translations.it;

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('iit_foosball_lang', newLang);
    } catch (e) {
      console.warn('Could not save lang to localStorage:', e);
    }
  };

  // Navigation tabs: 'home' | 'calendar' | 'results' | 'standings' | 'teams' | 'rules'
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    if (['home', 'calendar', 'results', 'standings', 'teams', 'rules'].includes(hash)) {
      return hash;
    }
    return 'home';
  });

  // Builder mode toggle
  const [isBuilder, setIsBuilder] = useState(() => {
    return isBuilderAvailable && window.location.hash.startsWith('#/builder');
  });

  const [dataState, setDataState] = useState(() => initialTournamentState(databaseFallback.editions || {}));
  const stateRef = useRef(dataState);
  const pendingPhotos = useRef(new Map());
  const busyRef = useRef(false);
  const authUserRef = useRef(null);
  const activationOwnerRef = useRef(null);
  const [invitation, setInvitation] = useState(() => isBuilderAvailable ? parseInvitation(window.location) : null);
  const [isPreview, setIsPreview] = useState(false);
  const [dataLoading, setDataLoading] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [session, setSession] = useState(null);
  const [activationNotice, setActivationNotice] = useState('');
  const needsPasswordSetup = session?.user?.user_metadata?.foosball_password_setup_required === true;
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [editorAccess, setEditorAccess] = useState('checking');
  const { editions, dirty: isDirty, source: dataSource, error: dataLoadError } = dataState;
  const activeEditionYear = String(databaseFallback.activeEditionYear) in editions
    ? String(databaseFallback.activeEditionYear) : Object.keys(editions).sort().at(-1);

  const dispatchData = useCallback(action => {
    stateRef.current = tournamentDraftReducer(stateRef.current, action);
    setDataState(stateRef.current);
  }, []);

  const clearPendingPhotos = useCallback(() => {
    for (const url of pendingPhotos.current.keys()) URL.revokeObjectURL(url);
    pendingPhotos.current.clear();
  }, []);

  const refreshCloud = useCallback(async (discard = false, checkRevision = false) => {
    if (!supabase) return;
    try {
      const identity = authUserRef.current;
      const result = await loadTournamentEditions(supabase, checkRevision ? stateRef.current.savedRevisions : undefined);
      const canDiscard = discard && identity === authUserRef.current;
      if (result) dispatchData({ type: 'loaded', result, discard: canDiscard });
      else dispatchData({ type: 'error', message: '' });
      if (canDiscard) clearPendingPhotos();
      return true;
    } catch (error) {
      dispatchData({ type: 'error', message: error.message });
      return false;
    } finally {
      setDataLoading(false);
    }
  }, [dispatchData, clearPendingPhotos]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      setIsBuilder(isBuilderAvailable && hash.startsWith('builder'));
      if (!hash.startsWith('builder')) setInvitation(null);
      if (['home', 'calendar', 'results', 'standings', 'teams', 'rules'].includes(hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const refresh = () => { if (active) void refreshCloud(false, true); };
    refresh();
    const channel = supabase.channel('tournament-editions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_editions' }, refresh)
      .subscribe();
    // Re-fetch after sleeping/reconnecting, and as a fallback if Realtime is unavailable.
    const interval = window.setInterval(() => { if (!document.hidden) refresh(); }, 60000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      void supabase.removeChannel(channel);
    };
  }, [refreshCloud]);

  useEffect(() => {
    const protectDraft = event => {
      if (!stateRef.current.dirty && !busyRef.current && !activationOwnerRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, []);

  useEffect(() => () => clearPendingPhotos(), [clearPendingPhotos]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    let authEventReceived = false;
    const applySession = nextSession => {
      if (!active) return;
      const userId = nextSession?.user.id || null;
      if (authUserRef.current !== userId) {
        dispatchData({ type: 'discard' });
        clearPendingPhotos();
        setIsPreview(false);
        setSaveMessage('');
        setEditorAccess('checking');
        if (activationOwnerRef.current && activationOwnerRef.current !== userId) {
          activationOwnerRef.current = null;
          setInvitation(null);
        }
      }
      authUserRef.current = userId;
      setSession(nextSession);
      setAuthLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      applySession(nextSession);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.warn('Session restore failed:', error.message);
      if (!authEventReceived) applySession(data?.session || null);
    }).catch(() => { if (!authEventReceived) applySession(null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [dispatchData, clearPendingPhotos]);

  useEffect(() => {
    if (!isBuilder || !supabase || !session) return undefined;
    let active = true;
    supabase.rpc('is_tournament_editor').then(({ data, error }) => {
      if (!active) return;
      setEditorAccess(error ? 'error' : data === true ? 'allowed' : 'denied');
      if (!error && data === true) {
        void cleanupAbandonedTeamPhotos(supabase).catch(() => console.warn('Pulizia delle foto abbandonate rinviata.'));
      }
    }).catch(() => { if (active) setEditorAccess('error'); });
    return () => { active = false; };
  }, [isBuilder, session]);

  const currentEdition = useMemo(() => {
    const visible = isBuilder || (isPreview && session) ? dataState.editions : dataState.savedEditions;
    return visible[activeEditionYear] || { name: '', teams: [], matches: [] };
  }, [dataState, activeEditionYear, isBuilder, isPreview, session]);

  // Helper to resolve team name and color
  const getTeamName = (teamIdOrName) => {
    if (!teamIdOrName) return 'TBD';
    const found = (currentEdition.teams || []).find(t => 
      t.id === teamIdOrName || t.name.toLowerCase() === String(teamIdOrName).toLowerCase()
    );
    return found ? found.name : teamIdOrName;
  };

  const getTeamColor = (teamIdOrName) => {
    if (!teamIdOrName) return '#94a3b8';
    const found = (currentEdition.teams || []).find(t => 
      t.id === teamIdOrName || t.name.toLowerCase() === String(teamIdOrName).toLowerCase()
    );
    return found?.logoColor || '#3b82f6';
  };

  // Official Standings Calculation
  const standings = useMemo(() => {
    const teams = currentEdition.teams || [];
    const matches = currentEdition.matches || [];

    const map = {};
    teams.forEach(t => {
      map[t.name.toLowerCase()] = {
        ...t,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0
      };
    });

    matches.forEach(m => {
      if (m.status === 'played' && m.score1 !== null && m.score2 !== null) {
        const s1 = parseInt(m.score1, 10);
        const s2 = parseInt(m.score2, 10);
        if (isNaN(s1) || isNaN(s2)) return;

        const t1 = map[m.team1.toLowerCase()];
        const t2 = map[m.team2.toLowerCase()];

        if (t1 && t2) {
          t1.played += 1;
          t2.played += 1;
          t1.gf += s1;
          t1.ga += s2;
          t2.gf += s2;
          t2.ga += s1;

          if (s1 > s2) {
            t1.won += 1;
            t1.points += 3;
            t2.lost += 1;
          } else if (s2 > s1) {
            t2.won += 1;
            t2.points += 3;
            t1.lost += 1;
          } else {
            t1.drawn += 1;
            t1.points += 1;
            t2.drawn += 1;
            t2.points += 1;
          }
        }
      }
    });

    const list = Object.values(map);
    list.forEach(t => {
      t.gd = t.gf - t.ga;
    });

    const getH2HDiff = (teamA, teamB) => {
      let ptsA = 0;
      let ptsB = 0;
      let gdA = 0;
      matches.forEach(m => {
        if (m.status === 'played' && m.score1 !== null && m.score2 !== null) {
          const matchT1 = m.team1.toLowerCase();
          const matchT2 = m.team2.toLowerCase();
          const nameA = teamA.name.toLowerCase();
          const nameB = teamB.name.toLowerCase();

          if ((matchT1 === nameA && matchT2 === nameB) || (matchT1 === nameB && matchT2 === nameA)) {
            const s1 = parseInt(m.score1, 10);
            const s2 = parseInt(m.score2, 10);
            const sA = matchT1 === nameA ? s1 : s2;
            const sB = matchT1 === nameA ? s2 : s1;
            if (sA > sB) ptsA += 3;
            else if (sB > sA) ptsB += 3;
            else { ptsA += 1; ptsB += 1; }
            gdA += (sA - sB);
          }
        }
      });
      if (ptsA !== ptsB) return ptsA - ptsB;
      return gdA;
    };

    return list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      const h2h = getH2HDiff(a, b);
      if (h2h !== 0) return -h2h;
      return b.gf - a.gf;
    });
  }, [currentEdition]);

  const handleTabChange = (tab) => {
    if (invitation || needsPasswordSetup) return;
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateEdition = update => {
    if (busyRef.current || editorAccess !== 'allowed') return;
    dispatchData({ type: 'edit', year: activeEditionYear, update });
    const used = new Set(Object.values(stateRef.current.editions).flatMap(edition => edition.teams.map(team => team.photo)));
    for (const url of pendingPhotos.current.keys()) {
      if (!used.has(url)) {
        URL.revokeObjectURL(url);
        pendingPhotos.current.delete(url);
      }
    }
    setSaveMessage('');
    setSaveError(false);
  };

  // Keep selected files in this browser until the editor explicitly presses Save.
  const handleUploadPhoto = (teamId, file) => {
    if (busyRef.current) throw new Error('Attendi la fine del salvataggio.');
    if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) throw new Error('Scegli una foto non vuota fino a 5 MB.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Usa JPG, PNG o WebP.');
    const url = URL.createObjectURL(file);
    pendingPhotos.current.set(url, { file, teamId });
    return url;
  };

  const handleSave = async () => {
    if (!supabase || !session || busyRef.current || editorAccess !== 'allowed') return;
    const snapshot = stateRef.current;
    if (snapshot.error || snapshot.source !== 'cloud') {
      setSaveMessage('Riprova la lettura dei dati online prima di salvare.');
      setSaveError(true);
      return;
    }
    const year = activeEditionYear;
    const userId = session.user.id;
    const edition = structuredClone(snapshot.editions[year]);
    const selectedPhotos = new Map(pendingPhotos.current);
    const uploaded = [];
    busyRef.current = true;
    setIsSaving(true);
    setSaveMessage('');
    setSaveError(false);
    let committed = false;
    try {
      for (const team of edition.teams) {
        if (!team.photo?.startsWith('blob:')) continue;
        const selected = selectedPhotos.get(team.photo);
        if (!selected) throw new Error('Seleziona di nuovo la foto prima di salvare.');
        if (authUserRef.current !== userId) throw new Error('La sessione è cambiata. Accedi di nuovo.');
        const path = await uploadTeamPhoto(supabase, team.id, selected.file);
        uploaded.push(path);
        team.photo = path;
      }
      if (authUserRef.current !== userId) throw new Error('La sessione è cambiata. Accedi di nuovo.');
      const revision = await saveTournamentEdition(supabase, {
        year, edition, expectedRevision: snapshot.revisions[year]
      });
      committed = true;
      if (authUserRef.current === userId) {
        dispatchData({ type: 'saved', year, edition, revision });
        clearPendingPhotos();
        setSaveMessage('Salvato online: il sito pubblico si aggiorna automaticamente.');
      } else {
        await refreshCloud();
      }
      const currentPhotos = new Set(Object.values(stateRef.current.savedEditions).flatMap(item => item.teams.map(team => team.photo)));
      const obsolete = snapshot.savedEditions[year].teams.map(team => team.photo).filter(path => path && !currentPhotos.has(path));
      try {
        await removeTeamPhotos(supabase, obsolete);
      } catch {
        setSaveMessage('Dati salvati online. Pulizia delle vecchie foto non riuscita.');
      }
    } catch (error) {
      setSaveMessage(error.message || 'Salvataggio non riuscito. Riprova.');
      setSaveError(true);
    } finally {
      if (!committed && uploaded.length) {
        try { await removeTeamPhotos(supabase, uploaded); }
        catch { console.warn('Pulizia foto non completata.'); }
      }
      busyRef.current = false;
      setIsSaving(false);
    }
  };

  const handleReload = async () => {
    if (busyRef.current) return;
    if (stateRef.current.dirty && !confirm('Ricaricare i dati online e scartare le tue modifiche non salvate? Annulla per mantenere la bozza.')) return;
    busyRef.current = true;
    setIsReloading(true);
    try {
      if (await refreshCloud(true)) {
        setSaveMessage('Dati online ricaricati.');
        setSaveError(false);
      }
    } finally {
      busyRef.current = false;
      setIsReloading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase || busyRef.current) return;
    if (stateRef.current.dirty && !confirm('Uscire e scartare le modifiche non salvate?')) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSaveMessage('Non è stato possibile uscire: riprova.');
      setSaveError(true);
    }
  };

  const handlePreview = () => {
    if (busyRef.current) return;
    setIsPreview(true);
    setIsBuilder(false);
    window.location.hash = '#/home';
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="main-header">
        <div className="header-logo-group" onClick={() => handleTabChange('home')} style={{ cursor: 'pointer' }}>
          <img src={`${import.meta.env.BASE_URL}logo_foosball.svg`} alt="IIT Foosball Logo" className="header-foosball-logo" />
          <div className="header-titles">
            <h1 className="header-main-title">{t.tournamentTitle}</h1>
            <p className="header-sub-title">{t.tournamentSubTitle}</p>
          </div>
          <img src={`${import.meta.env.BASE_URL}logo_iit.svg`} alt="IIT Logo" className="header-iit-logo" />
        </div>

        {/* Header Right Actions: Language Switcher + Builder Switch */}
        <div className="header-right-actions">
          {/* Global Language Switcher */}
          <div className="global-lang-switch">
            <button 
              className={`lang-toggle-btn ${lang === 'it' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('it')}
              title="Italiano"
            >
              🇮🇹 IT
            </button>
            <button 
              className={`lang-toggle-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
              title="English"
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Builder Admin Switch */}
          {isBuilderAvailable && (
            <div className="header-admin-action">
              {isBuilder ? (
                <button 
                  className="cta-btn primary-btn btn-sm"
                  onClick={() => { setIsPreview(false); setIsBuilder(false); window.location.hash = '#/home'; }}
                  disabled={isSaving || isReloading || Boolean(invitation) || needsPasswordSetup}
                >
                  <Eye size={14} /> {t.backToPublic}
                </button>
              ) : (
                <button 
                  className="cta-btn outline-btn btn-sm"
                  onClick={() => { setIsBuilder(true); window.location.hash = `#/builder`; }}
                  title="Accedi al pannello per aggiornare partite, classifiche e foto"
                >
                  <Wrench size={14} /> {t.builderBtn}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main View Router */}
      {isBuilder ? (
        /* ==================== BUILDER VIEW ==================== */
        !supabase ? (
          <main className="builder-access-wrap">
            <section className="builder-access-card">
              <h2>Salvataggio cloud non configurato</h2>
              <p>Il pannello resta disattivato finché non è collegato al database condiviso.</p>
            </section>
          </main>
        ) : authLoading || dataLoading ? (
          <BuilderLogin client={supabase} checkingSession />
        ) : invitation || (needsPasswordSetup && editorAccess === 'allowed') ? (
          <BuilderActivation
            key={invitation?.tokenHash || session?.user?.id || 'invalid'}
            client={supabase}
            invitation={invitation}
            resumeUser={!invitation && needsPasswordSetup ? session.user : null}
            updateForSession={updatePasswordForSession}
            onRecipientVerified={recipient => {
              if (authUserRef.current !== recipient.id) return false;
              activationOwnerRef.current = recipient.id;
              return true;
            }}
            onComplete={async recipient => {
              activationOwnerRef.current = null;
              await signOutInvitationSession(supabase, recipient.id);
              setActivationNotice('Password impostata. Accedi con la tua email e la nuova password.');
              setInvitation(null);
              setIsBuilder(true);
              window.history.replaceState(window.history.state, '', `${window.location.pathname}#/builder`);
            }}
            onCancel={() => {
              activationOwnerRef.current = null;
              setInvitation(null);
            }}
          />
        ) : !session ? (
          <BuilderLogin client={supabase} notice={activationNotice} />
        ) : editorAccess === 'checking' ? (
          <BuilderLogin client={supabase} checkingSession />
        ) : editorAccess !== 'allowed' ? (
          <main className="builder-access-wrap">
            <section className="builder-access-card" role="alert">
              <span className="badge badge-accent">Area riservata</span>
              <h2>Account non abilitato</h2>
              <p>Il tuo account può accedere ma non è stato autorizzato a modificare i dati del torneo.</p>
              {editorAccess === 'error' && <p>Non è stato possibile verificare i permessi. Riprova più tardi.</p>}
              <button className="cta-btn outline-btn" onClick={handleSignOut}>Esci</button>
            </section>
          </main>
        ) : (
          <BuilderMain
            editions={editions}
            activeEditionYear={activeEditionYear}
            onUpdateEdition={handleUpdateEdition}
            onUploadPhoto={handleUploadPhoto}
            onSave={handleSave}
            onSignOut={handleSignOut}
            onPreviewToggle={handlePreview}
            onReload={handleReload}
            saveError={saveError}
            standings={standings}
            isDirty={isDirty}
            isSaving={isSaving}
            isReloading={isReloading}
            saveMessage={saveMessage}
            dataLoadError={dataLoadError}
            t={t}
            lang={lang}
          />
        )
      ) : (
        /* ==================== PUBLIC SITE VIEW ==================== */
        <main className="public-content-wrap">
          {isPreview && session && (
            <div className="save-feedback-banner is-pending" role="status">
              Anteprima della tua bozza: le modifiche non salvate non sono visibili agli altri.
              <button className="cta-btn outline-btn btn-sm" onClick={() => { setIsBuilder(true); window.location.hash = '#/builder'; }}>Torna al Builder</button>
            </div>
          )}
          {supabase && dataLoadError && (
            <div className="cloud-fallback-banner" role="status">
              {dataSource === 'cloud' ? 'Aggiornamento non riuscito: mostro gli ultimi dati letti.' : 'Dati cloud non disponibili: mostro la copia locale.'}
              <button className="cta-btn outline-btn btn-sm" onClick={() => refreshCloud()}>Riprova</button>
            </div>
          )}
          {/* Navigation Bar */}
          <nav className="public-navbar">
            <div className="nav-tabs-list">
              <button 
                className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleTabChange('home')}
              >
                <Home size={17} /> <span>{t.navHome}</span>
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => handleTabChange('calendar')}
              >
                <Calendar size={17} /> <span>{t.navCalendar}</span>
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => handleTabChange('results')}
              >
                <Flame size={17} /> <span>{t.navResults}</span>
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'standings' ? 'active' : ''}`}
                onClick={() => handleTabChange('standings')}
              >
                <Trophy size={17} /> <span>{t.navStandings}</span>
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
                onClick={() => handleTabChange('teams')}
              >
                <Users size={17} /> <span>{t.navTeams}</span>
              </button>
              <button 
                className={`nav-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
                onClick={() => handleTabChange('rules')}
              >
                <BookOpen size={17} /> <span>{t.navRules}</span>
              </button>
            </div>
          </nav>

          {/* Tab Views */}
          <div className="tab-render-container">
            {activeTab === 'home' && (
              <PublicHome 
                edition={currentEdition}
                getTeamName={getTeamName}
                getTeamColor={getTeamColor}
                standings={standings}
                onNavigateTab={handleTabChange}
                t={t}
                lang={lang}
              />
            )}

            {activeTab === 'calendar' && (
              <PublicCalendar 
                edition={currentEdition}
                getTeamName={getTeamName}
                getTeamColor={getTeamColor}
                t={t}
                lang={lang}
              />
            )}

            {activeTab === 'results' && (
              <PublicResults 
                edition={currentEdition}
                getTeamName={getTeamName}
                getTeamColor={getTeamColor}
                t={t}
                lang={lang}
              />
            )}

            {activeTab === 'standings' && (
              <PublicStandings 
                edition={currentEdition}
                standings={standings}
                getTeamName={getTeamName}
                getTeamColor={getTeamColor}
                t={t}
                lang={lang}
              />
            )}

            {activeTab === 'teams' && (
              <PublicTeams 
                edition={currentEdition}
                standings={standings}
                getTeamColor={getTeamColor}
                t={t}
              />
            )}

            {activeTab === 'rules' && (
              <PublicRules 
                lang={lang}
                setLang={handleLanguageChange}
                t={t}
              />
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <p>{t.footerCopyright}</p>
          <p className="footer-subtext">{t.footerLocation}</p>
          <div className="footer-links">
            <span onClick={() => handleTabChange('rules')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
              {t.footerRulesLink}
            </span>
            <span>·</span>
            <a href="mailto:filippo.drago@iit.it,simone.nitti@iit.it,calogero.boscarini@iit.it">
              {t.footerContactLink}
            </a>

          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
