import { useUserStore } from '../store/useUserStore';

export interface AppTheme {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  subtext: string;
  divider: string;
  inputBorder: string;
  chipBg: string;
  tagBg: string;
  codeBg: string;
}

export const LIGHT_THEME: AppTheme = {
  background: '#FFFAF5',
  card: 'white',
  cardBorder: '#f5f0eb',
  text: '#2D2D2D',
  subtext: '#888',
  divider: '#f5f0eb',
  inputBorder: '#e0e0e0',
  chipBg: '#f0e8e0',
  tagBg: '#FFF5EE',
  codeBg: '#f5f0eb',
};

export const DARK_THEME: AppTheme = {
  background: '#1C1C1E',
  card: '#2C2C2E',
  cardBorder: '#3A3A3C',
  text: '#FFFFFF',
  subtext: '#8E8E93',
  divider: '#3A3A3C',
  inputBorder: '#48484A',
  chipBg: '#3A3A3C',
  tagBg: '#3A3A3C',
  codeBg: '#3A3A3C',
};

export function useTheme(): AppTheme {
  const darkMode = useUserStore((s) => s.darkMode);
  return darkMode ? DARK_THEME : LIGHT_THEME;
}
