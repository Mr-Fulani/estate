'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useSiteSettings } from '@/context/SiteSettingsContext';
import { currencyCodes, convertCurrency } from '@/lib/currency';
export { currencyCodes, normalizeCurrencyCode } from '@/lib/currency';
import { fetchExchangeRates } from '@/lib/api';
import type { CurrencyCode, ExchangeRatesResponse } from '@/types';




const STORAGE_KEY = 'estate_currency';

type CurrencyContextValue = {
  currency: CurrencyCode;
  currencyCodes: CurrencyCode[];
  catalogCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convert: (amount: number, fromCurrency?: string, toCurrency?: CurrencyCode) => number;
  effectiveDate: string | null;
  isReady: boolean;
  isStale: boolean;
  error: string | null;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);


export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();
  const enabledCurrencies = settings.runtime?.currencies || currencyCodes;
  const catalogCurrency = settings.runtime?.catalog_currency || 'RUB';
  const [requestedCurrency, setRequestedCurrency] = useState<CurrencyCode>(settings.runtime?.default_currency || enabledCurrencies[0]);
  const [snapshot, setSnapshot] = useState<ExchangeRatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && enabledCurrencies.includes(saved as CurrencyCode)) {
      setRequestedCurrency(saved as CurrencyCode);
    }
  }, [enabledCurrencies]);

  useEffect(() => {
    let cancelled = false;
    fetchExchangeRates()
      .then((data) => {
        if (cancelled) return;
        if (!currencyCodes.every(code => Number.isFinite(data.rates[code]) && data.rates[code] > 0)) throw new Error('Invalid exchange rates');
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
  const currency = enabledCurrencies.includes(requestedCurrency) ? requestedCurrency : enabledCurrencies[0];

  const setCurrency = useCallback((nextCurrency: CurrencyCode) => {
    if (!enabledCurrencies.includes(nextCurrency)) throw new Error('Currency is not enabled');
    setRequestedCurrency(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  }, [enabledCurrencies]);

  const convert = useCallback((amount: number, fromCurrency: string = catalogCurrency, toCurrency = currency) => {
    return convertCurrency(amount, fromCurrency, toCurrency, snapshot?.rates);
  }, [currency, catalogCurrency, snapshot]);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    currencyCodes: enabledCurrencies,
    catalogCurrency,
    setCurrency,
    convert,
    effectiveDate: snapshot?.effective_date || null,
    isReady,
    isStale: snapshot?.stale || false,
    error,
  }), [currency, enabledCurrencies, catalogCurrency, setCurrency, convert, snapshot, isReady, error]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}


export function useCurrency(): CurrencyContextValue {
  const value = useContext(CurrencyContext);
  if (!value) throw new Error('useCurrency must be used within CurrencyProvider');
  return value;
}
