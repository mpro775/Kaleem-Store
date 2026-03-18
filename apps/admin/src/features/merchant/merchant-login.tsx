import { FormEvent, useState } from 'react';
import { Alert, Box, Button, TextField, Typography, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { requestJson } from '../../lib/http';
import { readStoredApiBaseUrl } from './session-storage';
import type { AuthResult, MerchantSession } from './types';

interface MerchantLoginProps {
  onLoggedIn: (session: MerchantSession) => void;
}

export function MerchantLogin({ onLoggedIn }: MerchantLoginProps) {
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('Owner123!');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedApiBaseUrl = readStoredApiBaseUrl();
    if (!trimmedApiBaseUrl) {
      setError('تعذر العثور على رابط API. اضبط VITE_API_BASE_URL.');
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
        throw new Error('تعذر تسجيل الدخول. تأكد من صحة البيانات.');
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
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="البريد الإلكتروني"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="أدخل بريدك الإلكتروني"
          fullWidth
        />
        
        <TextField
          label="كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          placeholder="أدخل كلمة المرور"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Button 
        variant="contained" 
        color="primary" 
        type="submit" 
        disabled={busy}
        size="large"
        sx={{ mt: 1, py: 1.5, borderRadius: 2 }}
        fullWidth
      >
        {busy ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
      </Button>
    </Box>
  );
}
