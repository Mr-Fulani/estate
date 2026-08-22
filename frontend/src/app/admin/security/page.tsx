'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock3,
  History,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';

import {
  createAdminUser,
  fetchAdminUsers,
  fetchAuditLogs,
  updateAdminUser,
} from '@/lib/api';
import type { AdminAuditLog, AdminRole, AdminUser } from '@/types';
import { AdminActionSpinner } from '@/components/admin/AdminActionSpinner';


const roleLabels: Record<AdminRole, string> = {
  founder: 'Founder',
  admin: 'Администратор',
  manager: 'Менеджер',
  editor: 'Редактор',
};

const roleDescriptions: Record<AdminRole, string> = {
  founder: 'Полный доступ, команда и безопасность',
  admin: 'Все рабочие разделы и журнал действий',
  manager: 'Объекты, лиды, сделки и отзывы',
  editor: 'Объекты, новости и отзывы',
};

const actionLabels: Record<string, string> = {
  'auth.login': 'Вход в админку',
  'auth.logout': 'Выход из админки',
  'auth.login_failed': 'Неудачная попытка входа',
  'auth.password_changed': 'Изменён пароль',
  'auth.password_change_failed': 'Неудачная смена пароля',
  'admin_user.created': 'Создан аккаунт',
  'admin_user.updated': 'Изменён аккаунт',
  'property.created': 'Добавлен объект',
  'property.updated': 'Изменён объект',
  'property.deleted': 'Удалён объект',
  'lead.updated': 'Изменено обращение',
  'lead.note_added': 'Добавлена заметка к лиду',
  'lead.deleted': 'Удалено обращение',
  'review.invitation_created': 'Создано приглашение на отзыв',
  'review.updated': 'Изменён отзыв',
  'review.deleted': 'Удалён отзыв',
  'news.created': 'Создана публикация',
  'news.updated': 'Изменена публикация',
  'news.deleted': 'Удалена публикация',
  'category.created': 'Создана категория',
  'category.deleted': 'Удалена категория',
  'settings.updated': 'Изменены настройки сайта',
  'telegram.link_requested': 'Запрошена привязка Telegram',
  'telegram.connected': 'Подключён Telegram',
  'telegram.preferences_updated': 'Изменены Telegram-уведомления',
  'telegram.disconnected': 'Отключён Telegram',
};


export default function SecurityPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    role: 'manager' as AdminRole,
    password: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [team, audit] = await Promise.all([fetchAdminUsers(), fetchAuditLogs()]);
      setUsers(team);
      setLogs(audit.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось загрузить настройки доступа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = useMemo(() => users.filter((user) => user.is_active).length, [users]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const user = await createAdminUser(form);
      setUsers((current) => [...current, user]);
      setForm({ full_name: '', username: '', email: '', role: 'manager', password: '' });
      setShowCreate(false);
      const audit = await fetchAuditLogs();
      setLogs(audit.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось создать аккаунт');
    } finally {
      setCreating(false);
    }
  };

  const patchUser = async (id: number, data: Parameters<typeof updateAdminUser>[1]) => {
    setSavingId(id);
    setError(null);
    try {
      const updated = await updateAdminUser(id, data);
      setUsers((current) => current.map((user) => user.id === id ? updated : user));
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось изменить аккаунт');
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const handlePasswordReset = async (id: number) => {
    if (resetPassword.length < 12) {
      setError('Новый пароль должен содержать не менее 12 символов.');
      return;
    }
    if (await patchUser(id, { password: resetPassword })) {
      setResetUserId(null);
      setResetPassword('');
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="h-4 w-4" />
            Безопасность админки
          </div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Команда и доступ</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Создавайте персональные аккаунты, назначайте роли и проверяйте, кто менял объекты, сделки, отзывы и настройки.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="mb-4 h-5 w-5 text-primary" /><p className="text-3xl font-bold text-slate-900">{users.length}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Всего аккаунтов</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"><Check className="mb-4 h-5 w-5 text-emerald-600" /><p className="text-3xl font-bold text-slate-900">{activeCount}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Активный доступ</p></div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5"><History className="mb-4 h-5 w-5 text-amber-600" /><p className="text-3xl font-bold text-slate-900">{logs.length}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Последние действия</p></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setTab('users')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === 'users' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Аккаунты</button>
        <button type="button" onClick={() => setTab('audit')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === 'audit' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Журнал действий</button>
      </div>

      {tab === 'users' ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-900">Аккаунты сотрудников</h2><p className="text-sm text-slate-500">У каждого сотрудника должен быть свой вход.</p></div>
            <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800"><UserPlus className="h-4 w-4" />Добавить</button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /><h3 className="font-bold text-slate-900">Новый аккаунт</h3></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-sm font-semibold text-slate-700">Имя<input required minLength={2} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Имя сотрудника" /></label>
                <label className="text-sm font-semibold text-slate-700">Логин<input required minLength={3} pattern="[A-Za-z0-9][A-Za-z0-9._-]+" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="manager.name" /></label>
                <label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="name@company.com" /></label>
                <label className="text-sm font-semibold text-slate-700">Роль<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-sm font-semibold text-slate-700">Временный пароль<input required type="password" minLength={12} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Минимум 12 символов" /></label>
              </div>
              <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} disabled={creating} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Отмена</button><button type="submit" disabled={creating} aria-busy={creating} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-50">{creating && <AdminActionSpinner />}{creating ? 'Создание…' : 'Создать аккаунт'}</button></div>
            </form>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {users.map((user) => (
              <article key={user.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${user.is_active ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserCog className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{user.full_name}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{user.is_active ? 'Активен' : 'Отключён'}</span>{savingId === user.id && <span role="status" className="inline-flex items-center gap-1 text-[10px] font-bold text-primary"><AdminActionSpinner className="h-3 w-3" />Сохранение…</span>}</div><p className="mt-1 truncate text-sm text-slate-500">@{user.username} · {user.email}</p></div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Роль<select value={user.role} disabled={savingId === user.id} onChange={(event) => patchUser(user.id, { role: event.target.value as AdminRole })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-primary">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <button type="button" disabled={savingId === user.id} aria-busy={savingId === user.id} onClick={() => patchUser(user.id, { is_active: !user.is_active })} className={`self-end inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${user.is_active ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>{savingId === user.id && <AdminActionSpinner />}{savingId === user.id ? 'Сохранение…' : user.is_active ? 'Отключить' : 'Включить'}</button>
                </div>
                <p className="mt-3 text-xs text-slate-400">{roleDescriptions[user.role]}</p>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  {resetUserId === user.id ? (
                    <div className="flex flex-col gap-2 sm:flex-row"><input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} disabled={savingId === user.id} className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder="Новый пароль, минимум 12 символов" /><button type="button" onClick={() => handlePasswordReset(user.id)} disabled={savingId === user.id} aria-busy={savingId === user.id} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50">{savingId === user.id && <AdminActionSpinner />}{savingId === user.id ? 'Сохранение…' : 'Сохранить'}</button><button type="button" disabled={savingId === user.id} onClick={() => { setResetUserId(null); setResetPassword(''); }} className="h-10 rounded-xl px-3 text-sm font-semibold text-slate-500">Отмена</button></div>
                  ) : (
                    <button type="button" onClick={() => setResetUserId(user.id)} className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-800"><KeyRound className="h-3.5 w-3.5" />Сменить пароль</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Последние действия</h2><p className="mt-1 text-sm text-slate-500">Время показано по настройкам вашего браузера.</p></div>
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Clock3 className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-slate-800">{actionLabels[log.action] || log.action}</p><p className="mt-1 text-xs text-slate-500">{log.user?.full_name || 'Система'} · {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}</p></div>
                <time className="text-xs text-slate-400 sm:text-right" dateTime={log.created_at}>{new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(log.created_at))}</time>
              </div>
            ))}
            {!logs.length && !loading && <div className="px-5 py-12 text-center text-sm text-slate-500">Журнал пока пуст.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
