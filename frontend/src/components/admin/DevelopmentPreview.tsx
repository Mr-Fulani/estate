'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Property } from '@/types';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { DevelopmentPage } from '@/components/properties/DevelopmentPage';
import styles from './DevelopmentPreview.module.css';

export function DevelopmentPreview({ property, onClose }: { property: Property; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [locale, setLocale] = useState<Locale>('ru');
  useEffect(() => {
    const current = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      current?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(<dialog ref={dialog} aria-label="Предпросмотр жилого комплекса" className={styles.dialog} onCancel={onClose}>
    <div className={styles.toolbar}>
      <div><strong>Предпросмотр ЖК</strong><span>Изменения не сохранены · заявки отключены</span></div>
      <label>Язык<select value={locale} onChange={event => setLocale(event.target.value as Locale)}>{locales.map(value => <option key={value} value={value}>{localeLabels[value]}</option>)}</select></label>
      <button type="button" onClick={onClose}><X size={18} />К редактированию</button>
    </div>
    <div className={styles.viewport} onClickCapture={event => {
      const anchor = (event.target as Element).closest('a');
      if (anchor && !anchor.getAttribute('href')?.startsWith('#')) event.preventDefault();
    }}><DevelopmentPage key={locale} property={property} locale={locale} preview /></div>
  </dialog>, document.body);
}
