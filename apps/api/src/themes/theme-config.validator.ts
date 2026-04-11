import { BadRequestException } from '@nestjs/common';
import { THEME_SECTION_TYPES } from './constants/theme.constants';
import { migrateThemeConfigToV2 } from './theme-config.migrations';

const MAX_SECTIONS = 40;
const MAX_BLOCKS_PER_SECTION = 24;

const SECTION_VARIANTS: Record<(typeof THEME_SECTION_TYPES)[number], readonly string[]> = {
  announcement_bar: ['default', 'minimal'],
  header: ['default', 'centered'],
  hero: ['spotlight', 'split', 'compact'],
  categories_grid: ['grid', 'tiles'],
  featured_products: ['cards', 'minimal'],
  rich_text: ['default', 'highlight'],
  testimonials: ['cards', 'quotes'],
  newsletter_signup: ['default', 'compact'],
  offers_banner: ['default', 'subtle'],
  faq: ['list', 'cards'],
  trust_badges: ['inline', 'grid'],
  footer: ['default', 'minimal'],
};

const SECTION_BLOCK_TYPES: Partial<Record<(typeof THEME_SECTION_TYPES)[number], readonly string[]>> = {
  testimonials: ['testimonial_item'],
  faq: ['faq_item'],
  trust_badges: ['trust_badge'],
};

export function validateThemeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const migrated = migrateThemeConfigToV2(config);

  if (!isPlainObject(migrated)) {
    throw new BadRequestException('Theme config must be a valid object');
  }

  if (migrated.schemaVersion !== 2) {
    throw new BadRequestException('Theme config schemaVersion must be 2');
  }

  validateGlobals(migrated.globals);
  validateLayout(migrated.layout);

  const sections = migrated.sections;
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new BadRequestException('Theme config must include at least one section');
  }

  if (sections.length > MAX_SECTIONS) {
    throw new BadRequestException(`Theme config cannot exceed ${MAX_SECTIONS} sections`);
  }

  assertUniqueSectionIds(sections);
  for (const section of sections) {
    validateSection(section);
  }

  return migrated;
}

function validateGlobals(globals: unknown): void {
  if (!isPlainObject(globals)) {
    throw new BadRequestException('Theme globals must be a valid object');
  }

  const color = globals.color;
  if (!isPlainObject(color)) {
    throw new BadRequestException('Theme globals.color must be a valid object');
  }
  validateHexColor(color.bg, 'Theme color bg is invalid');
  validateHexColor(color.surface, 'Theme color surface is invalid');
  validateHexColor(color.text, 'Theme color text is invalid');
  validateHexColor(color.textMuted, 'Theme color textMuted is invalid');
  validateHexColor(color.primary, 'Theme color primary is invalid');
  validateHexColor(color.accent, 'Theme color accent is invalid');
  validateHexColor(color.danger, 'Theme color danger is invalid');

  const typography = globals.typography;
  if (!isPlainObject(typography)) {
    throw new BadRequestException('Theme globals.typography must be a valid object');
  }
  if (!isValidText(typography.bodyFontFamily, 120)) {
    throw new BadRequestException('Body font family must be a non-empty string up to 120 chars');
  }
  if (!isValidText(typography.headingFontFamily, 120)) {
    throw new BadRequestException('Heading font family must be a non-empty string up to 120 chars');
  }

  const baseFontSize = typography.baseFontSize;
  if (typeof baseFontSize !== 'number' || !Number.isFinite(baseFontSize) || baseFontSize < 14 || baseFontSize > 20) {
    throw new BadRequestException('Base font size must be a number between 14 and 20');
  }

  const radius = globals.radius;
  if (!isPlainObject(radius)) {
    throw new BadRequestException('Theme globals.radius must be a valid object');
  }
  validateRangeInteger(radius.sm, 0, 24, 'Radius sm must be an integer between 0 and 24');
  validateRangeInteger(radius.md, 0, 32, 'Radius md must be an integer between 0 and 32');
  validateRangeInteger(radius.lg, 0, 48, 'Radius lg must be an integer between 0 and 48');

  const spacing = globals.spacing;
  if (!isPlainObject(spacing)) {
    throw new BadRequestException('Theme globals.spacing must be a valid object');
  }
  validateRangeInteger(spacing.unit, 4, 12, 'Spacing unit must be an integer between 4 and 12');

  const motion = globals.motion;
  if (!isPlainObject(motion)) {
    throw new BadRequestException('Theme globals.motion must be a valid object');
  }
  if (typeof motion.enabled !== 'boolean') {
    throw new BadRequestException('Theme motion enabled flag must be boolean');
  }
  validateRangeInteger(motion.durationFast, 80, 220, 'Motion durationFast must be between 80 and 220');
  validateRangeInteger(motion.durationBase, 120, 360, 'Motion durationBase must be between 120 and 360');
}

function validateLayout(layout: unknown): void {
  if (layout === undefined) {
    return;
  }

  if (!isPlainObject(layout)) {
    throw new BadRequestException('Theme layout must be a valid object');
  }

  if (layout.contentMaxWidth !== undefined) {
    validateRangeInteger(
      layout.contentMaxWidth,
      960,
      1440,
      'Layout contentMaxWidth must be between 960 and 1440',
    );
  }

  if (layout.headerSticky !== undefined && typeof layout.headerSticky !== 'boolean') {
    throw new BadRequestException('Layout headerSticky must be boolean');
  }
}

function validateHexColor(value: unknown, errorMessage: string): void {
  if (typeof value !== 'string' || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
    throw new BadRequestException(errorMessage);
  }
}

function validateRangeInteger(value: unknown, min: number, max: number, errorMessage: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new BadRequestException(errorMessage);
  }
}

function assertUniqueSectionIds(sections: unknown[]): void {
  const seen = new Set<string>();
  for (const section of sections) {
    if (!isPlainObject(section)) {
      throw new BadRequestException('Theme section must be an object');
    }

    const id = section.id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new BadRequestException('Theme section id is required');
    }

    if (id.length > 80) {
      throw new BadRequestException('Theme section id is too long');
    }

    if (seen.has(id)) {
      throw new BadRequestException(`Duplicate theme section id: ${id}`);
    }

    seen.add(id);
  }
}

function validateSection(section: unknown): void {
  if (!isPlainObject(section)) {
    throw new BadRequestException('Theme section must be an object');
  }

  const type = section.type;
  if (typeof type !== 'string' || !THEME_SECTION_TYPES.includes(type as (typeof THEME_SECTION_TYPES)[number])) {
    throw new BadRequestException('Theme section type is invalid');
  }

  const enabled = section.enabled;
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    throw new BadRequestException('Theme section enabled flag must be boolean');
  }

  const settings = section.settings;
  if (!isPlainObject(settings)) {
    throw new BadRequestException('Theme section settings must be an object');
  }

  if (section.variant !== undefined && !isValidText(section.variant, 60)) {
    throw new BadRequestException('Theme section variant must be a non-empty string up to 60 chars');
  }

  if (typeof section.variant === 'string') {
    const allowedVariants = SECTION_VARIANTS[type as (typeof THEME_SECTION_TYPES)[number]];
    if (!allowedVariants.includes(section.variant)) {
      throw new BadRequestException(`Theme section variant is invalid for type: ${type}`);
    }
  }

  const blocks = section.blocks;
  if (blocks !== undefined) {
    if (!Array.isArray(blocks) || blocks.length > MAX_BLOCKS_PER_SECTION) {
      throw new BadRequestException(
        `Theme section blocks must be an array up to ${MAX_BLOCKS_PER_SECTION} entries`,
      );
    }

    const blockIds = new Set<string>();
    const allowedBlockTypes = SECTION_BLOCK_TYPES[type as (typeof THEME_SECTION_TYPES)[number]];

    for (const block of blocks) {
      if (!isPlainObject(block)) {
        throw new BadRequestException('Theme block must be an object');
      }

      if (!isValidText(block.id, 80)) {
        throw new BadRequestException('Theme block id must be a non-empty string up to 80 chars');
      }

      if (blockIds.has(block.id as string)) {
        throw new BadRequestException(`Duplicate theme block id: ${block.id as string}`);
      }

      blockIds.add(block.id as string);

      if (!isValidText(block.type, 60)) {
        throw new BadRequestException('Theme block type must be a non-empty string up to 60 chars');
      }

      if (allowedBlockTypes && !allowedBlockTypes.includes(block.type as string)) {
        throw new BadRequestException(
          `Theme block type ${block.type as string} is invalid for section type ${type}`,
        );
      }

      if (!isPlainObject(block.settings)) {
        throw new BadRequestException('Theme block settings must be an object');
      }
    }
  }

  validateSectionSettings(type, settings);
}

function validateSectionSettings(type: string, settings: unknown): void {
  if (!settings) {
    return;
  }

  const record = settings as Record<string, unknown>;

  if (type === 'hero' && record.headline !== undefined && !isValidText(record.headline, 180)) {
    throw new BadRequestException('Hero headline must be a non-empty string up to 180 chars');
  }
  if (type === 'hero' && record.subheadline !== undefined && !isValidText(record.subheadline, 320)) {
    throw new BadRequestException('Hero subheadline must be a non-empty string up to 320 chars');
  }
  if (type === 'hero' && record.primaryCtaLabel !== undefined && !isValidText(record.primaryCtaLabel, 40)) {
    throw new BadRequestException('Hero primary CTA label must be a non-empty string up to 40 chars');
  }
  if (
    type === 'hero' &&
    record.primaryCtaHref !== undefined &&
    !isValidText(record.primaryCtaHref, 300)
  ) {
    throw new BadRequestException('Hero primary CTA href must be a non-empty string up to 300 chars');
  }

  if (type === 'announcement_bar' && record.message !== undefined && !isValidText(record.message, 240)) {
    throw new BadRequestException('Announcement message must be a non-empty string up to 240 chars');
  }

  if (type === 'rich_text') {
    if (record.title !== undefined && !isValidText(record.title, 140)) {
      throw new BadRequestException('Rich text title must be a non-empty string up to 140 chars');
    }
    if (record.body !== undefined && !isValidText(record.body, 500)) {
      throw new BadRequestException('Rich text body must be a non-empty string up to 500 chars');
    }
  }

  if (type === 'newsletter_signup') {
    if (record.title !== undefined && !isValidText(record.title, 120)) {
      throw new BadRequestException('Newsletter title must be a non-empty string up to 120 chars');
    }
    if (record.ctaLabel !== undefined && !isValidText(record.ctaLabel, 40)) {
      throw new BadRequestException('Newsletter CTA label must be a non-empty string up to 40 chars');
    }
  }

  if (type === 'testimonials' && record.items !== undefined) {
    if (!Array.isArray(record.items) || record.items.length > 6) {
      throw new BadRequestException('Testimonials items must be an array up to 6 entries');
    }
  }

  if (type === 'faq' && record.items !== undefined) {
    if (!Array.isArray(record.items) || record.items.length > 8) {
      throw new BadRequestException('FAQ items must be an array up to 8 entries');
    }
  }

  if (type === 'faq' && record.title !== undefined && !isValidText(record.title, 140)) {
    throw new BadRequestException('FAQ title must be a non-empty string up to 140 chars');
  }

  if (type === 'trust_badges' && record.items !== undefined) {
    if (!Array.isArray(record.items) || record.items.length > 6) {
      throw new BadRequestException('Trust badges items must be an array up to 6 entries');
    }
  }

  if (type === 'trust_badges' && record.title !== undefined && !isValidText(record.title, 120)) {
    throw new BadRequestException('Trust badges title must be a non-empty string up to 120 chars');
  }
}

function isValidText(value: unknown, maxLength: number): boolean {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return !Array.isArray(value);
}
