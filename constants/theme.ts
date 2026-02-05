/**
 * ADHD Cleaning App Theme
 * A calm, intentional design system focused on reducing overwhelm.
 */

import { Platform } from 'react-native';

// MARK: - Colors
export const Colors = {
  // Base Colors
  background: '#FAFAF9',
  surface: '#FFFFFF',
  text: '#1C1917',
  textSecondary: '#78716C',
  textTertiary: '#A8A29E',

  // Accent Colors
  accent: '#7C9885',       // Sage green
  accentLight: '#A8C5B5',
  highlight: '#E9B872',    // Warm gold
  highlightLight: '#F5D9A8',

  // Semantic Colors
  success: '#7C9885',
  warning: '#E9B872',
  error: '#DC8A78',

  // Card Colors
  cardBackground: '#FFFFFF',
  cardBorder: '#E7E5E4',

  // Category Colors
  categoryDaily: '#E9B872',
  categoryWeekly: '#7C9885',
  categoryMonthly: '#8B9DC3',
  categorySeasonal: '#C9A87C',
  categorySpeedClean: '#E07A5F',
  categoryDeepClean: '#81B29A',
  categoryDeclutter: '#9B8AA6',
  categoryLaundry: '#6B9AC4',
  categoryPet: '#D4A373',
};

// MARK: - Typography
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontSize: 19,
    fontWeight: '400' as const,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  buttonSmall: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
};

// MARK: - Spacing
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Screen Padding
  screenHorizontal: 24,
  screenVertical: 16,

  // Card
  cardPadding: 20,
  cardSpacing: 16,
  cardCornerRadius: 16,

  // Button
  buttonHeight: 56,
  buttonCornerRadius: 14,
  buttonPadding: 16,

  // Icon
  iconSmall: 20,
  iconMedium: 24,
  iconLarge: 32,
  iconXL: 48,
};

// MARK: - Fonts
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    rounded: 'System',
  },
  android: {
    sans: 'Roboto',
    rounded: 'Roboto',
  },
  default: {
    sans: 'System',
    rounded: 'System',
  },
});

// MARK: - Number Formatting
const numberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
