'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      <Header />
      <main className={cn('flex-grow', !isAdmin && 'pt-16 md:pt-20')}>
        {children}
      </main>
      <Footer />
    </>
  );
}
