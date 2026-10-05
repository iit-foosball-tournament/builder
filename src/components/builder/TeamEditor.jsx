import React, { useState } from 'react';
import { Users, Plus, Trash2, Camera, Upload, Check, Shield, Search } from 'lucide-react';

function TeamEditor({ teams = [], onAddTeam, onDeleteTeam, onUpdateTeam }) {
  const [name, setName] = useState('');
  const [logoColor, setLogoColor] = useState('#2563eb');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Handle adding a new team
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTeam(name.trim(), logoColor, {
      player1: player1.trim(),
      player2: player2.trim(),
      photo: ''
    });
    setName('');
    setPlayer1('');
    setPlayer2('');
  };

  // Handle uploading team photo (converts to base64 DataURL for easy persistence & export)
  const handlePhotoUpload = (teamId, file) => {
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'immagine è troppo grande. Seleziona una foto inferiore a 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      onUpdateTeam(teamId, { photo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Filtered teams list
  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (t.player1 || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (t.player2 || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="team-editor-container">
      {/* Header */}
      <div className="card-header-banner">
        <div>
          <h3><Users className="inline-icon mr-2 text-primary" /> Gestione Squadre, Giocatori e Foto</h3>
          <p className="subtitle">
            Qui puoi modificare i nomi delle squadre, i dettagli dei 2 giocatori (Player 1 e Player 2) e caricare le foto ufficiali.
          </p>
        </div>
      </div>

      {/* Form: Add New Team */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Aggiungi Nuova Squadra</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 2fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label>Nome Squadra</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Es. I Campioni" 
                  required 
                />
              </div>
              <div>
                <label>Colore</label>
                <input 
                  type="color" 
                  value={logoColor} 
                  onChange={(e) => setLogoColor(e.target.value)} 
                  style={{ padding: '2px', height: '40px', width: '100%', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label>Giocatore 1 (Nome e cognome)</label>
                <input 
                  type="text" 
                  value={player1} 
                  onChange={(e) => setPlayer1(e.target.value)} 
                  placeholder="Nome Cognome"
                />
              </div>
              <div>
                <label>Giocatore 2 (Nome e cognome)</label>
                <input 
                  type="text" 
                  value={player2} 
                  onChange={(e) => setPlayer2(e.target.value)} 
                  placeholder="Nome Cognome"
                />
              </div>
              <div>
                <button type="submit" className="success-btn" style={{ width: '100%', height: '40px' }}>
                  <Plus size={16} /> Aggiungi
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Search Bar for Teams */}
      <div className="search-bar-wrap mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Cerca squadra o giocatore tra le 30 registrate..." 
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          style={{ maxWidth: '400px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <span className="text-muted font-semibold">
          Squadre presenti: {filteredTeams.length} di {teams.length}
        </span>
      </div>

      {/* Teams Grid with Photo Uploaders */}
      <div className="admin-teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {filteredTeams.map((t, idx) => (
          <div key={t.id || idx} className="card team-admin-card" style={{ borderLeft: `6px solid ${t.logoColor || '#3b82f6'}` }}>
            <div className="card-body">
              {/* Photo Area */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.photo ? (
                    <img 
                      src={t.photo} 
                      alt={t.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <Camera size={26} />
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>No foto</div>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label className="file-upload-btn-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: '#fff', padding: '7px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <Upload size={14} /> Carica Foto
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(t.id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {t.photo && (
                    <button 
                      onClick={() => onUpdateTeam(t.id, { photo: '' })}
                      style={{ display: 'block', marginTop: '6px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Rimuovi foto
                    </button>
                  )}
                </div>
              </div>

              {/* Team Details Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Nome Squadra:</label>
                  <input 
                    type="text" 
                    value={t.name} 
                    onChange={(e) => onUpdateTeam(t.id, { name: e.target.value })}
                    style={{ width: '100%', fontWeight: 'bold', fontSize: '14px', padding: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '60px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Colore:</label>
                    <input 
                      type="color" 
                      value={t.logoColor || '#3b82f6'} 
                      onChange={(e) => onUpdateTeam(t.id, { logoColor: e.target.value })}
                      style={{ width: '100%', height: '32px', cursor: 'pointer', padding: 0 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Giocatore 1 (P1):</label>
                    <input 
                      type="text" 
                      value={t.player1 || ''} 
                      placeholder="Nome Cognome"
                      onChange={(e) => onUpdateTeam(t.id, { player1: e.target.value })}
                      style={{ width: '100%', fontSize: '12px', padding: '6px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Giocatore 2 (P2):</label>
                  <input 
                    type="text" 
                    value={t.player2 || ''} 
                    placeholder="Nome Cognome"
                    onChange={(e) => onUpdateTeam(t.id, { player2: e.target.value })}
                    style={{ width: '100%', fontSize: '12px', padding: '6px' }}
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    if (confirm(`Sei sicuro di voler eliminare la squadra ${t.name}?`)) {
                      onDeleteTeam(t.id);
                    }
                  }} 
                  className="danger-btn btn-sm"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  <Trash2 size={12} /> Elimina Squadra
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamEditor;
