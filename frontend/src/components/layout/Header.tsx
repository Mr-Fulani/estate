'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold tracking-tight", isScrolled ? "text-primary" : "text-primary md:text-white")}>
              Estate<span className="text-secondary">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-secondary',
                  pathname === item.href
                    ? isScrolled ? 'text-primary font-semibold' : 'text-white font-semibold'
                    : isScrolled ? 'text-slate-600' : 'text-slate-200'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link href="/contact">
              <button className={cn(
                "px-4 py-2 rounded-md font-medium transition-colors",
                isScrolled ? "bg-primary text-white hover:bg-primary-800" : "bg-white text-primary hover:bg-slate-100"
              )}>
                Оставить заявку
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-primary bg-white/50 rounded-md backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-slate-100 py-4 px-4 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'block text-lg font-medium py-2',
                pathname === item.href ? 'text-primary' : 'text-slate-600'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
            <button className="w-full mt-4 bg-primary text-white px-4 py-3 rounded-md font-medium">
              Оставить заявку
            </button>
          </Link>
        </div>
      )}
    </header>
  );
}
