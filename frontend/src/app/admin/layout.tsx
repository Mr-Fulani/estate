'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Tags, 
  Globe, 
  PlusCircle, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Объекты', icon: Building2 },
  { href: '/admin/leads', label: 'Заявки и лиды', icon: Users },
  { href: '/admin/categories', label: 'Категории', icon: Tags },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between">
        <div>
          {/* Logo / Admin Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Estate<span className="text-secondary">.</span>
              </span>
              <span className="text-xs uppercase bg-secondary/20 text-secondary px-2 py-0.5 rounded font-semibold">
                Admin
              </span>
            </Link>
          </div>

          {/* Quick Create Button */}
          <div className="p-4">
            <Link
              href="/admin/properties/new"
              className="w-full bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Добавить объект
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {adminNavItems.map((item) => {
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800"
          >
            <Globe className="w-4 h-4 text-secondary" />
            <span>Вернуться на сайт</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
