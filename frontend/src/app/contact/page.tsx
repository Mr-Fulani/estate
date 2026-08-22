'use client';

import { ContactForm } from '@/app/properties/[id]/ContactForm';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLocale } from '@/context/LocaleContext';
import { localizedOfficeAddress } from '@/i18n/domain';
import { siteCopy } from '@/i18n/siteCopy';
import {
  TelegramIcon,
  WhatsappIcon,
  VkIcon,
  YoutubeIcon,
  InstagramIcon,
  FacebookIcon,
  MaxIcon,
} from '@/components/ui/SocialIcons';
import { TrackedContactLink } from '@/components/contact/TrackedContactLink';
import type { ContactTrackData } from '@/types';

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const { locale } = useLocale();
  const copy = siteCopy[locale].contact;
  const address = localizedOfficeAddress(locale, settings.address);

  const phoneTel = 'tel:' + (settings.phone || '').replace(/[\s\-\(\)]/g, '');

  const socialLinks = [
    { url: settings.telegram, icon: TelegramIcon, label: 'Telegram', channel: 'telegram', color: 'hover:bg-[#27A7E7] hover:text-white' },
    { url: settings.whatsapp, icon: WhatsappIcon, label: 'WhatsApp', channel: 'whatsapp', color: 'hover:bg-[#25D366] hover:text-white' },
    { url: settings.vk, icon: VkIcon, label: 'ВКонтакте', channel: 'vk', color: 'hover:bg-[#4C75A3] hover:text-white' },
    { url: settings.youtube, icon: YoutubeIcon, label: 'YouTube', color: 'hover:bg-[#FF0000] hover:text-white' },
    { url: settings.instagram, icon: InstagramIcon, label: 'Instagram', channel: 'instagram', color: 'hover:bg-[#E1306C] hover:text-white' },
    { url: settings.facebook, icon: FacebookIcon, label: 'Facebook', channel: 'facebook', color: 'hover:bg-[#1877F2] hover:text-white' },
    { url: settings.max_messenger, icon: MaxIcon, label: 'MAX', channel: 'max', color: 'hover:bg-blue-600 hover:text-white' },
  ].filter((s) => s.url && typeof s.url === 'string' && s.url.trim() !== '');

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-80px)] py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{copy.title}</h1>
          <p className="text-lg text-slate-600">
            {copy.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Dynamic Contact Info Card */}
          <div className="bg-primary-900 rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-8">{copy.info}</h2>
              
              <div className="space-y-7">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 text-secondary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white/90">{copy.office}</h3>
                    <p className="text-primary-100 leading-relaxed text-sm md:text-base">
                      {address}
                    </p>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 text-secondary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white/90">{copy.phone}</h3>
                    <TrackedContactLink href={phoneTel} channel="phone" source="contact_page_phone" className="text-primary-100 hover:text-white font-semibold text-base md:text-lg transition-colors inline-block">
                      {settings.phone}
                    </TrackedContactLink>
                  </div>
                </div>
                
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 text-secondary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white/90">{copy.email}</h3>
                    <TrackedContactLink href={`mailto:${settings.email}`} channel="email" source="contact_page_email" className="text-primary-100 hover:text-white transition-colors text-sm md:text-base">
                      {settings.email}
                    </TrackedContactLink>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 text-secondary">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white/90">{copy.hours}</h3>
                    <p className="text-primary-100 text-sm md:text-base">
                      {settings.working_hours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social & Messengers Section */}
            {socialLinks.length > 0 && (
              <div className="pt-8 mt-8 border-t border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-200 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-secondary" />
                  {copy.social}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {socialLinks.map((social) => social.channel ? (
                    <TrackedContactLink key={social.label} href={social.url!} target="_blank" channel={social.channel as ContactTrackData['channel']} source={`contact_page_${social.channel}`} className={`h-11 px-4 rounded-xl bg-white/10 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all active:scale-95 ${social.color}`} title={social.label}>
                      <social.icon className="h-[18px] w-[18px]" /><span>{social.label}</span>
                    </TrackedContactLink>
                  ) : (
                    <a key={social.label} href={social.url!} target="_blank" rel="noopener noreferrer" className={`h-11 px-4 rounded-xl bg-white/10 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all active:scale-95 ${social.color}`} title={social.label}>
                      <social.icon className="h-[18px] w-[18px]" /><span>{social.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{copy.write}</h2>
            <p className="text-slate-500 text-sm mb-6">
              {copy.responseTime}
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
