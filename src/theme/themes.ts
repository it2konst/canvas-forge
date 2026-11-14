import type { ThemeDefinition } from 'vuetify'

/*
 * Palettes for a drawing app.
 *
 * - The chrome is near-neutral grey on purpose: tinted UI shifts how colours
 *   in the picture are perceived, so only the accent carries hue.
 * - No pure white and no pure black. Body text sits at ~15:1 (light) and
 *   ~12.5:1 (dark) against panels: well above WCAG AA (4.5:1) but softer
 *   than 21:1, which causes glare by day and halation at night.
 * - Every accent and status colour passes 4.5:1 against its surface.
 * - The dark theme lifts surfaces in steps instead of relying on shadows,
 *   which are barely visible on dark backgrounds.
 */

export const lightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#EEEEEC',
    surface: '#F9F9F8',
    'surface-bright': '#FFFFFF',
    'surface-light': '#F1F1EF',
    'surface-variant': '#E4E4E1',
    'on-surface-variant': '#45474C',
    primary: '#3F5BD0',
    'primary-darken-1': '#3149AE',
    secondary: '#5C6270',
    'secondary-darken-1': '#4A4F5B',
    error: '#C0392B',
    info: '#2F6FB0',
    success: '#2E7D4F',
    warning: '#9A6700',
    'on-background': '#1E1F22',
    'on-surface': '#1E1F22',
    'on-primary': '#FFFFFF',
    // App-specific tokens
    workspace: '#E2E2DF',
    'checker-a': '#FFFFFF',
    'checker-b': '#E6E6E6',
  },
  variables: {
    'border-color': '#1E1F22',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.92,
    'medium-emphasis-opacity': 0.68,
    'disabled-opacity': 0.42,
    'hover-opacity': 0.05,
    'focus-opacity': 0.1,
    'activated-opacity': 0.1,
  },
}

export const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#17181A',
    surface: '#202124',
    'surface-bright': '#2C2D31',
    'surface-light': '#26272A',
    'surface-variant': '#33353A',
    'on-surface-variant': '#C4C6CC',
    primary: '#8FA3F2',
    'primary-darken-1': '#7189EA',
    secondary: '#A9AFBD',
    'secondary-darken-1': '#949AA8',
    error: '#F2877B',
    info: '#79B3EA',
    success: '#73C595',
    warning: '#E3B341',
    'on-background': '#E3E3E6',
    'on-surface': '#E3E3E6',
    'on-primary': '#121A3D',
    workspace: '#101113',
    'checker-a': '#3A3B3F',
    'checker-b': '#2E2F33',
  },
  variables: {
    'border-color': '#E3E3E6',
    'border-opacity': 0.1,
    'high-emphasis-opacity': 0.9,
    'medium-emphasis-opacity': 0.64,
    'disabled-opacity': 0.38,
    'hover-opacity': 0.06,
    'focus-opacity': 0.12,
    'activated-opacity': 0.14,
  },
}
