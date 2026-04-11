import type { ThemeSectionType } from './constants/theme.constants';

const DEFAULT_PRIMARY = '#1f4f46';
const DEFAULT_ACCENT = '#c86f31';
const DEFAULT_BG = '#f4efe7';
const DEFAULT_TEXT = '#2f2418';
const DEFAULT_TEXT_MUTED = '#6d5b46';
const DEFAULT_DANGER = '#b23a2f';
const DEFAULT_SURFACE = '#fff9f0';
const DEFAULT_HEADING_FONT = 'Lora, serif';
const DEFAULT_BODY_FONT = 'Tajawal, Cairo, sans-serif';

export function migrateThemeConfigToV2(config: Record<string, unknown>): Record<string, unknown> {
  if (Number(config.schemaVersion) === 2) {
    return config;
  }

  const globals = asRecord(config.globals);
  const sections = normalizeSections(config.sections);

  return {
    schemaVersion: 2,
    globals: {
      color: {
        bg: readString(globals.background, DEFAULT_BG),
        surface: DEFAULT_SURFACE,
        text: DEFAULT_TEXT,
        textMuted: DEFAULT_TEXT_MUTED,
        primary: readString(globals.primaryColor, DEFAULT_PRIMARY),
        accent: readString(globals.accentColor, DEFAULT_ACCENT),
        danger: DEFAULT_DANGER,
      },
      typography: {
        bodyFontFamily: readString(globals.fontFamily, DEFAULT_BODY_FONT),
        headingFontFamily: DEFAULT_HEADING_FONT,
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
    sections,
  };
}

function normalizeSections(value: unknown): Array<{
  id: string;
  type: ThemeSectionType;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
  blocks?: Array<{ id: string; type: string; settings: Record<string, unknown> }>;
}> {
  if (!Array.isArray(value)) {
    return buildFallbackSections();
  }

  const normalized = value
    .map((section, index) => normalizeSection(section, index))
    .filter(
      (
        section,
      ): section is {
        id: string;
        type: ThemeSectionType;
        enabled: boolean;
        variant: string;
        settings: Record<string, unknown>;
        blocks?: Array<{ id: string; type: string; settings: Record<string, unknown> }>;
      } => section !== null,
    );

  return normalized.length > 0 ? normalized : buildFallbackSections();
}

function normalizeSection(
  value: unknown,
  index: number,
): {
  id: string;
  type: ThemeSectionType;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
  blocks?: Array<{ id: string; type: string; settings: Record<string, unknown> }>;
} | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const type = asThemeSectionType(value.type);
  if (!type) {
    return null;
  }

  const id = readString(value.id, `section-${index + 1}`);
  const enabled = value.enabled !== false;
  const variant = readString(value.variant, defaultVariantForType(type));
  const settings = asRecord(value.settings);
  const blocks = normalizeBlocks(value.blocks, `${id}-block`);

  return {
    id,
    type,
    enabled,
    variant,
    settings,
    ...(blocks.length > 0 ? { blocks } : {}),
  };
}

function buildFallbackSections(): Array<{
  id: string;
  type: ThemeSectionType;
  enabled: boolean;
  variant: string;
  settings: Record<string, unknown>;
  blocks?: Array<{ id: string; type: string; settings: Record<string, unknown> }>;
}> {
  return [
    { id: 'header-main', type: 'header', enabled: true, variant: 'default', settings: { sticky: true } },
    {
      id: 'hero-main',
      type: 'hero',
      enabled: true,
      variant: 'spotlight',
      settings: { headline: 'Welcome to Kaleem Store' },
    },
    {
      id: 'featured-main',
      type: 'featured_products',
      enabled: true,
      variant: 'cards',
      settings: { limit: 8 },
    },
    { id: 'footer-main', type: 'footer', enabled: true, variant: 'default', settings: {} },
  ];
}

function normalizeBlocks(
  value: unknown,
  idPrefix: string,
): Array<{ id: string; type: string; settings: Record<string, unknown> }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!isPlainObject(item)) {
        return null;
      }

      return {
        id: readString(item.id, `${idPrefix}-${index + 1}`),
        type: readString(item.type, 'item'),
        settings: asRecord(item.settings),
      };
    })
    .filter((item): item is { id: string; type: string; settings: Record<string, unknown> } => item !== null)
    .slice(0, 24);
}

function defaultVariantForType(type: ThemeSectionType): string {
  const defaults: Record<ThemeSectionType, string> = {
    announcement_bar: 'default',
    header: 'default',
    hero: 'spotlight',
    categories_grid: 'grid',
    featured_products: 'cards',
    rich_text: 'default',
    testimonials: 'cards',
    newsletter_signup: 'default',
    offers_banner: 'default',
    faq: 'list',
    trust_badges: 'inline',
    footer: 'default',
  };

  return defaults[type];
}

function asThemeSectionType(value: unknown): ThemeSectionType | null {
  if (typeof value !== 'string') {
    return null;
  }

  const allowed: ThemeSectionType[] = [
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

  return allowed.includes(value as ThemeSectionType) ? (value as ThemeSectionType) : null;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
