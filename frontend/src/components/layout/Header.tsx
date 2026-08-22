'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Coins, Globe2, Menu, X, Phone } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useLocale } from '@/context/LocaleContext';
import { localeLabels, locales, localeTags, localizeHref, type Locale } from '@/i18n/config';
import { TelegramIcon, WhatsappIcon, VkIcon, YoutubeIcon, InstagramIcon, FacebookIcon, MaxIcon } from '../ui/SocialIcons';
import { TrackedContactLink } from '@/components/contact/TrackedContactLink';
import type { ContactTrackData } from '@/types';
import { currencyCodes, useCurrency } from '@/context/CurrencyContext';
import type { CurrencyCode } from '@/types';
import { startNavigationFeedback } from '@/components/layout/NavigationFeedback';

const currencyLabels: Record<CurrencyCode, string> = {
  RUB: '₽ RUB',
  USD: '$ USD',
  EUR: '€ EUR',
  TRY: '₺ TRY',
};

type NavParticle = {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
};

type NavBurst = {
  id: number;
  href: string;
  particles: NavParticle[];
};

const navParticleColors = ['#1a365d', '#d4a746', '#f4d98a', '#6f8fb8'];

function createNavParticles(): NavParticle[] {
  return Array.from({ length: 14 }, (_, index) => {
    const angle = ((Math.PI * 2) / 14) * index + (Math.random() - 0.5) * 0.35;
    const distance = 32 + Math.random() * 26;
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;

    return {
      id: index,
      startX,
      startY,
      endX: startX * (0.12 + Math.random() * 0.12),
      endY: startY * (0.12 + Math.random() * 0.12),
      size: 8 + Math.random() * 8,
      delay: Math.random() * 90,
      duration: 720 + Math.random() * 280,
      color: navParticleColors[index % navParticleColors.length],
    };
  });
}

function phoneToTel(phone: string): string {
  return 'tel:' + phone.replace(/[\s\-\(\)]/g, '');
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [navBurst, setNavBurst] = useState<NavBurst | null>(null);
  const navBurstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navBurstId = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSiteSettings();
  const { locale, messages, href } = useLocale();
  const { currency, setCurrency, effectiveDate, isReady, error } = useCurrency();
  const formattedRateDate = effectiveDate
    ? new Intl.DateTimeFormat(localeTags[locale], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${effectiveDate}T12:00:00Z`))
    : null;

  const currencyTitle = error
    ? messages.navigation.currencyUnavailable
    : [messages.navigation.currencyRate, formattedRateDate].filter(Boolean).join(' · ');

  useEffect(() => {
    let animationFrame = 0;

    const updateHeaderPosition = () => {
      animationFrame = 0;
      const scrollTop = Math.max(window.scrollY, 0);

      setIsDetached((currentValue) => {
        const nextValue = currentValue ? scrollTop > 2 : scrollTop > 10;
        return nextValue === currentValue ? currentValue : nextValue;
      });
    };

    const handleScroll = () => {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(updateHeaderPosition);
      }
    };

    updateHeaderPosition();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pageshow', updateHeaderPosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pageshow', updateHeaderPosition);
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => () => {
    if (navBurstTimer.current) {
      clearTimeout(navBurstTimer.current);
    }
  }, []);

  const navItems = [
    { href: href('/'), label: messages.navigation.home },
    { href: href('/properties'), label: messages.navigation.properties },
    { href: href('/services'), label: messages.navigation.services },
    { href: href('/news'), label: messages.navigation.news },
    { href: href('/reviews'), label: messages.navigation.reviews },
    { href: href('/about'), label: messages.navigation.about },
    { href: href('/contact'), label: messages.navigation.contact },
  ];

  const switchLocale = (nextLocale: Locale) => {
    setIsMobileMenuOpen(false);
    if (nextLocale === locale) return;

    const targetPath = localizeHref(nextLocale, pathname || '/');
    const locationSuffix = `${window.location.search}${window.location.hash}`;
    startNavigationFeedback();
    router.push(`${targetPath}${locationSuffix}`);
  };

  const animateNavClick = (event: ReactMouseEvent<HTMLAnchorElement>, itemHref: string) => {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    navBurstId.current += 1;
    const burstId = navBurstId.current;
    setNavBurst({
      id: burstId,
      href: itemHref,
      particles: createNavParticles(),
    });

    if (navBurstTimer.current) {
      clearTimeout(navBurstTimer.current);
    }

    navBurstTimer.current = setTimeout(() => {
      setNavBurst((currentBurst) => currentBurst?.id === burstId ? null : currentBurst);
    }, 1250);
  };

  // Hide public header on admin pages
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

  return (
    <header
      className="site-header fixed inset-x-0 top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
      data-detached={isDetached}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={href('/')} className="notranslate flex items-center gap-2 group" aria-label="Rahat Home" translate="no">
            <span className="text-2xl font-bold tracking-tight text-primary">
              <span className="md:hidden">RH<span className="text-secondary">.</span></span>
              <span className="hidden md:inline">Rahat Home<span className="text-secondary">.</span></span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav hidden xl:flex items-center gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(`${item.href}/`));
              const isBursting = navBurst?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => animateNavClick(event, item.href)}
                  className={cn(
                    'header-nav__link relative isolate py-1 text-sm font-medium transition-colors',
                    isActive || isBursting
                      ? 'text-primary font-semibold'
                      : 'text-slate-600 hover:text-primary'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'header-nav__pill',
                      (isActive || isBursting) && 'header-nav__pill--active',
                      isBursting && 'header-nav__pill--bursting'
                    )}
                    aria-hidden="true"
                  />
                  {isBursting && navBurst && (
                    <span key={navBurst.id} className="header-nav__burst" aria-hidden="true">
                      {navBurst.particles.map((particle) => (
                        <span
                          key={particle.id}
                          className="header-nav__particle"
                          style={{
                            '--particle-start-x': `${particle.startX}px`,
                            '--particle-start-y': `${particle.startY}px`,
                            '--particle-end-x': `${particle.endX}px`,
                            '--particle-end-y': `${particle.endY}px`,
                            '--particle-size': `${particle.size}px`,
                            '--particle-delay': `${particle.delay}ms`,
                            '--particle-duration': `${particle.duration}ms`,
                            '--particle-color': particle.color,
                          } as CSSProperties}
                        />
                      ))}
                    </span>
                  )}
                  <span className="relative z-[2]">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Social Icons */}
            <div className="hidden items-center gap-1.5 2xl:flex">
              {socialLinks.map((social) => social.channel ? (
                <TrackedContactLink key={social.label} href={social.url!} target="_blank" channel={social.channel as ContactTrackData['channel']} source={`header_${social.channel}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-primary/5 hover:text-primary" title={social.label}>
                  <social.icon className="h-[18px] w-[18px]" />
                </TrackedContactLink>
              ) : (
                <a key={social.label} href={social.url!} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-primary/5 hover:text-primary" title={social.label}>
                  <social.icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>

            {/* Divider */}
            {socialLinks.length > 0 && (
              <div className="hidden w-px h-6 bg-slate-200 2xl:block" />
            )}

            <label className="notranslate relative flex items-center text-slate-500" title={messages.navigation.language} translate="no">
              <Globe2 className="w-4 h-4 absolute start-2.5 pointer-events-none" aria-hidden="true" />
              <span className="sr-only">{messages.navigation.language}</span>
              <select
                value={locale}
                onChange={(event) => switchLocale(event.target.value as Locale)}
                className="h-9 rounded-lg border border-slate-200 bg-white ps-8 pe-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={messages.navigation.language}
              >
                {locales.map((item) => <option key={item} value={item} lang={item}>{item.toUpperCase()}</option>)}
              </select>
            </label>

            <label className="relative flex items-center text-slate-500" title={currencyTitle}>
              <Coins className="w-4 h-4 absolute start-2.5 pointer-events-none" aria-hidden="true" />
              <span className="sr-only">{messages.navigation.currency}</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                disabled={!isReady}
                className="h-9 rounded-lg border border-slate-200 bg-white ps-8 pe-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={messages.navigation.currency}
              >
                {currencyCodes.map((item) => <option key={item} value={item}>{currencyLabels[item]}</option>)}
              </select>
            </label>

            {/* Phone */}
            <TrackedContactLink href={phoneToTel(settings.phone)} channel="phone" source="header_phone" className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <Phone className="w-4 h-4" />
              </div>
              <span dir="ltr">{settings.phone}</span>
            </TrackedContactLink>

            <Link href={href('/contact')} className="bg-primary text-white hover:bg-primary-800 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95">
              {messages.navigation.request}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="xl:hidden p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? messages.navigation.closeMenu : messages.navigation.openMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="xl:hidden max-h-[calc(100vh-4rem)] overflow-y-auto bg-white border-t border-slate-100 px-6 py-5 flex flex-col gap-4 shadow-xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block text-base font-medium py-2 transition-colors border-b border-slate-50',
                  isActive ? 'text-primary font-semibold' : 'text-slate-700 hover:text-primary'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 flex flex-col gap-3">
            <div className="notranslate flex items-center gap-2" aria-label={messages.navigation.language} translate="no">
              <Globe2 className="w-4 h-4 text-primary" aria-hidden="true" />
              {locales.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchLocale(item)}
                  lang={item}
                  className={cn(
                    'min-h-9 px-3 rounded-lg text-xs font-semibold border',
                    item === locale ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'
                  )}
                  aria-label={localeLabels[item]}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2" aria-label={messages.navigation.currency} title={currencyTitle}>
              <Coins className="w-4 h-4 text-primary" aria-hidden="true" />
              {currencyCodes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrency(item)}
                  disabled={!isReady && item !== 'RUB'}
                  className={cn(
                    'min-h-9 px-3 rounded-lg text-xs font-semibold border disabled:cursor-not-allowed disabled:opacity-50',
                    item === currency ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'
                  )}
                  aria-label={`${messages.navigation.currency}: ${item}`}
                  aria-pressed={item === currency}
                >
                  {currencyLabels[item]}
                </button>
              ))}
            </div>
            <TrackedContactLink href={phoneToTel(settings.phone)} channel="phone" source="mobile_header_phone" className="flex items-center gap-2.5 text-slate-800 font-medium py-1.5">
              <Phone className="w-4 h-4 text-secondary" />
              <span dir="ltr">{settings.phone}</span>
            </TrackedContactLink>

            {/* Social Links in Mobile */}
            <div className="flex items-center gap-2 py-1.5">
              {socialLinks.map((social) => social.channel ? (
                <TrackedContactLink key={social.label} href={social.url!} target="_blank" channel={social.channel as ContactTrackData['channel']} source={`mobile_header_${social.channel}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary" title={social.label}>
                  <social.icon className="h-5 w-5" />
                </TrackedContactLink>
              ) : (
                <a key={social.label} href={social.url!} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary" title={social.label}>
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            <Link href={href('/contact')} onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors text-center">
              {messages.navigation.request}
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}
