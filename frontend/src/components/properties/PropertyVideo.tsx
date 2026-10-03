'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { isDirectVideoUrl, videoEmbedUrl, videoPosterUrl } from '@/lib/video-media';

const labels = { ru: 'Воспроизвести видео', en: 'Play video', tr: 'Videoyu oynat', ar: 'تشغيل الفيديو' };

/** Shared playback defaults for developments, apartment types and ordinary listings. */
export function PropertyVideo({ url, title, poster, className = '', onAspectRatio }: { url: string; title: string; poster?: string; className?: string; onAspectRatio?: (ratio: number) => void }) {
  const { locale } = useLocale();
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failedPoster, setFailedPoster] = useState<string | null>(null);
  const candidate = videoPosterUrl(url);
  const preview = candidate && failedPoster !== candidate ? candidate : poster || '/og.png';
  const embed = videoEmbedUrl(url);
  if (embed) {
    const muted = new URL(embed);
    if (muted.hostname.includes('youtube')) muted.searchParams.set('mute', '1');
    if (muted.hostname.includes('vimeo')) muted.searchParams.set('muted', '1');
    return <iframe src={muted.href} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" className={`h-full w-full border-0 ${className}`} />;
  }
  if (!isDirectVideoUrl(url)) return <a href={url} target="_blank" rel="noopener noreferrer" className="grid h-full place-items-center px-4 text-center text-white underline">{title}</a>;
  return <div className={`relative h-full w-full overflow-hidden bg-[#172931] ${className}`}>
    {candidate && failedPoster !== candidate && <Image unoptimized width={1} height={1} src={candidate} alt="" aria-hidden="true" className="hidden" onLoad={event => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) onAspectRatio?.(image.naturalWidth / image.naturalHeight); }} onError={() => setFailedPoster(candidate)} />}
    <video key={url} ref={video} src={url} poster={preview} title={title} controls muted playsInline preload="metadata" onLoadedMetadata={event => { const media = event.currentTarget; if (media.videoWidth && media.videoHeight) onAspectRatio?.(media.videoWidth / media.videoHeight); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} className="h-full w-full object-contain" />
    {!playing && <button type="button" aria-label={`${labels[locale]}: ${title}`} onClick={() => { void video.current?.play().catch(() => setPlaying(false)); }} className="absolute start-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[#172931]/90 text-white shadow-lg hover:bg-[#172931] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rtl:translate-x-1/2"><Play size={24} fill="currentColor" /></button>}
  </div>;
}
