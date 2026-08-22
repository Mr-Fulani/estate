'use client';

import { Phone } from 'lucide-react';

import { TrackedContactLink } from '@/components/contact/TrackedContactLink';
import { TelegramIcon, WhatsappIcon } from '@/components/ui/SocialIcons';
import { useLocale } from '@/context/LocaleContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { siteCopy } from '@/i18n/siteCopy';


export function PropertyContactActions({ propertyId }: { propertyId: number }) {
  const { settings } = useSiteSettings();
  const { locale } = useLocale();
  const copy = siteCopy[locale].property;
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{copy.quickContact}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {settings.whatsapp && (
          <TrackedContactLink href={settings.whatsapp} channel="whatsapp" source="property_whatsapp" propertyId={propertyId} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <WhatsappIcon className="h-5 w-5" />{copy.whatsapp}
          </TrackedContactLink>
        )}
        {settings.telegram && (
          <TrackedContactLink href={settings.telegram} channel="telegram" source="property_telegram" propertyId={propertyId} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-50 px-3 text-sm font-bold text-sky-700 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
            <TelegramIcon className="h-5 w-5" />{copy.telegram}
          </TrackedContactLink>
        )}
        <TrackedContactLink href={phoneHref} channel="phone" source="property_phone" propertyId={propertyId} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Phone className="h-5 w-5" />{copy.call}
        </TrackedContactLink>
      </div>
    </div>
  );
}
