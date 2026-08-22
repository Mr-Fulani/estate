'use client';

import type { ReactNode } from 'react';

import { useLocale } from '@/context/LocaleContext';
import { collectContactAttribution } from '@/lib/attribution';
import { trackContactAction } from '@/lib/api';
import type { ContactTrackData } from '@/types';


export function TrackedContactLink({
  href,
  channel,
  source,
  propertyId,
  className,
  children,
  title,
  target,
}: {
  href: string;
  channel: ContactTrackData['channel'];
  source: string;
  propertyId?: number;
  className?: string;
  children: ReactNode;
  title?: string;
  target?: string;
}) {
  const { locale } = useLocale();

  const recordIntent = () => {
    void trackContactAction({
      kind: 'click',
      channel,
      ...collectContactAttribution(locale, source, propertyId),
    });
  };

  return (
    <a
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className={className}
      title={title}
      onClick={recordIntent}
    >
      {children}
    </a>
  );
}
