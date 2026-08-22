'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Tags, 
  Globe, 
  PlusCircle, 
  ChevronRight,
  Settings,
  Newspaper,
  Menu,
  X,
  Star,
  ShieldCheck,
  LogOut,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCurrentAdmin, logoutAdmin } from '@/lib/api';
import type { AdminRole, AdminUser } from '@/types';
import { AdminActionSpinner } from '@/components/admin/AdminActionSpinner';

const adminNavItems = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, roles: ['founder', 'admin', 'manager', 'editor'] },
  { href: '/admin/properties', label: 'Объекты', icon: Building2, roles: ['founder', 'admin', 'manager', 'editor'] },
  { href: '/admin/news', label: 'Новости', icon: Newspaper, roles: ['founder', 'admin', 'editor'] },
  { href: '/admin/leads', label: 'Лиды и сделки', icon: Users, roles: ['founder', 'admin', 'manager'] },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star, roles: ['founder', 'admin', 'manager', 'editor'] },
  { href: '/admin/categories', label: 'Категории', icon: Tags, roles: ['founder', 'admin', 'manager'] },
  { href: '/admin/settings', label: 'Настройки сайта', icon: Settings, roles: ['founder', 'admin'] },
  { href: '/admin/security', label: 'Команда и доступ', icon: ShieldCheck, roles: ['founder'] },
];

const roleLabels: Record<AdminRole, string> = {
  founder: 'Founder',
  admin: 'Администратор',
  manager: 'Менеджер',
  editor: 'Редактор',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => setIsMenuOpen(false), [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    fetchCurrentAdmin().then(setUser).catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      const returnTo = (event as CustomEvent<{ returnTo?: string }>).detail?.returnTo || '/admin';
      router.replace(`/admin/login?reason=expired&returnTo=${encodeURIComponent(returnTo)}`);
    };
    window.addEventListener('estate:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('estate:auth-expired', handleAuthExpired);
  }, [router]);

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAdmin();
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  };

  const visibleNavItems = adminNavItems.filter(
    (item) => !user || item.roles.includes(user.role),
  );

  return (
    <div className="admin-shell min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between md:sticky md:top-0 md:h-screen md:w-64">
        <div>
          {/* Logo / Admin Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                RH<span className="text-secondary">.</span>
              </span>
              <span className="text-xs uppercase bg-secondary/20 text-secondary px-2 py-0.5 rounded font-semibold">
                Admin
              </span>
            </Link>
            <button type="button" onClick={() => setIsMenuOpen((open) => !open)} className="rounded-xl bg-slate-800 p-2 text-slate-200 md:hidden" aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={isMenuOpen} aria-controls="admin-navigation">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <div id="admin-navigation" className={cn(!isMenuOpen && 'hidden md:block')}>
          {/* Quick Create Button */}
          <div className="grid gap-2 p-4">
            <Link
              href="/admin/properties/new"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Добавить объект
            </Link>
            <Link
              href="/admin/news/new"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <Newspaper className="h-4 w-4" />
              Добавить новость
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-secondary' : 'text-slate-400')} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-400" />}
                </Link>
              );
            })}
          </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className={cn('p-4 border-t border-slate-800', !isMenuOpen && 'hidden md:block')}>
          {user && (
            <div className="mb-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3">
              <Link href="/admin/profile" className="group/profile flex items-center gap-2.5 rounded-lg outline-none transition hover:bg-slate-700/70 focus-visible:ring-2 focus-visible:ring-secondary/70">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.full_name}</p>
                  <p className="truncate text-[11px] text-slate-400">@{user.username} · {roleLabels[user.role]}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-500 transition group-hover/profile:translate-x-0.5 group-hover/profile:text-secondary" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-busy={isLoggingOut}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white disabled:opacity-50"
              >
                {isLoggingOut ? <AdminActionSpinner className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                {isLoggingOut ? 'Выходим…' : 'Выйти'}
              </button>
            </div>
          )}
          <Link
            href="/ru"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800"
          >
            <Globe className="w-4 h-4 text-secondary" />
            <span>Вернуться на сайт</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 2xl:p-10">
        {children}
      </div>
    </div>
  );
}
