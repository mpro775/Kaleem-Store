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
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return !Array.isArray(value);
}
