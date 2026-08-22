'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { loginAdmin } from '@/lib/api';
import { AdminActionSpinner } from '@/components/admin/AdminActionSpinner';


export function LoginForm({ returnTo, reason }: { returnTo?: string; reason?: string }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeReturnTo = returnTo?.startsWith('/admin') && !returnTo.startsWith('//')
    ? returnTo
    : '/admin';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginAdmin(identifier, password);
      window.location.assign(safeReturnTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось войти. Попробуйте снова.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(27,93,71,0.35),transparent_34%),radial-gradient(circle_at_85%_82%,rgba(200,158,85,0.18),transparent_30%)]" />
      <div className="absolute left-[12%] top-24 h-72 w-72 rounded-full border border-white/5" />
      <div className="absolute -bottom-36 -right-20 h-96 w-96 rounded-full border border-secondary/10" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden flex-col justify-between px-12 py-12 lg:flex xl:px-20 xl:py-16">
          <Link href="/ru" className="flex w-fit items-center gap-3" aria-label="Rahat Home — на сайт">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">RH<span className="text-secondary">.</span></span>
          </Link>

          <div className="max-w-xl pb-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Защищённая рабочая зона
            </div>
            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
              Все объекты, обращения и сделки — в одном месте.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Управляйте каталогом на четырёх языках, контролируйте воронку продаж, модерируйте отзывы и следите за результатом команды.
            </p>
            <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
              {[
                'Сессии и роли сотрудников',
                'История важных изменений',
                'CRM по обращениям и сделкам',
                'SEO каждого объекта',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">Rahat Home Admin · Доступ только для команды</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:bg-white/[0.025] lg:backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Link href="/ru" className="mb-10 flex w-fit items-center gap-2.5 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"><Building2 className="h-5 w-5" /></div>
              <span className="text-xl font-bold">RH<span className="text-secondary">.</span></span>
            </Link>

            <div className="rounded-[28px] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-black/25 sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Вход в админку</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Используйте аккаунт, выданный founder-ом проекта.
                </p>
              </div>

              {reason === 'expired' && !error && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Сессия завершилась. Войдите снова, чтобы продолжить.
                </div>
              )}
              {error && (
                <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="admin-identifier" className="mb-2 block text-sm font-semibold text-slate-700">Логин или email</label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="zloy или name@company.com"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">Пароль</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Введите пароль"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <AdminActionSpinner />}
                  {loading ? 'Проверяем…' : 'Войти в панель'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                Регистрация закрыта. Доступ создаётся в разделе<br />«Команда и доступ».
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
