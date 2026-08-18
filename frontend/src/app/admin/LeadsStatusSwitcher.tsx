'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateContactStatus } from '@/lib/api';
import { Check, Clock, CheckCircle } from 'lucide-react';

export function LeadsStatusSwitcher({
  leadId,
  currentStatus,
}: {
  leadId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status || loading) return;
    setLoading(true);
    try {
      await updateContactStatus(leadId, newStatus);
      setStatus(newStatus);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Ошибка при обновлении статуса заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => handleStatusChange(e.target.value)}
      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50"
    >
      <option value="new">🟡 Новая</option>
      <option value="contacted">🔵 В работе / Связались</option>
      <option value="closed">🟢 Закрыта</option>
    </select>
  );
}
