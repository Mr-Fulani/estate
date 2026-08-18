'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Camera
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, getStatusBadgeVariant } from '@/lib/utils';

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

  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[selectedIndex] : null;

  const displayStatus = statusBadge !== undefined && statusBadge !== null 
    ? statusBadge 
    : (isActive ? 'Актуально' : 'В архиве');

  const statusVariant = getStatusBadgeVariant(displayStatus);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

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
        <span className="font-medium text-sm">Фотографии скоро появятся</span>
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
        <img
          src={currentImage!}
          alt={`${title} - Фото ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 pointer-events-none">
          {isFeatured && (
            <Badge variant="secondary" className="shadow-md font-semibold">
              Рекомендуем
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
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full">
            {selectedIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-colors"
            title="Увеличить фото на весь экран"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 active:scale-95"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 active:scale-95"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {images.map((imgUrl, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  'relative w-20 h-16 md:w-24 md:h-18 rounded-xl overflow-hidden flex-shrink-0 transition-all cursor-pointer border',
                  isSelected
                    ? 'ring-3 ring-primary border-transparent scale-100 opacity-100 shadow-md'
                    : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-primary/50'
                )}
              >
                <img
                  src={imgUrl}
                  alt={`Миниатюра ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 bg-primary text-white text-[8px] font-bold px-1 rounded">
                    Главное
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
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white z-20" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold truncate max-w-lg">
              {title} — <span className="text-slate-400">Фото {selectedIndex + 1} из {images.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Central Image View */}
          <div className="relative flex-1 w-full max-h-[80vh] flex items-center justify-center my-auto" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentImage!}
              alt={`${title} - Фото ${selectedIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            {/* Left & Right Arrows in Lightbox */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors shadow-lg active:scale-95"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors shadow-lg active:scale-95"
                >
                  <ChevronRight className="w-7 h-7" />
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
                    'w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all border',
                    selectedIndex === idx
                      ? 'ring-2 ring-white border-transparent scale-105 opacity-100'
                      : 'border-white/20 opacity-50 hover:opacity-80'
                  )}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
