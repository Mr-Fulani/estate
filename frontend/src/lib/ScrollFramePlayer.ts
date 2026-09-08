/**
 * Canvas playback adapted from Aironzak's Roomwalk, MIT.
 * https://github.com/Aironzak/instagram — see /licenses/roomwalk.txt.
 * Loads only nearby frames and sparse anchors; never allocates the entire film.
 */
import { frameAt, frameQueue, frameURL, nearestFrame, scrollProgress } from './scroll-frames';

type Options = {
  canvas: HTMLCanvasElement;
  section: HTMLElement;
  mobile: boolean;
  onProgress: (progress: number) => void;
  onReady: () => void;
  onError: () => void;
};

export class ScrollFramePlayer {
  private options: Options;
  private context: CanvasRenderingContext2D;
  private images = new Map<number, HTMLImageElement>();
  private pending = new Map<number, { image: HTMLImageElement; timer: ReturnType<typeof setTimeout> }>();
  private failed = new Set<number>();
  private active = false;
  private paused = false;
  private destroyed = false;
  private raf = 0;
  private target = 0;
  private drawn = -1;
  private resizeObserver: ResizeObserver;

  constructor(options: Options) {
    this.options = options;
    const context = options.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas is unavailable');
    this.context = context;
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(options.canvas);
    window.addEventListener('scroll', this.schedule, { passive: true });
    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('pageshow', this.schedule);
    document.addEventListener('visibilitychange', this.visibility);
    options.canvas.addEventListener('contextlost', this.fail);
    this.resize();
  }

  setActive(active: boolean) {
    this.active = active;
    if (active) this.schedule();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused) this.schedule();
  }

  private visibility = () => {
    if (document.hidden && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else this.schedule();
  };

  private schedule = () => {
    if (this.destroyed || !this.active || this.paused || document.hidden || this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      if (this.destroyed || !this.active || this.paused || document.hidden) return;
      const rect = this.options.section.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(this.options.section).getPropertyValue('--journey-inset')) || 80;
      const progress = scrollProgress(rect.top, rect.height, window.innerHeight, inset);
      this.target = frameAt(progress);
      this.options.onProgress(progress);
      this.draw();
      this.pump();
    });
  };

  private resize = () => {
    if (this.destroyed) return;
    const canvas = this.options.canvas;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.drawn = -1;
      this.draw();
    }
    this.schedule();
  };

  private pump() {
    if (this.destroyed || !this.active || this.paused || document.hidden) return;
    for (const frame of frameQueue(this.target, this.options.mobile)) {
      if (this.pending.size >= 4) break;
      if (!this.images.has(frame) && !this.pending.has(frame) && !this.failed.has(frame)) this.load(frame);
    }
  }

  private load(frame: number) {
    const image = new Image();
    image.decoding = 'async';
    const finish = (success: boolean) => {
      const pending = this.pending.get(frame);
      if (!pending) return;
      clearTimeout(pending.timer);
      image.onload = image.onerror = null;
      this.pending.delete(frame);
      if (this.destroyed) return;
      if (success && image.naturalWidth > 0) {
        this.images.set(frame, image);
        // Bound our live frame references (~58 MB desktop / ~24 MB mobile, excluding the browser cache).
        const limit = this.options.mobile ? 26 : 28;
        if (this.images.size > limit) {
          const wanted = new Set(frameQueue(this.target, this.options.mobile));
          const evict = Array.from(this.images.keys()).find(index => !wanted.has(index) && index !== this.drawn);
          if (evict !== undefined) this.images.delete(evict);
          else this.images.delete(this.images.keys().next().value!);
        }
        if (this.active && !this.paused && !document.hidden) this.draw();
      } else {
        image.removeAttribute('src');
        this.failed.add(frame);
        if (this.failed.size >= 4 && this.images.size === 0) { this.fail(); return; }
      }
      this.pump();
    };
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    const timer = setTimeout(() => finish(false), 8000);
    this.pending.set(frame, { image, timer });
    image.src = frameURL(frame, this.options.mobile);
  }

  private draw() {
    if (this.destroyed) return;
    const frame = nearestFrame(this.target, this.images.keys());
    if (frame === null || frame === this.drawn) return;
    const image = this.images.get(frame)!;
    const { width, height } = this.options.canvas;
    if (!width || !height) return;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    try {
      this.context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      this.drawn = frame;
      this.options.canvas.dataset.frame = String(frame);
      this.options.onReady();
    } catch { this.fail(); }
  }

  private fail = () => {
    if (this.destroyed) return;
    this.destroy();
    this.options.onError();
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener('scroll', this.schedule);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pageshow', this.schedule);
    document.removeEventListener('visibilitychange', this.visibility);
    this.options.canvas.removeEventListener('contextlost', this.fail);
    this.resizeObserver.disconnect();
    if (this.raf) cancelAnimationFrame(this.raf);
    for (const { image, timer } of Array.from(this.pending.values())) {
      clearTimeout(timer);
      image.onload = image.onerror = null;
      image.removeAttribute('src');
    }
    this.pending.clear();
    this.images.clear();
  }
}
