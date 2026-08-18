'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContactRequest } from '@/types';
import { updateContactStatus, deleteContactRequest } from '@/lib/api';
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Trash2, 
  ExternalLink,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export function LeadsTable({
  initialLeads,
}: {
  initialLeads: ContactRequest[];
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<ContactRequest[]>(initialLeads);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSearch = search === '' ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (lead.phone && lead.phone.includes(search)) ||
      lead.message.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const updated = await updateContactStatus(id, newStatus);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: updated.status } : l)));
    } catch (e) {
      alert('Ошибка при изменении статуса заявки');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту заявку?')) return;
    setDeletingId(id);
    try {
      await deleteContactRequest(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert('Ошибка при удалении заявки');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, email..."
            className="w-full h-10 pl-9 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'Все заявки' },
            { id: 'new', label: '🟡 Новые' },
            { id: 'contacted', label: '🔵 В работе' },
            { id: 'closed', label: '🟢 Закрытые' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Клиент</th>
                <th className="py-3.5 px-4">Контакты</th>
                <th className="py-3.5 px-4">Сообщение / Запрос</th>
                <th className="py-3.5 px-4">Объект</th>
                <th className="py-3.5 px-4">Статус</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Заявок в этой категории не найдено
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Date */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {lead.created_at ? new Date(lead.created_at).toLocaleString('ru-RU') : 'Недавно'}
                      </div>
                    </td>

                    {/* Contact details */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs space-y-1">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 text-slate-700 hover:text-primary font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5 text-secondary" />
                          {lead.phone}
                        </a>
                      )}
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-primary"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {lead.email}
                      </a>
                    </td>

                    {/* Message */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed line-clamp-3">
                        {lead.message}
                      </p>
                    </td>

                    {/* Linked Property */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs">
                      {lead.property_id ? (
                        <Link
                          href={`/properties/${lead.property_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg font-semibold transition-colors"
                        >
                          <span>Объект #{lead.property_id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400">Общая заявка</span>
                      )}
                    </td>

                    {/* Status Select */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {lead.id && (
                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => handleStatusChange(lead.id!, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option value="new">🟡 Новая</option>
                          <option value="contacted">🔵 В работе</option>
                          <option value="closed">🟢 Закрыта</option>
                        </select>
                      )}
                    </td>

                    {/* Delete action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {lead.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(lead.id!)}
                          disabled={deletingId === lead.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить заявку"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
