import { FormEvent, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { requestJson } from '../../lib/http';
import { readStoredApiBaseUrl } from '../merchant/session-storage';
import type { AuthResult, MerchantSession } from '../merchant/types';

interface MerchantRegisterPageProps {
  onBackHome: () => void;
  onSignIn: () => void;
  onRegistered: (session: MerchantSession) => void;
}

interface OwnerRegistrationChallengeResult {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}

const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export function MerchantRegisterPage({
  onBackHome,
  onSignIn,
  onRegistered,
}: MerchantRegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [registrationChallenge, setRegistrationChallenge] = useState<{
    challengeId: string;
    expiresAtMs: number;
    resendAvailableAtMs: number;
  } | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());

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

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (registrationChallenge) {
      await onVerifyOtp();
      return;
    }
    await onStartRegistration();
  }

  async function onStartRegistration(): Promise<void> {
    const apiBaseUrl = readStoredApiBaseUrl();
    if (!apiBaseUrl) {
      setError('API base URL is not configured.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password || !ownerPhone.trim()) {
      setError('Please fill all required fields.');
      return;
    }

    if (!PHONE_REGEX.test(ownerPhone.trim())) {
      setError('Owner phone is invalid.');
      return;
    }

    setBusy(true);
    setError('');
    setInfoMessage('');

    try {
      const result = await requestJson<OwnerRegistrationChallengeResult>(
        `${apiBaseUrl}/auth/register-owner/start`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            ownerPhone: ownerPhone.trim(),
          }),
        },
      );

      if (!result) {
        throw new Error('Failed to start registration.');
      }

      setRegistrationChallenge({
        challengeId: result.challengeId,
        expiresAtMs: Date.parse(result.expiresAt),
        resendAvailableAtMs: Date.parse(result.resendAvailableAt),
      });
      setOtpCode('');
      setClockNow(Date.now());
      setInfoMessage('Verification code sent to your email.');
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start registration.');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(): Promise<void> {
    const apiBaseUrl = readStoredApiBaseUrl();
    if (!apiBaseUrl || !registrationChallenge) {
      setError('Verification session is missing. Restart registration.');
      return;
    }

    const normalizedOtp = otpCode.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const result = await requestJson<AuthResult>(`${apiBaseUrl}/auth/register-owner/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          challengeId: registrationChallenge.challengeId,
          otpCode: normalizedOtp,
        }),
      });

      if (!result) {
        throw new Error('Failed to complete verification.');
      }

      onRegistered({
        apiBaseUrl,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'OTP verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function onResendOtp(): Promise<void> {
    const apiBaseUrl = readStoredApiBaseUrl();
    if (!apiBaseUrl || !registrationChallenge) {
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
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            challengeId: registrationChallenge.challengeId,
          }),
        },
      );

      if (!result) {
        throw new Error('Failed to resend verification code.');
      }

      setRegistrationChallenge({
        challengeId: result.challengeId,
        expiresAtMs: Date.parse(result.expiresAt),
        resendAvailableAtMs: Date.parse(result.resendAvailableAt),
      });
      setClockNow(Date.now());
      setInfoMessage('A new verification code has been sent.');
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : 'Failed to resend verification code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box component="section" dir="rtl" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', py: { xs: 4, md: 8 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.8}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              إنشاء حساب التاجر
            </Typography>
            <Typography color="text.secondary">
              أدخل بيانات المالك ثم أكمل التحقق بالرمز. إعداد المتجر سيتم بعد OTP.
            </Typography>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {infoMessage ? <Alert severity="success">{infoMessage}</Alert> : null}

          <Box component="form" onSubmit={onSubmit}>
            {!registrationChallenge ? (
              <Stack spacing={2}>
                <TextField
                  label="الاسم الكامل"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
                <TextField
                  label="البريد الإلكتروني"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <TextField
                  label="كلمة المرور"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  inputProps={{ minLength: 8 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="رقم هاتف المالك"
                  value={ownerPhone}
                  onChange={(event) => setOwnerPhone(event.target.value)}
                  required
                  inputProps={{ dir: 'ltr' }}
                />
                <Button type="submit" variant="contained" size="large" disabled={busy}>
                  {busy ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق'}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Alert severity={otpExpiresInSeconds > 0 ? 'info' : 'warning'}>
                  {otpExpiresInSeconds > 0
                    ? `الرمز صالح لمدة ${formatCountdown(otpExpiresInSeconds)}`
                    : 'انتهت صلاحية الرمز. أعد الإرسال.'}
                </Alert>
                <TextField
                  label="رمز التحقق (6 أرقام)"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ maxLength: 6, dir: 'ltr' }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button type="submit" variant="contained" disabled={busy || otpExpiresInSeconds <= 0}>
                    {busy ? 'جاري التحقق...' : 'تأكيد'}
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
                      setError('');
                      setInfoMessage('');
                    }}
                    disabled={busy}
                  >
                    تعديل البيانات
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button variant="text" onClick={onBackHome}>
              العودة للرئيسية
            </Button>
            <Button variant="text" onClick={onSignIn}>
              لدي حساب بالفعل
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}
