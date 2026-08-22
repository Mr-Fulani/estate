import { fetchContactRequests } from '@/lib/api';
import { LeadsTable } from './LeadsTable';
import { Users } from 'lucide-react';
import { getAdminCookieHeader } from '@/lib/adminServer';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const adminCookie = await getAdminCookieHeader();
  const leads = await fetchContactRequests(undefined, adminCookie);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Лиды, обращения и сделки
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Единая воронка: формы, звонки, переходы в мессенджеры, просмотры, переговоры и итог продажи или аренды.
        </p>
      </div>

      <LeadsTable initialLeads={leads} />
    </div>
  );
}
