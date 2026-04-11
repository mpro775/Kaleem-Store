export const THEME_SECTION_TYPES = [
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
] as const;

export type ThemeSectionType = (typeof THEME_SECTION_TYPES)[number];
