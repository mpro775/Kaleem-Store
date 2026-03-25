'use client';

import { useState } from 'react';
import { useCustomerAuth } from '../lib/customer-auth-context';
import { customerForgotPassword } from '../lib/customer-client';

type AuthView = 'login' | 'register' | 'forgot-password' | 'success';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useCustomerAuth();

  const [loginForm, setLoginForm] = useState({ phoneOrEmail: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginForm);
      resetForms();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const registerInput: { fullName: string; phone: string; email?: string; password: string } = {
        fullName: registerForm.fullName,
        phone: registerForm.phone,
        password: registerForm.password,
      };
      if (registerForm.email) {
        registerInput.email = registerForm.email;
      }
      await register(registerInput);
      resetForms();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await customerForgotPassword(forgotEmail);
      setView('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  }

  function resetForms() {
    setLoginForm({ phoneOrEmail: '', password: '' });
    setRegisterForm({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
    setForgotEmail('');
    setError(null);
    setView('login');
  }

  function handleClose() {
    resetForms();
    onClose();
  }

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        {view === 'login' && (
          <>
            <h2>تسجيل الدخول</h2>
            <p className="auth-modal-subtitle">مرحباً بعودتك! سجل دخولك لمتابعة طلباتك</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label htmlFor="login-phone">رقم الهاتف أو البريد الإلكتروني</label>
                <input
                  id="login-phone"
                  type="text"
                  className="input"
                  value={loginForm.phoneOrEmail}
                  onChange={(e) => setLoginForm({ ...loginForm, phoneOrEmail: e.target.value })}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">كلمة المرور</label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="button-primary auth-submit" disabled={loading}>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => { setView('forgot-password'); setError(null); }}>
                نسيت كلمة المرور؟
              </button>
              <button type="button" className="auth-link" onClick={() => { setView('register'); setError(null); }}>
                ليس لديك حساب؟ سجل الآن
              </button>
            </div>
          </>
        )}

        {view === 'register' && (
          <>
            <h2>إنشاء حساب جديد</h2>
            <p className="auth-modal-subtitle">أنشئ حسابك لتتبع طلباتك وإدارة عناوينك</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <label htmlFor="register-name">الاسم الكامل</label>
                <input
                  id="register-name"
                  type="text"
                  className="input"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  required
                  maxLength={120}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="register-phone">رقم الهاتف</label>
                <input
                  id="register-phone"
                  type="tel"
                  className="input"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  required
                  maxLength={30}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="register-email">البريد الإلكتروني (اختياري)</label>
                <input
                  id="register-email"
                  type="email"
                  className="input"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  maxLength={120}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="register-password">كلمة المرور</label>
                <input
                  id="register-password"
                  type="password"
                  className="input"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={8}
                  maxLength={72}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="register-confirm">تأكيد كلمة المرور</label>
                <input
                  id="register-confirm"
                  type="password"
                  className="input"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="button-primary auth-submit" disabled={loading}>
                {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
              </button>
            </form>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => { setView('login'); setError(null); }}>
                لديك حساب؟ سجل دخولك
              </button>
            </div>
          </>
        )}

        {view === 'forgot-password' && (
          <>
            <h2>نسيت كلمة المرور</h2>
            <p className="auth-modal-subtitle">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="auth-field">
                <label htmlFor="forgot-email">البريد الإلكتروني</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="button-primary auth-submit" disabled={loading}>
                {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </button>
            </form>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => { setView('login'); setError(null); }}>
                العودة لتسجيل الدخول
              </button>
            </div>
          </>
        )}

        {view === 'success' && (
          <>
            <h2>تم الإرسال بنجاح</h2>
            <p className="auth-modal-subtitle">
              تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.
            </p>
            <button type="button" className="button-primary auth-submit" onClick={() => { setView('login'); setError(null); }}>
              العودة لتسجيل الدخول
            </button>
          </>
        )}
      </div>
    </div>
  );
}
