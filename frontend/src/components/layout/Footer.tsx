'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Phone, Shield } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Hide footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

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
                <span>г. Москва, Пресненская набережная, 12<br/>Башня Федерация, офис 45</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <a href="tel:+74951234567" className="hover:text-white transition-colors">+7 (495) 123-45-67</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <a href="mailto:info@estate-agency.ru" className="hover:text-white transition-colors">info@estate-agency.ru</a>
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
