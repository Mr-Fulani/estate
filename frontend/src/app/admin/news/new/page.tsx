import { Newspaper } from 'lucide-react';
import { NewsForm } from '../NewsForm';

export default function NewNewsPage() {
  return <div className="space-y-6"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Newspaper className="h-6 w-6 text-primary" />Новая публикация</h1><p className="mt-1 text-sm text-slate-500">Сначала заполните русскую версию, затем при необходимости добавьте переводы.</p></div><NewsForm /></div>;
}
