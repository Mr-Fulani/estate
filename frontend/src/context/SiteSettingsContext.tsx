'use client';

import React, { createContext, useContext, useState } from 'react';
import { SiteSettings } from '@/types';
import { fallbackSiteSettings, fetchSiteSettings } from '@/lib/api';

interface SiteSettingsContextType {
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: SiteSettings) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: fallbackSiteSettings,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export function SiteSettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: SiteSettings;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);

  const refreshSettings = async () => {
    try {
      const data = await fetchSiteSettings();
      setSettings(data);
    } catch (e) {
      console.error('Failed to load settings in context:', e);
    }
  };

  const updateLocalSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, refreshSettings, updateLocalSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
