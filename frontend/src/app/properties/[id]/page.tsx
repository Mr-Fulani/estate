import { fetchProperty } from '@/lib/api';
import { notFound } from 'next/navigation';
import { PropertyDetails } from '@/components/properties/PropertyDetails';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { ContactForm } from './ContactForm';

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await fetchProperty(params.id);

  if (!property) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 bg-slate-50 min-h-screen">
      <Link href="/properties" className="inline-flex items-center text-primary hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в каталог
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PropertyDetails property={property} />
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Заинтересовал объект?</h3>
            <p className="text-slate-600 mb-6">Оставьте свои контакты, и наш агент свяжется с вами для обсуждения деталей.</p>
            <ContactForm propertyId={property.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
