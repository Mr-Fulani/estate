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

export function AppShell({
  children,
  siteSettings,
}: {
  children: React.ReactNode;
  siteSettings: SiteSettings;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      <Suspense fallback={null}><NavigationFeedback /></Suspense>
      <CurrencyProvider>
        <SiteSettingsProvider initialSettings={siteSettings}>
          <Header />
          <main className={cn('flex-grow', !isAdmin && 'pt-16 md:pt-20')}>
            {children}
          </main>
          <Footer />
        </SiteSettingsProvider>
      </CurrencyProvider>
    </>
  );
}
