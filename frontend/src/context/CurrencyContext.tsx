'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchExchangeRates } from '@/lib/api';
import type { CurrencyCode, ExchangeRatesResponse } from '@/types';


export const currencyCodes: CurrencyCode[] = ['RUB', 'USD', 'EUR', 'TRY'];

const STORAGE_KEY = 'estate_currency';

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convert: (amount: number, fromCurrency?: string, toCurrency?: CurrencyCode) => number;
  effectiveDate: string | null;
  isReady: boolean;
  isStale: boolean;
  error: string | null;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);


export function normalizeCurrencyCode(value?: string | null): CurrencyCode {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'USD' || normalized === '$') return 'USD';
  if (normalized === 'EUR' || normalized === '€') return 'EUR';
  if (normalized === 'TRY' || normalized === 'TL' || normalized === '₺') return 'TRY';
  return 'RUB';
}


export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [requestedCurrency, setRequestedCurrency] = useState<CurrencyCode>('RUB');
  const [snapshot, setSnapshot] = useState<ExchangeRatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && currencyCodes.includes(saved as CurrencyCode)) {
      setRequestedCurrency(saved as CurrencyCode);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchExchangeRates()
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('rates_unavailable');
      });
    return () => { cancelled = true; };
  }, []);

  const isReady = snapshot !== null;
  const currency = requestedCurrency === 'RUB' || isReady ? requestedCurrency : 'RUB';

  const setCurrency = useCallback((nextCurrency: CurrencyCode) => {
    setRequestedCurrency(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  }, []);

  const convert = useCallback((amount: number, fromCurrency = 'RUB', toCurrency = currency) => {
    const source = normalizeCurrencyCode(fromCurrency);
    if (source === toCurrency) return amount;
    if (!snapshot) return amount;
    const sourceRate = snapshot.rates[source];
    const targetRate = snapshot.rates[toCurrency];
    if (!sourceRate || !targetRate) return amount;
    return amount * sourceRate / targetRate;
  }, [currency, snapshot]);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency,
    convert,
    effectiveDate: snapshot?.effective_date || null,
    isReady,
    isStale: snapshot?.stale || false,
    error,
  }), [currency, setCurrency, convert, snapshot, isReady, error]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}


export function useCurrency(): CurrencyContextValue {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency must be used within CurrencyProvider');
  return value;
}
