import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Calendar, 
  Flame, 
  Trophy, 
  Users, 
  BookOpen, 
  Wrench, 
  Eye, 
  Globe 
} from 'lucide-react';

import databaseFallback from './data/database_fallback.json';
import { translations } from './translations';
import PublicHome from './components/public/PublicHome';
import PublicCalendar from './components/public/PublicCalendar';
import PublicResults from './components/public/PublicResults';
import PublicStandings from './components/public/PublicStandings';
import PublicTeams from './components/public/PublicTeams';
import PublicRules from './components/public/PublicRules';
import BuilderMain from './components/builder/BuilderMain';

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

  // Database state
  const [editions, setEditions] = useState(() => {
    try {
      const saved = localStorage.getItem('iit_foosball_editions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed['2026'] && parsed['2026'].teams && parsed['2026'].teams.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
    return databaseFallback.editions || {};
  });

  const [activeEditionYear, setActiveEditionYear] = useState('2026');

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash.startsWith('builder')) {
        if (isBuilderAvailable) setIsBuilder(true);
      } else {
        setIsBuilder(false);
        if (['home', 'calendar', 'results', 'standings', 'teams', 'rules'].includes(hash)) {
          setActiveTab(hash);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch ./data/data.json at runtime for public site deployment updates
  useEffect(() => {
    const loadRuntimeData = async () => {
      try {
        const res = await fetch('./data/data.json');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const runtimeData = await res.json();
            if (runtimeData && runtimeData.editions && runtimeData.editions['2026']) {
              setEditions(prev => {
                const localSaved = localStorage.getItem('iit_foosball_editions');
                if (!localSaved) {
                  return runtimeData.editions;
                }
                return prev;
              });
            }
          }
        }
      } catch (err) {
        console.log('Using local fallback database:', err.message);
      }
    };
    loadRuntimeData();
  }, []);

  // Persist editions to localStorage
  useEffect(() => {
    try {
      if (editions && Object.keys(editions).length > 0) {
        localStorage.setItem('iit_foosball_editions', JSON.stringify(editions));
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [editions]);

  const currentEdition = editions[activeEditionYear] || databaseFallback.editions['2026'] || {};

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
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateEdition = (updatedEdition) => {
    setEditions(prev => ({
      ...prev,
      [activeEditionYear]: updatedEdition
    }));
  };

  const handleResetToDefault = () => {
    if (confirm(lang === 'it' 
      ? "Attenzione: vuoi reimpostare i dati iniziali del calendario e delle 30 squadre? Le modifiche locali non salvate andranno perse."
      : "Warning: do you want to reset the database to the initial 30 teams and schedule? Any unsaved local edits will be lost.")) {
      localStorage.removeItem('iit_foosball_editions');
      setEditions(databaseFallback.editions);
      alert(lang === 'it' ? "Database ripristinato ai dati iniziali!" : "Database reset to initial fixtures!");
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="main-header">
        <div className="header-logo-group" onClick={() => handleTabChange('home')} style={{ cursor: 'pointer' }}>
          <img src="/logo_foosball.svg" alt="IIT Foosball Logo" className="header-foosball-logo" />
          <div className="header-titles">
            <h1 className="header-main-title">{t.tournamentTitle}</h1>
            <p className="header-sub-title">{t.tournamentSubTitle}</p>
          </div>
          <img src="/logo_iit.svg" alt="IIT Logo" className="header-iit-logo" />
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
                  onClick={() => { setIsBuilder(false); window.location.hash = `#/home`; }}
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
        <BuilderMain 
          editions={editions}
          activeEditionYear={activeEditionYear}
          onUpdateEdition={handleUpdateEdition}
          onPreviewToggle={() => { setIsBuilder(false); window.location.hash = `#/home`; }}
          standings={standings}
          t={t}
          lang={lang}
        />
      ) : (
        /* ==================== PUBLIC SITE VIEW ==================== */
        <main className="public-content-wrap">
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
                lang={lang}
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
            {isBuilderAvailable && (
              <>
                <span>·</span>
                <span onClick={handleResetToDefault} style={{ cursor: 'pointer', opacity: 0.6, fontSize: '11px' }}>
                  {t.footerResetLink}
                </span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
