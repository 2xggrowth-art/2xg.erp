import { useState, useEffect } from 'react';
import { orgSettingsService, OrgSettings } from '../services/org-settings.service';

export const useOrgSettings = () => {
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await orgSettingsService.getOrgSettings();
        setOrgSettings(settings);
      } catch (error) {
        console.error('Error fetching org settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return { orgSettings, loading };
};
