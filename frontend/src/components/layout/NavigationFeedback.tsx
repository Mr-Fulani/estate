'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';


const NAVIGATION_START_EVENT = 'estate:navigation-start';


export function startNavigationFeedback() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
  }
}


export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'complete'>('idle');
  const currentUrl = `${pathname}?${searchParams.toString()}`;
  const previousUrl = useRef(currentUrl);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setPhase('loading');
    safetyTimer.current = setTimeout(() => setPhase('idle'), 12000);
  }, [clearTimers]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!target || target.target === '_blank' || target.hasAttribute('download')) return;

      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      const sameDocument = destination.pathname === current.pathname && destination.search === current.search;
      if (sameDocument) return;
      start();
    };

    window.addEventListener(NAVIGATION_START_EVENT, start);
    window.addEventListener('popstate', start);
    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, start);
      window.removeEventListener('popstate', start);
      document.removeEventListener('click', handleClick);
      clearTimers();
    };
  }, [clearTimers, start]);

  useEffect(() => {
    if (previousUrl.current === currentUrl) return;
    previousUrl.current = currentUrl;
    clearTimers();
    setPhase((currentPhase) => currentPhase === 'idle' ? 'idle' : 'complete');
    hideTimer.current = setTimeout(() => setPhase('idle'), 220);
  }, [clearTimers, currentUrl]);

  if (phase === 'idle') return null;

  return (
    <div className="navigation-progress" data-phase={phase} role="status" aria-label="Loading">
      <div className="navigation-progress__bar">
        <span className="navigation-progress__glow" />
      </div>
    </div>
  );
}
