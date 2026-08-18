import { fetchContactRequests } from '@/lib/api';
import { LeadsTable } from './LeadsTable';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const leads = await fetchContactRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Заявки и обращения клиентов (CRM)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Все входящие запросы с контактных форм, карточек недвижимости и консультаций.
        </p>
      </div>

      <LeadsTable initialLeads={leads} />
    </div>
  );
}
