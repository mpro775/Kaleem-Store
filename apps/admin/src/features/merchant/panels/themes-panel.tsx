import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddIcon from '@mui/icons-material/Add';

import type { MerchantRequester } from '../merchant-dashboard.types';
import type { PreviewTokenResponse, ThemeState } from '../types';

interface ThemesPanelProps {
  request: MerchantRequester;
  apiBaseUrl: string;
}

type SectionType =
  | 'announcement_bar'
  | 'header'
  | 'hero'
  | 'categories_grid'
  | 'featured_products'
  | 'rich_text'
  | 'testimonials'
  | 'newsletter_signup'
  | 'offers_banner'
  | 'faq'
  | 'trust_badges'
  | 'footer';

type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch';

interface SettingField {
  key: string;
  label: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

interface BlockModel {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

interface SectionModel {
  id: string;
  type: SectionType;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
  blocks: BlockModel[];
}

interface ThemeEditorModel {
  globals: {
    primaryColor: string;
    accentColor: string;
    background: string;
    fontFamily: string;
  };
  sections: SectionModel[];
}

interface SectionDefinition {
  type: SectionType;
  label: string;
  variants: Array<{ value: string; label: string }>;
  settingsSchema: SettingField[];
  defaultSettings: Record<string, unknown>;
  blockDefinition?: {
    type: string;
    label: string;
    schema: SettingField[];
    defaults: Record<string, unknown>;
    maxItems: number;
  };
}

interface PublishSummary {
  globalChangedKeys: string[];
  addedSections: string[];
  removedSections: string[];
  movedSections: string[];
  changedSections: string[];
}

interface EditorState {
  model: ThemeEditorModel;
  history: ThemeEditorModel[];
  historyIndex: number;
}

type EditorAction =
  | { type: 'reset'; model: ThemeEditorModel }
  | { type: 'update'; updater: (draft: ThemeEditorModel) => void }
  | { type: 'undo' }
  | { type: 'redo' };

const sectionOrder: SectionType[] = [
  'announcement_bar',
  'header',
  'hero',
  'categories_grid',
  'featured_products',
  'rich_text',
  'testimonials',
  'newsletter_signup',
  'offers_banner',
  'faq',
  'trust_badges',
  'footer',
];

const sectionDefinitions: Record<SectionType, SectionDefinition> = {
  announcement_bar: {
    type: 'announcement_bar',
    label: 'الشريط الإعلاني',
    variants: [
      { value: 'default', label: 'افتراضي' },
      { value: 'minimal', label: 'بسيط' },
    ],
    settingsSchema: [{ key: 'message', label: 'نص الإعلان', type: 'text' }],
    defaultSettings: { message: 'شحن مجاني للطلبات فوق 300 ريال' },
  },
  header: {
    type: 'header',
    label: 'الترويسة',
    variants: [
      { value: 'default', label: 'افتراضي' },
      { value: 'centered', label: 'متمركز' },
    ],
    settingsSchema: [{ key: 'sticky', label: 'ترويسة ثابتة', type: 'switch' }],
    defaultSettings: { sticky: true },
  },
  hero: {
    type: 'hero',
    label: 'القسم الرئيسي',
    variants: [
      { value: 'spotlight', label: 'Spotlight' },
      { value: 'split', label: 'Split' },
      { value: 'compact', label: 'Compact' },
    ],
    settingsSchema: [
      { key: 'headline', label: 'العنوان الرئيسي', type: 'text' },
      { key: 'subheadline', label: 'النص التوضيحي', type: 'textarea' },
      { key: 'primaryCtaLabel', label: 'نص الزر', type: 'text' },
      { key: 'primaryCtaHref', label: 'رابط الزر', type: 'text' },
    ],
    defaultSettings: {
      headline: 'مرحباً بك في متجرنا',
      subheadline: 'تجربة تسوق سريعة وآمنة مع خيارات دفع مرنة.',
      primaryCtaLabel: 'تصفح المنتجات',
      primaryCtaHref: '/categories',
    },
  },
  categories_grid: {
    type: 'categories_grid',
    label: 'شبكة التصنيفات',
    variants: [
      { value: 'grid', label: 'Grid' },
      { value: 'tiles', label: 'Tiles' },
    ],
    settingsSchema: [],
    defaultSettings: {},
  },
  featured_products: {
    type: 'featured_products',
    label: 'المنتجات المميزة',
    variants: [
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ],
    settingsSchema: [{ key: 'limit', label: 'عدد المنتجات', type: 'number', min: 1, max: 24 }],
    defaultSettings: { limit: 8 },
  },
  rich_text: {
    type: 'rich_text',
    label: 'النص الترويجي',
    variants: [
      { value: 'default', label: 'افتراضي' },
      { value: 'highlight', label: 'مميز' },
    ],
    settingsSchema: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'body', label: 'المحتوى', type: 'textarea' },
    ],
    defaultSettings: {
      title: 'لماذا يثق العملاء بنا؟',
      body: 'توصيل سريع، منتجات مختارة، ودفع آمن.',
    },
  },
  testimonials: {
    type: 'testimonials',
    label: 'آراء العملاء',
    variants: [
      { value: 'cards', label: 'Cards' },
      { value: 'quotes', label: 'Quotes' },
    ],
    settingsSchema: [{ key: 'title', label: 'العنوان', type: 'text' }],
    defaultSettings: { title: 'مفضل لدى المتسوقين' },
    blockDefinition: {
      type: 'testimonial_item',
      label: 'رأي عميل',
      schema: [
        { key: 'author', label: 'اسم العميل', type: 'text' },
        { key: 'quote', label: 'النص', type: 'textarea' },
      ],
      defaults: { author: 'عميل', quote: 'تجربة ممتازة' },
      maxItems: 6,
    },
  },
  newsletter_signup: {
    type: 'newsletter_signup',
    label: 'النشرة البريدية',
    variants: [
      { value: 'default', label: 'افتراضي' },
      { value: 'compact', label: 'Compact' },
    ],
    settingsSchema: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'ctaLabel', label: 'نص الدعوة', type: 'text' },
    ],
    defaultSettings: { title: 'احصل على عروض أسبوعية', ctaLabel: 'اشترك' },
  },
  offers_banner: {
    type: 'offers_banner',
    label: 'بانر العروض',
    variants: [
      { value: 'default', label: 'افتراضي' },
      { value: 'subtle', label: 'هادئ' },
    ],
    settingsSchema: [],
    defaultSettings: {},
  },
  faq: {
    type: 'faq',
    label: 'الأسئلة الشائعة',
    variants: [
      { value: 'list', label: 'List' },
      { value: 'cards', label: 'Cards' },
    ],
    settingsSchema: [{ key: 'title', label: 'العنوان', type: 'text' }],
    defaultSettings: { title: 'أسئلة شائعة' },
    blockDefinition: {
      type: 'faq_item',
      label: 'سؤال/جواب',
      schema: [
        { key: 'question', label: 'السؤال', type: 'text' },
        { key: 'answer', label: 'الجواب', type: 'textarea' },
      ],
      defaults: { question: 'سؤال', answer: 'إجابة' },
      maxItems: 8,
    },
  },
  trust_badges: {
    type: 'trust_badges',
    label: 'شارات الثقة',
    variants: [
      { value: 'inline', label: 'Inline' },
      { value: 'grid', label: 'Grid' },
    ],
    settingsSchema: [{ key: 'title', label: 'العنوان', type: 'text' }],
    defaultSettings: { title: 'تسوق بثقة' },
    blockDefinition: {
      type: 'trust_badge',
      label: 'شارة',
      schema: [
        { key: 'label', label: 'العنوان', type: 'text' },
        { key: 'description', label: 'الوصف', type: 'textarea' },
      ],
      defaults: { label: 'دفع آمن', description: 'بوابات دفع موثوقة' },
      maxItems: 6,
    },
  },
  footer: {
    type: 'footer',
    label: 'التذييل',
    variants: [
      { value: 'default', label: 'افتراضي' },
      { value: 'minimal', label: 'Minimal' },
    ],
    settingsSchema: [],
    defaultSettings: {},
  },
};

const defaultModel = createDefaultModel();
const visualBuilderEnabled = import.meta.env.VITE_SF_VISUAL_BUILDER_ENABLED !== 'false';
const rolloutStage = (import.meta.env.VITE_SF_ROLLOUT_STAGE ?? 'internal').trim().toLowerCase();

function cloneModel(model: ThemeEditorModel): ThemeEditorModel {
  return JSON.parse(JSON.stringify(model)) as ThemeEditorModel;
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'reset') {
    const clean = cloneModel(action.model);
    return {
      model: clean,
      history: [cloneModel(clean)],
      historyIndex: 0,
    };
  }

  if (action.type === 'undo') {
    if (state.historyIndex <= 0) {
      return state;
    }

    const nextIndex = state.historyIndex - 1;
    const snapshot = state.history[nextIndex] ?? state.model;
    return {
      ...state,
      historyIndex: nextIndex,
      model: cloneModel(snapshot),
    };
  }

  if (action.type === 'redo') {
    if (state.historyIndex >= state.history.length - 1) {
      return state;
    }

    const nextIndex = state.historyIndex + 1;
    const snapshot = state.history[nextIndex] ?? state.model;
    return {
      ...state,
      historyIndex: nextIndex,
      model: cloneModel(snapshot),
    };
  }

  const draft = cloneModel(state.model);
  action.updater(draft);

  const before = JSON.stringify(state.model);
  const after = JSON.stringify(draft);
  if (before === after) {
    return state;
  }

  const trimmed = state.history.slice(0, state.historyIndex + 1);
  const nextHistory = [...trimmed, cloneModel(draft)].slice(-80);
  return {
    model: draft,
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
  };
}

export function ThemesPanel({ request, apiBaseUrl }: ThemesPanelProps) {
  const [themeState, setThemeState] = useState<ThemeState | null>(null);
  const [previewToken, setPreviewToken] = useState<PreviewTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' }>({
    text: '',
    type: 'info',
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [pendingAddType, setPendingAddType] = useState<SectionType>('hero');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishSummary, setPublishSummary] = useState<PublishSummary | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedHash, setLastSavedHash] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const [editorState, dispatch] = useReducer(reducer, {
    model: cloneModel(defaultModel),
    history: [cloneModel(defaultModel)],
    historyIndex: 0,
  });

  const currentConfig = useMemo(
    () => modelToThemeConfig(editorState.model),
    [editorState.model],
  );
  const currentHash = useMemo(() => JSON.stringify(currentConfig), [currentConfig]);
  const isDirty = hydrated && currentHash !== lastSavedHash;

  const selectedSection =
    editorState.model.sections.find((section) => section.id === selectedSectionId) ?? null;

  useEffect(() => {
    loadDraft().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !isDirty || actionLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft({ autosave: true }).catch(() => undefined);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [hydrated, isDirty, actionLoading, currentHash]);

  async function loadDraft(): Promise<void> {
    setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const data = await request<ThemeState>('/themes/draft', { method: 'GET' });
      if (!data) {
        return;
      }

      const model = themeConfigToModel(data.draftConfig);
      dispatch({ type: 'reset', model });
      setSelectedSectionId(model.sections[0]?.id ?? '');
      setThemeState(data);

      const hash = JSON.stringify(data.draftConfig);
      setLastSavedHash(hash);
      setLastSavedAt(new Date());
      setHydrated(true);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'تعذر تحميل إعدادات الواجهة',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(options?: { autosave?: boolean }): Promise<void> {
    if (options?.autosave) {
      setIsAutosaving(true);
    } else {
      setActionLoading(true);
      setMessage({ text: '', type: 'info' });
    }

    try {
      const data = await request<ThemeState>('/themes/draft', {
        method: 'PUT',
        body: JSON.stringify({ config: currentConfig }),
      });

      if (data) {
        setThemeState(data);
        setLastSavedHash(JSON.stringify(data.draftConfig));
      } else {
        setLastSavedHash(currentHash);
      }

      setLastSavedAt(new Date());

      if (!options?.autosave) {
        setMessage({ text: 'تم حفظ المسودة بنجاح.', type: 'success' });
      }
    } catch (error) {
      if (!options?.autosave) {
        setMessage({
          text: error instanceof Error ? error.message : 'تعذر حفظ المسودة',
          type: 'error',
        });
      }
    } finally {
      if (options?.autosave) {
        setIsAutosaving(false);
      } else {
        setActionLoading(false);
      }
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
      setMessage({ text: 'تم إنشاء رابط المعاينة.', type: 'success' });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'تعذر إنشاء رابط المعاينة',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openPublishDialog(): void {
    const summary = buildPublishSummary(themeState?.publishedConfig ?? {}, currentConfig);
    setPublishSummary(summary);
    setShowPublishDialog(true);
  }

  async function confirmPublish(): Promise<void> {
    setActionLoading(true);
    setShowPublishDialog(false);
    setMessage({ text: '', type: 'info' });

    try {
      if (isDirty) {
        await saveDraft({ autosave: true });
      }

      const data = await request<ThemeState>('/themes/publish', { method: 'POST' });
      if (data) {
        setThemeState(data);
        setLastSavedHash(JSON.stringify(data.draftConfig));
      }

      setMessage({ text: 'تم نشر التعديلات بنجاح.', type: 'success' });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'تعذر نشر الواجهة',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  }

  function updateModel(updater: (draft: ThemeEditorModel) => void): void {
    dispatch({ type: 'update', updater });
  }

  function reorderSections(fromId: string, toId: string): void {
    if (fromId === toId) {
      return;
    }

    updateModel((draft) => {
      const fromIndex = draft.sections.findIndex((item) => item.id === fromId);
      const toIndex = draft.sections.findIndex((item) => item.id === toId);
      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      const [moved] = draft.sections.splice(fromIndex, 1);
      if (!moved) {
        return;
      }
      draft.sections.splice(toIndex, 0, moved);
    });
  }

  function addSection(type: SectionType): void {
    const definition = sectionDefinitions[type];
    const nextSection: SectionModel = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      variant: definition.variants[0]?.value ?? 'default',
      settings: { ...definition.defaultSettings },
      blocks: definition.blockDefinition
        ? [
            {
              id: `${type}-block-1-${Date.now()}`,
              type: definition.blockDefinition.type,
              settings: { ...definition.blockDefinition.defaults },
            },
          ]
        : [],
    };

    updateModel((draft) => {
      draft.sections.push(nextSection);
    });
    setSelectedSectionId(nextSection.id);
  }

  function duplicateSection(sectionId: string): void {
    const source = editorState.model.sections.find((entry) => entry.id === sectionId);
    if (!source) {
      return;
    }

    const copy = cloneSection(source);
    updateModel((draft) => {
      const index = draft.sections.findIndex((entry) => entry.id === sectionId);
      draft.sections.splice(index + 1, 0, copy);
    });
    setSelectedSectionId(copy.id);
  }

  function removeSection(sectionId: string): void {
    updateModel((draft) => {
      draft.sections = draft.sections.filter((entry) => entry.id !== sectionId);
    });

    const fallback = editorState.model.sections.find((entry) => entry.id !== sectionId);
    setSelectedSectionId(fallback?.id ?? '');
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visualBuilderEnabled) {
    return (
      <Alert severity="warning">
        Visual Builder is disabled for this rollout stage. Set `VITE_SF_VISUAL_BUILDER_ENABLED=true` to enable it.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Studio تخصيص المتجر
          </Typography>
          <Typography color="text.secondary">
            محرر بصري كامل: شجرة أقسام، خصائص ديناميكية، معاينة لحظية، Undo/Redo، وحفظ تلقائي.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" variant="outlined" label={`Rollout: ${rolloutStage}`} />
          <Chip
            size="small"
            color={isDirty ? 'warning' : 'success'}
            label={isDirty ? 'يوجد تغييرات غير منشورة' : 'المسودة محفوظة'}
          />
          {isAutosaving ? <Chip size="small" label="جاري الحفظ التلقائي..." /> : null}
          {lastSavedAt ? <Chip size="small" variant="outlined" label={`آخر حفظ: ${lastSavedAt.toLocaleTimeString('ar-SA')}`} /> : null}

          <Button variant="outlined" startIcon={<UndoIcon />} onClick={() => dispatch({ type: 'undo' })} disabled={editorState.historyIndex <= 0 || actionLoading}>
            Undo
          </Button>
          <Button variant="outlined" startIcon={<RedoIcon />} onClick={() => dispatch({ type: 'redo' })} disabled={editorState.historyIndex >= editorState.history.length - 1 || actionLoading}>
            Redo
          </Button>
          <Button variant="outlined" onClick={() => loadDraft().catch(() => undefined)} disabled={actionLoading}>
            إعادة تحميل
          </Button>
          <Button variant="outlined" onClick={() => saveDraft().catch(() => undefined)} disabled={actionLoading}>
            حفظ يدوي
          </Button>
          <Button variant="contained" color="primary" onClick={openPublishDialog} disabled={actionLoading}>
            نشر التعديلات
          </Button>
        </Stack>
      </Box>

      {message.text ? <Alert severity={message.type}>{message.text}</Alert> : null}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '320px 1fr 380px' } }}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <SettingsSuggestIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>شجرة الأقسام</Typography>
          </Stack>
          <Divider sx={{ mb: 1.5 }} />

          <Stack spacing={1}>
            {editorState.model.sections.map((section) => {
              const isSelected = selectedSectionId === section.id;
              const label = sectionDefinitions[section.type].label;
              return (
                <Paper
                  key={section.id}
                  variant="outlined"
                  draggable
                  onDragStart={() => setDraggingSectionId(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingSectionId) {
                      reorderSections(draggingSectionId, section.id);
                    }
                    setDraggingSectionId(null);
                  }}
                  sx={{
                    p: 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    backgroundColor: isSelected ? 'action.selected' : 'transparent',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DragIndicatorIcon fontSize="small" color="action" />
                    <Button
                      size="small"
                      onClick={() => setSelectedSectionId(section.id)}
                      sx={{ justifyContent: 'flex-start', flex: 1, textTransform: 'none' }}
                    >
                      <Stack alignItems="flex-start" spacing={0.2}>
                        <Typography variant="body2" fontWeight={700}>{label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {section.variant} {section.enabled ? '• ظاهر' : '• مخفي'}
                        </Typography>
                      </Stack>
                    </Button>
                    <Switch
                      size="small"
                      checked={section.enabled}
                      onChange={(event) =>
                        updateModel((draft) => {
                          const target = draft.sections.find((entry) => entry.id === section.id);
                          if (target) {
                            target.enabled = event.target.checked;
                          }
                        })
                      }
                    />
                    <IconButton size="small" onClick={() => duplicateSection(section.id)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeSection(section.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={1}>
            <FormControl size="small" fullWidth>
              <InputLabel id="add-section-select-label">إضافة قسم</InputLabel>
              <Select
                labelId="add-section-select-label"
                value={pendingAddType}
                label="إضافة قسم"
                onChange={(event) => setPendingAddType(event.target.value as SectionType)}
              >
                {sectionOrder.map((type) => (
                  <MenuItem key={type} value={type}>{sectionDefinitions[type].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => addSection(pendingAddType)}>
              إضافة
            </Button>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <PaletteIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>لوحة الخصائص</Typography>
          </Stack>
          <Divider sx={{ mb: 1.5 }} />

          <Typography variant="subtitle2" color="text.secondary" mb={1}>الهوية العامة</Typography>
          <Stack spacing={1.2} mb={2}>
            <TextField
              size="small"
              label="اللون الأساسي"
              value={editorState.model.globals.primaryColor}
              onChange={(event) =>
                updateModel((draft) => {
                  draft.globals.primaryColor = event.target.value;
                })
              }
              dir="ltr"
            />
            <TextField
              size="small"
              label="لون التمييز"
              value={editorState.model.globals.accentColor}
              onChange={(event) =>
                updateModel((draft) => {
                  draft.globals.accentColor = event.target.value;
                })
              }
              dir="ltr"
            />
            <TextField
              size="small"
              label="لون الخلفية"
              value={editorState.model.globals.background}
              onChange={(event) =>
                updateModel((draft) => {
                  draft.globals.background = event.target.value;
                })
              }
              dir="ltr"
            />
            <TextField
              size="small"
              label="الخط الرئيسي"
              value={editorState.model.globals.fontFamily}
              onChange={(event) =>
                updateModel((draft) => {
                  draft.globals.fontFamily = event.target.value;
                })
              }
              dir="ltr"
            />
          </Stack>

          <Divider sx={{ mb: 1.5 }} />
          {!selectedSection ? (
            <Alert severity="info">اختر قسماً من الشجرة لتعديل خصائصه.</Alert>
          ) : (
            <SectionSettingsEditor
              section={selectedSection}
              onChange={(updater) =>
                updateModel((draft) => {
                  const target = draft.sections.find((entry) => entry.id === selectedSection.id);
                  if (!target) {
                    return;
                  }
                  updater(target);
                })
              }
            />
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <VisibilityIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>Live Preview</Typography>
          </Stack>
          <Divider sx={{ mb: 1.5 }} />

          <LivePreview model={editorState.model} />

          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={1}>
            {previewToken ? (
              <Button
                fullWidth
                variant="outlined"
                href={`${apiBaseUrl}/sf/theme?previewToken=${previewToken.previewToken}`}
                target="_blank"
              >
                فتح المعاينة الحقيقية
              </Button>
            ) : null}
            <Button fullWidth variant="outlined" onClick={() => createPreviewToken().catch(() => undefined)}>
              إنشاء رابط معاينة
            </Button>
          </Stack>

          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              الإصدار المنشور: {themeState?.version ?? '-'}
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Dialog open={showPublishDialog} onClose={() => setShowPublishDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ملخص النشر</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            راجع التغييرات قبل النشر النهائي:
          </Typography>
          <Stack spacing={1}>
            <SummaryRow label="متغيرات عامة تغيرت" value={publishSummary?.globalChangedKeys.length ?? 0} />
            <SummaryRow label="أقسام مضافة" value={publishSummary?.addedSections.length ?? 0} />
            <SummaryRow label="أقسام محذوفة" value={publishSummary?.removedSections.length ?? 0} />
            <SummaryRow label="أقسام تغير ترتيبها" value={publishSummary?.movedSections.length ?? 0} />
            <SummaryRow label="أقسام تغير محتواها" value={publishSummary?.changedSections.length ?? 0} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPublishDialog(false)}>إلغاء</Button>
          <Button variant="contained" onClick={() => confirmPublish().catch(() => undefined)}>
            تأكيد النشر
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SectionSettingsEditor({
  section,
  onChange,
}: {
  section: SectionModel;
  onChange: (updater: (target: SectionModel) => void) => void;
}) {
  const definition = sectionDefinitions[section.type];

  return (
    <Stack spacing={1.3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>{definition.label}</Typography>
        <Chip size="small" label={section.id} variant="outlined" />
      </Stack>

      <FormControl size="small" fullWidth>
        <InputLabel id="section-variant-label">النمط</InputLabel>
        <Select
          labelId="section-variant-label"
          label="النمط"
          value={section.variant}
          onChange={(event) =>
            onChange((target) => {
              target.variant = event.target.value;
            })
          }
        >
          {definition.variants.map((variant) => (
            <MenuItem key={variant.value} value={variant.value}>{variant.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {definition.settingsSchema.map((field) => (
        <DynamicField
          key={field.key}
          field={field}
          value={section.settings[field.key]}
          onChange={(value) =>
            onChange((target) => {
              target.settings[field.key] = value;
            })
          }
        />
      ))}

      {definition.blockDefinition ? (
        <BlocksEditor
          section={section}
          definition={definition.blockDefinition}
          onChange={onChange}
        />
      ) : null}
    </Stack>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: SettingField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === 'switch') {
    return (
      <Paper variant="outlined" sx={{ p: 1, px: 1.4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2">{field.label}</Typography>
          <Switch checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        </Stack>
      </Paper>
    );
  }

  if (field.type === 'select') {
    return (
      <FormControl size="small" fullWidth>
        <InputLabel id={`${field.key}-label`}>{field.label}</InputLabel>
        <Select
          labelId={`${field.key}-label`}
          label={field.label}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (field.type === 'number') {
    return (
      <TextField
        size="small"
        type="number"
        label={field.label}
        inputProps={{ min: field.min, max: field.max, step: field.step ?? 1 }}
        value={typeof value === 'number' ? value : ''}
        onChange={(event) => onChange(Number(event.target.value))}
        helperText={field.helperText}
        fullWidth
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <TextField
        size="small"
        multiline
        minRows={3}
        label={field.label}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        helperText={field.helperText}
        fullWidth
      />
    );
  }

  return (
    <TextField
      size="small"
      label={field.label}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
      helperText={field.helperText}
      fullWidth
    />
  );
}

function BlocksEditor({
  section,
  definition,
  onChange,
}: {
  section: SectionModel;
  definition: NonNullable<SectionDefinition['blockDefinition']>;
  onChange: (updater: (target: SectionModel) => void) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.2, mt: 0.7 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2">{definition.label}</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          disabled={section.blocks.length >= definition.maxItems}
          onClick={() =>
            onChange((target) => {
              target.blocks.push({
                id: `${target.type}-block-${Date.now()}`,
                type: definition.type,
                settings: { ...definition.defaults },
              });
            })
          }
        >
          إضافة
        </Button>
      </Stack>

      <Stack spacing={1}>
        {section.blocks.map((block) => (
          <Paper key={block.id} variant="outlined" sx={{ p: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">{block.id}</Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  onChange((target) => {
                    target.blocks = target.blocks.filter((entry) => entry.id !== block.id);
                  })
                }
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Stack spacing={1}>
              {definition.schema.map((field) => (
                <DynamicField
                  key={`${block.id}-${field.key}`}
                  field={field}
                  value={block.settings[field.key]}
                  onChange={(value) =>
                    onChange((target) => {
                      const targetBlock = target.blocks.find((entry) => entry.id === block.id);
                      if (targetBlock) {
                        targetBlock.settings[field.key] = value;
                      }
                    })
                  }
                />
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}

function LivePreview({ model }: { model: ThemeEditorModel }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1,
        bgcolor: model.globals.background,
      }}
    >
      <Box
        sx={{
          borderRadius: 1.5,
          p: 1.2,
          bgcolor: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'grid',
          gap: 0.8,
        }}
      >
        <Typography sx={{ fontSize: 12, fontFamily: model.globals.fontFamily, color: model.globals.primaryColor }}>
          Preview reflects current draft instantly
        </Typography>
        {model.sections.filter((section) => section.enabled).map((section) => {
          const title = sectionDefinitions[section.type].label;
          const highlight = pickPreviewText(section);
          return (
            <Paper
              key={section.id}
              variant="outlined"
              sx={{ p: 0.8, borderRadius: 1.2, borderColor: 'rgba(0,0,0,0.09)', bgcolor: 'rgba(255,255,255,0.8)' }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: model.globals.primaryColor }}>
                {title} • {section.variant}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {highlight}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2">{label}</Typography>
      <Chip size="small" label={String(value)} />
    </Stack>
  );
}

function pickPreviewText(section: SectionModel): string {
  if (typeof section.settings.headline === 'string') {
    return section.settings.headline;
  }
  if (typeof section.settings.title === 'string') {
    return section.settings.title;
  }
  if (typeof section.settings.message === 'string') {
    return section.settings.message;
  }
  if (section.blocks[0]) {
    const first = section.blocks[0];
    const values = Object.values(first.settings).find((value) => typeof value === 'string');
    if (typeof values === 'string') {
      return values;
    }
  }

  return 'No custom text';
}

function cloneSection(section: SectionModel): SectionModel {
  const cloned = JSON.parse(JSON.stringify(section)) as SectionModel;
  cloned.id = `${section.type}-copy-${Date.now()}`;
  cloned.blocks = cloned.blocks.map((block) => ({
    ...block,
    id: `${block.type}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
  }));
  return cloned;
}

function createDefaultModel(): ThemeEditorModel {
  return {
    globals: {
      primaryColor: '#1f4f46',
      accentColor: '#c86f31',
      background: '#f4efe7',
      fontFamily: 'Tajawal, Cairo, sans-serif',
    },
    sections: sectionOrder.map((type, index) => {
      const definition = sectionDefinitions[type];
      const section: SectionModel = {
        id: `${type}-${index + 1}`,
        type,
        enabled: true,
        variant: definition.variants[0]?.value ?? 'default',
        settings: { ...definition.defaultSettings },
        blocks: [],
      };

      if (definition.blockDefinition) {
        section.blocks = [
          {
            id: `${type}-block-1`,
            type: definition.blockDefinition.type,
            settings: { ...definition.blockDefinition.defaults },
          },
        ];
      }

      return section;
    }),
  };
}

function themeConfigToModel(config: Record<string, unknown>): ThemeEditorModel {
  const globals = asRecord(config.globals);
  const color = asRecord(globals.color);
  const typography = asRecord(globals.typography);
  const sectionsRaw = Array.isArray(config.sections) ? config.sections : [];

  const model: ThemeEditorModel = {
    globals: {
      primaryColor: readString(color.primary ?? globals.primaryColor, defaultModel.globals.primaryColor),
      accentColor: readString(color.accent ?? globals.accentColor, defaultModel.globals.accentColor),
      background: readString(color.bg ?? globals.background, defaultModel.globals.background),
      fontFamily: readString(typography.bodyFontFamily ?? globals.fontFamily, defaultModel.globals.fontFamily),
    },
    sections: [],
  };

  const seenIds = new Set<string>();
  for (const raw of sectionsRaw) {
    const section = asRecord(raw);
    const type = section.type;
    if (typeof type !== 'string' || !isSectionType(type)) {
      continue;
    }

    const definition = sectionDefinitions[type];
    const id = readString(section.id, `${type}-${model.sections.length + 1}`);
    if (seenIds.has(id)) {
      continue;
    }
    seenIds.add(id);

    const blocksRaw = Array.isArray(section.blocks) ? section.blocks : [];
    const blocks = blocksRaw
      .map((item, index) => {
        const block = asRecord(item);
        return {
          id: readString(block.id, `${type}-block-${index + 1}`),
          type: readString(block.type, definition.blockDefinition?.type ?? 'item'),
          settings: asRecord(block.settings),
        };
      })
      .slice(0, definition.blockDefinition?.maxItems ?? 0);

    model.sections.push({
      id,
      type,
      enabled: section.enabled !== false,
      variant: resolveVariant(readString(section.variant, ''), definition),
      settings: { ...definition.defaultSettings, ...asRecord(section.settings) },
      blocks,
    });
  }

  if (model.sections.length === 0) {
    return cloneModel(defaultModel);
  }

  return model;
}

function modelToThemeConfig(model: ThemeEditorModel): Record<string, unknown> {
  return {
    schemaVersion: 2,
    globals: {
      color: {
        bg: model.globals.background,
        surface: '#fff9f0',
        text: '#2f2418',
        textMuted: '#6d5b46',
        primary: model.globals.primaryColor,
        accent: model.globals.accentColor,
        danger: '#b23a2f',
      },
      typography: {
        bodyFontFamily: model.globals.fontFamily,
        headingFontFamily: 'Lora, serif',
        baseFontSize: 16,
      },
      radius: {
        sm: 10,
        md: 14,
        lg: 22,
      },
      spacing: {
        unit: 8,
      },
      motion: {
        enabled: true,
        durationFast: 140,
        durationBase: 260,
      },
    },
    layout: {
      contentMaxWidth: 1120,
      headerSticky: true,
    },
    sections: model.sections.map((section) => ({
      id: section.id,
      type: section.type,
      enabled: section.enabled,
      variant: section.variant,
      settings: section.settings,
      ...(section.blocks.length > 0 ? { blocks: section.blocks } : {}),
    })),
  };
}

function resolveVariant(value: string, definition: SectionDefinition): string {
  if (definition.variants.some((variant) => variant.value === value)) {
    return value;
  }

  return definition.variants[0]?.value ?? 'default';
}

function isSectionType(value: string): value is SectionType {
  return sectionOrder.includes(value as SectionType);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function buildPublishSummary(
  publishedConfig: Record<string, unknown>,
  draftConfig: Record<string, unknown>,
): PublishSummary {
  const publishedGlobals = extractGlobalKeys(publishedConfig);
  const draftGlobals = extractGlobalKeys(draftConfig);

  const globalChangedKeys = Object.keys(draftGlobals).filter(
    (key) => publishedGlobals[key] !== draftGlobals[key],
  );

  const publishedSections = extractSectionMap(publishedConfig);
  const draftSections = extractSectionMap(draftConfig);

  const publishedIds = Object.keys(publishedSections);
  const draftIds = Object.keys(draftSections);

  const addedSections = draftIds.filter((id) => !publishedSections[id]);
  const removedSections = publishedIds.filter((id) => !draftSections[id]);
  const changedSections = draftIds.filter(
    (id) => publishedSections[id] && publishedSections[id] !== draftSections[id],
  );

  const movedSections: string[] = [];
  const shared = draftIds.filter((id) => publishedSections[id]);
  for (const id of shared) {
    if (publishedIds.indexOf(id) !== draftIds.indexOf(id)) {
      movedSections.push(id);
    }
  }

  return {
    globalChangedKeys,
    addedSections,
    removedSections,
    movedSections,
    changedSections,
  };
}

function extractGlobalKeys(config: Record<string, unknown>): Record<string, string> {
  const globals = asRecord(config.globals);
  const color = asRecord(globals.color);
  const typography = asRecord(globals.typography);

  return {
    primary: readString(color.primary, ''),
    accent: readString(color.accent, ''),
    background: readString(color.bg, ''),
    font: readString(typography.bodyFontFamily, ''),
  };
}

function extractSectionMap(config: Record<string, unknown>): Record<string, string> {
  const sections = Array.isArray(config.sections) ? config.sections : [];
  const map: Record<string, string> = {};
  for (const section of sections) {
    const value = asRecord(section);
    if (typeof value.id !== 'string') {
      continue;
    }
    map[value.id] = JSON.stringify(value);
  }
  return map;
}
