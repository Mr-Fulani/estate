import type { CurrencyCode } from '@/types';

export const currencyCodes: CurrencyCode[] = ['RUB', 'USD', 'EUR', 'TRY'];

export function normalizeCurrencyCode(value?: string | null): CurrencyCode {
  const code = value?.trim().toUpperCase();
  const aliases: Record<string, CurrencyCode> = { '$': 'USD', '€': 'EUR', TL: 'TRY', '₺': 'TRY', '₽': 'RUB' };
  if (code && aliases[code]) return aliases[code];
  if (currencyCodes.includes(code as CurrencyCode)) return code as CurrencyCode;
  throw new Error(`Unsupported currency: ${value || '(empty)'}`);
}

export function convertCurrency(amount: number, from: string, to: string, rates?: Partial<Record<CurrencyCode, number>>): number {
  const source = normalizeCurrencyCode(from);
  const target = normalizeCurrencyCode(to);
  if (source === target) return amount;
  const sourceRate = rates?.[source];
  const targetRate = rates?.[target];
  if (!sourceRate || !targetRate || sourceRate <= 0 || targetRate <= 0) throw new Error('Exchange rates unavailable');
  return amount * sourceRate / targetRate;
}
