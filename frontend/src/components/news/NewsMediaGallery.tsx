'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Play, X } from 'lucide-react';

import type { Locale } from '@/i18n/config';
import { siteCopy } from '@/i18n/siteCopy';
import { getYouTubeEmbedUrl } from '@/lib/youtube';
import type { NewsMedia } from '@/types';

export function NewsMediaGallery({
  media,
  title,
  locale,
  coverImage,
}: {
  media: NewsMedia[];
  title: string;
  locale: Locale;
  coverImage?: string | null;
}) {
  const copy = siteCopy[locale].news;
  const orderedMedia = [...media]
    .sort((first, second) => first.position - second.position)
    .filter((item) => item.media_type !== 'image' || item.url !== coverImage);
  const images = orderedMedia.filter((item) => item.media_type === 'image');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedImage === null) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedImage(null);
      if (event.key === 'ArrowLeft') setSelectedImage((current) => current === null ? null : (current - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setSelectedImage((current) => current === null ? null : (current + 1) % images.length);
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [images.length, selectedImage]);

  if (!orderedMedia.length) return null;

  return (
    <section className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="news-media-title">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="news-media-title" className="text-2xl font-bold text-slate-950 md:text-3xl">{copy.mediaTitle}</h2>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary">{orderedMedia.length}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {orderedMedia.map((item, index) => {
          if (item.media_type === 'youtube') {
            const embedUrl = getYouTubeEmbedUrl(item.url);
            if (!embedUrl) return null;
            return (
              <div key={item.id || `${item.url}-${index}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
                <div className="relative aspect-video">
                  <iframe
                    src={embedUrl}
                    title={`${title} — ${copy.video} ${index + 1}`}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white"><Play className="h-4 w-4 text-secondary" aria-hidden="true" />{copy.video}</div>
              </div>
            );
          }

          const imageIndex = images.findIndex((image) => image.id ? image.id === item.id : image.url === item.url);
          return (
            <button
              key={item.id || `${item.url}-${index}`}
              type="button"
              onClick={() => setSelectedImage(imageIndex)}
              aria-label={`${copy.openImage}: ${imageIndex + 1}`}
              className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 text-left shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              <Image src={item.url} alt={`${title} — ${copy.photo} ${imageIndex + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-70" />
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur"><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />{copy.photo} {imageIndex + 1}</span>
            </button>
          );
        })}
      </div>

      {selectedImage !== null && images[selectedImage] && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={copy.openImage} className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedImage(null); }}>
          <button ref={closeButtonRef} type="button" onClick={() => setSelectedImage(null)} aria-label={copy.closeMedia} className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-8 md:top-8"><X className="h-6 w-6" /></button>
          {images.length > 1 && <button type="button" onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)} aria-label={copy.previousImage} className="absolute left-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-8"><ChevronLeft className="h-7 w-7" /></button>}
          <div className="relative h-[80vh] w-[min(1200px,88vw)]">
            <Image src={images[selectedImage].url} alt={`${title} — ${copy.photo} ${selectedImage + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          {images.length > 1 && <button type="button" onClick={() => setSelectedImage((selectedImage + 1) % images.length)} aria-label={copy.nextImage} className="absolute right-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-8"><ChevronRight className="h-7 w-7" /></button>}
          <span className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">{selectedImage + 1} / {images.length}</span>
        </div>
      )}
    </section>
  );
}
