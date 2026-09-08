'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution, configureAttribution } from '@/lib/attribution';
import type { SiteProfile } from '@/lib/site-profile';

export function AttributionTracker({ profile }: { profile?: SiteProfile }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    configureAttribution({ enabled: profile?.attribution_enabled, retentionDays: profile?.attribution_retention_days });
    captureAttribution();
  }, [pathname, query, profile?.attribution_enabled, profile?.attribution_retention_days]);
  return null;
}
