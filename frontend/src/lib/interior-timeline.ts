/** Bounded parallax for a section moving through the viewport.
 * The 6% travel fits inside the image layer's 8% top/bottom overscan. */
export function sceneOffset(top: number, height: number, viewport: number): number {
  if (height <= 0 || viewport <= 0) return 0;
  const progress = Math.max(0, Math.min(1, (viewport - top) / (viewport + height)));
  return (progress - 0.5) * height * 0.12;
}
