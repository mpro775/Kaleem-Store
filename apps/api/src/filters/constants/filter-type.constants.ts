export const FILTER_TYPES = ['checkbox', 'radio', 'color', 'range'] as const;

export type FilterType = (typeof FILTER_TYPES)[number];
