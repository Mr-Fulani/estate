'use client';

import { normalizeCurrencyCode, useCurrency } from '@/context/CurrencyContext';
import type { Locale } from '@/i18n/config';
import { formatPrice } from '@/lib/utils';


export function CurrencyPrice({
  amount,
  sourceCurrency = 'RUB',
  locale,
}: {
  amount: number;
  sourceCurrency?: string;
  locale: Locale;
}) {
  const { currency, convert, isReady } = useCurrency();
  const displayCurrency = isReady ? currency : normalizeCurrencyCode(sourceCurrency);
  return <bdi dir="ltr">{formatPrice(convert(amount, sourceCurrency, displayCurrency), displayCurrency, locale)}</bdi>;
}
