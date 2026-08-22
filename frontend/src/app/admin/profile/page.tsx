'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Unlink,
  UserRound,
} from 'lucide-react';

import { AdminActionSpinner } from '@/components/admin/AdminActionSpinner';
import {
  changeCurrentAdminPassword,
  createAdminTelegramLink,
  disconnectAdminTelegram,
  fetchAdminTelegramSettings,
  fetchCurrentAdmin,
  sendAdminTelegramTest,
  updateAdminTelegramSettings,
} from '@/lib/api';
import type { AdminRole, AdminTelegramSettings, AdminUser } from '@/types';


const roleLabels: Record<AdminRole, string> = {
  founder: 'Founder',
  admin: 'Администратор',
  manager: 'Менеджер',
  editor: 'Редактор',
};

type Preference = 'notifications_enabled' | 'notify_new_leads' | 'notify_new_reviews';

function SettingsToggle({
  checked,
  busy,
  disabled,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  busy?: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={busy}
        aria-label={title}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${checked ? 'bg-primary' : 'bg-slate-300'}`}
      >
        {busy ? <AdminActionSpinner className="mx-auto h-4 w-4 text-white" /> : <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />}
      </button>
    </div>
  );
}


export default function AdminProfilePage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [telegram, setTelegram] = useState<AdminTelegramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState('');
  const [connectExpiresAt, setConnectExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const refreshTelegram = useCallback(async (showFeedback = false) => {
    try {
      const settings = await fetchAdminTelegramSettings();
      setTelegram(settings);
      if (settings.linked) {
        stopPolling();
        setConnectUrl('');
        setConnectExpiresAt('');
        if (showFeedback) setNotice('Telegram успешно подключён.');
      }
      return settings;
    } catch (caught) {
      if (showFeedback) setError(caught instanceof Error ? caught.message : 'Не удалось проверить подключение');
      return null;
    }
  }, [stopPolling]);

  useEffect(() => {
    Promise.all([fetchCurrentAdmin(), fetchAdminTelegramSettings()])
      .then(([currentUser, settings]) => {
        setUser(currentUser);
        setTelegram(settings);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Не удалось загрузить профиль'))
      .finally(() => setLoading(false));
    return stopPolling;
  }, [stopPolling]);

  const startPolling = () => {
    stopPolling();
    pollTimer.current = setInterval(() => {
      void refreshTelegram(true);
    }, 3000);
    window.setTimeout(stopPolling, 15 * 60 * 1000);
  };

  const createLink = async () => {
    setAction('link'); setError(''); setNotice('');
    try {
      const link = await createAdminTelegramLink();
      setConnectUrl(link.url);
      setConnectExpiresAt(link.expires_at);
      startPolling();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось создать ссылку');
    } finally {
      setAction(null);
    }
  };

  const togglePreference = async (preference: Preference) => {
    if (!telegram) return;
    setAction(preference); setError(''); setNotice('');
    try {
      const updated = await updateAdminTelegramSettings({ [preference]: !telegram[preference] });
      setTelegram(updated);
      setNotice('Настройки уведомлений сохранены.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось сохранить настройку');
    } finally {
      setAction(null);
    }
  };

  const sendTest = async () => {
    setAction('test'); setError(''); setNotice('');
    try {
      await sendAdminTelegramTest();
      setNotice('Тестовое уведомление отправлено в Telegram.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось отправить уведомление');
    } finally {
      setAction(null);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Отключить Telegram от аккаунта?')) return;
    setAction('disconnect'); setError(''); setNotice('');
    try {
      await disconnectAdminTelegram();
      stopPolling();
      setConnectUrl('');
      setTelegram((current) => current ? {
        ...current,
        linked: false,
        telegram_username: null,
        linked_at: null,
        notifications_enabled: false,
      } : current);
      setNotice('Telegram отключён от аккаунта.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось отключить Telegram');
    } finally {
      setAction(null);
    }
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (passwordForm.next !== passwordForm.confirm) {
      setError('Новый пароль и подтверждение не совпадают.');
      return;
    }
    if (passwordForm.current === passwordForm.next) {
      setError('Новый пароль должен отличаться от текущего.');
      return;
    }
    setAction('password');
    try {
      const result = await changeCurrentAdminPassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setNotice(result.revoked_sessions
        ? `Пароль изменён. Завершено других сессий: ${result.revoked_sessions}.`
        : 'Пароль изменён. Других активных сессий не было.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось изменить пароль');
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center"><AdminActionSpinner className="h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary"><UserRound className="h-4 w-4" />Личный кабинет</div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Профиль и уведомления</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Управляйте личным Telegram-подключением. Настройки применяются только к вашему аккаунту.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</div>}

      {user && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div>
            <div className="min-w-0"><h2 className="truncate text-lg font-bold text-slate-900">{user.full_name}</h2><p className="truncate text-sm text-slate-500">@{user.username} · {user.email}</p></div>
            <span className="ml-auto hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 sm:inline-flex">{roleLabels[user.role]}</span>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></div>
          <div><h2 className="font-bold text-slate-900">Смена пароля</h2><p className="mt-1 text-sm leading-6 text-slate-500">После изменения текущая сессия останется активной, остальные устройства выйдут из аккаунта.</p></div>
        </div>
        <form onSubmit={changePassword} className="space-y-5 bg-slate-50/60 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Текущий пароль<input type="password" required maxLength={256} autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Новый пароль<input type="password" required minLength={12} maxLength={256} autoComplete="new-password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /><span className="mt-1.5 block text-[11px] font-medium normal-case tracking-normal text-slate-400">Минимум 12 символов</span></label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Повторите пароль<input type="password" required minLength={12} maxLength={256} autoComplete="new-password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /></label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={action !== null} aria-busy={action === 'password'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-50">{action === 'password' ? <AdminActionSpinner /> : <LockKeyhole className="h-4 w-4" />}{action === 'password' ? 'Изменение…' : 'Изменить пароль'}</button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Send className="h-5 w-5" /></div>
            <div><h2 className="font-bold text-slate-900">Telegram</h2><p className="mt-1 text-sm text-slate-500">Мгновенные уведомления о событиях сайта.</p></div>
          </div>
          {telegram?.linked ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Подключён{telegram.telegram_username ? ` · @${telegram.telegram_username}` : ''}</span>
          ) : (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><MessageCircle className="h-4 w-4" />Не подключён</span>
          )}
        </div>

        <div className="space-y-5 bg-slate-50/60 p-5 sm:p-6">
          {!telegram?.configured ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h3 className="font-bold text-amber-950">Бот пока не настроен на сервере</h3><p className="mt-1 text-sm leading-6 text-amber-800">Для подключения нужны TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME, TELEGRAM_WEBHOOK_SECRET и регистрация webhook. После настройки кнопка подключения станет доступна автоматически.</p></div></div>
            </div>
          ) : !telegram.linked ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <h3 className="font-bold text-sky-950">Подключите личный Telegram</h3>
              <p className="mt-2 text-sm leading-6 text-sky-800">Ссылка одноразовая и действует 15 минут. В Telegram нажмите Start — страница проверит подключение автоматически.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => void createLink()} disabled={action !== null} aria-busy={action === 'link'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-50">{action === 'link' ? <AdminActionSpinner /> : <Send className="h-4 w-4" />}{connectUrl ? 'Обновить ссылку' : 'Получить ссылку'}</button>
                {connectUrl && <a href={connectUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-5 text-sm font-bold text-sky-700 transition hover:border-sky-400"><ExternalLink className="h-4 w-4" />Открыть Telegram</a>}
                {connectUrl && <button type="button" onClick={() => void refreshTelegram(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-sky-700 hover:bg-sky-100"><RefreshCw className="h-4 w-4" />Проверить</button>}
              </div>
              {connectExpiresAt && <p className="mt-3 text-xs text-sky-700">Ссылка действует до {new Date(connectExpiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}.</p>}
            </div>
          ) : (
            <>
              <SettingsToggle checked={telegram.notifications_enabled} busy={action === 'notifications_enabled'} disabled={action !== null} title="Все Telegram-уведомления" description="Главный выключатель. Привязка аккаунта сохранится, даже если уведомления отключены." onChange={() => void togglePreference('notifications_enabled')} />
              <div className="grid gap-3 md:grid-cols-2">
                <SettingsToggle checked={telegram.notify_new_leads && telegram.can_notify_new_leads} busy={action === 'notify_new_leads'} disabled={action !== null || !telegram.notifications_enabled || !telegram.can_notify_new_leads} title="Новые заявки" description={telegram.can_notify_new_leads ? 'Формы со страницы контактов и карточек объектов.' : 'Недоступно для вашей роли.'} onChange={() => void togglePreference('notify_new_leads')} />
                <SettingsToggle checked={telegram.notify_new_reviews && telegram.can_notify_new_reviews} busy={action === 'notify_new_reviews'} disabled={action !== null || !telegram.notifications_enabled || !telegram.can_notify_new_reviews} title="Новые отзывы" description={telegram.can_notify_new_reviews ? 'Публичные и подтверждённые отзывы, ожидающие модерации.' : 'Недоступно для вашей роли.'} onChange={() => void togglePreference('notify_new_reviews')} />
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => void disconnect()} disabled={action !== null} aria-busy={action === 'disconnect'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">{action === 'disconnect' ? <AdminActionSpinner /> : <Unlink className="h-4 w-4" />}Отключить Telegram</button>
                <button type="button" onClick={() => void sendTest()} disabled={action !== null} aria-busy={action === 'test'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-800 disabled:opacity-50">{action === 'test' ? <AdminActionSpinner /> : <BellRing className="h-4 w-4" />}{action === 'test' ? 'Отправка…' : 'Отправить тест'}</button>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500"><Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p>Уведомления не заменяют CRM: заявки и отзывы сохраняются в админке даже при временной недоступности Telegram.</p></div>
    </div>
  );
}
