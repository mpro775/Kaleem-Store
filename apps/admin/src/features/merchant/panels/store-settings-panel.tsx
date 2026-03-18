import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import type { MerchantRequester } from '../merchant-dashboard';
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, []);

  async function loadSettings(): Promise<void> {
    setLoading(true);
    setMessage('');

    try {
      const data = await request<StoreSettings>('/store/settings', { method: 'GET' });
      if (!data) {
        return;
      }

      setForm({
        name: data.name,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        logoUrl: data.logoUrl ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        shippingPolicy: data.shippingPolicy ?? '',
        returnPolicy: data.returnPolicy ?? '',
        privacyPolicy: data.privacyPolicy ?? '',
        termsAndConditions: data.termsAndConditions ?? '',
      });
      setMessage('تم تحميل إعدادات المتجر');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحميل إعدادات المتجر');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(): Promise<void> {
    setLoading(true);
    setMessage('');

    try {
      await request<StoreSettings>('/store/settings', {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      });
      setMessage('تم تحديث إعدادات المتجر');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تحديث الإعدادات');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, display: 'grid', gap: 1 }}>
      <Typography variant="h6">إعدادات المتجر</Typography>
      <TextField label="اسم المتجر" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <TextField
          label="رمز العملة"
          value={form.currencyCode}
          inputProps={{ maxLength: 3 }}
          onChange={(event) => setForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))}
        />
        <TextField label="المنطقة الزمنية" value={form.timezone} onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} />
      </Stack>
      <TextField label="رابط الشعار" value={form.logoUrl} onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
        <TextField label="الهاتف" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
        <TextField label="العنوان" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
      </Stack>
      <TextField label="سياسة الشحن" multiline minRows={3} value={form.shippingPolicy} onChange={(event) => setForm((prev) => ({ ...prev, shippingPolicy: event.target.value }))} />
      <TextField label="سياسة الاسترجاع" multiline minRows={3} value={form.returnPolicy} onChange={(event) => setForm((prev) => ({ ...prev, returnPolicy: event.target.value }))} />
      <TextField label="سياسة الخصوصية" multiline minRows={3} value={form.privacyPolicy} onChange={(event) => setForm((prev) => ({ ...prev, privacyPolicy: event.target.value }))} />
      <TextField label="الشروط والأحكام" multiline minRows={3} value={form.termsAndConditions} onChange={(event) => setForm((prev) => ({ ...prev, termsAndConditions: event.target.value }))} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" onClick={() => loadSettings().catch(() => undefined)} disabled={loading}>
          إعادة تحميل
        </Button>
        <Button variant="contained" onClick={() => saveSettings().catch(() => undefined)} disabled={loading}>
          حفظ
        </Button>
      </Stack>

      {message ? <Alert severity="info">{message}</Alert> : null}
    </Paper>
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
