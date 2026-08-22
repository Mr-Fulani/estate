import Image from 'next/image';
import { HeroSearch } from './HeroSearch';
import type { Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';

export function Hero({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale].home;
  return (
    <section className="sticky top-0 z-0 flex min-h-[100svh] items-center overflow-hidden bg-primary-900 py-16 md:py-24">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/85 to-primary-900/60 z-10" />
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
          alt=""
          fill
          preload
          loading="eager"
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 text-secondary text-sm font-semibold tracking-wide uppercase mb-4 backdrop-blur-sm border border-white/10">
            {copy.eyebrow}
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
            {copy.title}
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed max-w-2xl">
            {copy.description}
          </p>
          
          {/* Interactive Search Component */}
          <HeroSearch />

        </div>
      </div>
    </section>
  );
}
