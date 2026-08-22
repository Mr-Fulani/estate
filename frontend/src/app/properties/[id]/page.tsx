import { PropertyDetailContent } from '@/components/pages/PropertyDetailContent';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyDetailContent id={id} locale="ru" />;
}
