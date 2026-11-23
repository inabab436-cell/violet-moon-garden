/** Cover the viewport without extra cropping on upright phones. */
export function courtyardZoom(width: number, height: number, worldWidth: number, worldHeight: number) {
  const cover = Math.max(width / worldWidth, height / worldHeight);
  return cover * (width < height ? 1 : 1.08);
}