'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo } from 'react';

import type { Locale } from '@/i18n/config';
import { isLocale, localizeHref } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import type { LocalizedMessages } from '@/i18n/types';


type LocaleContextValue = {
  locale: Locale;
  messages: LocalizedMessages;
  href: (path: string) => string;
};


const LocaleContext = createContext<LocaleContextValue | null>(null);


export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: LocalizedMessages;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathnameLocale = pathname?.split('/')[1];
  const activeLocale = pathnameLocale && isLocale(pathnameLocale) ? pathnameLocale : locale;
  const activeMessages = activeLocale === locale ? messages : getMessages(activeLocale);

  useEffect(() => {
    document.documentElement.lang = activeLocale;
  }, [activeLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: activeLocale,
      messages: activeMessages,
      href: (path) => localizeHref(activeLocale, path),
    }),
    [activeLocale, activeMessages]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}


export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return value;
}
