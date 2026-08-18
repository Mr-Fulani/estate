'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, Phone } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/properties', label: 'Каталог' },
  { href: '/services', label: 'Услуги' },
  { href: '/about', label: 'О нас' },
  { href: '/contact', label: 'Контакты' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all duration-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-primary">
              Estate<span className="text-secondary">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors relative py-1',
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-slate-600 hover:text-primary'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="tel:+74951234567"
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <Phone className="w-4 h-4" />
              </div>
              <span>+7 (495) 123-45-67</span>
            </a>

            <Link href="/contact">
              <button className="bg-primary text-white hover:bg-primary-800 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95">
                Оставить заявку
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2">
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
              className="flex items-center gap-2.5 text-slate-800 font-medium py-1.5"
            >
              <Phone className="w-4 h-4 text-secondary" />
              <span>+7 (495) 123-45-67</span>
            </a>

            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors">
                Оставить заявку
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
