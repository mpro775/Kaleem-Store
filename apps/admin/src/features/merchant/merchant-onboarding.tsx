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
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { merchantRequestJson } from './api-client';
import type { MerchantSession, MediaAsset, PresignedMediaUpload, StoreSettings, StoreSettingsOptions } from './types';

interface MerchantOnboardingProps {
  session: MerchantSession;
  onCompleted: (session: MerchantSession) => void;
  onSignedOut: () => void;
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

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface SlugAvailabilityResponse {
  isValidFormat: boolean;
  isAvailable: boolean;
  normalizedSlug: string;
}

interface MeResponse {
  id: string;
  storeId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'staff';
  permissions: string[];
  sessionId: string;
  onboardingCompleted: boolean;
}

const YEMEN_CENTER: [number, number] = [15.3694, 44.191];
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FAVICON_SIZE_BYTES = 1 * 1024 * 1024;

const CATEGORY_LABELS: Record<string, string> = {
  beauty: 'مستحضرات تجميل',
  fashion: 'ملابس وأزياء',
  abayas: 'عبايات',
  electronics: 'إلكترونيات وهواتف وأجهزة إلكترونية',
  books_stationery: 'كتب وقرطاسية',
  kids_toys: 'أطفال وألعاب',
  furniture_decor: 'أثاث وديكور',
  health_wellness: 'صحة وعافية',
  other: 'أخرى',
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

const DAY_LABELS: Record<string, string> = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الاثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

export function MerchantOnboarding({ session, onCompleted, onSignedOut }: MerchantOnboardingProps) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' }>({
    text: '',
    type: 'info',
  });
  const [options, setOptions] = useState<StoreSettingsOptions | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    loading: boolean;
    isValidFormat: boolean;
    isAvailable: boolean;
    normalizedSlug: string;
  }>({
    loading: false,
    isValidFormat: true,
    isAvailable: true,
    normalizedSlug: '',
  });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoMediaAssetId, setLogoMediaAssetId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconMediaAssetId, setFaviconMediaAssetId] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [businessCategory, setBusinessCategory] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('اليمن');
  const [city, setCity] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [workingHours, setWorkingHours] = useState<WorkingHoursDayForm[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [mapResults, setMapResults] = useState<NominatimResult[]>([]);
  const [mapPoint, setMapPoint] = useState<[number, number] | null>(YEMEN_CENTER);

  const slugPreview = useMemo(() => slug.trim() || 'my-store', [slug]);

  useEffect(() => {
    initialize().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(buildSlugFromName(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      setSlugStatus({ loading: false, isValidFormat: false, isAvailable: false, normalizedSlug: '' });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      checkSlugAvailability(normalized).catch(() => undefined);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [slug]);

  async function initialize(): Promise<void> {
    setLoading(true);
    try {
      const [settingsData, optionsData] = await Promise.all([
        request<StoreSettings>('/store/settings', { method: 'GET' }),
        request<StoreSettingsOptions>('/store/settings/options', { method: 'GET' }),
      ]);

      if (!settingsData || !optionsData) {
        throw new Error('Failed to load onboarding data.');
      }

      setOptions(optionsData);
      applySettings(settingsData, optionsData);
      setSlugStatus({
        loading: false,
        isValidFormat: true,
        isAvailable: true,
        normalizedSlug: settingsData.slug,
      });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to load onboarding.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function applySettings(settings: StoreSettings, optionsData: StoreSettingsOptions): void {
    setName(settings.name || '');
    setSlug(settings.slug || '');
    setLogoMediaAssetId(settings.logoMediaAssetId);
    setLogoUrl(settings.logoUrl);
    setFaviconMediaAssetId(settings.faviconMediaAssetId ?? null);
    setFaviconUrl(settings.faviconUrl ?? null);
    setBusinessCategory(settings.businessCategory ?? '');
    setPhone(settings.phone ?? '');
    setCountry(settings.country || optionsData.defaultCountry);
    setCity(settings.city ?? '');
    setAddressDetails(settings.addressDetails ?? '');
    setLatitude(settings.latitude !== null ? String(settings.latitude) : '');
    setLongitude(settings.longitude !== null ? String(settings.longitude) : '');
    setWorkingHours(toWorkingHoursForm(settings.workingHours, optionsData.workingDays));
    setSocialLinks(
      Object.fromEntries(optionsData.socialPlatforms.map((platform) => [platform, settings.socialLinks?.[platform] ?? ''])),
    );
    if (settings.latitude !== null && settings.longitude !== null) {
      setMapPoint([settings.latitude, settings.longitude]);
    }
  }

  async function checkSlugAvailability(rawSlug: string): Promise<void> {
    setSlugStatus((prev) => ({ ...prev, loading: true }));
    try {
      const result = await request<SlugAvailabilityResponse>(
        `/store/slug-availability?slug=${encodeURIComponent(rawSlug)}`,
        { method: 'GET' },
      );

      if (!result) {
        return;
      }

      setSlugStatus({
        loading: false,
        isValidFormat: result.isValidFormat,
        isAvailable: result.isAvailable,
        normalizedSlug: result.normalizedSlug,
      });
    } catch {
      setSlugStatus((prev) => ({ ...prev, loading: false }));
    }
  }

  async function saveAndComplete(): Promise<void> {
    if (!options) {
      return;
    }

    const validationError = validateCurrentStep(2);
    if (validationError) {
      setMessage({ text: validationError, type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: 'info' });

    try {
      await request('/store/settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          slug: slugStatus.normalizedSlug || slug.trim().toLowerCase(),
          logoMediaAssetId,
          logoUrl,
          faviconMediaAssetId,
          faviconUrl,
          businessCategory: businessCategory || null,
          phone: phone.trim() || null,
          country,
          city: city.trim() || null,
          addressDetails: addressDetails.trim() || null,
          address: composeAddress(country, city, addressDetails) || null,
          latitude: latitude.trim() ? Number(latitude) : null,
          longitude: longitude.trim() ? Number(longitude) : null,
          workingHours: workingHours.map((dayRow) => ({
            day: dayRow.day,
            isClosed: dayRow.isClosed,
            slots: dayRow.isClosed
              ? []
              : dayRow.slots.map((slot) => ({ open: slot.open, close: slot.close })),
          })),
          socialLinks: Object.fromEntries(
            options.socialPlatforms.map((platform) => [platform, (socialLinks[platform] || '').trim() || null]),
          ),
          onboardingCompleted: true,
        }),
      });

      const me = await request<MeResponse>('/auth/me', { method: 'GET' });
      if (!me) {
        throw new Error('Unable to refresh user session.');
      }

      onCompleted({
        ...session,
        user: {
          ...session.user,
          ...me,
        },
      });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to finish onboarding.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function validateCurrentStep(step: number): string | null {
    if (!options) {
      return 'Options are not loaded yet.';
    }

    if (step >= 0) {
      if (!name.trim()) {
        return 'اسم المتجر مطلوب.';
      }
      if (!slug.trim()) {
        return 'رابط المتجر مطلوب.';
      }
      if (!slugStatus.isValidFormat) {
        return 'صيغة رابط المتجر غير صحيحة.';
      }
      if (!slugStatus.isAvailable) {
        return 'رابط المتجر مستخدم بالفعل.';
      }
    }

    if (step >= 1) {
      if (!businessCategory) {
        return 'يرجى اختيار نشاط العمل.';
      }
    }

    if (step >= 2) {
      if (!phone.trim()) {
        return 'رقم التواصل مطلوب.';
      }

      const hasLatitude = latitude.trim().length > 0;
      const hasLongitude = longitude.trim().length > 0;
      if (hasLatitude !== hasLongitude) {
        return 'يجب إدخال خط العرض وخط الطول معًا.';
      }
      if (hasLatitude && hasLongitude) {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          return 'Latitude غير صالح.';
        }
        if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
          return 'Longitude غير صالح.';
        }
      }

      for (const dayRow of workingHours) {
        if (dayRow.isClosed) {
          continue;
        }
        for (const slot of dayRow.slots) {
          if (!slot.open || !slot.close) {
            return `أكمل ساعات العمل ليوم ${DAY_LABELS[dayRow.day] ?? dayRow.day}.`;
          }
          if (slot.open >= slot.close) {
            return `وقت الفتح يجب أن يسبق الإغلاق ليوم ${DAY_LABELS[dayRow.day] ?? dayRow.day}.`;
          }
        }
      }

      for (const platform of options.socialPlatforms) {
        const value = (socialLinks[platform] || '').trim();
        if (!value) {
          continue;
        }
        if (!isValidHttpUrl(value)) {
          return `رابط ${SOCIAL_LABELS[platform] ?? platform} غير صالح.`;
        }
      }
    }

    return null;
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setMessage({ text: 'حجم الشعار يجب أن لا يتجاوز 5MB.', type: 'error' });
      return;
    }

    setUploadingLogo(true);
    try {
      const asset = await uploadMediaAsset(file);
      setLogoMediaAssetId(asset.id);
      setLogoUrl(asset.url);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'فشل رفع الشعار.', type: 'error' });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleFaviconUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.size > MAX_FAVICON_SIZE_BYTES) {
      setMessage({ text: 'حجم أيقونة الموقع يجب أن لا يتجاوز 1MB.', type: 'error' });
      return;
    }

    setUploadingFavicon(true);
    try {
      const asset = await uploadMediaAsset(file);
      setFaviconMediaAssetId(asset.id);
      setFaviconUrl(asset.url);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'فشل رفع الأيقونة.', type: 'error' });
    } finally {
      setUploadingFavicon(false);
    }
  }

  async function uploadMediaAsset(file: File): Promise<MediaAsset> {
    const presigned = await request<PresignedMediaUpload>('/media/presign-upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      }),
    });

    if (!presigned) {
      throw new Error('Failed to create upload URL.');
    }

    const uploadResponse = await fetch(presigned.uploadUrl, {
      method: 'PUT',
      headers: presigned.uploadHeaders,
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error('Upload failed.');
    }

    const etag = uploadResponse.headers.get('etag') ?? undefined;
    const confirmed = await request<MediaAsset>('/media/confirm', {
      method: 'POST',
      body: JSON.stringify({
        objectKey: presigned.objectKey,
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
        ...(etag ? { etag } : {}),
      }),
    });

    if (!confirmed) {
      throw new Error('Upload confirmation failed.');
    }

    return confirmed;
  }

  function openMapDialog(): void {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMapPoint([lat, lng]);
    }
    setMapDialogOpen(true);
  }

  function applyMapPoint(): void {
    if (!mapPoint) {
      return;
    }
    setLatitude(mapPoint[0].toFixed(7));
    setLongitude(mapPoint[1].toFixed(7));
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
        throw new Error();
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
    } finally {
      setMapSearching(false);
    }
  }

  async function request<T>(
    path: string,
    init?: RequestInit,
    options?: { includeStoreHeader?: boolean },
  ): Promise<T | null> {
    return merchantRequestJson<T>({
      session,
      path,
      init,
      options: {
        includeStoreHeader: options?.includeStoreHeader ?? true,
      },
      onSessionUpdate: () => undefined,
      onSessionExpired: onSignedOut,
    });
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!options) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Failed to load onboarding options.</Alert>
        <Button variant="contained" onClick={() => initialize().catch(() => undefined)}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} dir="rtl">
      <Stack spacing={0.8}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          إعداد المتجر
        </Typography>
        <Typography color="text.secondary">
          أكمل 3 خطوات لتهيئة متجرك قبل الدخول إلى لوحة التحكم.
        </Typography>
      </Stack>

      <StepIndicator activeStep={activeStep} />

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      {activeStep === 0 ? (
        <Stack spacing={2}>
          <TextField label="اسم المتجر" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField
            label="رابط المتجر (Slug)"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(normalizeSlugInput(event.target.value));
            }}
            inputProps={{ dir: 'ltr' }}
            helperText={
              slugStatus.loading
                ? 'جاري التحقق...'
                : !slugStatus.isValidFormat
                  ? 'صيغة الرابط غير صحيحة.'
                  : !slugStatus.isAvailable
                    ? 'هذا الرابط مستخدم بالفعل.'
                    : `${slugPreview}.kaleem.store`
            }
            error={!slugStatus.loading && (!slugStatus.isValidFormat || !slugStatus.isAvailable)}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">شعار المتجر</Typography>
            <Typography variant="caption" color="text.secondary">
              الأنواع المدعومة: PNG, JPG, WebP, SVG - الحد الأقصى 5MB.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <PreviewImage url={logoUrl} fallback="بدون شعار" />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo || saving}
              >
                {uploadingLogo ? 'جاري الرفع...' : logoUrl ? 'تغيير الشعار' : 'رفع الشعار'}
              </Button>
            </Stack>
            <input
              ref={logoInputRef}
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => {
                handleLogoUpload(event).catch(() => undefined);
              }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">أيقونة الموقع (Favicon)</Typography>
            <Typography variant="caption" color="text.secondary">
              المقاس الموصى به 32x32، والأنواع المدعومة PNG/ICO/SVG - الحد الأقصى 1MB.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <PreviewImage url={faviconUrl} fallback="بدون أيقونة" small />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploadingFavicon || saving}
              >
                {uploadingFavicon ? 'جاري الرفع...' : faviconUrl ? 'تغيير الأيقونة' : 'رفع الأيقونة'}
              </Button>
            </Stack>
            <input
              ref={faviconInputRef}
              hidden
              type="file"
              accept="image/png,image/x-icon,image/svg+xml"
              onChange={(event) => {
                handleFaviconUpload(event).catch(() => undefined);
              }}
            />
          </Stack>
        </Stack>
      ) : null}

      {activeStep === 1 ? (
        <FormControl>
          <RadioGroup value={businessCategory} onChange={(event) => setBusinessCategory(event.target.value)}>
            {options.businessCategories.map((category) => (
              <FormControlLabel
                key={category}
                value={category}
                control={<Radio />}
                label={CATEGORY_LABELS[category] ?? category}
              />
            ))}
          </RadioGroup>
        </FormControl>
      ) : null}

      {activeStep === 2 ? (
        <Stack spacing={2}>
          <TextField label="رقم التواصل" value={phone} onChange={(event) => setPhone(event.target.value)} inputProps={{ dir: 'ltr' }} />
          <TextField label="الدولة" value={country} disabled />
          <TextField select label="المدينة (المحافظة)" value={city} onChange={(event) => setCity(event.target.value)}>
            <MenuItem value="">اختر المحافظة</MenuItem>
            {options.governorates.map((governorate) => (
              <MenuItem key={governorate} value={governorate}>
                {governorate}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="العنوان التفصيلي"
            value={addressDetails}
            onChange={(event) => setAddressDetails(event.target.value)}
            multiline
            rows={2}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField label="Latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
            <TextField label="Longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
          </Stack>
          <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={openMapDialog}>
            اختيار الموقع من الخريطة
          </Button>

          <Typography variant="subtitle2">ساعات العمل</Typography>
          {workingHours.map((dayRow) => (
            <Box key={dayRow.day} sx={{ p: 1.2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>{DAY_LABELS[dayRow.day] ?? dayRow.day}</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!dayRow.isClosed}
                        onChange={(event) => {
                          setWorkingHours((prev) =>
                            prev.map((item) =>
                              item.day === dayRow.day
                                ? {
                                    ...item,
                                    isClosed: !event.target.checked,
                                    slots: event.target.checked
                                      ? item.slots.length > 0
                                        ? item.slots
                                        : [createSlot()]
                                      : [],
                                  }
                                : item,
                            ),
                          );
                        }}
                      />
                    }
                    label={dayRow.isClosed ? 'مغلق' : 'مفتوح'}
                  />
                </Stack>
                {!dayRow.isClosed ? (
                  <Stack spacing={1}>
                    {dayRow.slots.map((slot) => (
                      <Stack key={slot.id} direction={{ xs: 'column', md: 'row' }} spacing={1}>
                        <TextField
                          label="من"
                          type="time"
                          value={slot.open}
                          onChange={(event) => {
                            setWorkingHours((prev) =>
                              prev.map((item) =>
                                item.day === dayRow.day
                                  ? {
                                      ...item,
                                      slots: item.slots.map((entry) =>
                                        entry.id === slot.id ? { ...entry, open: event.target.value } : entry,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          label="إلى"
                          type="time"
                          value={slot.close}
                          onChange={(event) => {
                            setWorkingHours((prev) =>
                              prev.map((item) =>
                                item.day === dayRow.day
                                  ? {
                                      ...item,
                                      slots: item.slots.map((entry) =>
                                        entry.id === slot.id ? { ...entry, close: event.target.value } : entry,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                        <IconButton
                          color="error"
                          onClick={() => {
                            setWorkingHours((prev) =>
                              prev.map((item) =>
                                item.day === dayRow.day
                                  ? { ...item, slots: item.slots.filter((entry) => entry.id !== slot.id) }
                                  : item,
                              ),
                            );
                          }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      variant="text"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setWorkingHours((prev) =>
                          prev.map((item) =>
                            item.day === dayRow.day ? { ...item, slots: [...item.slots, createSlot()] } : item,
                          ),
                        );
                      }}
                    >
                      إضافة فترة
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          ))}

          <Typography variant="subtitle2">روابط التواصل الاجتماعي</Typography>
          {options.socialPlatforms.map((platform) => (
            <TextField
              key={platform}
              label={SOCIAL_LABELS[platform] ?? platform}
              value={socialLinks[platform] ?? ''}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSocialLinks((prev) => ({ ...prev, [platform]: nextValue }));
              }}
              inputProps={{ dir: 'ltr' }}
            />
          ))}
        </Stack>
      ) : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
        <Button variant="outlined" color="inherit" onClick={onSignedOut} disabled={saving}>
          تسجيل الخروج
        </Button>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || saving}
            onClick={() => {
              setMessage({ text: '', type: 'info' });
              setActiveStep((prev) => Math.max(0, prev - 1));
            }}
          >
            السابق
          </Button>
          {activeStep < 2 ? (
            <Button
              variant="contained"
              disabled={saving}
              onClick={() => {
                const validationError = validateCurrentStep(activeStep);
                if (validationError) {
                  setMessage({ text: validationError, type: 'error' });
                  return;
                }
                setMessage({ text: '', type: 'info' });
                setActiveStep((prev) => prev + 1);
              }}
            >
              التالي
            </Button>
          ) : (
            <Button variant="contained" disabled={saving} onClick={() => saveAndComplete().catch(() => undefined)}>
              {saving ? 'جاري الإنهاء...' : 'إنهاء الإعداد'}
            </Button>
          )}
        </Stack>
      </Stack>

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
                disabled={mapSearching}
                onClick={() => searchOnMap().catch(() => undefined)}
              >
                {mapSearching ? 'جاري البحث...' : 'بحث'}
              </Button>
            </Stack>
            {mapResults.length > 0 ? (
              <Stack spacing={0.5}>
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
            <Box sx={{ height: 320, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <StoreMap point={mapPoint} onPointChange={setMapPoint} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMapDialogOpen(false)}>إلغاء</Button>
          <Button onClick={applyMapPoint} variant="contained" disabled={!mapPoint}>
            اعتماد الموقع
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function StepIndicator({ activeStep }: { activeStep: number }) {
  const labels = ['هوية المتجر', 'نشاط العمل', 'معلومات التواصل'];
  return (
    <Stack direction="row" spacing={1}>
      {labels.map((label, index) => (
        <Box
          key={label}
          sx={{
            px: 1.4,
            py: 0.65,
            borderRadius: 99,
            bgcolor: index === activeStep ? 'primary.main' : 'action.hover',
            color: index === activeStep ? '#fff' : 'text.secondary',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {`${index + 1}. ${label}`}
        </Box>
      ))}
    </Stack>
  );
}

function PreviewImage({ url, fallback, small = false }: { url: string | null; fallback: string; small?: boolean }) {
  return (
    <Box
      sx={{
        width: small ? 56 : 100,
        height: small ? 56 : 100,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
      }}
    >
      {url ? (
        <Box component="img" src={url} alt={fallback} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <Typography variant="caption" color="text.secondary">
          {fallback}
        </Typography>
      )}
    </Box>
  );
}

function StoreMap({ point, onPointChange }: { point: [number, number] | null; onPointChange: (point: [number, number]) => void }) {
  const center = (point ?? YEMEN_CENTER) as LatLngExpression;
  return (
    <MapContainer center={center} zoom={6} style={{ width: '100%', height: '100%' }}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

function createSlot(): WorkingHoursSlotForm {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    open: '09:00',
    close: '17:00',
  };
}

function toWorkingHoursForm(
  source: StoreSettings['workingHours'],
  supportedDays: string[],
): WorkingHoursDayForm[] {
  const byDay = new Map(source.map((item) => [item.day, item]));
  return supportedDays.map((day) => {
    const existing = byDay.get(day);
    if (!existing) {
      return { day, isClosed: true, slots: [] };
    }
    return {
      day,
      isClosed: existing.isClosed,
      slots: (existing.slots ?? []).map((slot) => ({
        id: `${day}-${slot.open}-${slot.close}-${Math.random().toString(16).slice(2)}`,
        open: slot.open,
        close: slot.close,
      })),
    };
  });
}

function composeAddress(country: string, city: string, addressDetails: string): string {
  return [country, city, addressDetails].map((part) => part.trim()).filter(Boolean).join('، ');
}

function normalizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildSlugFromName(input: string): string {
  const transliterated = transliterateArabic(input);
  return normalizeSlugInput(transliterated);
}

function transliterateArabic(value: string): string {
  const map: Record<string, string> = {
    ا: 'a',
    أ: 'a',
    إ: 'i',
    آ: 'a',
    ء: '',
    ب: 'b',
    ت: 't',
    ث: 'th',
    ج: 'j',
    ح: 'h',
    خ: 'kh',
    د: 'd',
    ذ: 'th',
    ر: 'r',
    ز: 'z',
    س: 's',
    ش: 'sh',
    ص: 's',
    ض: 'd',
    ط: 't',
    ظ: 'z',
    ع: 'a',
    غ: 'gh',
    ف: 'f',
    ق: 'q',
    ك: 'k',
    ل: 'l',
    م: 'm',
    ن: 'n',
    ه: 'h',
    و: 'w',
    ي: 'y',
    ى: 'a',
    ة: 'h',
  };

  return value
    .split('')
    .map((char) => map[char] ?? char)
    .join('');
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
