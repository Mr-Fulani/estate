import { fetchProperty, fetchCategories } from '@/lib/api';
import { PropertyForm } from '../../PropertyForm';
import { notFound } from 'next/navigation';
import { Edit3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const [property, categories] = await Promise.all([
    fetchProperty(resolvedParams.id),
    fetchCategories(),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-primary" />
          Редактирование объекта #{property.id}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {property.title}
        </p>
      </div>

      <PropertyForm initialData={property} categories={categories} />
    </div>
  );
}
