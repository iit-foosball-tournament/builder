# IIT Foosball Tournament 2026

React/Vite Builder e sito pubblico del torneo IIT di calcio balilla. Il Builder è ospitato su GitHub Pages; il sito pubblico usa la stessa applicazione compilata in modalità sola lettura.

## Salvataggio condiviso

Il progetto Supabase `iit-foosball-tournament` (regione Frankfurt) conserva le stagioni in `public.tournament_editions` e le foto nel bucket pubblico `foosball-team-photos`.

- I visitatori leggono i dati dal database; la versione inclusa nel repository è solo una copia di fallback.
- Il Builder richiede un account Supabase autorizzato. Le policy RLS consentono la lettura pubblica; le modifiche passano soltanto dalla funzione `save_tournament_edition`, che verifica le autorizzazioni private (`tournament_editors` o `tournament_editor_emails`), confronta la revisione e aggiorna versione/autore/orario sul server. Gli autori dei salvataggi restano nella tabella privata `tournament_edition_authors`.
- Le modifiche diventano pubbliche quando l’editor preme **Salva**. Non servono ZIP, Git o una nuova build per aggiornare i risultati del sito. Realtime aggiorna la vista pubblica; un controllo leggero delle revisioni ogni minuto e al ritorno sulla pagina copre le riconnessioni.
- L’anteprima è separata dai dati pubblicati. Le bozze restano soltanto nella pagina aperta: non chiuderla prima di salvare. Un conflitto non sovrascrive il collega né elimina la bozza. **Ricarica dati online** richiede conferma prima di scartare le modifiche; anche l’uscita chiede conferma se ci sono modifiche pendenti.
- Le foto selezionate restano nella bozza del browser fino a **Salva**; solo allora sono caricate nello Storage. Nel database si conserva il percorso dell’oggetto, non base64. Il bucket accetta JPG, PNG e WebP fino a 5 MB; le trasformazioni immagini sono disattivate. Una foto referenziata da qualsiasi stagione non può essere eliminata. Al successivo accesso di un editor vengono ripuliti fino a 100 upload abbandonati da almeno un giorno.
- Non usare mai chiavi `service_role` o segreti nelle variabili `VITE_*`: il codice frontend e la chiave publishable sono pubblici. La sicurezza è affidata ad Auth e RLS.

### Configurazione locale / build

Copia `.env.example` in `.env.local` e imposta la chiave **publishable** del progetto:

```text
VITE_SUPABASE_URL=https://ymudxqnprtbyshtmtumz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

La chiave publishable è progettata per essere inclusa nel browser; non sostituirla con la chiave `service_role`. `.env.local` è ignorato da Git.

### Abilitazione degli editor

Gli indirizzi autorizzati sono conservati soltanto in `private.tournament_editor_emails`, mai nei roster, nelle migrazioni pubbliche o nel browser. Preautorizzare un indirizzo **non crea un account e non invia un invito**.

L’autorizzazione per email consente a un account Supabase Auth di modificare dati e foto quando la sua email, verificata e conservata sul server, corrisponde a un indirizzo abilitato. Resta disponibile il grant amministrativo indipendente per ID in `private.tournament_editors`. La verifica non usa l’email dichiarata dal client, il JWT o i metadati modificabili dall’utente. Gli account anonimi, cancellati o temporaneamente bloccati non possono essere editor, nemmeno tramite un grant esplicito per ID. Per revocare l’accesso email, imposta `enabled = false`; se era stato concesso anche un accesso esplicito tramite `private.tournament_editors`, rimuovi anche quel grant indipendente.

Gli account devono essere creati tramite la dashboard o le API ufficiali di Supabase Auth, non inserendo utenti/password manualmente in SQL. Non disattivare la conferma email globale e non condividere password o chiavi amministrative in chat. Il login attuale del Builder usa email e password.

Il servizio SMTP predefinito di Supabase invia solo agli indirizzi dei membri dell’organizzazione e ha limiti stretti. Senza un SMTP aggiuntivo, l’amministratore può usare l’API ufficiale `auth.admin.generateLink({ type: 'invite', email, options: { data: { foosball_password_setup_required: true } } })`: crea un account **non confermato**, restituisce il link e **non invia email**. La chiave amministrativa resta esclusivamente sul server; non salvarla nella configurazione Vite o nei messaggi. Non concedere accesso all’organizzazione per aggirare l’SMTP. Vedi [SMTP ufficiale](https://supabase.com/docs/guides/auth/auth-smtp) e [generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink).

Il responsabile consegna ciascun link individualmente tramite un canale privato all’indirizzo autorizzato, mai in un gruppo o in un repository. Usa il `hashed_token` restituito dall’API nel frammento `#/builder?type=invite&token_hash=…` del Builder online. Il token non viene inviato al server web né consumato automaticamente: l’editor preme **Attiva il mio account**, il Builder verifica il token con Supabase Auth e i permessi server, poi chiede una password personale di almeno 12 caratteri. Il frammento viene rimosso prima della verifica. Terminata l’attivazione, l’editor accede con email e nuova password. Rispettare la scadenza configurata in Auth; per un account già confermato che necessita di un nuovo link usare `type: 'recovery'`, supportato dallo stesso flusso. Non confermare le email amministrativamente per aggirare l’attivazione.

Il marcatore `user_metadata.foosball_password_setup_required` permette di riprendere la scelta della password dopo un reload con sessione ancora valida; è solo un’indicazione UI modificabile dall’utente, **non un criterio di autorizzazione**. Viene rimosso insieme all’impostazione della password. Questa richiesta usa il JWT della sessione verificata, non una sessione diversa eventualmente arrivata da un’altra scheda. Il controllo editor resta esclusivamente server-side e indipendente dai metadati.

Non abilitare scritture anonime.

## Avvio e test

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Apri `http://localhost:5173/#/builder` per il Builder. Per controllare la vista pubblica, apri `http://localhost:5173/#/teams`.

I test SQL in `supabase/tests/` si eseguono contro la stagione inizializzata e fanno rollback completo: nessuna identità, modifica, revisione o oggetto di test resta nel progetto. I test dei predicati Storage non sostituiscono il test dell’upload/eliminazione via API con un editor reale.

Le migrazioni in `supabase/migrations/` descrivono lo schema applicato al progetto. La build e gli script di deploy rifiutano configurazioni cloud mancanti o chiavi amministrative; la pubblicazione controlla anche repository e destinazione prima di eliminare file.

## Pubblicazione

I due script usano `.env.local` durante la build, quindi la configurazione cloud è inclusa anche nei bundle statici:

```bash
./deploy_builder.sh
./publish_public.sh ../iit-foosball-tournament.github.io
```

Il primo aggiorna il branch GitHub Pages del Builder. Il secondo compila la modalità pubblica e copia i file nel repository `iit-foosball-tournament.github.io`; per pubblicarli, esegui `git add`, `git commit` e `git push` in quel repository. Questo deploy serve per le modifiche al codice, non per i punteggi o le foto.

## Torneo

- Girone unico: 30 squadre, 29 giornate, 435 partite.
- Vittoria a 10 gol: 3 punti; pareggio 9–9: 1 punto a squadra.
- Criteri di classifica: punti, differenza reti, scontro diretto, gol fatti.
- Playoff per le prime 8 classificate; nei playoff si applica la regola dei vantaggi.
- Sede: Mensa CCT Morego, dalle 08:00 alle 15:00.

## Nota sul piano gratuito

L’organizzazione Supabase è sul piano Free e il preventivo attuale per il progetto è pari a 0 al mese. I limiti del piano restano applicabili: i progetti Free possono essere messi in pausa dopo periodi di attività insufficiente. Non sono stati attivati componenti a pagamento.
