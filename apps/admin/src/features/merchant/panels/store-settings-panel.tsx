import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MerchantRequester } from '../merchant-dashboard.types';
import type { MediaAsset, PresignedMediaUpload, StoreSettings, StoreSettingsOptions } from '../types';
import { AppPage, FormSection, PageHeader } from '../components/ui';

interface StoreSettingsPanelProps {
  request: MerchantRequester;
}

interface WorkingHoursSlotForm {
  id: string;
  open: string;
  close: string;
}

interface WorkingHoursDayForm {
  day: string;
  isClosed: boolean;
  slots: WorkingHoursSlotForm[];
}

type SocialLinksForm = Record<string, string>;

interface StoreSettingsForm {
  name: string;
  currencyCode: string;
  timezone: string;
  logoMediaAssetId: string | null;
  logoUrl: string | null;
  phone: string;
  country: string;
  city: string;
  addressDetails: string;
  latitude: string;
  longitude: string;
  workingHours: WorkingHoursDayForm[];
  socialLinks: SocialLinksForm;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  termsAndConditions: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const DEFAULT_OPTIONS: StoreSettingsOptions = {
  defaultCountry: 'اليمن',
  currencies: ['YER', 'SAR', 'USD'],
  timezones: ['Asia/Aden'],
  governorates: [],
  workingDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  socialPlatforms: ['instagram', 'facebook', 'x', 'tiktok', 'snapchat', 'whatsapp', 'telegram', 'youtube', 'website'],
  businessCategories: ['beauty', 'fashion', 'abayas', 'electronics', 'books_stationery', 'kids_toys', 'furniture_decor', 'health_wellness', 'other'],
};

const DAY_LABELS: Record<string, string> = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  youtube: 'YouTube',
  website: 'Website',
};

const YEMEN_CENTER: [number, number] = [15.3694, 44.191];

export function StoreSettingsPanel({ request }: StoreSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [options, setOptions] = useState<StoreSettingsOptions>(DEFAULT_OPTIONS);
  const [form, setForm] = useState<StoreSettingsForm>(createInitialForm(DEFAULT_OPTIONS));
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [mapResults, setMapResults] = useState<NominatimResult[]>([]);
  const [mapPoint, setMapPoint] = useState<[number, number] | null>(YEMEN_CENTER);

  const composedAddress = useMemo(
    () => composeAddress(form.country, form.city, form.addressDetails),
    [form.country, form.city, form.addressDetails],
  );

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, []);

  async function loadSettings(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      const [settingsData, optionsData] = await Promise.all([
        request<StoreSettings>('/store/settings', { method: 'GET' }),
        request<StoreSettingsOptions>('/store/settings/options', { method: 'GET' }),
      ]);

      if (!settingsData) {
        return;
      }

      const resolvedOptions = optionsData ?? DEFAULT_OPTIONS;
      setOptions(resolvedOptions);
      setForm(toFormState(settingsData, resolvedOptions));
      if (settingsData.latitude !== null && settingsData.longitude !== null) {
        setMapPoint([settingsData.latitude, settingsData.longitude]);
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'تعذر تحميل إعدادات المتجر',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(): Promise<void> {
    const validationError = validateForm(form, options.socialPlatforms);
    if (validationError) {
      setMessage({ text: validationError, type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaveLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      await request<StoreSettings>('/store/settings', {
        method: 'PUT',
        body: JSON.stringify(buildPayload(form, composedAddress)),
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

  async function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setUploadLoading(true);
    setMessage({ text: '', type: 'info' });

    try {
      const asset = await uploadMediaAsset(request, file);
      setForm((prev) => ({
        ...prev,
        logoMediaAssetId: asset.id,
        logoUrl: asset.url,
      }));
      setMessage({ text: 'تم رفع الشعار بنجاح', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'تعذر رفع الشعار', type: 'error' });
    } finally {
      setUploadLoading(false);
    }
  }

  function clearLogo(): void {
    setForm((prev) => ({
      ...prev,
      logoMediaAssetId: null,
      logoUrl: null,
    }));
  }

  function openMapDialog(): void {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMapPoint([lat, lng]);
    }
    setMapDialogOpen(true);
  }

  function applyMapPoint(): void {
    if (!mapPoint) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      latitude: mapPoint[0].toFixed(7),
      longitude: mapPoint[1].toFixed(7),
    }));
    setMapDialogOpen(false);
  }

  async function searchOnMap(): Promise<void> {
    const query = mapSearch.trim();
    if (!query) {
      return;
    }

    setMapSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ye&limit=6&q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error('تعذر البحث في الخريطة');
      }
      const items = (await response.json()) as NominatimResult[];
      setMapResults(items);
      if (items.length > 0) {
        const first = items[0];
        if (first) {
          setMapPoint([Number(first.lat), Number(first.lon)]);
        }
      }
    } catch {
      setMapResults([]);
      setMessage({ text: 'تعذر البحث في الخريطة حالياً', type: 'error' });
    } finally {
      setMapSearching(false);
    }
  }

  if (loading) {
    return (
      <AppPage maxWidth={980}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
          <CircularProgress />
        </Box>
      </AppPage>
    );
  }

  return (
    <AppPage maxWidth={980}>
      <PageHeader
        title="إعدادات المتجر"
        description="إدارة الهوية، العنوان، ساعات العمل وروابط التواصل بشكل منظم ومتوافق مع المتجر."
        actions={(
          <>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<SettingsBackupRestoreIcon />}
              onClick={() => loadSettings().catch(() => undefined)}
              disabled={saveLoading || uploadLoading}
            >
              إعادة التحميل
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={() => saveSettings().catch(() => undefined)}
              disabled={saveLoading || uploadLoading}
            >
              {saveLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </>
        )}
      />

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <FormSection title="المعلومات الأساسية" description="اسم المتجر، شعاره، العملة والمنطقة الزمنية.">
        <Stack spacing={3}>
          <TextField
            label="اسم المتجر"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">شعار المتجر</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                {form.logoUrl ? (
                  <Box component="img" src={form.logoUrl} alt="Store logo" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">بدون شعار</Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading || saveLoading}
                >
                  {uploadLoading ? 'جاري الرفع...' : form.logoUrl ? 'استبدال الشعار' : 'رفع الشعار'}
                </Button>
                <Button
                  variant="text"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={clearLogo}
                  disabled={!form.logoUrl || uploadLoading || saveLoading}
                >
                  حذف
                </Button>
              </Stack>
            </Stack>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(event) => {
                handleLogoFileChange(event).catch(() => undefined);
              }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label="العملة"
              value={form.currencyCode}
              onChange={(event) => setForm((prev) => ({ ...prev, currencyCode: event.target.value }))}
            >
              {options.currencies.map((currency) => (
                <MenuItem key={currency} value={currency}>{currency}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="المنطقة الزمنية"
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              dir="ltr"
            >
              {options.timezones.map((timezone) => (
                <MenuItem key={timezone} value={timezone}>{timezone}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </FormSection>

      <FormSection title="العنوان الجغرافي" description="الدولة، المدينة، العنوان التفصيلي والإحداثيات مع اختيار مباشر من الخريطة.">
        <Stack spacing={2}>
          <TextField
            label="الدولة"
            value={form.country}
            disabled
          />
          <TextField
            select
            label="المدينة (المحافظة)"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          >
            <MenuItem value="">اختر المحافظة</MenuItem>
            {options.governorates.map((governorate) => (
              <MenuItem key={governorate} value={governorate}>{governorate}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="العنوان التفصيلي"
            multiline
            rows={2}
            value={form.addressDetails}
            onChange={(event) => setForm((prev) => ({ ...prev, addressDetails: event.target.value }))}
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Latitude"
              value={form.latitude}
              onChange={(event) => setForm((prev) => ({ ...prev, latitude: event.target.value }))}
              dir="ltr"
            />
            <TextField
              label="Longitude"
              value={form.longitude}
              onChange={(event) => setForm((prev) => ({ ...prev, longitude: event.target.value }))}
              dir="ltr"
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={openMapDialog}>
              اختيار من الخريطة
            </Button>
          </Stack>

          <TextField
            label="العنوان legacy (توافق خلفي)"
            value={composedAddress}
            helperText="يتم توليده تلقائياً من الدولة + المدينة + العنوان التفصيلي عند الحفظ."
            InputProps={{ readOnly: true }}
          />
        </Stack>
      </FormSection>

      <FormSection title="ساعات العمل" description="تحديد أيام العمل مع إمكانية تعدد الفترات في اليوم الواحد.">
        <Stack spacing={2}>
          {form.workingHours.map((dayRow) => (
            <Box key={dayRow.day} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={600}>{DAY_LABELS[dayRow.day] ?? dayRow.day}</Typography>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={!dayRow.isClosed}
                        onChange={(event) => {
                          setForm((prev) => ({
                            ...prev,
                            workingHours: prev.workingHours.map((item) =>
                              item.day === dayRow.day
                                ? {
                                    ...item,
                                    isClosed: !event.target.checked,
                                    slots: !event.target.checked ? [] : item.slots.length > 0 ? item.slots : [createSlot()],
                                  }
                                : item,
                            ),
                          }));
                        }}
                      />
                    )}
                    label={dayRow.isClosed ? 'مغلق' : 'مفتوح'}
                  />
                </Stack>

                {!dayRow.isClosed ? (
                  <Stack spacing={1}>
                    {dayRow.slots.map((slot) => (
                      <Stack key={slot.id} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                        <TextField
                          label="من"
                          type="time"
                          value={slot.open}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              workingHours: prev.workingHours.map((item) =>
                                item.day === dayRow.day
                                  ? {
                                      ...item,
                                      slots: item.slots.map((s) =>
                                        s.id === slot.id ? { ...s, open: event.target.value } : s,
                                      ),
                                    }
                                  : item,
                              ),
                            }));
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="إلى"
                          type="time"
                          value={slot.close}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              workingHours: prev.workingHours.map((item) =>
                                item.day === dayRow.day
                                  ? {
                                      ...item,
                                      slots: item.slots.map((s) =>
                                        s.id === slot.id ? { ...s, close: event.target.value } : s,
                                      ),
                                    }
                                  : item,
                              ),
                            }));
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <IconButton
                          color="error"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              workingHours: prev.workingHours.map((item) =>
                                item.day === dayRow.day
                                  ? { ...item, slots: item.slots.filter((s) => s.id !== slot.id) }
                                  : item,
                              ),
                            }));
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    ))}

                    <Button
                      size="small"
                      variant="text"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          workingHours: prev.workingHours.map((item) =>
                            item.day === dayRow.day
                              ? { ...item, slots: [...item.slots, createSlot()] }
                              : item,
                          ),
                        }));
                      }}
                    >
                      إضافة فترة
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          ))}
        </Stack>
      </FormSection>

      <FormSection title="روابط التواصل" description="روابط المنصات الاجتماعية والموقع الرسمي.">
        <Stack spacing={2}>
          <TextField
            label="رقم الهاتف"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            dir="ltr"
          />

          <Divider />

          {options.socialPlatforms.map((platform) => (
            <TextField
              key={platform}
              label={SOCIAL_LABELS[platform] ?? platform}
              value={form.socialLinks[platform] ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    [platform]: value,
                  },
                }));
              }}
              placeholder="https://"
              dir="ltr"
            />
          ))}
        </Stack>
      </FormSection>

      <FormSection title="السياسات والأحكام" description="سياسات الشحن والاسترجاع والخصوصية والشروط العامة.">
        <Stack spacing={3}>
          <TextField
            label="سياسة الشحن"
            multiline
            minRows={3}
            value={form.shippingPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, shippingPolicy: event.target.value }))}
          />
          <TextField
            label="سياسة الاسترجاع"
            multiline
            minRows={3}
            value={form.returnPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, returnPolicy: event.target.value }))}
          />
          <TextField
            label="سياسة الخصوصية"
            multiline
            minRows={3}
            value={form.privacyPolicy}
            onChange={(event) => setForm((prev) => ({ ...prev, privacyPolicy: event.target.value }))}
          />
          <TextField
            label="الشروط والأحكام"
            multiline
            minRows={3}
            value={form.termsAndConditions}
            onChange={(event) => setForm((prev) => ({ ...prev, termsAndConditions: event.target.value }))}
          />
        </Stack>
      </FormSection>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => saveSettings().catch(() => undefined)}
          disabled={saveLoading || uploadLoading}
        >
          {saveLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </Box>

      <Dialog open={mapDialogOpen} onClose={() => setMapDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>اختيار الموقع من الخريطة</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                label="ابحث عن مكان"
                value={mapSearch}
                onChange={(event) => setMapSearch(event.target.value)}
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => searchOnMap().catch(() => undefined)}
                disabled={mapSearching}
              >
                {mapSearching ? 'جاري البحث...' : 'بحث'}
              </Button>
            </Stack>

            {mapResults.length > 0 ? (
              <Stack spacing={1}>
                {mapResults.map((result) => (
                  <Button
                    key={`${result.lat}-${result.lon}-${result.display_name}`}
                    variant="text"
                    sx={{ justifyContent: 'flex-start' }}
                    onClick={() => setMapPoint([Number(result.lat), Number(result.lon)])}
                  >
                    {result.display_name}
                  </Button>
                ))}
              </Stack>
            ) : null}

            <Box sx={{ height: 360, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <StoreMap
                point={mapPoint}
                onPointChange={setMapPoint}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              اضغط على الخريطة لتحديد الموقع. الإحداثيات الحالية:{' '}
              {mapPoint ? `${mapPoint[0].toFixed(7)}, ${mapPoint[1].toFixed(7)}` : '-'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapDialogOpen(false)}>إلغاء</Button>
          <Button onClick={applyMapPoint} variant="contained" disabled={!mapPoint}>اعتماد الإحداثيات</Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}

function createSlot(): WorkingHoursSlotForm {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    open: '09:00',
    close: '17:00',
  };
}

function createInitialForm(options: StoreSettingsOptions): StoreSettingsForm {
  return {
    name: '',
    currencyCode: options.currencies[0] ?? 'YER',
    timezone: options.timezones[0] ?? 'Asia/Aden',
    logoMediaAssetId: null,
    logoUrl: null,
    phone: '',
    country: options.defaultCountry,
    city: '',
    addressDetails: '',
    latitude: '',
    longitude: '',
    workingHours: options.workingDays.map((day) => ({
      day,
      isClosed: true,
      slots: [],
    })),
    socialLinks: Object.fromEntries(options.socialPlatforms.map((key) => [key, ''])),
    shippingPolicy: '',
    returnPolicy: '',
    privacyPolicy: '',
    termsAndConditions: '',
  };
}

function toFormState(settings: StoreSettings, options: StoreSettingsOptions): StoreSettingsForm {
  const workingHoursMap = new Map(settings.workingHours.map((row) => [row.day, row]));

  const workingHours = options.workingDays.map((day) => {
    const fromApi = workingHoursMap.get(day);
    if (!fromApi) {
      return { day, isClosed: true, slots: [] };
    }
    return {
      day,
      isClosed: Boolean(fromApi.isClosed),
      slots: (fromApi.slots ?? []).map((slot) => ({
        id: `${day}-${slot.open}-${slot.close}-${Math.random().toString(16).slice(2)}`,
        open: slot.open,
        close: slot.close,
      })),
    };
  });

  const socialLinks = Object.fromEntries(
    options.socialPlatforms.map((platform) => [platform, settings.socialLinks?.[platform] ?? '']),
  );

  return {
    name: settings.name || '',
    currencyCode: settings.currencyCode || options.currencies[0] || 'YER',
    timezone: settings.timezone || options.timezones[0] || 'Asia/Aden',
    logoMediaAssetId: settings.logoMediaAssetId,
    logoUrl: settings.logoUrl,
    phone: settings.phone ?? '',
    country: settings.country || options.defaultCountry,
    city: settings.city ?? '',
    addressDetails: settings.addressDetails ?? '',
    latitude: settings.latitude !== null ? String(settings.latitude) : '',
    longitude: settings.longitude !== null ? String(settings.longitude) : '',
    workingHours,
    socialLinks,
    shippingPolicy: settings.shippingPolicy ?? '',
    returnPolicy: settings.returnPolicy ?? '',
    privacyPolicy: settings.privacyPolicy ?? '',
    termsAndConditions: settings.termsAndConditions ?? '',
  };
}

function buildPayload(form: StoreSettingsForm, composedAddress: string): Record<string, unknown> {
  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();
  const parsedLatitude = latitude ? Number(latitude) : null;
  const parsedLongitude = longitude ? Number(longitude) : null;

  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    currencyCode: form.currencyCode,
    timezone: form.timezone,
    logoMediaAssetId: form.logoMediaAssetId,
    logoUrl: form.logoUrl,
    phone: form.phone.trim() || null,
    country: form.country,
    city: form.city.trim() || null,
    addressDetails: form.addressDetails.trim() || null,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    address: composedAddress || null,
    workingHours: form.workingHours.map((dayRow) => ({
      day: dayRow.day,
      isClosed: dayRow.isClosed,
      slots: dayRow.isClosed
        ? []
        : dayRow.slots
            .map((slot) => ({ open: slot.open.trim(), close: slot.close.trim() }))
            .filter((slot) => slot.open && slot.close),
    })),
    socialLinks: Object.fromEntries(
      Object.entries(form.socialLinks).map(([key, value]) => [key, value.trim() || null]),
    ),
    shippingPolicy: form.shippingPolicy.trim(),
    returnPolicy: form.returnPolicy.trim(),
    privacyPolicy: form.privacyPolicy.trim(),
    termsAndConditions: form.termsAndConditions.trim(),
  };

  return payload;
}

function validateForm(form: StoreSettingsForm, socialPlatforms: string[]): string | null {
  if (!form.name.trim()) {
    return 'اسم المتجر مطلوب';
  }

  const latitude = form.latitude.trim();
  const longitude = form.longitude.trim();
  const hasLatitude = latitude.length > 0;
  const hasLongitude = longitude.length > 0;
  if (hasLatitude !== hasLongitude) {
    return 'يجب إدخال Latitude وLongitude معاً';
  }

  if (hasLatitude && hasLongitude) {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
      return 'Latitude غير صالح';
    }
    if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      return 'Longitude غير صالح';
    }
  }

  for (const dayRow of form.workingHours) {
    if (dayRow.isClosed) {
      continue;
    }
    for (const slot of dayRow.slots) {
      if (!slot.open || !slot.close) {
        return `أكمل أوقات العمل ليوم ${DAY_LABELS[dayRow.day] ?? dayRow.day}`;
      }
      if (slot.open >= slot.close) {
        return `وقت الفتح يجب أن يسبق الإغلاق ليوم ${DAY_LABELS[dayRow.day] ?? dayRow.day}`;
      }
    }
  }

  for (const platform of socialPlatforms) {
    const value = form.socialLinks[platform]?.trim();
    if (!value) {
      continue;
    }

    if (!isValidHttpUrl(value)) {
      return `رابط ${SOCIAL_LABELS[platform] ?? platform} غير صالح`;
    }
  }

  return null;
}

function composeAddress(country: string, city: string, addressDetails: string): string {
  return [country, city, addressDetails].map((part) => part.trim()).filter(Boolean).join('، ');
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function StoreMap({ point, onPointChange }: { point: [number, number] | null; onPointChange: (point: [number, number]) => void }) {
  const center = (point ?? YEMEN_CENTER) as LatLngExpression;

  return (
    <MapContainer center={center} zoom={6} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPointChange={onPointChange} />
      <MapRecenter point={point} />
      {point ? <CircleMarker center={point} radius={8} pathOptions={{ color: '#1976d2', fillOpacity: 0.85 }} /> : null}
    </MapContainer>
  );
}

function MapClickHandler({ onPointChange }: { onPointChange: (point: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onPointChange([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function MapRecenter({ point }: { point: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!point) {
      return;
    }
    map.setView(point, Math.max(map.getZoom(), 10));
  }, [map, point]);

  return null;
}

async function uploadMediaAsset(request: MerchantRequester, file: File): Promise<MediaAsset> {
  const presigned = await request<PresignedMediaUpload>('/media/presign-upload', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
    }),
  });

  if (!presigned) {
    throw new Error('تعذر إنشاء رابط الرفع');
  }

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: presigned.uploadHeaders,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('فشل رفع الملف');
  }

  const etag = uploadResponse.headers.get('etag') ?? undefined;
  const confirmPayload: {
    objectKey: string;
    fileName: string;
    contentType: string;
    fileSizeBytes: number;
    etag?: string;
  } = {
    objectKey: presigned.objectKey,
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size,
  };

  if (etag) {
    confirmPayload.etag = etag;
  }

  const mediaAsset = await request<MediaAsset>('/media/confirm', {
    method: 'POST',
    body: JSON.stringify(confirmPayload),
  });

  if (!mediaAsset) {
    throw new Error('تعذر تأكيد الملف المرفوع');
  }

  return mediaAsset;
}
