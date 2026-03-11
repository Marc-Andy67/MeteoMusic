// styles/theme.ts
// Source unique pour toutes les valeurs de design de l'app.
// Importer { colors, spacing, radius, text } dans les fichiers qui en ont besoin.

export const colors = {
  // Fonds
  bg:          '#0F0F1A',
  card:        '#1E1E2E',
  sheet:       '#1A1A2E',
  border:      '#2D2D40',

  // Primaire
  primary:     '#7C3AED',
  primaryDim:  '#3B1F6E',
  primaryText: '#A78BFA',

  // Texte
  textPrimary:   '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted:     '#6B7280',
  textDisabled:  '#4B5563',

  // États
  success:  '#22C55E',
  error:    '#EF4444',
  dark:     '#374151',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
};

export const radius = {
  sm:   8,
  md:  12,
  lg:  14,
  xl:  16,
  xxl: 24,
  full: 999,
};

export const text = {
  xs:   11,
  sm:   12,
  md:   13,
  base: 15,
  lg:   16,
  xl:   18,
  xxl:  22,
  h2:   24,
  h1:   28,
};