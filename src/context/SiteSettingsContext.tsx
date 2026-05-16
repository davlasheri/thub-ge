import { createContext, useContext, useState } from 'react';

const SETTINGS_KEY = 'thub_site_settings';

export interface ContactSettings {
  address: string;
  phone: string;
  phoneHref: string;
  email1: string;
  email2: string;
  hoursWeekday: string;
  hoursWeekend: string;
  mapsUrl: string;
}

export interface HomeSettings {
  taglineKa: string;
  taglineEn: string;
  taglineRu: string;
  bannerKa: string;
  bannerEn: string;
  bannerRu: string;
}

export interface SiteSettings {
  contact: ContactSettings;
  home: HomeSettings;
}

const DEFAULTS: SiteSettings = {
  contact: {
    address: 'Tbilisi, Georgia',
    phone: '+995 599 286 244',
    phoneHref: 'tel:+995599286244',
    email1: 'info@thub.ge',
    email2: 'orders@thub.ge',
    hoursWeekday: 'Mon–Fri: 10:00–19:00',
    hoursWeekend: 'Sat–Sun: 10:00–18:00',
    mapsUrl: 'https://maps.app.goo.gl/3Mwx3WmQCfhRRTcb8',
  },
  home: {
    taglineKa: '',
    taglineEn: '',
    taglineRu: '',
    bannerKa: '',
    bannerEn: '',
    bannerRu: '',
  },
};

interface SiteSettingsCtx {
  settings: SiteSettings;
  updateContact: (c: ContactSettings) => void;
  updateHome: (h: HomeSettings) => void;
}

const Ctx = createContext<SiteSettingsCtx | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
      return {
        contact: { ...DEFAULTS.contact, ...(stored.contact ?? {}) },
        home:    { ...DEFAULTS.home,    ...(stored.home    ?? {}) },
      };
    } catch {
      return DEFAULTS;
    }
  });

  const persist = (s: SiteSettings) => {
    setSettings(s);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  };

  const updateContact = (c: ContactSettings) => persist({ ...settings, contact: c });
  const updateHome    = (h: HomeSettings)    => persist({ ...settings, home: h });

  return <Ctx.Provider value={{ settings, updateContact, updateHome }}>{children}</Ctx.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSiteSettings outside SiteSettingsProvider');
  return ctx;
}
