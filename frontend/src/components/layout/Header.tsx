'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/properties', label: 'Каталог' },
  { href: '/services', label: 'Услуги' },
  { href: '/about', label: 'О нас' },
  { href: '/contact', label: 'Контакты' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll(); // Check initial scroll position
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if header should be in solid light mode
  const isSolid = !isHome || isScrolled;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isSolid
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3.5'
          : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className={cn(
                'text-2xl font-bold tracking-tight transition-colors',
                isSolid ? 'text-primary' : 'text-white'
              )}
            >
              Estate<span className="text-secondary">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-all hover:text-secondary relative py-1',
                    isSolid
                      ? isActive
                        ? 'text-primary font-semibold'
                        : 'text-slate-600 hover:text-primary'
                      : isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-200 hover:text-white'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className={cn(
                        'absolute bottom-0 left-0 right-0 h-0.5 rounded-full',
                        isSolid ? 'bg-primary' : 'bg-secondary'
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+74951234567"
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                isSolid ? 'text-slate-700 hover:text-primary' : 'text-white/90 hover:text-white'
              )}
            >
              <Phone className="w-4 h-4 text-secondary" />
              <span>+7 (495) 123-45-67</span>
            </a>

            <Link href="/contact">
              <button
                className={cn(
                  'px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm',
                  isSolid
                    ? 'bg-primary text-white hover:bg-primary-800'
                    : 'bg-white text-primary hover:bg-slate-100'
                )}
              >
                Оставить заявку
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors border',
              isSolid
                ? 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
                : 'text-white bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm'
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-slate-100 py-5 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block text-base font-medium py-2 transition-colors border-b border-slate-50',
                  isActive ? 'text-primary font-semibold' : 'text-slate-700 hover:text-primary'
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 flex flex-col gap-3">
            <a
              href="tel:+74951234567"
              className="flex items-center gap-2 text-slate-700 font-medium py-1"
            >
              <Phone className="w-4 h-4 text-secondary" />
              <span>+7 (495) 123-45-67</span>
            </a>

            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-800 transition-colors">
                Оставить заявку
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
