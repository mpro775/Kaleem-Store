import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { StoreSettings } from '../types';
import { AppPage, FormSection, PageHeader } from '../components/ui';

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
      <AppPage maxWidth={900}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <CircularProgress />
        </Box>
      </AppPage>
    );
  }

  return (
    <AppPage maxWidth={900}>
      <PageHeader
        title="إعدادات المتجر"
        description="قم بضبط البيانات الأساسية والسياسات الخاصة بمتجرك لتظهر للعملاء بشكل واضح ومتسق."
        actions={(
          <>
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
          </>
        )}
      />

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <FormSection title="المعلومات الأساسية" description="بيانات الهوية الرئيسية التي تظهر للعملاء داخل المتجر والفواتير.">
        <Stack spacing={3}>
          <TextField
            label="اسم المتجر"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="مثال: متجر الهدايا الفاخرة"
          />
          <TextField
            label="رابط الشعار (Logo URL)"
            value={form.logoUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            placeholder="https://example.com/logo.png"
            helperText="أدخل رابط صورة شعار المتجر."
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="رمز العملة"
              value={form.currencyCode}
              inputProps={{ maxLength: 3 }}
              onChange={(event) => setForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))}
              helperText="مثال: SAR, YER, USD"
            />
            <TextField
              label="المنطقة الزمنية"
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              helperText="مثال: Asia/Riyadh"
              dir="ltr"
            />
          </Stack>
        </Stack>
      </FormSection>

      <FormSection title="معلومات التواصل" description="وسائل التواصل وموقع المتجر الجغرافي الظاهر للعميل.">
        <Stack spacing={3}>
          <TextField
            label="رقم الهاتف"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="+966xxxxxxxxx"
            dir="ltr"
          />
          <TextField
            label="العنوان الجغرافي"
            multiline
            rows={2}
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="مثال: شارع العليا، الرياض، المملكة العربية السعودية"
          />
        </Stack>
      </FormSection>

      <FormSection title="السياسات والأحكام" description="سياسات الشحن والاسترجاع والخصوصية والشروط العامة للمتجر.">
        <Stack spacing={3}>
          <TextField
            label="سياسة الشحن والتوصيل"
            multiline
            minRows={3}
            value={form.shippingPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, shippingPolicy: event.target.value }))}
            placeholder="اكتب هنا تفاصيل الشحن والشركات المعتمدة ومدة التوصيل المتوقعة..."
          />
          <TextField
            label="سياسة الاسترجاع والاستبدال"
            multiline
            minRows={3}
            value={form.returnPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, returnPolicy: event.target.value }))}
            placeholder="اكتب هنا شروط قبول استرجاع أو استبدال المنتجات..."
          />
          <TextField
            label="سياسة الخصوصية"
            multiline
            minRows={3}
            value={form.privacyPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, privacyPolicy: event.target.value }))}
            placeholder="اكتب هنا كيفية جمع واستخدام بيانات العملاء..."
          />
          <TextField
            label="الشروط والأحكام"
            multiline
            minRows={3}
            value={form.termsAndConditions}
            onChange={(event) => setForm((prev) => ({ ...prev, termsAndConditions: event.target.value }))}
            placeholder="اكتب هنا الشروط العامة لاستخدام الموقع وإتمام الطلبات..."
          />
        </Stack>
      </FormSection>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => saveSettings().catch(() => undefined)}
          disabled={saveLoading}
        >
          {saveLoading ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </Box>
    </AppPage>
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
