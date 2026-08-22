import type { Locale } from './config';

export type LocalizedMessages = {
  locale: Locale;
  navigation: {
    home: string;
    properties: string;
    services: string;
    news: string;
    reviews: string;
    about: string;
    contact: string;
    request: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    currency: string;
    currencyRate: string;
    currencyUnavailable: string;
  };
  common: {
    loading: string;
    retry: string;
    back: string;
    readMore: string;
    noResults: string;
    previous: string;
    next: string;
    errorTitle: string;
    errorDescription: string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
};
