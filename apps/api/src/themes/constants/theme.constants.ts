export const THEME_SECTION_TYPES = [
  'header',
  'hero',
  'categories_grid',
  'featured_products',
  'offers_banner',
  'footer',
] as const;

export type ThemeSectionType = (typeof THEME_SECTION_TYPES)[number];
