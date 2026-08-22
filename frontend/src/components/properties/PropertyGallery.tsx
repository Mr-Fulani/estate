'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Camera
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, getStatusBadgeVariant } from '@/lib/utils';
import { useLocale } from '@/context/LocaleContext';
import { localizedStatus } from '@/i18n/domain';
import { siteCopy } from '@/i18n/siteCopy';

export function PropertyGallery({
  images,
  title,
  isFeatured,
  categoryName,
  isActive,
  statusBadge,
}: {
  images: string[];
  title: string;
  isFeatured?: boolean;
  categoryName?: string;
  isActive?: boolean;
  statusBadge?: string | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { locale } = useLocale();
  const copy = siteCopy[locale].property;

  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[selectedIndex] : null;

  const rawStatus = statusBadge !== undefined && statusBadge !== null
    ? statusBadge
    : (isActive ? 'Актуально' : 'В архиве');
  const displayStatus = localizedStatus(locale, rawStatus);

  const statusVariant = getStatusBadgeVariant(rawStatus);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => locale === 'ar'
          ? (prev - 1 + images.length) % images.length
          : (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => locale === 'ar'
          ? (prev + 1) % images.length
          : (prev - 1 + images.length) % images.length);
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
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
  }, [isLightboxOpen, images.length, locale]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  if (!hasImages) {
    return (
      <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex flex-col items-center justify-center text-primary-400 gap-2">
        <Camera className="w-10 h-10 opacity-50" />
        <span className="font-medium text-sm">{copy.photosSoon}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Large Image Display */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-slate-900 rounded-2xl overflow-hidden cursor-zoom-in group shadow-sm border border-slate-200"
      >
        <Image
          src={currentImage!}
          alt={`${title} — ${copy.photo} ${selectedIndex + 1}`}
          fill
          preload
          loading="eager"
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges Overlay */}
        <div className="absolute start-4 top-4 z-10 flex flex-wrap gap-2 pointer-events-none">
          {isFeatured && (
            <Badge variant="secondary" className="shadow-md font-semibold">
              {copy.recommended}
            </Badge>
          )}
          {categoryName && (
            <Badge variant="primary" className="shadow-md">
              {categoryName}
            </Badge>
          )}
          {displayStatus && (
            <Badge variant={statusVariant} className="shadow-md bg-white/95 backdrop-blur-sm font-semibold">
              {displayStatus}
            </Badge>
          )}
        </div>

        {/* Counter and Zoom Button */}
        <div className="absolute bottom-4 end-4 z-10 flex items-center gap-2">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full">
            {selectedIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-colors"
            title={copy.enlarge}
            aria-label={copy.enlarge}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Arrow Navigation on Main Image */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute start-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-100 shadow-lg transition-opacity hover:bg-white focus:opacity-100 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
              aria-label={copy.previousPhoto}
            >
              <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute end-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-100 shadow-lg transition-opacity hover:bg-white focus:opacity-100 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
              aria-label={copy.nextPhoto}
            >
              <ChevronRight className="h-6 w-6 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
          {images.map((imgUrl, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  'relative w-20 h-16 md:w-24 md:h-[72px] rounded-xl overflow-hidden flex-shrink-0 transition-all cursor-pointer border',
                  isSelected
                    ? 'ring-2 ring-primary border-transparent scale-100 opacity-100 shadow-md'
                    : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-primary/50'
                )}
                aria-label={`${copy.photo} ${idx + 1}`}
                aria-current={isSelected ? 'true' : undefined}
              >
                <Image
                  src={imgUrl}
                  alt={`${copy.photo} ${idx + 1}`}
                  fill
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  sizes="96px"
                  className="object-cover"
                />
                {idx === 0 && (
                  <span className="absolute bottom-1 start-1 rounded bg-primary px-1 text-[8px] font-bold text-white">
                    {copy.mainPhoto}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="property-gallery-title"
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 md:p-8"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white z-20" onClick={(e) => e.stopPropagation()}>
            <div id="property-gallery-title" className="text-sm font-semibold truncate max-w-lg">
              {title} — <span className="text-slate-400">{copy.photo} {selectedIndex + 1} / {images.length}</span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={`${copy.close} (Esc)`}
              aria-label={copy.close}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Central Image View */}
          <div className="relative flex-1 w-full max-h-[80vh] flex items-center justify-center my-auto" onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentImage!}
              alt={`${title} — ${copy.photo} ${selectedIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain rounded-xl shadow-2xl transition-all"
            />

            {/* Left & Right Arrows in Lightbox */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={copy.previousPhoto}
                  className="absolute start-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition-colors hover:bg-white/25 active:scale-95 md:start-6"
                >
                  <ChevronLeft className="h-7 w-7 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={copy.nextPhoto}
                  className="absolute end-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-lg transition-colors hover:bg-white/25 active:scale-95 md:end-6"
                >
                  <ChevronRight className="h-7 w-7 rtl:rotate-180" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails in Lightbox */}
          {images.length > 1 && (
            <div className="flex gap-2 max-w-full overflow-x-auto pb-2 z-20" onClick={(e) => e.stopPropagation()}>
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={cn(
                    'relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all border',
                    selectedIndex === idx
                      ? 'ring-2 ring-white border-transparent scale-105 opacity-100'
                      : 'border-white/20 opacity-50 hover:opacity-80'
                  )}
                  aria-label={`${copy.photo} ${idx + 1}`}
                  aria-current={selectedIndex === idx ? 'true' : undefined}
                >
                  <Image src={imgUrl} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
