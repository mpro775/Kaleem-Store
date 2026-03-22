import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography, Divider, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import StoreIcon from '@mui/icons-material/Store';
import PhoneIcon from '@mui/icons-material/Phone';
import PolicyIcon from '@mui/icons-material/Policy';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
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
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل إعدادات المتجر', type: 'error' });
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
      setMessage({ text: 'تم تحديث إعدادات المتجر بنجاح', type: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحديث الإعدادات', type: 'error' });
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
            إعدادات المتجر
          </Typography>
          <Typography color="text.secondary">
            قم بضبط البيانات الأساسية والسياسات الخاصة بمتجرك لتظهر للعملاء بشكل صحيح.
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
            إلغاء التعديلات
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={() => saveSettings().catch(() => undefined)} 
            disabled={saveLoading}
          >
            {saveLoading ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
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
          <Typography variant="h6" fontWeight={800}>المعلومات الأساسية</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        <Stack spacing={3}>
          <TextField 
            label="اسم المتجر" 
            fullWidth 
            value={form.name} 
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} 
            placeholder="مثال: متجر الهدايا الفاخرة"
          />
          <TextField 
            label="رابط الشعار (Logo URL)" 
            fullWidth 
            value={form.logoUrl} 
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))} 
            placeholder="https://example.com/logo.png"
            helperText="أدخل رابط صورة شعار المتجر. سيظهر في الفواتير وواجهة المتجر."
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <TextField
              label="رمز العملة"
              fullWidth
              value={form.currencyCode}
              inputProps={{ maxLength: 3 }}
              onChange={(event) => setForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))}
              helperText="مثال: SAR, YER, USD"
            />
            <TextField 
              label="المنطقة الزمنية" 
              fullWidth 
              value={form.timezone} 
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} 
              helperText="مثال: Asia/Riyadh"
              dir="ltr"
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Card 2: Contact Information */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PhoneIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>معلومات التواصل</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        <Stack spacing={3}>
          <TextField 
            label="رقم الهاتف" 
            fullWidth 
            value={form.phone} 
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} 
            placeholder="+966xxxxxxxxx"
            dir="ltr"
          />
          <TextField 
            label="العنوان الجغرافي" 
            fullWidth 
            multiline
            rows={2}
            value={form.address} 
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} 
            placeholder="مثال: شارع العليا، الرياض، المملكة العربية السعودية"
          />
        </Stack>
      </Paper>

      {/* Card 3: Policies */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <PolicyIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>السياسات والأحكام</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        
        <Stack spacing={4}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>سياسة الشحن والتوصيل</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.shippingPolicy} 
              onChange={(event) => setForm((prev) => ({ ...prev, shippingPolicy: event.target.value }))} 
              placeholder="اكتب هنا تفاصيل الشحن والشركات المعتمدة ومدة التوصيل المتوقعة..."
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>سياسة الاسترجاع والاستبدال</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.returnPolicy} 
              onChange={(event) => setForm((prev) => ({ ...prev, returnPolicy: event.target.value }))} 
              placeholder="اكتب هنا شروط قبول استرجاع أو استبدال المنتجات..."
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>سياسة الخصوصية</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.privacyPolicy} 
              onChange={(event) => setForm((prev) => ({ ...prev, privacyPolicy: event.target.value }))} 
              placeholder="اكتب هنا كيفية جمع واستخدام بيانات العملاء..."
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>الشروط والأحكام</Typography>
            <TextField 
              fullWidth 
              multiline 
              minRows={3} 
              value={form.termsAndConditions} 
              onChange={(event) => setForm((prev) => ({ ...prev, termsAndConditions: event.target.value }))} 
              placeholder="اكتب هنا الشروط العامة لاستخدام الموقع وإتمام الطلبات..."
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
          {saveLoading ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
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