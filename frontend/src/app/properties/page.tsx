import { PropertiesPageContent, type PropertySearchParams } from '@/components/pages/PropertiesPageContent';

export const dynamic = 'force-dynamic';

export default function PropertiesPage({ searchParams }: { searchParams: Promise<PropertySearchParams> }) {
  return <PropertiesPageContent searchParams={searchParams} locale="ru" />;
}
