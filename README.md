# IIT Foosball Tournament 2026 — Builder & Manager Workspace

Workspace di sviluppo e gestione amministrativa per il **Torneo di Calcio Balilla IIT 2026 (Stile Tradizionale · Double Open)**.
Basato su React 19 + Vite, include la modalità **Builder Mode** per la gestione autonoma di partite, classifiche, squadre e caricamento foto ufficiali, con esportazione automatica per il sito pubblico GitHub Pages.

Il sito statico pubblico compilato per GitHub Pages si trova nel repository gemello: **`iit-foosball-tournament.github.io`**.

---

## 📐 Architettura delle 2 Repository

```
                    ┌─────────────────────────────────────────┐
                    │   iit-foosball-tournament/builder       │
                    │   (Pannello di controllo & CMS locale)  │
                    └────────────────────┬────────────────────┘
                                         │
             ┌───────────────────────────┴───────────────────────────┐
             │                                                       │
             ▼ [Opzione A: Script rapido]                            ▼ [Opzione B: ZIP manuale]
    ./publish_public.sh                                     Esporta ZIP Bundle
             │                                                       │
             ▼                                                       ▼
┌─────────────────────────────────────────┐         ┌─────────────────────────────────┐
│ iit-foosball-tournament.github.io       │ ◄───────┤ Estrai data.json & images/     │
│ (Sito statico deployato su GH Pages)    │         │ in ./data                       │
└─────────────────────────────────────────┘         └─────────────────────────────────┘
```

1. **`builder` (Questa repo)**: Ambiente completo con Builder Mode. Permette di registrare i risultati, caricare le foto delle 30 squadre, visualizzare l'anteprima live ed esportare il database.
2. **`iit-foosball-tournament.github.io`**: Repository del sito statico pubblico ottimizzato per GitHub Pages, con fallback incorporato e caricamento dinamico di `./data/data.json`.

---

## 🚀 Avvio Locale

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
3. Apri il browser all'indirizzo `http://localhost:5173`.
   - Clicca sul pulsante **"Builder / Gestione"** in alto a destra (oppure naviga su `http://localhost:5173/#/builder`) per entrare nel pannello di amministrazione.
   - Clicca su **"Anteprima Sito Live"** per vedere esattamente come appare il sito per i colleghi.

---

## 📋 Guida Operativa per il Collega (Come Aggiornare Tutto)

### 1. Inserimento Risultati Partite
- Quando i colleghi inviano via e-mail l'esito della partita (a `filippo.drago@iit.it`, `simone.nitti@iit.it`, `calogero.boscarini@iit.it` con gli avversari in CC):
- Apri il Builder alla scheda **"⚽ Risultati & Partite"**.
- Seleziona la **Giornata** (1..29) o cerca il nome della squadra.
- Inserisci i gol realizzati (es. `10` a `7`, o `9` a `9` per pareggio).
- La partita viene marcata come completata e la **Classifica (Punti, Differenza Reti, Vittorie)** si ricalcola istantaneamente!

### 2. Caricamento Foto Squadre
- Ricevuta o scattata la foto di una coppia/squadra:
- Apri la scheda **"👥 Squadre & Foto"**.
- Clicca su **"Carica Foto"** sulla scheda della squadra desiderata e seleziona l'immagine dal computer.
- L'anteprima viene aggiornata e memorizzata.

### 3. Pubblicazione Online (Deploy sul sito pubblico)
#### Metodo Rapido (1 comando):
Dalla cartella `builder`, esegui:
```bash
./publish_public.sh ../iit-foosball-tournament.github.io
cd ../iit-foosball-tournament.github.io
git add .
git commit -m "Aggiornamento risultati e foto"
git push origin main
```
In ~60 secondi il sito online su GitHub Pages sarà aggiornato con i nuovi punteggi!

---

## 🏆 Regole e Formato del Torneo Integrati
- **Formula:** Girone unico da 30 squadre (29 giornate, 435 partite).
- **Punteggio:** Vittoria a 10 gol (3 punti), Pareggio a 9-9 (1 punto a testa), Sconfitta (0 punti).
- **Criteri parità:** 1° Differenza Reti &rarr; 2° Scontro Diretto &rarr; 3° Gol Fatti.
- **Fase Finale:** Le prime **8 classificate** si qualificano ai Quarti di finale (QF1: 1ª vs 8ª, QF2: 4ª vs 5ª, QF3: 2ª vs 7ª, QF4: 3ª vs 6ª), Semifinali, Finale 3° posto e Finalissima. Nei playoff vige la regola dei vantaggi (scarto di 2 gol sul 9-9, nessun pareggio).
- **Orari Mensa Morego:** 08:00 – 15:00.
