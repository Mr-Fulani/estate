'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Home,
  Key,
  PhoneCall,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import { localizeHref } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { useLocale } from '@/context/LocaleContext';

const serviceIcons = [Home, Key, TrendingUp, ShieldCheck];
const trustIcons = [Award, ShieldCheck, Clock];

export default function ServicesPage() {
  const { locale } = useLocale();
  const copy = siteCopy[locale].services;

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-primary-900 py-16 text-white md:py-20">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-secondary">{copy.eyebrow}</span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{copy.title}</h1>
            <p className="mb-8 text-lg leading-relaxed text-primary-100 md:text-xl">{copy.description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={localizeHref(locale, '/contact')} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-secondary px-6 font-semibold text-white transition-colors hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-white">{copy.consultation}</Link>
              <Link href={localizeHref(locale, '/properties')} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-6 font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white">{copy.properties}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-slate-50 py-8">
        <div className="container mx-auto grid gap-4 px-4 md:grid-cols-3 md:px-6">
          {copy.trust.map((label, index) => {
            const Icon = trustIcons[index];
            return (
              <div key={label} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <p className="font-bold text-slate-900">{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">{copy.sectionTitle}</h2>
            <p className="text-lg text-slate-600">{copy.sectionDescription}</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {copy.items.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <article key={service.title} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl md:p-8">
                  <div className="mb-6 flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md"><Icon className="h-7 w-7" aria-hidden="true" /></span>
                    <div>
                      <h3 className="mb-2 text-2xl font-bold text-slate-900">{service.title}</h3>
                      <p className="leading-relaxed text-slate-600">{service.description}</p>
                    </div>
                  </div>
                  <ul className="mb-7 grid gap-3 sm:grid-cols-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /><span>{feature}</span></li>
                    ))}
                  </ul>
                  <Link href={localizeHref(locale, '/contact')} className="mt-auto inline-flex items-center gap-2 font-semibold text-primary hover:text-secondary">{copy.consultation}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 md:text-4xl">{copy.processTitle}</h2>
          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {copy.process.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <span className="mb-4 block text-4xl font-black text-primary/20">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-primary py-16 text-white md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center md:px-6">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"><PhoneCall className="h-8 w-8 text-secondary" aria-hidden="true" /></span>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{copy.ctaTitle}</h2>
          <p className="mb-8 text-lg leading-relaxed text-primary-100">{copy.ctaDescription}</p>
          <Link href={localizeHref(locale, '/contact')} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-secondary px-7 font-semibold text-white transition-colors hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-white">{copy.ctaButton}</Link>
        </div>
      </section>
    </div>
  );
}
