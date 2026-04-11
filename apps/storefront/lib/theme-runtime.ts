function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function px(value: unknown, fallback: number): string {
  const normalized = Math.round(readNumber(value, fallback));
  return `${normalized}px`;
}

type ThemeStyleMap = Record<`--${string}`, string>;

export function resolveThemeStyleVars(config: Record<string, unknown> | null | undefined): ThemeStyleMap {
  const safeConfig = asRecord(config);
  const globals = asRecord(safeConfig.globals);
  const color = asRecord(globals.color);
  const typography = asRecord(globals.typography);
  const radius = asRecord(globals.radius);
  const layout = asRecord(safeConfig.layout);

  const background = readString(color.bg ?? globals.background, '#f5efe5');
  const surface = readString(color.surface, '#fff9f0');
  const text = readString(color.text, '#2f2418');
  const textMuted = readString(color.textMuted, '#6d5b46');
  const primary = readString(color.primary ?? globals.primaryColor, '#295f55');
  const accent = readString(color.accent ?? globals.accentColor, '#b35d31');
  const danger = readString(color.danger, '#b23a2f');

  const bodyFont = readString(typography.bodyFontFamily ?? globals.fontFamily, 'Trebuchet MS, Gill Sans, sans-serif');
  const headingFont = readString(typography.headingFontFamily, 'Palatino Linotype, Book Antiqua, serif');

  return {
    '--color-bg': background,
    '--color-bg-soft': '#f9f5ee',
    '--color-surface': surface,
    '--color-surface-strong': '#ffffff',
    '--color-surface-tint': '#f3e7d5',
    '--color-text': text,
    '--color-text-muted': textMuted,
    '--color-line': '#ddc9ad',
    '--color-primary': primary,
    '--color-primary-strong': '#173d36',
    '--color-primary-contrast': '#f8f7f2',
    '--color-accent': accent,
    '--color-accent-soft': '#e8d4c2',
    '--color-danger': danger,
    '--color-danger-soft': '#f8d8d4',
    '--color-success': '#27ae60',
    '--color-info': '#3498db',
    '--color-warning': '#f0a500',
    '--color-hero-text': '#f7efe4',
    '--color-hero-text-muted': '#f5ebdd',
    '--surface-overlay-strong': 'rgba(255, 255, 255, 0.95)',
    '--surface-overlay-medium': 'rgba(255, 255, 255, 0.85)',
    '--surface-overlay-soft': 'rgba(255, 255, 255, 0.72)',
    '--overlay-backdrop': 'rgba(47, 36, 24, 0.5)',
    '--shadow-soft': '0 18px 40px rgba(23, 34, 28, 0.09)',
    '--gradient-page-end': '#f8f2e8',
    '--gradient-hero-secondary': '#234966',
    '--radius-md': px(radius.md, 14),
    '--radius-lg': px(radius.lg, 22),
    '--font-body': bodyFont,
    '--font-heading': headingFont,
    '--page-max-width': px(layout.contentMaxWidth, 1120),
    '--spacing-unit': px(asRecord(globals.spacing).unit, 8),

    '--bg': background,
    '--bg-soft': '#f9f5ee',
    '--surface': surface,
    '--surface-strong': '#ffffff',
    '--text': text,
    '--text-muted': textMuted,
    '--line': '#ddc9ad',
    '--primary': primary,
    '--primary-strong': '#173d36',
    '--accent': accent,
    '--danger': danger,
  };
}
