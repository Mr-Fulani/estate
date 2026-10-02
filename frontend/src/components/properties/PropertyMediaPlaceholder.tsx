'use client';

import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import { getSiteCopy } from '@/lib/site-profile';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export function PropertyMediaPlaceholder({ locale, sizes = '(max-width: 768px) 100vw, 33vw' }: { locale: Locale; sizes?: string }) {
  const { settings } = useSiteSettings();
  return <div className="absolute inset-0 bg-[#102d49]">
    <Image src="/og.png" alt="" fill sizes={sizes} style={{ objectFit: 'contain' }} />
    <span className="absolute bottom-3 start-1/2 z-10 max-w-[90%] -translate-x-1/2 rounded-md bg-[#102d49] px-3 py-1.5 text-center text-xs font-medium text-white rtl:translate-x-1/2">
      {getSiteCopy(locale, settings).property.photosSoon}
    </span>
  </div>;
}
