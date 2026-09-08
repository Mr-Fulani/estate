import { getLocaleConfig } from '@/lib/runtime-locales';
import { permanentRedirect } from 'next/navigation';

export default function HomePage() {
  permanentRedirect(`/${getLocaleConfig().defaultLocale}`);
}
