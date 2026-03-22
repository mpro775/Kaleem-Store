import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { MerchantRequester } from '../merchant-dashboard';
import type { PreviewTokenResponse, ThemeState } from '../types';

interface ThemesPanelProps {
  request: MerchantRequester;
  apiBaseUrl: string;
}

const sectionKeys = [
  'announcement_bar',
  'header',
  'hero',
  'categories_grid',
  'featured_products',
  'rich_text',
  'testimonials',
  'newsletter_signup',
  'offers_banner',
  'footer',
] as const;

type SectionKey = (typeof sectionKeys)[number];

const sectionLabels: Record<SectionKey, string> = {
  announcement_bar: 'الشريط الإعلاني العلوي',
  header: 'الترويسة (الرأس)',
  hero: 'قسم البانر الرئيسي',
  categories_grid: 'شبكة التصنيفات',
  featured_products: 'المنتجات المميزة',
  rich_text: 'نص ترويجي غني',
  testimonials: 'آراء العملاء',
  newsletter_signup: 'الاشتراك بالنشرة البريدية',
  offers_banner: 'بانر العروض',
  footer: 'التذييل (أسفل الصفحة)',
};

interface ThemeEditorForm {
  primaryColor: string;
  accentColor: string;
  background: string;
  fontFamily: string;
  heroHeadline: string;
  sectionEnabled: Record<SectionKey, boolean>;
}

const defaultForm: ThemeEditorForm = {
  primaryColor: '#502E91',
  accentColor: '#8F00FF',
  background: '#FAFAFF',
  fontFamily: 'Tajawal, Cairo, sans-serif',
  heroHeadline: 'مرحباً بك في متجرنا',
  sectionEnabled: {
    announcement_bar: true,
    header: true,
    hero: true,
    categories_grid: true,
    featured_products: true,
    rich_text: true,
    testimonials: true,
    newsletter_signup: true,
    offers_banner: true,
    footer: true,
  },
};

export function ThemesPanel({ request, apiBaseUrl }: ThemesPanelProps) {
  const [themeState, setThemeState] = useState<ThemeState | null>(null);
  const [form, setForm] = useState<ThemeEditorForm>(defaultForm);
  const [previewToken, setPreviewToken] = useState<PreviewTokenResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => {
    loadDraft().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDraft(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<ThemeState>('/themes/draft', { method: 'GET' });
      if (!data) return;

      setThemeState(data);
      setForm(themeConfigToForm(data.draftConfig));
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر تحميل إعدادات الواجهة', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<ThemeState>('/themes/draft', {
        method: 'PUT',
        body: JSON.stringify({ config: formToThemeConfig(form) }),
      });

      if (data) {
        setThemeState(data);
      }
      setMessage({ text: 'تم حفظ مسودة التعديلات بنجاح. راجعها قبل النشر.', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر حفظ المسودة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function publishTheme(): Promise<void> {
    if (!window.confirm('هل أنت متأكد من نشر هذه التعديلات لتظهر للعملاء الآن؟')) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<ThemeState>('/themes/publish', { method: 'POST' });
      if (data) {
        setThemeState(data);
      }
      setMessage({ text: 'تم نشر الواجهة المحدثة بنجاح.', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر نشر الواجهة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function createPreviewToken(): Promise<void> {
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const token = await request<PreviewTokenResponse>('/themes/preview-token', {
        method: 'POST',
        body: JSON.stringify({ expiresInMinutes: 30 }),
      });
      setPreviewToken(token);
      setMessage({ text: 'تم إنشاء رمز المعاينة بنجاح.', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر إنشاء رمز المعاينة', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            واجهة المتجر والتخصيص
          </Typography>
          <Typography color="text.secondary">
            تحكم في ألوان المتجر، الخطوط، وإخفاء أو إظهار أقسام الصفحة الرئيسية.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            onClick={() => loadDraft().catch(() => undefined)}
            disabled={actionLoading}
          >
            تجاهل التعديلات
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => saveDraft().catch(() => undefined)}
            disabled={actionLoading}
          >
            حفظ كمسودة
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => publishTheme().catch(() => undefined)}
            disabled={actionLoading}
            disableElevation
          >
            نشر التعديلات
          </Button>
        </Stack>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ borderRadius: 2 }}>{message.text}</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Colors and Branding */}
        <Box>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <PaletteIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>الألوان والخطوط</Typography>
            </Box>
            <Divider sx={{ mb: 4 }} />

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  fullWidth 
                  label="اللون الأساسي" 
                  value={form.primaryColor} 
                  onChange={(event) => setForm((prev) => ({ ...prev, primaryColor: event.target.value }))} 
                  dir="ltr"
                  InputProps={{
                    startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: form.primaryColor, mr: 1, border: '1px solid', borderColor: 'divider' }} />
                  }}
                />
                <TextField 
                  fullWidth 
                  label="لون التمييز (Accent)" 
                  value={form.accentColor} 
                  onChange={(event) => setForm((prev) => ({ ...prev, accentColor: event.target.value }))} 
                  dir="ltr"
                  InputProps={{
                    startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: form.accentColor, mr: 1, border: '1px solid', borderColor: 'divider' }} />
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField 
                  fullWidth 
                  label="لون الخلفية العامة" 
                  value={form.background} 
                  onChange={(event) => setForm((prev) => ({ ...prev, background: event.target.value }))} 
                  dir="ltr"
                  InputProps={{
                    startAdornment: <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: form.background, mr: 1, border: '1px solid', borderColor: 'divider' }} />
                  }}
                />
              </Box>

              <TextField 
                fullWidth 
                label="الخط الرئيسي (CSS Font Family)" 
                value={form.fontFamily} 
                onChange={(event) => setForm((prev) => ({ ...prev, fontFamily: event.target.value }))} 
                dir="ltr"
                helperText="مثال: Tajawal, Cairo, sans-serif"
              />
            </Stack>
          </Paper>
        </Box>

        {/* Section Toggles */}
        <Box>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <SettingsSuggestIcon color="primary" />
              <Typography variant="h6" fontWeight={800}>أقسام الصفحة الرئيسية</Typography>
            </Box>
            <Divider sx={{ mb: 4 }} />

            <TextField 
              fullWidth 
              label="عنوان البانر الرئيسي (Hero)" 
              value={form.heroHeadline} 
              onChange={(event) => setForm((prev) => ({ ...prev, heroHeadline: event.target.value }))} 
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight={700} mb={2}>تفعيل وإلغاء الأقسام:</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {sectionKeys.map((key) => (
                <Paper key={key} variant="outlined" sx={{ p: 1, px: 2, display: 'flex', alignItems: 'center', bgcolor: form.sectionEnabled[key] ? 'background.default' : 'transparent' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.sectionEnabled[key]}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            sectionEnabled: {
                              ...prev.sectionEnabled,
                              [key]: event.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label={<Typography variant="body2" fontWeight={form.sectionEnabled[key] ? 700 : 500}>{sectionLabels[key]}</Typography>}
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Status and Preview */}
        <Box sx={{ gridColumn: { xs: 'span 1', lg: 'span 2' } }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon color="success" fontSize="large" />
              <Box>
                <Typography variant="h6" fontWeight={800}>حالة الواجهة الحالية</Typography>
                {themeState ? (
                  <Typography variant="body2" color="text.secondary">
                    الإصدار المنشور: {themeState.version}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">لا توجد بيانات للإصدار.</Typography>
                )}
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {previewToken && (
                <Button 
                  variant="text" 
                  color="primary"
                  href={`${apiBaseUrl}/sf/theme?previewToken=${previewToken.previewToken}`}
                  target="_blank"
                  sx={{ fontWeight: 700 }}
                >
                  فتح رابط المعاينة
                </Button>
              )}
              <Button 
                variant="outlined" 
                startIcon={<VisibilityIcon />} 
                onClick={() => createPreviewToken().catch(() => undefined)}
                disabled={actionLoading}
              >
                إنشاء رابط معاينة
              </Button>
            </Stack>
          </Paper>
        </Box>

      </Box>
    </Box>
  );
}

function themeConfigToForm(config: Record<string, unknown>): ThemeEditorForm {
  const globals = asRecord(config.globals);
  const sections = Array.isArray(config.sections) ? config.sections : [];
  const sectionEnabled = { ...defaultForm.sectionEnabled };

  for (const section of sections) {
    const sectionRecord = asRecord(section);
    const type = sectionRecord.type;
    if (typeof type === 'string' && isSectionKey(type)) {
      sectionEnabled[type] = sectionRecord.enabled !== false;
    }
  }

  const heroHeadline = resolveHeroHeadline(sections);

  return {
    primaryColor:
      typeof globals.primaryColor === 'string' ? globals.primaryColor : defaultForm.primaryColor,
    accentColor:
      typeof globals.accentColor === 'string' ? globals.accentColor : defaultForm.accentColor,
    background:
      typeof globals.background === 'string' ? globals.background : defaultForm.background,
    fontFamily:
      typeof globals.fontFamily === 'string' ? globals.fontFamily : defaultForm.fontFamily,
    heroHeadline,
    sectionEnabled,
  };
}

function formToThemeConfig(form: ThemeEditorForm): Record<string, unknown> {
  return {
    globals: {
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      background: form.background,
      fontFamily: form.fontFamily,
    },
    sections: [
      {
        id: 'announcement-main',
        type: 'announcement_bar',
        enabled: form.sectionEnabled.announcement_bar,
         settings: { message: 'شحن مجاني للطلبات فوق 300 ريال' },
      },
      {
        id: 'header-main',
        type: 'header',
        enabled: form.sectionEnabled.header,
        settings: { sticky: true },
      },
      {
        id: 'hero-main',
        type: 'hero',
        enabled: form.sectionEnabled.hero,
        settings: { headline: form.heroHeadline },
      },
      {
        id: 'categories-main',
        type: 'categories_grid',
        enabled: form.sectionEnabled.categories_grid,
        settings: {},
      },
      {
        id: 'featured-main',
        type: 'featured_products',
        enabled: form.sectionEnabled.featured_products,
        settings: { limit: 8 },
      },
      {
        id: 'rich-text-main',
        type: 'rich_text',
        enabled: form.sectionEnabled.rich_text,
        settings: {
           title: 'لماذا يثق العملاء بنا؟',
           body: 'توصيل سريع، منتجات مختارة، ودفع آمن.',
        },
      },
      {
        id: 'testimonials-main',
        type: 'testimonials',
        enabled: form.sectionEnabled.testimonials,
        settings: {
           title: 'مفضل لدى المتسوقين',
           items: [
             { quote: 'جودة ممتازة ودعم سريع.', author: 'ريم' },
             { quote: 'تجربة دفع سلسة على الجوال.', author: 'فيصل' },
           ],
        },
      },
      {
        id: 'newsletter-main',
        type: 'newsletter_signup',
        enabled: form.sectionEnabled.newsletter_signup,
         settings: { title: 'احصل على عروض أسبوعية', ctaLabel: 'اشترك' },
      },
      {
        id: 'offers-main',
        type: 'offers_banner',
        enabled: form.sectionEnabled.offers_banner,
        settings: {},
      },
      {
        id: 'footer-main',
        type: 'footer',
        enabled: form.sectionEnabled.footer,
        settings: {},
      },
    ],
  };
}

function resolveHeroHeadline(sections: unknown[]): string {
  for (const section of sections) {
    const sectionRecord = asRecord(section);
    if (sectionRecord.type !== 'hero') {
      continue;
    }

    const settings = asRecord(sectionRecord.settings);
    if (typeof settings.headline === 'string') {
      return settings.headline;
    }
  }

  return defaultForm.heroHeadline;
}

function isSectionKey(value: string): value is SectionKey {
  return sectionKeys.includes(value as SectionKey);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}