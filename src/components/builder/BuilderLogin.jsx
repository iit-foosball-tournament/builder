import { useState } from 'react';
import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';

function BuilderLogin({ client, checkingSession = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        setError('Accesso non riuscito. Controlla email e password oppure chiedi al responsabile di abilitare il tuo account.');
        return;
      }

      setPassword('');
    } catch {
      setError('Connessione non riuscita. Controlla la rete e riprova.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="builder-access-wrap">
      <section className="builder-access-card" aria-labelledby="builder-access-title">
        <div className="builder-access-icon"><ShieldCheck size={26} /></div>
        <span className="badge badge-accent">Area riservata</span>
        <h2 id="builder-access-title">Accedi al Builder</h2>
        <p>Entra per aggiornare risultati, squadre e foto. Le modifiche saranno pubblicate sul sito quando premi Salva.</p>

        {checkingSession ? (
          <div className="builder-access-progress"><LoaderCircle size={18} className="spin" /> Verifica accesso…</div>
        ) : (
          <form className="builder-login-form" onSubmit={handleSubmit}>
            <label htmlFor="builder-email">Email</label>
            <input
              id="builder-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
            <label htmlFor="builder-password">Password</label>
            <input
              id="builder-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
            {error && <p className="builder-login-error" role="alert">{error}</p>}
            <button className="cta-btn primary-btn builder-login-submit" type="submit" disabled={busy}>
              {busy ? <LoaderCircle size={16} className="spin" /> : <KeyRound size={16} />}
              {busy ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </form>
        )}
        <p className="builder-access-footnote">Gli account vengono abilitati dal responsabile del torneo.</p>
      </section>
    </main>
  );
}

export default BuilderLogin;
