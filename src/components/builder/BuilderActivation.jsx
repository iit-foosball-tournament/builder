import { useEffect, useRef, useState } from 'react';
import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import {
  InvitationActivationError,
  setInvitationPassword,
  signOutInvitationSession,
  verifyInvitation
} from '../../authInvitation';

const expiredMessage = 'Il link non è valido, è scaduto oppure è già stato usato. Contatta il responsabile del torneo per un nuovo invito.';

function BuilderActivation({ client, invitation, resumeUser, updateForSession, onRecipientVerified, onComplete, onCancel }) {
  const [recipient, setRecipient] = useState(() => resumeUser ? { id: resumeUser.id, email: resumeUser.email } : null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);
  const mounted = useRef(true);
  const recipientRef = useRef(recipient);

  useEffect(() => {
    if (resumeUser) onRecipientVerified(resumeUser);
  }, [resumeUser, onRecipientVerified]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [client]);

  const activate = async () => {
    if (busyRef.current || recipient || invitation?.invalid || !invitation) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    // Replace (not push) before exchanging: no token remains in history or the address bar.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}#/builder`);
    try {
      const verified = await verifyInvitation(client, invitation);
      if (!mounted.current) {
        await signOutInvitationSession(client, verified.id);
        return;
      }
      if (!onRecipientVerified(verified)) {
        await signOutInvitationSession(client, verified.id);
        throw new InvitationActivationError('session');
      }
      recipientRef.current = verified;
      setRecipient(verified);
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof InvitationActivationError && cause.reason === 'session'
          ? 'La sessione è cambiata. Riapri un nuovo invito e riprova.'
          : cause instanceof InvitationActivationError && cause.reason === 'access'
            ? 'Questo account non è abilitato. Contatta il responsabile del torneo.'
            : expiredMessage);
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (busyRef.current || !recipient) return;
    if (password.length < 12) {
      setError('Usa una password di almeno 12 caratteri.');
      return;
    }
    if (password !== confirmation) {
      setError('Le password non coincidono.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await setInvitationPassword(client, recipient, password, updateForSession);
      if (!mounted.current) {
        await signOutInvitationSession(client, recipient.id);
        return;
      }
      setPassword('');
      setConfirmation('');
      onComplete(recipient);
    } catch (cause) {
      if (mounted.current) {
        setPassword('');
        setConfirmation('');
        if (cause instanceof InvitationActivationError && cause.reason === 'session') {
          recipientRef.current = null;
          setRecipient(null);
          setError('La sessione è cambiata o è scaduta. Contatta il responsabile per un nuovo invito.');
        } else {
          setError('Impossibile impostare la password. Riprova o contatta il responsabile del torneo.');
        }
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const cancel = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setPassword('');
    setConfirmation('');
    window.history.replaceState(window.history.state, '', `${window.location.pathname}#/builder`);
    if (recipientRef.current) await signOutInvitationSession(client, recipientRef.current.id);
    recipientRef.current = null;
    if (mounted.current) {
      onCancel();
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <main className="builder-access-wrap">
      <section className="builder-access-card" aria-labelledby="builder-activation-title">
        <div className="builder-access-icon"><ShieldCheck size={26} /></div>
        <span className="badge badge-accent">Area riservata</span>
        <h2 id="builder-activation-title">Attiva il tuo account Builder</h2>
        {invitation?.invalid || (!invitation && !recipient) ? (
          <p className="builder-login-error" role="alert">{expiredMessage}</p>
        ) : recipient ? (
          <>
            <p>Account verificato: <strong>{recipient.email}</strong>. Controlla che sia il tuo indirizzo prima di impostare la password.</p>
            <form className="builder-login-form" onSubmit={submitPassword}>
              <label htmlFor="builder-new-password">Nuova password</label>
              <input id="builder-new-password" type="password" autoComplete="new-password"
                minLength={12} required value={password} disabled={busy}
                onChange={event => setPassword(event.target.value)} />
              <p>Usa almeno 12 caratteri, meglio una frase lunga e unica che non usi altrove. Poi accedi con la nuova password.</p>
              <label htmlFor="builder-confirm-password">Conferma password</label>
              <input id="builder-confirm-password" type="password" autoComplete="new-password"
                minLength={12} required value={confirmation} disabled={busy}
                onChange={event => setConfirmation(event.target.value)} />
              {error && <p className="builder-login-error" role="alert">{error}</p>}
              <button className="cta-btn primary-btn builder-login-submit" type="submit" disabled={busy}>
                {busy ? <LoaderCircle size={16} className="spin" /> : <KeyRound size={16} />}
                {busy ? 'Salvataggio in corso…' : 'Imposta password e continua'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p>Per sicurezza l’invito non viene usato automaticamente. Attiva l’account solo se hai richiesto questo accesso.</p>
            {error && <p className="builder-login-error" role="alert">{error}</p>}
            <button className="cta-btn primary-btn builder-login-submit" type="button" disabled={busy || Boolean(error)} onClick={activate}>
              {busy ? <LoaderCircle size={16} className="spin" /> : <KeyRound size={16} />}
              {busy ? 'Verifica in corso…' : 'Attiva il mio account'}
            </button>
          </>
        )}
        {busy && <p role="status" className="builder-access-progress">Operazione in corso…</p>}
        <button className="cta-btn outline-btn" type="button" disabled={busy} onClick={cancel}>Annulla</button>
        <p className="builder-access-footnote">Per un invito scaduto, contatta il responsabile del torneo.</p>
      </section>
    </main>
  );
}

export default BuilderActivation;
