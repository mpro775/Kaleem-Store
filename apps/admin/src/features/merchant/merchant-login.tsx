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
      setError('رابط API مطلوب');
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
        throw new Error('تعذر تسجيل الدخول');
      }

      onLoggedIn({
        apiBaseUrl: trimmedApiBaseUrl,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'تعذر تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel panel-merchant auth-panel">
      <header className="panel-header">
        <h2>تسجيل دخول التاجر</h2>
        <p>استخدم بيانات المتجر للوصول إلى لوحة الإدارة. يتم حفظ رابط الـ API محلياً لسهولة الاستخدام.</p>
      </header>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          رابط API
          <input
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            placeholder="http://localhost:3000"
          />
        </label>

        <div className="auth-form-grid">
          <label>
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            كلمة المرور
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="auth-inline-hint subdued">
          <span>المسار التالي بعد النجاح:</span>
          <strong>`/merchant`</strong>
        </div>

        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>

      {error ? <p className="status-message error-text">{error}</p> : null}
    </section>
  );
}
