'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '@/types';
import { fetchSiteSettings } from '@/lib/api';

const defaultSettings: SiteSettings = {
  phone: '+7 (495) 123-45-67',
  email: 'info@estate-agency.ru',
  address: 'г. Москва, Пресненская набережная, 12, Башня Федерация',
  working_hours: 'Ежедневно с 9:00 до 21:00',
  telegram: 'https://t.me/estate_agency',
  whatsapp: 'https://wa.me/79991234567',
  vk: 'https://vk.com/estate_agency',
  youtube: 'https://youtube.com/@estate_agency',
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: SiteSettings) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

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

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, refreshSettings, updateLocalSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
