// Mantine theme configuration — minimalist desktop app

import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Custom color palette — deep blue primary, clean neutrals
const primary: MantineColorsTuple = [
  '#eef3ff', '#dae4ff', '#a8c1ff', '#759cfd',
  '#4b7afa', '#3463f7', '#2855ed', '#1d48d4', '#133ebd', '#0a34a8',
];

export const theme = createTheme({
  // Core colors
  primaryColor: 'primary',
  colors: { primary },

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSizes: { xs: '11px', sm: '12px', md: '13px', lg: '15px', xl: '18px' },

  // Radius — slightly rounded, not pill (desktop look)
  radius: { xs: '4px', sm: '6px', md: '8px', lg: '10px', xl: '14px' },

  // Spacing — compact for desktop
  spacing: { xs: '6px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },

  // Shadows — subtle, not too deep
  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.18)',
    sm: '0 2px 4px rgba(0,0,0,0.20)',
    md: '0 4px 12px rgba(0,0,0,0.25)',
    lg: '0 8px 24px rgba(0,0,0,0.30)',
    xl: '0 16px 40px rgba(0,0,0,0.35)',
  },

  // Components — minimalist defaults
  components: {
    Button: {
      defaultProps: { fw: 500 },
    },
    Modal: {
      defaultProps: { radius: 'md', centered: true },
    },
    Card: {
      defaultProps: { radius: 'md', withBorder: true },
    },
    Switch: {
      defaultProps: { size: 'sm' },
    },
    Select: {
      defaultProps: { size: 'sm', searchable: false },
    },
    ActionIcon: {
      defaultProps: { variant: 'subtle' },
    },
    Badge: {
      defaultProps: { size: 'sm', variant: 'light' },
    },
    Tabs: {
      defaultProps: { variant: 'pills' },
    },
    Tooltip: {
      defaultProps: { withArrow: true },
    },
  },
});
