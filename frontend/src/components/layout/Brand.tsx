'use client';
import Image from 'next/image';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { brandName, brandInitials } from '@/lib/site-profile';

export function Brand({ compact = false }: { compact?: boolean }) {
  const { settings } = useSiteSettings();
  const logo = settings.profile?.logo_url;
  if (logo) return <Image src={logo} alt={brandName(settings)} width={180} height={48} className="h-10 w-auto max-w-44 object-contain" />;
  return <span translate="no" role="img" aria-label={brandName(settings)}><span aria-hidden="true">{compact ? brandInitials(settings) : <><span className="md:hidden">{brandInitials(settings)}</span><span className="hidden md:inline">{brandName(settings)}</span></>}<span className="text-secondary">.</span></span></span>;
}
