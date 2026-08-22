'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  Mail,
  MousePointerClick,
  Phone,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';

import { addContactNote, deleteContactRequest, updateContactRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ContactRequest } from '@/types';
import { ReviewInviteButton } from './ReviewInviteButton';


const statuses = [
  { id: 'new', label: 'Новая', color: 'bg-amber-100 text-amber-800' },
  { id: 'contacted', label: 'Связались', color: 'bg-blue-100 text-blue-800' },
  { id: 'qualified', label: 'Квалифицирована', color: 'bg-cyan-100 text-cyan-800' },
  { id: 'viewing', label: 'Просмотр', color: 'bg-violet-100 text-violet-800' },
  { id: 'negotiation', label: 'Переговоры', color: 'bg-fuchsia-100 text-fuchsia-800' },
  { id: 'won', label: 'Сделка', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'lost', label: 'Потеряна', color: 'bg-slate-200 text-slate-700' },
] as const;

const channelLabels: Record<string, string> = {
  form: 'Форма сайта', phone: 'Телефон', email: 'Email', whatsapp: 'WhatsApp', telegram: 'Telegram',
  max: 'MAX', instagram: 'Instagram', facebook: 'Facebook', vk: 'VK',
};

const activityLabels: Record<string, string> = {
  lead_created: 'Создана заявка', contact_click: 'Переход в канал связи',
  contact_click_repeated: 'Повторный переход', status_changed: 'Изменён этап воронки',
  messenger_message: 'Получено сообщение в мессенджере', deal_updated: 'Обновлены данные сделки',
  note_added: 'Добавлена заметка', lead_imported: 'Импортировано из старой CRM',
};

function formatMoney(value: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}


export function LeadsTable({ initialLeads }: { initialLeads: ContactRequest[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<'sold' | 'rented'>('sold');
  const [dealValue, setDealValue] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  const counts = useMemo(() => Object.fromEntries(statuses.map((status) => [status.id, leads.filter((lead) => lead.status === status.id).length])), [leads]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesChannel = channelFilter === 'all' || lead.channel === channelFilter;
      const haystack = [lead.name, lead.email, lead.phone, lead.message, lead.property?.title, lead.utm_campaign, lead.source].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && matchesChannel && (!query || haystack.includes(query));
    });
  }, [channelFilter, leads, search, statusFilter]);

  const replaceLead = (updated: ContactRequest) => setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead));

  const changeStatus = async (lead: ContactRequest, nextStatus: string) => {
    if (!lead.id) return;
    if (nextStatus === 'won') {
      setClosingId(lead.id);
      setOutcome(lead.property?.market_status === 'rented' ? 'rented' : 'sold');
      setDealValue(lead.deal_value ? String(lead.deal_value) : '');
      return;
    }
    setBusyId(lead.id);
    try {
      replaceLead(await updateContactRequest(lead.id, { status: nextStatus }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось изменить этап');
    } finally {
      setBusyId(null);
    }
  };

  const closeDeal = async (lead: ContactRequest) => {
    if (!lead.id) return;
    setBusyId(lead.id);
    try {
      const updated = await updateContactRequest(lead.id, {
        status: 'won',
        outcome,
        deal_value: dealValue ? Number(dealValue) : undefined,
        deal_currency: lead.deal_currency || 'RUB',
        note: outcome === 'sold' ? 'Объект отмечен как проданный' : 'Объект отмечен как сданный',
      });
      replaceLead(updated);
      setClosingId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось закрыть сделку');
    } finally {
      setBusyId(null);
    }
  };

  const saveNote = async (lead: ContactRequest) => {
    if (!lead.id || !noteDrafts[lead.id]?.trim()) return;
    setBusyId(lead.id);
    try {
      replaceLead(await addContactNote(lead.id, noteDrafts[lead.id].trim()));
      setNoteDrafts((current) => ({ ...current, [lead.id!]: '' }));
    } catch {
      alert('Не удалось добавить заметку');
    } finally {
      setBusyId(null);
    }
  };

  const removeLead = async (lead: ContactRequest) => {
    if (!lead.id || !confirm('Удалить обращение и всю его историю?')) return;
    setBusyId(lead.id);
    try {
      await deleteContactRequest(lead.id);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statuses.map((status) => (
          <button key={status.id} type="button" onClick={() => setStatusFilter(statusFilter === status.id ? 'all' : status.id)} className={cn('rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', statusFilter === status.id ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200')}>
            <span className={cn('inline-flex rounded-full px-2 py-1 text-[11px] font-bold', status.color)}>{status.label}</span>
            <p className="mt-3 text-2xl font-black text-slate-900">{counts[status.id] || 0}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя, телефон, объект, кампания…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
        </div>
        <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-primary">
          <option value="all">Все каналы</option>
          {Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {(statusFilter !== 'all' || channelFilter !== 'all' || search) && <button type="button" onClick={() => { setStatusFilter('all'); setChannelFilter('all'); setSearch(''); }} className="h-11 rounded-xl px-4 text-sm font-semibold text-primary hover:bg-primary/5">Сбросить</button>}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">Обращений по выбранным условиям нет.</div>}
        {filtered.map((lead) => {
          const statusInfo = statuses.find((item) => item.id === lead.status) || statuses[0];
          const isAnonymousClick = lead.kind === 'click';
          return (
            <details key={lead.id} className={cn('group overflow-hidden rounded-2xl border bg-white shadow-sm', !lead.is_read && 'border-l-4 border-l-secondary', lead.status === 'won' ? 'border-emerald-200' : 'border-slate-200')}>
              <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:content-none lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', isAnonymousClick ? 'bg-violet-50 text-violet-700' : 'bg-primary/5 text-primary')}>
                    {isAnonymousClick ? <MousePointerClick className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{lead.name || `${channelLabels[lead.channel || ''] || 'Контакт'}: интерес к объекту`}</h3>
                      <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', statusInfo.color)}>{statusInfo.label}</span>
                      {isAnonymousClick && <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">клик, не подтверждённое сообщение</span>}
                      {lead.kind === 'webhook' && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">сообщение подтверждено</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{lead.property?.title || 'Общее обращение'} · {channelLabels[lead.channel || 'form'] || lead.channel}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Calendar className="h-3 w-3" />{lead.created_at ? new Date(lead.created_at).toLocaleString('ru-RU') : 'Недавно'} · {lead.source || 'сайт'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3" onClick={(event) => event.stopPropagation()}>
                  {lead.deal_value != null && <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><CircleDollarSign className="h-4 w-4" />{formatMoney(lead.deal_value, lead.deal_currency)}</span>}
                  <select value={lead.status || 'new'} disabled={busyId === lead.id} onChange={(event) => void changeStatus(lead, event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-primary">
                    {statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
                  </select>
                  <ChevronDown className="h-5 w-5 text-slate-400 transition group-open:rotate-180" />
                </div>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                {lead.status === 'won' && lead.id && <div className="mb-5"><ReviewInviteButton contactId={lead.id} initialLocale={lead.locale} /></div>}
                {closingId === lead.id && (
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-700" /><h4 className="font-bold text-emerald-950">Зафиксировать результат сделки</h4></div>
                    {!lead.property_id && <p className="mb-3 text-sm font-semibold text-red-700">Сначала привяжите обращение к объекту.</p>}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <select value={outcome} onChange={(event) => setOutcome(event.target.value as 'sold' | 'rented')} className="h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold"><option value="sold">Объект продан</option><option value="rented">Объект сдан</option></select>
                      <input type="number" min="0" value={dealValue} onChange={(event) => setDealValue(event.target.value)} placeholder="Сумма сделки" className="h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm" />
                      <button type="button" disabled={!lead.property_id || busyId === lead.id} onClick={() => void closeDeal(lead)} className="h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">Подтвердить сделку</button>
                    </div>
                    <p className="mt-3 text-xs text-emerald-800">После подтверждения коммерческий статус связанного объекта автоматически изменится на «Продан» или «Сдан».</p>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Клиент и источник</h4>
                    {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-primary"><Phone className="h-4 w-4 text-secondary" />{lead.phone}</a>}
                    {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-primary"><Mail className="h-4 w-4" />{lead.email}</a>}
                    {lead.property && <Link href={`/ru/properties/${lead.property.slug}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ExternalLink className="h-4 w-4" />Открыть объект</Link>}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-600">
                      <dt className="font-semibold">UTM source</dt><dd>{lead.utm_source || '—'}</dd>
                      <dt className="font-semibold">Кампания</dt><dd>{lead.utm_campaign || '—'}</dd>
                      <dt className="font-semibold">Язык</dt><dd>{lead.locale?.toUpperCase() || '—'}</dd>
                      <dt className="font-semibold">Аккаунт</dt><dd>{lead.external_username || '—'}</dd>
                    </dl>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Запрос и заметка</h4>
                    <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700">{lead.message || 'Сообщение не передано — зафиксирован только переход в канал связи.'}</p>
                    <textarea rows={3} value={lead.id ? noteDrafts[lead.id] || '' : ''} onChange={(event) => lead.id && setNoteDrafts((current) => ({ ...current, [lead.id!]: event.target.value }))} placeholder="Итог звонка, договорённость, следующий шаг…" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-primary" />
                    <button type="button" disabled={!lead.id || busyId === lead.id || !noteDrafts[lead.id!]?.trim()} onClick={() => void saveNote(lead)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Добавить в историю</button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">История</h4>
                    <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                      {(lead.activities || []).map((activity) => (
                        <div key={activity.id} className="border-l-2 border-slate-200 pl-3">
                          <p className="text-xs font-bold text-slate-700">{activityLabels[activity.event_type] || activity.event_type}</p>
                          {activity.from_status !== activity.to_status && activity.to_status && <p className="text-xs text-slate-500">{activity.from_status || '—'} → {activity.to_status}</p>}
                          {activity.note && <p className="mt-1 text-xs leading-relaxed text-slate-600">{activity.note}</p>}
                          <time className="text-[10px] text-slate-400">{new Date(activity.created_at).toLocaleString('ru-RU')}</time>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => void removeLead(lead)} disabled={busyId === lead.id} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" />Удалить обращение</button>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
