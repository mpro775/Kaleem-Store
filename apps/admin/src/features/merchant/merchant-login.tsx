import { FormEvent, useState } from 'react';
import { requestJson } from '../../lib/http';
import { readStoredApiBaseUrl } from './session-storage';
import type { AuthResult, MerchantSession } from './types';

interface MerchantLoginProps {
  onLoggedIn: (session: MerchantSession) => void;
}

export function MerchantLogin({ onLoggedIn }: MerchantLoginProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState(readStoredApiBaseUrl());
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('Owner123!');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedApiBaseUrl = apiBaseUrl.trim();
    if (!trimmedApiBaseUrl) {
      setError('API base URL is required');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const result = await requestJson<AuthResult>(`${trimmedApiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!result) {
        throw new Error('Unable to sign in');
      }

      onLoggedIn({
        apiBaseUrl: trimmedApiBaseUrl,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel panel-merchant auth-panel">
      <header className="panel-header">
        <h2>Merchant Login</h2>
        <p>Authenticate to access store management screens.</p>
      </header>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          API Base URL
          <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {error ? <p className="status-message error-text">{error}</p> : null}
    </section>
  );
}
