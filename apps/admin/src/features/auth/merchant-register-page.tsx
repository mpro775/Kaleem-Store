import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { requestJson } from '../../lib/http';
import { readStoredApiBaseUrl } from '../merchant/session-storage';
import type { AuthResult, MerchantSession } from '../merchant/types';

interface MerchantRegisterPageProps {
  onBackHome: () => void;
  onSignIn: () => void;
  onRegistered: (session: MerchantSession) => void;
}

interface RegisterFormState {
  fullName: string;
  email: string;
  password: string;
  ownerPhone: string;
  storeName: string;
  storeSlug: string;
  storePhone: string;
  useOwnerPhoneForStore: boolean;
}

interface OwnerRegistrationChallengeResult {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}

type OtpStepState = 'verify' | 'expired' | 'restart';

const initialFormState: RegisterFormState = {
  fullName: '',
  email: '',
  password: '',
  ownerPhone: '',
  storeName: '',
  storeSlug: '',
  storePhone: '',
  useOwnerPhoneForStore: true,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

function updateOtpInput(setter: (value: string) => void, value: string): void {
  const normalized = value.replace(/\D/g, '').slice(0, 6);
  setter(normalized);
}

function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}

function normalizeRegistrationErrorMessage(message: string): string {
  if (message.includes('Store slug already in use')) {
    return 'رابط المتجر مستخدم بالفعل';
  }

  if (message.includes('Email already in use')) {
    return 'البريد الإلكتروني مستخدم بالفعل';
  }

  if (message.includes('Invalid verification code')) {
    return 'رمز التحقق غير صحيح';
  }

  if (message.includes('Verification code has expired')) {
    return 'انتهت صلاحية رمز التحقق، أعد إرسال رمز جديد أو ابدأ التسجيل من جديد';
  }

  if (message.includes('Maximum verification attempts exceeded')) {
    return 'تم تجاوز الحد الأقصى لمحاولات التحقق، ابدأ التسجيل من جديد';
  }

  if (message.includes('Maximum resend attempts exceeded')) {
    return 'تم تجاوز الحد الأقصى لإعادة إرسال الرمز، ابدأ التسجيل من جديد';
  }

  if (message.includes('Wait before requesting a new verification code')) {
    return 'يرجى الانتظار قليلاً قبل طلب رمز جديد';
  }

  return message;
}

function inferOtpStepState(message: string): OtpStepState {
  if (message.includes('انتهت صلاحية رمز التحقق')) {
    return 'expired';
  }

  if (
    message.includes('ابدأ التسجيل من جديد') ||
    message.includes('تم استخدام جلسة التحقق') ||
    message.includes('جلسة التحقق غير موجودة')
  ) {
    return 'restart';
  }

  return 'verify';
}

export function MerchantRegisterPage({ onBackHome, onSignIn, onRegistered }: MerchantRegisterPageProps) {
  const theme = useTheme();
  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [storeSlugTouched, setStoreSlugTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [registrationChallenge, setRegistrationChallenge] = useState<{
    challengeId: string;
    expiresAtMs: number;
    resendAvailableAtMs: number;
  } | null>(null);
  const [otpStepState, setOtpStepState] = useState<OtpStepState>('verify');
  const [clockNow, setClockNow] = useState(() => Date.now());

  const slugPreview = useMemo(() => {
    return form.storeSlug.trim().length > 0 ? form.storeSlug.trim() : slugify(form.storeName);
  }, [form.storeName, form.storeSlug]);

  const storeSlugPreview = slugPreview || 'my-store';
  const selectedStorePhone = form.useOwnerPhoneForStore ? form.ownerPhone.trim() : form.storePhone.trim();
  const otpExpiresInSeconds = registrationChallenge
    ? Math.max(0, Math.ceil((registrationChallenge.expiresAtMs - clockNow) / 1000))
    : 0;
  const resendInSeconds = registrationChallenge
    ? Math.max(0, Math.ceil((registrationChallenge.resendAvailableAtMs - clockNow) / 1000))
    : 0;

  useEffect(() => {
    if (!registrationChallenge) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [registrationChallenge]);

  useEffect(() => {
    if (!registrationChallenge) {
      return;
    }

    if (otpExpiresInSeconds <= 0 && otpStepState === 'verify') {
      setOtpStepState('expired');
    }
  }, [otpExpiresInSeconds, otpStepState, registrationChallenge]);

  function updateField<K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]): void {
    setForm((current) => {
      const nextForm: RegisterFormState = {
        ...current,
        [key]: value,
      };

      if (key === 'storeName' && !storeSlugTouched) {
        nextForm.storeSlug = slugify(String(value));
      }

      if (key === 'ownerPhone' && current.useOwnerPhoneForStore) {
        nextForm.storePhone = String(value);
      }

      if (key === 'useOwnerPhoneForStore') {
        const useOwnerPhoneForStore = Boolean(value);
        nextForm.useOwnerPhoneForStore = useOwnerPhoneForStore;
        if (useOwnerPhoneForStore) {
          nextForm.storePhone = current.ownerPhone;
        }
      }

      return nextForm;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (registrationChallenge) {
      if (otpStepState !== 'verify') {
        return;
      }
      await onVerifyOtp();
      return;
    }

    await onStartRegistration();
  }

  async function onStartRegistration(): Promise<void> {
    const apiBaseUrl = readStoredApiBaseUrl();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const password = form.password;
    const ownerPhone = form.ownerPhone.trim();
    const storeName = form.storeName.trim();
    const storeSlug = form.storeSlug.trim();
    const storePhone = selectedStorePhone;

    if (!apiBaseUrl) {
      setError('تعذر العثور على رابط API. اضبط VITE_API_BASE_URL.');
      return;
    }

    if (!fullName || !email || !password || !ownerPhone || !storeName || !storeSlug) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }

    if (!PHONE_REGEX.test(ownerPhone)) {
      setError('رقم هاتف المالك غير صالح. استخدم أرقاماً مع + اختياري.');
      return;
    }

    if (storePhone && !PHONE_REGEX.test(storePhone)) {
      setError('رقم هاتف المتجر غير صالح.');
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storeSlug)) {
      setError('رابط المتجر يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط.');
      return;
    }

    setBusy(true);
    setError('');
    setInfoMessage('');
    setOtpStepState('verify');

    try {
      const payload: {
        fullName: string;
        email: string;
        password: string;
        ownerPhone: string;
        storeName: string;
        storeSlug: string;
        storePhone?: string;
      } = {
        fullName,
        email,
        password,
        ownerPhone,
        storeName,
        storeSlug,
      };

      if (storePhone) {
        payload.storePhone = storePhone;
      }

      const result = await requestJson<OwnerRegistrationChallengeResult>(
        `${apiBaseUrl}/auth/register-owner/start`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!result) {
        throw new Error('تعذر بدء التسجيل.');
      }

      setRegistrationChallenge({
        challengeId: result.challengeId,
        expiresAtMs: Date.parse(result.expiresAt),
        resendAvailableAtMs: Date.parse(result.resendAvailableAt),
      });
      setOtpStepState('verify');
      setClockNow(Date.now());
      setOtpCode('');
      setInfoMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني. أدخل الرمز لإكمال إنشاء الحساب.');
    } catch (startError) {
      const message = normalizeRegistrationErrorMessage(
        startError instanceof Error ? startError.message : 'تعذر بدء التسجيل.',
      );
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(): Promise<void> {
    const apiBaseUrl = readStoredApiBaseUrl();
    const challengeId = registrationChallenge?.challengeId;
    const normalizedOtpCode = otpCode.trim();

    if (!apiBaseUrl || !challengeId) {
      setError('جلسة التحقق غير متاحة. أعد بدء التسجيل.');
      return;
    }

    if (!/^\d{6}$/.test(normalizedOtpCode)) {
      setError('رمز التحقق يجب أن يتكون من 6 أرقام.');
      return;
    }

    if (otpExpiresInSeconds <= 0) {
      setOtpStepState('expired');
      setError('انتهت صلاحية رمز التحقق، أعد إرسال رمز جديد أو ابدأ التسجيل من جديد');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const result = await requestJson<AuthResult>(`${apiBaseUrl}/auth/register-owner/verify`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          otpCode: normalizedOtpCode,
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
    } catch (verifyError) {
      const message = normalizeRegistrationErrorMessage(
        verifyError instanceof Error ? verifyError.message : 'تعذر التحقق من الرمز.',
      );
      setError(message);
      setOtpStepState(inferOtpStepState(message));
    } finally {
      setBusy(false);
    }
  }

  async function onResendOtp(): Promise<void> {
    const apiBaseUrl = readStoredApiBaseUrl();
    const challengeId = registrationChallenge?.challengeId;

    if (!apiBaseUrl || !challengeId) {
      setError('جلسة التحقق غير متاحة. أعد بدء التسجيل.');
      return;
    }

    setBusy(true);
    setError('');
    setInfoMessage('');

    try {
      const result = await requestJson<OwnerRegistrationChallengeResult>(
        `${apiBaseUrl}/auth/register-owner/resend-otp`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            challengeId,
          }),
        },
      );

      if (!result) {
        throw new Error('تعذر إعادة إرسال رمز التحقق.');
      }

      setRegistrationChallenge({
        challengeId: result.challengeId,
        expiresAtMs: Date.parse(result.expiresAt),
        resendAvailableAtMs: Date.parse(result.resendAvailableAt),
      });
      setOtpStepState('verify');
      setClockNow(Date.now());
      setInfoMessage('تم إرسال رمز تحقق جديد إلى بريدك.');
    } catch (resendError) {
      const message = normalizeRegistrationErrorMessage(
        resendError instanceof Error ? resendError.message : 'تعذر إعادة إرسال رمز التحقق.',
      );
      setError(message);
      setOtpStepState(inferOtpStepState(message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      component="section"
      dir="rtl"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, width: '100%' }}>
        
        {/* Right Form Side */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', p: { xs: 3, sm: 6, md: 8 }, position: 'relative', overflowY: 'auto' }}>
          
          <Button 
            onClick={onBackHome}
            sx={{ position: 'absolute', top: 32, right: 32, color: 'text.secondary', '&:hover': { color: 'primary.main' }, zIndex: 10 }}
            startIcon={<ArrowForwardIcon sx={{ mr: -1, ml: 1 }} />}
          >
            العودة للرئيسية
          </Button>

          <Box sx={{ maxWidth: 500, width: '100%', mx: 'auto', my: { xs: 8, md: 0 } }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                إنشاء متجرك الجديد
              </Typography>
              <Typography color="text.secondary">
                أدخل بياناتك وبيانات متجرك للبدء مجاناً.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {infoMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {infoMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {!registrationChallenge ? (
                <>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                      بيانات المالك
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField
                        label="الاسم الكامل"
                        value={form.fullName}
                        onChange={(event) => updateField('fullName', event.target.value)}
                        placeholder="مثال: أحمد خالد"
                        required
                        fullWidth
                      />
                      <TextField
                        label="البريد الإلكتروني"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        placeholder="owner@example.com"
                        required
                        fullWidth
                      />
                      <TextField
                        label="كلمة المرور"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => updateField('password', event.target.value)}
                        placeholder="8 أحرف أو أكثر"
                        inputProps={{ minLength: 8 }}
                        required
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="رقم هاتف المالك"
                        value={form.ownerPhone}
                        onChange={(event) => updateField('ownerPhone', event.target.value)}
                        placeholder="+9677XXXXXXX"
                        required
                        fullWidth
                        inputProps={{ dir: 'ltr' }}
                      />
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                      هوية المتجر
                    </Typography>
                    <Stack spacing={2.5}>
                      <TextField
                        label="اسم المتجر"
                        value={form.storeName}
                        onChange={(event) => updateField('storeName', event.target.value)}
                        placeholder="مثال: متجر القمة"
                        required
                        fullWidth
                      />
                      <TextField
                        label="رابط المتجر (Slug)"
                        value={form.storeSlug}
                        onChange={(event) => {
                          setStoreSlugTouched(true);
                          updateField('storeSlug', slugify(event.target.value));
                        }}
                        placeholder="my-store"
                        required
                        fullWidth
                        inputProps={{ dir: 'ltr' }}
                        helperText={
                          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                            سيصبح رابط متجرك:{' '}
                            <strong dir="ltr" style={{ color: theme.palette.primary.main }}>
                              {storeSlugPreview}.kaleem.store
                            </strong>
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.useOwnerPhoneForStore}
                            onChange={(event) =>
                              updateField('useOwnerPhoneForStore', event.target.checked)
                            }
                          />
                        }
                        label="استخدام نفس رقم المالك كرقم المتجر"
                      />

                      <TextField
                        label="رقم هاتف المتجر"
                        value={selectedStorePhone}
                        onChange={(event) => {
                          updateField('useOwnerPhoneForStore', false);
                          updateField('storePhone', event.target.value);
                        }}
                        placeholder="+9677XXXXXXX"
                        fullWidth
                        inputProps={{ dir: 'ltr' }}
                        disabled={form.useOwnerPhoneForStore}
                      />
                    </Stack>
                  </Box>

                  <Button
                    variant="contained"
                    type="submit"
                    disabled={busy}
                    size="large"
                    sx={{ mt: 2, py: 1.5, borderRadius: 2 }}
                  >
                    {busy ? 'جارٍ إرسال رمز التحقق...' : 'إرسال رمز التحقق'}
                  </Button>
                </>
              ) : (
                <>
                  {otpStepState === 'verify' ? (
                    <>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        تم إرسال رمز إلى <strong>{form.email}</strong>. الوقت المتبقي:{' '}
                        <strong dir="ltr">{formatCountdown(otpExpiresInSeconds)}</strong>
                      </Alert>

                      <TextField
                        label="رمز التحقق (6 أرقام)"
                        value={otpCode}
                        onChange={(event) => updateOtpInput(setOtpCode, event.target.value)}
                        placeholder="123456"
                        inputProps={{ maxLength: 6, dir: 'ltr' }}
                        required
                        fullWidth
                      />

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button variant="contained" type="submit" disabled={busy} sx={{ py: 1.4 }}>
                          {busy ? 'جارٍ التحقق...' : 'تأكيد وإنشاء الحساب'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => onResendOtp().catch(() => undefined)}
                          disabled={busy || resendInSeconds > 0}
                        >
                          {resendInSeconds > 0
                            ? `إعادة الإرسال بعد ${formatCountdown(resendInSeconds)}`
                            : 'إعادة إرسال الرمز'}
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => {
                            setRegistrationChallenge(null);
                            setOtpCode('');
                            setOtpStepState('verify');
                            setInfoMessage('');
                            setError('');
                          }}
                          disabled={busy}
                        >
                          تعديل البيانات
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2, borderColor: otpStepState === 'expired' ? 'warning.light' : 'error.light' }}
                    >
                      <Stack spacing={1.2}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {otpStepState === 'expired' ? 'انتهت صلاحية رمز التحقق' : 'تحتاج إعادة المحاولة'}
                        </Typography>
                        <Typography color="text.secondary">
                          {otpStepState === 'expired'
                            ? 'يمكنك إعادة إرسال رمز جديد للبريد نفسه ومتابعة التسجيل مباشرة.'
                            : 'تعذر متابعة التحقق الحالي. ابدأ التسجيل من جديد لتوليد جلسة تحقق جديدة.'}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          {otpStepState === 'expired' ? (
                            <Button
                              variant="contained"
                              onClick={() => onResendOtp().catch(() => undefined)}
                              disabled={busy || resendInSeconds > 0}
                            >
                              {resendInSeconds > 0
                                ? `إعادة الإرسال بعد ${formatCountdown(resendInSeconds)}`
                                : 'إرسال رمز جديد'}
                            </Button>
                          ) : null}
                          <Button
                            variant={otpStepState === 'expired' ? 'outlined' : 'contained'}
                            onClick={() => {
                              setRegistrationChallenge(null);
                              setOtpCode('');
                              setOtpStepState('verify');
                              setInfoMessage('');
                              setError('');
                            }}
                            disabled={busy}
                          >
                            البدء من جديد
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  )}
                </>
              )}
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                لدي حساب بالفعل؟{' '}
                <Typography
                  component="span"
                  color="primary"
                  sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={onSignIn}
                >
                  تسجيل الدخول
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Left Branding Side (Hidden on Mobile) */}
        <Box 
          sx={{ 
            display: { xs: 'none', lg: 'flex' },
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 8
          }}
        >
          {/* Abstract elements */}
          <Box sx={{ position: 'absolute', top: '10%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)` }} />
          <Box sx={{ position: 'absolute', bottom: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 70%)` }} />
          
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 900,
                fontSize: '1.75rem',
                mb: 4,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              K
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: '2.5rem', lineHeight: 1.2 }}>
              انطلق بتجارتك الرقمية نحو القمة.
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 5, fontWeight: 400, lineHeight: 1.7 }}>
              انضم إلى آلاف التجار الذين يثقون في كليم ستور لإدارة وتنمية أعمالهم اليومية.
            </Typography>

            <Stack spacing={4}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography fontWeight={800}>1</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>سهولة التسجيل</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>خطوة واحدة فقط وتكون لوحة التحكم الخاصة بك جاهزة تماماً للبدء.</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography fontWeight={800}>2</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>تخصيص الهوية</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>اختر النطاق المناسب لك وعدل الألوان بما يتناسب مع علامتك التجارية.</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography fontWeight={800}>3</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>انطلاقة فورية</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>أضف منتجاتك، استقبل الطلبات، وابدأ البيع من اليوم الأول مباشرة.</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
