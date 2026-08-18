'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Phone, Shield } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { TelegramIcon, WhatsappIcon, VkIcon, YoutubeIcon, InstagramIcon, MaxIcon } from '../ui/SocialIcons';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { settings } = useSiteSettings();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const socialLinks = [
    { url: settings.telegram, icon: TelegramIcon, label: 'Telegram' },
    { url: settings.whatsapp, icon: WhatsappIcon, label: 'WhatsApp' },
    { url: settings.vk, icon: VkIcon, label: 'VK' },
    { url: settings.youtube, icon: YoutubeIcon, label: 'YouTube' },
    { url: settings.instagram, icon: InstagramIcon, label: 'Instagram' },
    { url: settings.max_messenger, icon: MaxIcon, label: 'MAX' },
  ].filter((s) => s.url && typeof s.url === 'string' && s.url.trim() !== '');

  const phoneTel = 'tel:' + settings.phone.replace(/[\s\-\(\)]/g, '');

  return (
    <footer className="bg-primary-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight text-white">
                Estate<span className="text-secondary">.</span>
              </span>
            </Link>
            <p className="mb-6 leading-relaxed text-sm text-slate-300">
              Ваш надежный партнер в мире недвижимости. Мы помогаем находить идеальные дома и выгодно инвестировать в недвижимость с 2010 года.
            </p>

            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-slate-300 hover:bg-secondary hover:text-white transition-all"
                    title={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Навигация</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/properties" className="hover:text-white transition-colors">Каталог недвижимости</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">О компании</Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">Наши услуги</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Контакты</Link>
              </li>
              <li className="pt-2">
                <Link 
                  href="/admin" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-secondary font-semibold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Панель администратора
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Связаться с нами</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <a href={phoneTel} className="hover:text-white transition-colors">{settings.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-primary-300">
          <p>© {currentYear} Estate Agency. Все права защищены.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Пользовательское соглашение</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
