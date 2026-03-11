import { BadRequestException } from '@nestjs/common';
import { THEME_SECTION_TYPES } from './constants/theme.constants';

const MAX_SECTIONS = 30;

export function validateThemeConfig(config: Record<string, unknown>): void {
  if (!isPlainObject(config)) {
    throw new BadRequestException('Theme config must be a valid object');
  }

  const sections = config.sections;
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

  if (config.globals !== undefined && !isPlainObject(config.globals)) {
    throw new BadRequestException('Theme globals must be a valid object');
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
  if (settings !== undefined && !isPlainObject(settings)) {
    throw new BadRequestException('Theme section settings must be an object');
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
