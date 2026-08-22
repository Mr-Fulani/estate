'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLocale } from '@/context/LocaleContext';
import { localizedOfficeAddress } from '@/i18n/domain';
import { siteCopy } from '@/i18n/siteCopy';
import { TelegramIcon, WhatsappIcon, VkIcon, YoutubeIcon, InstagramIcon, FacebookIcon, MaxIcon } from '../ui/SocialIcons';
import { TrackedContactLink } from '@/components/contact/TrackedContactLink';
import type { ContactTrackData } from '@/types';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { settings } = useSiteSettings();
  const { locale, href } = useLocale();
  const copy = siteCopy[locale].footer;
  const address = localizedOfficeAddress(locale, settings.address);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const socialLinks = [
    { url: settings.telegram, icon: TelegramIcon, label: 'Telegram', channel: 'telegram' },
    { url: settings.whatsapp, icon: WhatsappIcon, label: 'WhatsApp', channel: 'whatsapp' },
    { url: settings.vk, icon: VkIcon, label: 'VK', channel: 'vk' },
    { url: settings.youtube, icon: YoutubeIcon, label: 'YouTube' },
    { url: settings.instagram, icon: InstagramIcon, label: 'Instagram', channel: 'instagram' },
    { url: settings.facebook, icon: FacebookIcon, label: 'Facebook', channel: 'facebook' },
    { url: settings.max_messenger, icon: MaxIcon, label: 'MAX', channel: 'max' },
  ].filter((s) => s.url && typeof s.url === 'string' && s.url.trim() !== '');

  const phoneTel = 'tel:' + settings.phone.replace(/[\s\-\(\)]/g, '');

  return (
    <footer className="bg-primary-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href={href('/')} className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight text-white">
                Estate<span className="text-secondary">.</span>
              </span>
            </Link>
            <p className="mb-6 leading-relaxed text-sm text-slate-300">
              {copy.description}
            </p>

            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  social.channel ? (
                    <TrackedContactLink key={social.label} href={social.url!} target="_blank" channel={social.channel as ContactTrackData['channel']} source={`footer_${social.channel}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition-all hover:bg-secondary hover:text-white" title={social.label}>
                      <social.icon className="h-5 w-5" />
                    </TrackedContactLink>
                  ) : (
                    <a key={social.label} href={social.url!} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition-all hover:bg-secondary hover:text-white" title={social.label}>
                      <social.icon className="h-5 w-5" />
                    </a>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">{copy.navigation}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={href('/properties')} className="hover:text-white transition-colors">{copy.catalog}</Link>
              </li>
              <li>
                <Link href={href('/about')} className="hover:text-white transition-colors">{copy.company}</Link>
              </li>
              <li>
                <Link href={href('/services')} className="hover:text-white transition-colors">{copy.services}</Link>
              </li>
              <li>
                <Link href={href('/news')} className="hover:text-white transition-colors">{copy.news}</Link>
              </li>
              <li>
                <Link href={href('/reviews')} className="hover:text-white transition-colors">{copy.reviews}</Link>
              </li>
              <li>
                <Link href={href('/contact')} className="hover:text-white transition-colors">{copy.contact}</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">{copy.contact}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <TrackedContactLink href={phoneTel} channel="phone" source="footer_phone" className="hover:text-white transition-colors">{settings.phone}</TrackedContactLink>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <TrackedContactLink href={`mailto:${settings.email}`} channel="email" source="footer_email" className="hover:text-white transition-colors">{settings.email}</TrackedContactLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-primary-300">
          <p>© {currentYear} Estate Agency. {copy.copyright}</p>
          <div className="flex gap-4">
            <Link href={href('/privacy')} className="hover:text-white transition-colors">{copy.privacy}</Link>
            <Link href={href('/terms')} className="hover:text-white transition-colors">{copy.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
