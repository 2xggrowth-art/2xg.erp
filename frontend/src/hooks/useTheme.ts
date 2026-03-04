import { useEffect } from 'react';
import { useOrgSettings } from './useOrgSettings';

export const useTheme = () => {
  const { orgSettings } = useOrgSettings();

  useEffect(() => {
    if (!orgSettings) return;

    const root = document.documentElement;

    if (orgSettings.theme_color) {
      root.style.setProperty('--theme-primary', orgSettings.theme_color);
      // Generate lighter variant (hex + alpha for transparency)
      root.style.setProperty('--theme-primary-light', orgSettings.theme_color + '20');
      root.style.setProperty('--theme-primary-dark', adjustColor(orgSettings.theme_color, -20));
    }

    if (orgSettings.accent_color) {
      root.style.setProperty('--theme-accent', orgSettings.accent_color);
    }

    return () => {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-primary-light');
      root.style.removeProperty('--theme-primary-dark');
      root.style.removeProperty('--theme-accent');
    };
  }, [orgSettings]);
};

// Simple hex color adjustment — shifts R, G, B channels by the given amount
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
