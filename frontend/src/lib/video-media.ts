export function videoEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (url.hostname === 'drive.google.com') {
      const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
      return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : null;
    }
    if (url.hostname === 'youtu.be' || url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1);
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (url.hostname === 'vimeo.com' || url.hostname.endsWith('.vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).at(-1);
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { return null; }
  return null;
}

export function isDirectVideoUrl(value: string): boolean {
  return /\.(mp4|mov|webm|ogv|ogg)(?:$|[?#])/i.test(value);
}

/** Google Drive's `uc?export=view` endpoint can stall when embedded in a site.
 * The thumbnail endpoint returns the same source image as a browser-friendly image response.
 */
export function displayImageUrl(value: string, width = 2000): string {
  try {
    const url = new URL(value);
    if (url.hostname !== 'drive.google.com') return value;
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || url.searchParams.get('id');
    return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${width}` : value;
  } catch { return value; }
}

export function isDriveImage(value: string): boolean {
  try { return new URL(value).hostname === 'drive.google.com'; }
  catch { return false; }
}

/** Optimized videos have an immutable server-generated WebP preview beside them. */
export function videoPosterUrl(value: string): string | null {
  return /\/properties\/optimized\/[a-f0-9]{64}\.mp4(?:$|[?#])/i.test(value)
    ? value.replace(/\.mp4(?=$|[?#])/i, '.poster.webp') : null;
}
