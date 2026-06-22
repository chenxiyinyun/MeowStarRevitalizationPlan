/**
 * 颜色变暗工具（等距建筑光照模型）
 * @param color 0xRRGGBB
 * @param factor 0~1，越小越暗
 * @returns 变暗后的 0xRRGGBB
 */
export function darkenColor(color: number, factor: number): number {
  const r = Math.round(((color >> 16) & 0xff) * factor)
  const g = Math.round(((color >> 8) & 0xff) * factor)
  const b = Math.round((color & 0xff) * factor)
  return (r << 16) | (g << 8) | b
}
