import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography, Divider, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import StoreIcon from '@mui/icons-material/Store';
import PhoneIcon from '@mui/icons-material/Phone';
import PolicyIcon from '@mui/icons-material/Policy';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { StoreSettings } from '../types';

interface StoreSettingsPanelProps {
  request: MerchantRequester;
}

export function StoreSettingsPanel({ request }: StoreSettingsPanelProps) {
  const [form, setForm] = useState({
    name: '',
    currencyCode: 'YER',
    timezone: 'Asia/Aden',
    logoUrl: '',
    phone: '',
    address: '',
    shippingPolicy: '',
    returnPolicy: '',
    privacyPolicy: '',
    termsAndConditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, []);

  async function loadSettings(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      const data = await request<StoreSettings>('/store/settings', { method: 'GET' });
      if (!data) return;

      setForm({
        name: data.name || '',
        currencyCode: data.currencyCode || 'YER',
        timezone: data.timezone || 'Asia/Aden',
        logoUrl: data.logoUrl ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        shippingPolicy: data.shippingPolicy ?? '',
        returnPolicy: data.returnPolicy ?? '',
        privacyPolicy: data.privacyPolicy ?? '',
        termsAndConditions: data.termsAndConditions ?? '',
      });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط±', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(): Promise<void> {
    setSaveLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      await request<StoreSettings>('/store/settings', {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      setMessage({ text: 'طھظ… طھط­ط¯ظٹط« ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­', type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ', type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
      
      {/* Header Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط±
          </Typography>
          <Typography color="text.secondary">
            ظ‚ظ… ط¨ط¶ط¨ط· ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط© ظˆط§ظ„ط³ظٹط§ط³ط§طھ ط§ظ„ط®ط§طµط© ط¨ظ…طھط¬ط±ظƒ ظ„طھط¸ظ‡ط± ظ„ظ„ط¹ظ…ظ„ط§ط، ط¨ط´ظƒظ„ طµط­ظٹط­.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            color="inherit" 
            startIcon={<SettingsBackupRestoreIcon />}
            onClick={() => loadSettings().catch(() => undefined)} 
            disabled={saveLoading}
          >
            ط¥ظ„ط؛ط§ط، ط§ظ„طھط¹ط¯ظٹظ„ط§طھ
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={() => saveSettings().catch(() => undefined)} 
            disabled={saveLoading}
          >
            {saveLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ط§ظ„طھط؛ظٹظٹط±ط§طھ'}
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Card 1: Basic Information */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <StoreIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط©</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        <Stack spacing={3}>
          <TextField 
            label="ط§ط³ظ… ط§ظ„ظ…طھط¬ط±" 
            fullWidth 
            value={form.name} 
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} 
            placeholder="ظ…ط«ط§ظ„: ظ…طھط¬ط± ط§ظ„ظ‡ط¯ط§ظٹط§ ط§ظ„ظپط§ط®ط±ط©"
          />
          <TextField 
            label="ط±ط§ط¨ط· ط§ظ„ط´ط¹ط§ط± (Logo URL)" 
            fullWidth 
            value={form.logoUrl} 
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))} 
            placeholder="https://example.com/logo.png"
            helperText="ط£ط¯ط®ظ„ ط±ط§ط¨ط· طµظˆط±ط© ط´ط¹ط§ط± ط§ظ„ظ…طھط¬ط±. ط³ظٹط¸ظ‡ط± ظپظٹ ط§ظ„ظپظˆط§طھظٹط± ظˆظˆط§ط¬ظ‡ط© ط§ظ„ظ…طھط¬ط±."
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <TextField
              label="ط±ظ…ط² ط§ظ„ط¹ظ…ظ„ط©"
              fullWidth
              value={form.currencyCode}
              inputProps={{ maxLength: 3 }}
              onChange={(event) => setForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))}
              helperText="ظ…ط«ط§ظ„: SAR, YER, USD"
            />
            <TextField 
              label="ط§ظ„ظ…ظ†ط·ظ‚ط© ط§ظ„ط²ظ…ظ†ظٹط©" 
              fullWidth 
              value={form.timezone} 
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} 
              helperText="ظ…ط«ط§ظ„: Asia/Riyadh"
              dir="ltr"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Card 2: Contact Information */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PhoneIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„طھظˆط§طµظ„</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        <Stack spacing={3}>
          <TextField 
            label="ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ" 
            fullWidth 
            value={form.phone} 
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} 
            placeholder="+966xxxxxxxxx"
            dir="ltr"
          />
          <TextField 
            label="ط§ظ„ط¹ظ†ظˆط§ظ† ط§ظ„ط¬ط؛ط±ط§ظپظٹ" 
            fullWidth 
            multiline
            rows={2}
            value={form.address} 
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} 
            placeholder="ظ…ط«ط§ظ„: ط´ط§ط±ط¹ ط§ظ„ط¹ظ„ظٹط§طŒ ط§ظ„ط±ظٹط§ط¶طŒ ط§ظ„ظ…ظ…ظ„ظƒط© ط§ظ„ط¹ط±ط¨ظٹط© ط§ظ„ط³ط¹ظˆط¯ظٹط©"
          />
        </Stack>
      </Paper>

      {/* Card 3: Policies */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PolicyIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>ط§ظ„ط³ظٹط§ط³ط§طھ ظˆط§ظ„ط£ط­ظƒط§ظ…</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        <Stack spacing={4}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>ط³ظٹط§ط³ط© ط§ظ„ط´ط­ظ† ظˆط§ظ„طھظˆطµظٹظ„</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.shippingPolicy} 
              onChange={(event) => setForm((prev) => ({ ...prev, shippingPolicy: event.target.value }))} 
              placeholder="ط§ظƒطھط¨ ظ‡ظ†ط§ طھظپط§طµظٹظ„ ط§ظ„ط´ط­ظ† ظˆط§ظ„ط´ط±ظƒط§طھ ط§ظ„ظ…ط¹طھظ…ط¯ط© ظˆظ…ط¯ط© ط§ظ„طھظˆطµظٹظ„ ط§ظ„ظ…طھظˆظ‚ط¹ط©..."
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>ط³ظٹط§ط³ط© ط§ظ„ط§ط³طھط±ط¬ط§ط¹ ظˆط§ظ„ط§ط³طھط¨ط¯ط§ظ„</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.returnPolicy} 
              onChange={(event) => setForm((prev) => ({ ...prev, returnPolicy: event.target.value }))} 
              placeholder="ط§ظƒطھط¨ ظ‡ظ†ط§ ط´ط±ظˆط· ظ‚ط¨ظˆظ„ ط§ط³طھط±ط¬ط§ط¹ ط£ظˆ ط§ط³طھط¨ط¯ط§ظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ..."
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>ط³ظٹط§ط³ط© ط§ظ„ط®طµظˆطµظٹط©</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.privacyPolicy} 
              onChange={(event) => setForm((prev) => ({ ...prev, privacyPolicy: event.target.value }))} 
              placeholder="ط§ظƒطھط¨ ظ‡ظ†ط§ ظƒظٹظپظٹط© ط¬ظ…ط¹ ظˆط§ط³طھط®ط¯ط§ظ… ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط،..."
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>ط§ظ„ط´ط±ظˆط· ظˆط§ظ„ط£ط­ظƒط§ظ…</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.termsAndConditions} 
              onChange={(event) => setForm((prev) => ({ ...prev, termsAndConditions: event.target.value }))} 
              placeholder="ط§ظƒطھط¨ ظ‡ظ†ط§ ط§ظ„ط´ط±ظˆط· ط§ظ„ط¹ط§ظ…ط© ظ„ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ…ظˆظ‚ط¹ ظˆط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨ط§طھ..."
            />
          </Box>
        </Stack>
      </Paper>

      {/* Bottom Floating Save Button for convenience */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          startIcon={<SaveIcon />}
          onClick={() => saveSettings().catch(() => undefined)} 
          disabled={saveLoading}
          sx={{ px: 4, py: 1.5, borderRadius: 2 }}
        >
          {saveLoading ? 'ط¬ط§ط±ظگ ط§ظ„ط­ظپط¸...' : 'ط­ظپط¸ ط§ظ„طھط؛ظٹظٹط±ط§طھ'}
        </Button>
      </Box>

    </Box>
  );
}

function buildPayload(form: {
  name: string;
  currencyCode: string;
  timezone: string;
  logoUrl: string;
  phone: string;
  address: string;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  termsAndConditions: string;
}) {
  const payload: {
    name: string;
    currencyCode: string;
    timezone: string;
    logoUrl?: string;
    phone?: string;
    address?: string;
    shippingPolicy?: string;
    returnPolicy?: string;
    privacyPolicy?: string;
    termsAndConditions?: string;
  } = {
    name: form.name.trim(),
    currencyCode: form.currencyCode.trim().toUpperCase(),
    timezone: form.timezone.trim(),
  };

  const logo = form.logoUrl.trim();
  const phone = form.phone.trim();
  const address = form.address.trim();
  const shippingPolicy = form.shippingPolicy.trim();
  const returnPolicy = form.returnPolicy.trim();
  const privacyPolicy = form.privacyPolicy.trim();
  const termsAndConditions = form.termsAndConditions.trim();

  if (logo) {
    payload.logoUrl = logo;
  }
  if (phone) {
    payload.phone = phone;
  }
  if (address) {
    payload.address = address;
  }
  payload.shippingPolicy = shippingPolicy;
  payload.returnPolicy = returnPolicy;
  payload.privacyPolicy = privacyPolicy;
  payload.termsAndConditions = termsAndConditions;

  return payload;
}