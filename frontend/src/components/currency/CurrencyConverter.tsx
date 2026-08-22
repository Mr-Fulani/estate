'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, BadgeCheck, RefreshCw, Sparkles } from 'lucide-react';

import { currencyCodes, useCurrency } from '@/context/CurrencyContext';
import { localeTags, type Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import type { CurrencyCode } from '@/types';


const currencyLabels: Record<CurrencyCode, string> = {
  RUB: '₽  RUB',
  USD: '$  USD',
  EUR: '€  EUR',
  TRY: '₺  TRY',
};

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}


function formatMoney(value: number, currency: CurrencyCode, locale: Locale): string {
  return new Intl.NumberFormat(localeTags[locale], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}


export function CurrencyConverter({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale].home.converter;
  const { convert, effectiveDate, isReady, isStale, error } = useCurrency();
  const [amount, setAmount] = useState('1000000');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('RUB');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('USD');

  const numericAmount = parseAmount(amount);
  const convertedAmount = isReady ? convert(numericAmount, fromCurrency, toCurrency) : null;
  const unitRate = isReady ? convert(1, fromCurrency, toCurrency) : null;

  const formattedDate = useMemo(() => {
    if (!effectiveDate) return null;
    return new Intl.DateTimeFormat(localeTags[locale], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${effectiveDate}T12:00:00Z`));
  }, [effectiveDate, locale]);

  const statusText = error
    ? copy.unavailable
    : !isReady
      ? copy.loading
      : isStale
        ? copy.cached
        : copy.live;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    if (convertedAmount !== null) {
      setAmount(String(Number(convertedAmount.toFixed(2))));
    }
  };

  return (
    <section className="bg-white py-12 sm:py-16 md:py-24" aria-labelledby="currency-converter-title">
      <div className="container mx-auto min-w-0 px-3 sm:px-4 md:px-6">
        <div className="relative isolate min-w-0 max-w-full overflow-hidden rounded-[1.5rem] bg-primary-900 px-4 py-7 shadow-[0_28px_80px_-32px_rgba(15,35,65,0.65)] sm:rounded-[2rem] sm:px-8 sm:py-8 md:rounded-[2.5rem] md:px-12 md:py-12 lg:px-16">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-secondary/20 bg-secondary/5 blur-[1px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-48 left-1/4 h-96 w-96 rounded-full bg-primary-700/50 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent sm:inset-x-12" aria-hidden="true" />

          <div className="relative grid min-w-0 items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
            <div className="min-w-0 max-w-xl">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3.5 py-2 text-start text-[0.6875rem] font-bold uppercase leading-4 tracking-[0.14em] text-secondary-300 sm:text-xs sm:tracking-[0.16em]">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {copy.eyebrow}
              </div>
              <h2 id="currency-converter-title" className="break-words text-[1.75rem] font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-lg break-words text-sm leading-6 text-primary-200 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
                {copy.description}
              </p>

              <div className="mt-6 flex flex-col gap-3 text-sm font-semibold text-primary-100 sm:mt-8 sm:flex-row sm:flex-wrap">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-2 sm:rounded-full">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                  {copy.official}
                </span>
                <span className="inline-flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-2 sm:rounded-full">
                  <RefreshCw className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                  {copy.automatic}
                </span>
              </div>
            </div>

            <div className="min-w-0 max-w-full rounded-[1.25rem] border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur sm:rounded-[1.75rem] sm:p-6 md:p-8">
              <div className="mb-5 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700" aria-live="polite">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${error ? 'bg-red-500' : isReady ? 'bg-emerald-500' : 'animate-pulse bg-secondary'}`} aria-hidden="true" />
                  {statusText}
                </div>
                {formattedDate && (
                  <div className="max-w-full break-words rounded-2xl bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 sm:rounded-full">
                    {copy.updated}: {formattedDate}
                  </div>
                )}
              </div>

              <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] sm:gap-4">
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
                  <label htmlFor="converter-amount" className="mb-3 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {copy.amount}
                  </label>
                  <div className="flex min-w-0 flex-col items-stretch gap-3">
                    <input
                      id="converter-amount"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value.replace(/[^\d.,\s]/g, ''))}
                      inputMode="decimal"
                      autoComplete="off"
                      dir="ltr"
                      aria-label={copy.amount}
                      className="min-w-0 max-w-full bg-transparent text-xl font-bold tracking-tight text-slate-900 outline-none sm:text-2xl"
                    />
                    <select
                      value={fromCurrency}
                      onChange={(event) => setFromCurrency(event.target.value as CurrencyCode)}
                      aria-label={`${copy.amount}: ${copy.rate}`}
                      dir="ltr"
                      className="h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary"
                    >
                      {currencyCodes.map((currency) => <option key={currency} value={currency}>{currencyLabels[currency]}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={swapCurrencies}
                    disabled={!isReady}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-secondary text-primary-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-secondary-400 focus:outline-none focus:ring-4 focus:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={copy.swap}
                    title={copy.swap}
                  >
                    <ArrowLeftRight className="h-5 w-5 rotate-90 sm:rotate-0" aria-hidden="true" />
                  </button>
                </div>

                <div className="min-w-0 rounded-2xl border border-primary/15 bg-primary-50 p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-500">
                    {copy.result}
                  </div>
                  <div className="flex min-w-0 flex-col items-stretch gap-3">
                    <output dir="ltr" className="block min-w-0 max-w-full break-all text-xl font-bold tracking-tight text-primary-900 sm:text-2xl" aria-live="polite">
                      {convertedAmount === null ? '—' : formatMoney(convertedAmount, toCurrency, locale)}
                    </output>
                    <select
                      value={toCurrency}
                      onChange={(event) => setToCurrency(event.target.value as CurrencyCode)}
                      aria-label={`${copy.result}: ${copy.rate}`}
                      dir="ltr"
                      className="h-11 min-w-0 w-full rounded-xl border border-primary-100 bg-white px-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary"
                    >
                      {currencyCodes.map((currency) => <option key={currency} value={currency}>{currencyLabels[currency]}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                <div className="flex flex-col justify-between gap-2 text-sm sm:flex-row sm:items-center">
                  <span className="font-medium text-slate-500">{copy.rate}</span>
                  <strong dir="ltr" className="max-w-full break-all text-start text-slate-900 sm:text-end">
                    {unitRate === null
                      ? (error ? copy.unavailable : copy.loading)
                      : `1 ${fromCurrency} = ${new Intl.NumberFormat(localeTags[locale], { maximumFractionDigits: 6 }).format(unitRate)} ${toCurrency}`}
                  </strong>
                </div>
              </div>

              <p className="mt-4 break-words text-xs leading-5 text-slate-500">
                {copy.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
