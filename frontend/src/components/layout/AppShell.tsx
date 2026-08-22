'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { NavigationFeedback } from '@/components/layout/NavigationFeedback';
import type { SiteSettings } from '@/types';
import { useLocale } from '@/context/LocaleContext';

export function AppShell({
  children,
  siteSettings,
}: {
  children: React.ReactNode;
  siteSettings: SiteSettings;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const { locale } = useLocale();
  const skipLabel = locale === 'en' ? 'Skip to content' : locale === 'tr' ? 'İçeriğe geç' : 'Перейти к содержанию';

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[300] -translate-y-24 rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
      >
        {skipLabel}
      </a>
      <Suspense fallback={null}><NavigationFeedback /></Suspense>
      <CurrencyProvider>
        <SiteSettingsProvider initialSettings={siteSettings}>
          <Header />
          <main id="main-content" tabIndex={-1} className={cn('flex-grow outline-none', !isAdmin && 'pt-16 md:pt-20')}>
            {children}
          </main>
          <Footer />
        </SiteSettingsProvider>
      </CurrencyProvider>
    </>
  );
}
