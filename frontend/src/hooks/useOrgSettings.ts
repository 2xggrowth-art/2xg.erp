import { useState, useEffect } from 'react';
import { orgSettingsService, OrgSettings } from '../services/org-settings.service';

let cachedSettings: OrgSettings | null = null;

export const useOrgSettings = () => {
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(cachedSettings);
  const [loading, setLoading] = useState(!cachedSettings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedSettings) return;

    const fetchSettings = async () => {
      try {
        const settings = await orgSettingsService.getOrgSettings();
        cachedSettings = settings;
        setOrgSettings(settings);
      } catch (err: any) {
        console.error('Failed to fetch org settings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    try {
      const settings = await orgSettingsService.getOrgSettings();
      cachedSettings = settings;
      setOrgSettings(settings);
    } catch (err: any) {
      console.error('Failed to refresh org settings:', err);
    }
  };

  return { orgSettings, loading, error, refreshSettings };
};

export const clearOrgSettingsCache = () => {
  cachedSettings = null;
};
