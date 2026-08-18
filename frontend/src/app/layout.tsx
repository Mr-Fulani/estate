import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Estate — Агентство недвижимости',
  description: 'Продажа, покупка и аренда недвижимости. Найдите свой идеальный дом с Estate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
