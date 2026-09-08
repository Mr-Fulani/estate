/** Roomwalk-derived frame selection. See /public/licenses/roomwalk.txt. */
export const FRAME_COUNT = 144;

export function scrollProgress(top: number, height: number, viewport: number, inset: number): number {
  const travel = height - (viewport - inset);
  if (travel <= 0) return 0;
  return Math.min(1, Math.max(0, (inset - top) / travel));
}

export function frameAt(progress: number, count = FRAME_COUNT): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * Math.max(0, count - 1));
}

export function nearestFrame(target: number, available: Iterable<number>): number | null {
  let closest: number | null = null;
  for (const frame of Array.from(available)) {
    if (closest === null || Math.abs(frame - target) < Math.abs(closest - target)) closest = frame;
  }
  return closest;
}

/** Sparse anchors span the whole film; adjacent frames load around the current scroll position. */
export function frameQueue(target: number, mobile: boolean): number[] {
  const indices = new Set<number>([target]);
  const stride = mobile ? 2 : 1;
  for (let distance = stride; distance <= 8 * stride; distance += stride) {
    if (target + distance < FRAME_COUNT) indices.add(target + distance);
    if (target - distance >= 0) indices.add(target - distance);
  }
  for (let index = 0; index < FRAME_COUNT; index += 24) indices.add(index);
  indices.add(FRAME_COUNT - 1);
  return Array.from(indices);
}

export function frameURL(index: number, mobile: boolean): string {
  return `/residences/etro/scroll-v1/${mobile ? 'mobile' : 'desktop'}/frame-${String(index).padStart(3, '0')}.webp`;
}
