import { useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { requestJson } from '../../lib/http';
import { readStoredPlatformApiBaseUrl } from './platform-session-storage';
import type { PlatformAuthResult, PlatformSession } from './platform-types';

interface PlatformLoginPageProps {
  onLoggedIn: (session: PlatformSession) => void;
  onBackHome: () => void;
  onMerchantLogin: () => void;
}

export function PlatformLoginPage({ onLoggedIn, onBackHome, onMerchantLogin }: PlatformLoginPageProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => readStoredPlatformApiBaseUrl());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submitLogin() {
    setSubmitting(true);
    setError('');
    try {
      const normalizedApiBaseUrl = apiBaseUrl.trim().replace(/\/+$/, '');
      const payload = await requestJson<PlatformAuthResult>(
        `${normalizedApiBaseUrl}/platform/auth/login`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!payload) {
        throw new Error('Empty auth response');
      }

      onLoggedIn({
        apiBaseUrl: normalizedApiBaseUrl,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="section" dir="rtl" sx={{ display: 'grid', gap: 1.25 }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>
            تسجيل دخول منصة كليم
          </Typography>
          <Typography color="text.secondary">
            دخول فريق العمليات الداخلي مع صلاحيات RBAC.
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3 }}>
        <Stack spacing={1.2}>
          <TextField
            label="API Base URL"
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            fullWidth
            placeholder="http://localhost:3000"
          />
          <TextField
            label="البريد الإلكتروني"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
            type="email"
          />
          <TextField
            label="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            type="password"
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="contained"
              disabled={submitting || !email.trim() || !password.trim() || !apiBaseUrl.trim()}
              onClick={() => submitLogin().catch(() => undefined)}
            >
              {submitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
            <Button variant="outlined" onClick={onBackHome}>الرئيسية</Button>
            <Button variant="outlined" onClick={onMerchantLogin}>دخول التاجر</Button>
          </Stack>
        </Stack>
        {error ? <Alert severity="error" sx={{ mt: 1.2 }}>{error}</Alert> : null}
      </Paper>
    </Box>
  );
}
