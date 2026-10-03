import type { Metadata } from 'next';
import LocalizedNotFound from '@/components/layout/LocalizedNotFound';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: null, languages: {} },
  openGraph: { url: null },
};

export default LocalizedNotFound;
