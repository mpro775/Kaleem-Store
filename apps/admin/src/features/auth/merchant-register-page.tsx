import { FormEvent, useMemo, useState } from 'react';
import { requestJson } from '../../lib/http';
import { readStoredApiBaseUrl } from '../merchant/session-storage';
import type { AuthResult, MerchantSession } from '../merchant/types';

interface MerchantRegisterPageProps {
  onBackHome: () => void;
  onSignIn: () => void;
  onRegistered: (session: MerchantSession) => void;
}

interface RegisterFormState {
  apiBaseUrl: string;
  fullName: string;
  email: string;
  password: string;
  storeName: string;
  storeSlug: string;
}

const initialFormState: RegisterFormState = {
  apiBaseUrl: readStoredApiBaseUrl(),
  fullName: '',
  email: '',
  password: '',
  storeName: '',
  storeSlug: '',
};

const formHighlights = [
  'إنشاء الحساب يتم على نفس بوابة التاجر بدون الانتقال إلى تطبيق آخر.',
  'عند نجاح التسجيل سيتم إدخالك مباشرة إلى لوحة التاجر.',
  'رابط المتجر يتم توليده تلقائياً ويمكن تعديله قبل الإرسال.',
];

export function MerchantRegisterPage({ onBackHome, onSignIn, onRegistered }: MerchantRegisterPageProps) {
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storeSlugTouched, setStoreSlugTouched] = useState(false);

  const slugPreview = useMemo(() => {
    return form.storeSlug.trim().length > 0 ? form.storeSlug.trim() : slugify(form.storeName);
  }, [form.storeName, form.storeSlug]);

  function updateField<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]): void {
    setForm((current) => {
      const nextForm: RegisterFormState = {
        ...current,
        [key]: value,
      };

      if (key === 'storeName' && !storeSlugTouched) {
        nextForm.storeSlug = slugify(String(value));
      }

      return nextForm;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const apiBaseUrl = form.apiBaseUrl.trim();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const password = form.password;
    const storeName = form.storeName.trim();
    const storeSlug = form.storeSlug.trim();

    if (!apiBaseUrl) {
      setError('يرجى إدخال رابط الـ API.');
      return;
    }

    if (!fullName || !email || !password || !storeName || !storeSlug) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storeSlug)) {
      setError('رابط المتجر يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const result = await requestJson<AuthResult>(`${apiBaseUrl}/auth/register-owner`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          storeName,
          storeSlug,
        }),
      });

      if (!result) {
        throw new Error('تعذر إنشاء الحساب.');
      }

      onRegistered({
        apiBaseUrl,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'تعذر إنشاء الحساب.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" dir="rtl">
      <div className="auth-page-intro panel">
        <p className="eyebrow">إنشاء حساب</p>
        <h2>أنشئ حساب التاجر وادخل مباشرة إلى لوحة متجرك</h2>
        <p>
          تم ربط هذا النموذج مباشرة مع `POST /auth/register-owner` حتى تكتمل رحلة التاجر من
          الصفحة التعريفية إلى التسجيل ثم الدخول التلقائي إلى `/merchant`.
        </p>
        <div className="auth-benefits-list">
          {formHighlights.map((item) => (
            <div key={item} className="auth-benefit-card">
              <strong>{item}</strong>
            </div>
          ))}
        </div>
        <div className="auth-page-links">
          <button type="button" onClick={onBackHome}>
            العودة للرئيسية
          </button>
          <button type="button" onClick={onSignIn}>
            لدي حساب بالفعل
          </button>
        </div>
      </div>

      <section className="panel panel-merchant auth-panel auth-form-panel">
        <header className="panel-header">
          <h2>إنشاء حساب جديد</h2>
          <p>أدخل بيانات المتجر الأساسية. عند نجاح التسجيل سيتم إنشاء الجلسة والدخول مباشرة.</p>
        </header>

        <form className="stack-form auth-register-form" onSubmit={onSubmit}>
          <label>
            رابط API
            <input
              value={form.apiBaseUrl}
              onChange={(event) => updateField('apiBaseUrl', event.target.value)}
              placeholder="http://localhost:3000"
            />
          </label>

          <div className="auth-form-grid">
            <label>
              الاسم الكامل
              <input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="مثال: أحمد خالد"
                required
              />
            </label>

            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="owner@example.com"
                required
              />
            </label>
          </div>

          <div className="auth-form-grid">
            <label>
              كلمة المرور
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="8 أحرف أو أكثر"
                minLength={8}
                required
              />
            </label>

            <label>
              اسم المتجر
              <input
                value={form.storeName}
                onChange={(event) => updateField('storeName', event.target.value)}
                placeholder="مثال: متجر القمة"
                required
              />
            </label>
          </div>

          <label>
            رابط المتجر `slug`
            <input
              dir="ltr"
              value={form.storeSlug}
              onChange={(event) => {
                setStoreSlugTouched(true);
                updateField('storeSlug', slugify(event.target.value));
              }}
              placeholder="my-store"
              required
            />
          </label>

          <div className="auth-inline-hint">
            <span>معاينة الرابط:</span>
            <code>{slugPreview || 'my-store'}</code>
          </div>

          <div className="auth-page-links">
            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب والدخول'}
            </button>
            <button type="button" onClick={onSignIn} disabled={busy}>
              لدي حساب بالفعل
            </button>
          </div>
        </form>

        {error ? <p className="status-message error-text">{error}</p> : null}

        <div className="auth-inline-hint subdued">
          <span>بعد النجاح:</span>
          <strong>سيتم تحويلك تلقائياً إلى لوحة التاجر.</strong>
        </div>
      </section>
    </section>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
