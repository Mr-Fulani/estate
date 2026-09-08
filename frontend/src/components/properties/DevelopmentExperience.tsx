'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Expand, Pause, Play } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { developmentCopy } from '@/i18n/development';
import { interiorCopy } from '@/i18n/interiors';
import { sceneOffset } from '@/lib/interior-timeline';
import styles from './DevelopmentExperience.module.css';

type Props = {
  locale: Locale; images: string[]; title: string; brand: string;
  renders: boolean; story?: string;
  onExpand: (image: { url: string; label: string }) => void;
};

/** Each room is a real document section, not another frame in a pinned player. */
export function DevelopmentExperience({ locale, images, title, brand, renders, story, onExpand }: Props) {
  const copy = developmentCopy[locale];
  const words = interiorCopy[locale];
  const rootRef = useRef<HTMLElement>(null);
  const pausedRef = useRef(false);
  const refreshRef = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const imageKey = images.join('|');
  const label = (index: number) => words.rooms[images[index]?.split('/').pop()?.split('.')[0] || ''] || copy.image + ' ' + (index + 1);
  const sceneId = (index: number) => 'etro-interior-' + (index + 1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-interior-scene]'));
    const media = new Map(scenes.map(scene => [scene, scene.querySelector<HTMLElement>('[data-scene-background]')]));
    const visible = new Set<HTMLElement>();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; addEventListener?: (type: string, listener: () => void) => void; removeEventListener?: (type: string, listener: () => void) => void } }).connection;
    let enabled = false;
    let raf = 0;
    const render = () => {
      raf = 0;
      if (!enabled || pausedRef.current || document.hidden) return;
      // Read visible geometry first, then transform only the image layers.
      const updates = Array.from(visible).map(scene => {
        const rect = scene.getBoundingClientRect();
        return { layer: media.get(scene), offset: sceneOffset(rect.top, rect.height, window.innerHeight) };
      });
      updates.forEach(({ layer, offset }) => layer?.style.setProperty('--scene-offset', offset + 'px'));
    };
    const schedule = () => {
      if (!raf && enabled && visible.size && !pausedRef.current && !document.hidden) raf = requestAnimationFrame(render);
    };
    const configure = () => {
      enabled = !reduced.matches && !connection?.saveData;
      setEnhanced(enabled);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!enabled) media.forEach(layer => layer?.style.removeProperty('--scene-offset'));
      else schedule();
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
        else visible.delete(entry.target as HTMLElement);
      });
      schedule();
    }, { rootMargin: '120px 0px' });
    scenes.forEach(scene => observer.observe(scene));
    refreshRef.current = schedule;
    configure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', configure);
    connection?.addEventListener?.('change', configure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      document.removeEventListener('visibilitychange', schedule);
      reduced.removeEventListener('change', configure);
      connection?.removeEventListener?.('change', configure);
      refreshRef.current = () => {};
    };
  }, [imageKey]);

  const toggle = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (!pausedRef.current) refreshRef.current();
  };

  return (
    <section ref={rootRef} id="interiors" className={styles.experience} aria-labelledby="interior-title" data-testid="development-experience" data-enhanced={enhanced} data-paused={paused}>
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>02 / {copy.interiors}</p><h2 id="interior-title">{copy.livingTitle}</h2></div>
        <a href="#residences" className={styles.skip}>{words.skip}<ArrowDown size={16} aria-hidden="true" /></a>
      </div>
      <nav className={styles.chapters} aria-label={copy.gallery}>
        <span className={styles.hint}><ArrowDown size={14} aria-hidden="true" />{words.scroll}</span>
        {images.map((url, index) => <a key={url + index} href={'#' + sceneId(index)}><span>{String(index + 1).padStart(2, '0')}</span>{label(index)}</a>)}
      </nav>
      <div className={styles.scenes}>
        {images.map((url, index) => <section key={url + index} id={sceneId(index)} className={styles.scene} data-interior-scene data-testid="interior-scene" aria-labelledby={sceneId(index) + '-title'}>
          <div className={styles.background} data-scene-background>
            <Image src={url} alt={title + ' — ' + label(index)} fill sizes="100vw" className={styles.photo} />
          </div>
          <div className={styles.shade} aria-hidden="true" />
          <span className={styles.brand}>{brand}<span>PRIVATE RESIDENCES</span></span>
          <div className={styles.tools}>
            {enhanced && <button type="button" onClick={toggle} aria-label={paused ? copy.motionOn : copy.motionOff} aria-pressed={paused} title={paused ? copy.motionOn : copy.motionOff}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>}
            <button type="button" onClick={() => onExpand({ url, label: label(index) })} aria-label={copy.open + ': ' + label(index)} title={copy.open}><Expand size={17} /></button>
          </div>
          <div className={styles.caption}>
            <div><p>{words.detail}</p><h3 id={sceneId(index) + '-title'}>{label(index)}</h3></div>
            <a className={styles.next} href={index + 1 < images.length ? '#' + sceneId(index + 1) : '#residences'}>
              <span>{index + 1 < images.length ? label(index + 1) : words.skip}</span>
              {index + 1 < images.length ? <ArrowDown size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
            </a>
          </div>
          <span className={styles.count} dir="ltr">{String(index + 1).padStart(2, '0')} <span>/ {String(images.length).padStart(2, '0')}</span></span>
        </section>)}
      </div>
      <div className={styles.after}>
        {renders && <p className={styles.disclaimer}>{copy.render}</p>}
        {story && <p className={styles.story}>{story}</p>}
      </div>
    </section>
  );
}
