'use client';

import { useCurrency } from '@/context/CurrencyContext';
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
  const { currency, convert } = useCurrency();
  return <bdi dir="ltr">{formatPrice(convert(amount, sourceCurrency, currency), currency, locale)}</bdi>;
}
