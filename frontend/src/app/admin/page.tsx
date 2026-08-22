import Link from 'next/link';
import { 
  Building2, 
  Users, 
  PlusCircle, 
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle2,
  CircleDollarSign,
  TrendingUp,
  Star,
} from 'lucide-react';
import { fetchAdminStats, fetchContactRequests, fetchProperties } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { LeadsStatusSwitcher } from './LeadsStatusSwitcher';
import { getAdminCookieHeader } from '@/lib/adminServer';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const adminCookie = await getAdminCookieHeader();
  const [stats, leads, recentProps] = await Promise.all([
    fetchAdminStats(adminCookie),
    fetchContactRequests(undefined, adminCookie),
    fetchProperties({ per_page: 5, sort_by: 'created_at', order: 'desc' }),
  ]);

  const statCards = [
    {
      title: 'Новые заявки',
      value: stats.new_contacts,
      sub: `${stats.form_leads} форм, всего ${stats.total_contacts} касаний`,
      icon: Users,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'В работе',
      value: stats.active_leads,
      sub: 'От контакта до переговоров',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Мессенджеры',
      value: stats.messenger_messages,
      sub: `${stats.messenger_clicks} переходов · подтверждённые сообщения`,
      icon: MessageCircle,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      title: 'Успешные сделки',
      value: stats.won_deals,
      sub: `${stats.sold_properties} продано · ${stats.rented_properties} сдано`,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Сумма сделок',
      value: formatPrice(stats.total_deal_value, 'RUB'),
      sub: 'По закрытым обращениям',
      icon: CircleDollarSign,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      title: 'Объекты',
      value: stats.total_properties,
      sub: `${stats.active_properties} опубликовано`,
      icon: Building2,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      title: 'Отзывы',
      value: stats.pending_reviews,
      sub: 'Ожидают модерации',
      icon: Star,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Панель управления агентством
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Управление объектами недвижимости, ценами, описаниями и заявками клиентов.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties/new"
            className="bg-primary hover:bg-primary-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Добавить объект
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {stat.title}
                </p>
                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
              </div>
              <div className={`p-3 rounded-xl border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Leads & Recent Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Leads (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Последние заявки клиентов</h2>
              <p className="text-xs text-slate-500">Поступают с форм сайта и страниц объектов</p>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs font-semibold text-primary hover:text-secondary flex items-center gap-1 transition-colors"
            >
              Все заявки
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              Заявок пока нет. Новые сообщения с сайта появятся здесь.
            </div>
          ) : (
            <div className="space-y-4">
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{lead.name || `${lead.channel || 'Канал'}: новый интерес`}</span>
                      {lead.status === 'new' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Новая
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{lead.email}</span>}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 italic mt-1">
                      «{lead.message || 'Зафиксирован переход в канал связи'}»
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    {lead.id && (
                      <LeadsStatusSwitcher leadId={lead.id} currentStatus={lead.status || 'new'} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Properties (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Недвижимость</h2>
              <p className="text-xs text-slate-500">Последние добавленные объекты</p>
            </div>
            <Link
              href="/admin/properties"
              className="text-xs font-semibold text-primary hover:text-secondary flex items-center gap-1 transition-colors"
            >
              Все ({stats.total_properties})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProps.items.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs text-slate-400 font-semibold">
                    {prop.images && prop.images.length > 0 ? (
                      <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      'No photo'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{prop.title}</h4>
                    <p className="text-xs text-primary font-semibold">
                      {formatPrice(prop.price, prop.currency)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/properties/${prop.id}/edit`}
                  className="text-xs text-slate-500 hover:text-primary font-semibold px-2 py-1 bg-slate-50 rounded-lg shrink-0 ml-2"
                >
                  Ред.
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/admin/properties/new"
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
            >
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              Добавить новый объект
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
