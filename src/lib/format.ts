export const round = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? 0 : Math.round(n))

export function temp(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const r = Math.round(n)
  return r > 0 ? `+${r}` : String(r)
}

export function tempShort(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `${Math.round(n)}°`
}

export function fmtVis(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return '—'
  if (m >= 10000) return '>10 km'
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  return `${Math.round(m)} m`
}

export function fmtTime(iso: string): string {
  return iso.slice(11, 16)
}

export function fmtDate(iso: string): string {
  return iso.slice(5, 10).replace('-', '/')
}

export function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

export function weatherText(code: number | null | undefined): string {
  const c = Number(code) || 0
  if (c === 0) return '晴'
  if (c === 1) return '晴间多云'
  if (c === 2) return '多云'
  if (c === 3) return '阴'
  if (c === 45 || c === 48) return '雾'
  if (c >= 51 && c <= 57) return '毛毛雨'
  if (c >= 61 && c <= 67) return '雨'
  if (c === 71) return '小雪'
  if (c === 73) return '中雪'
  if (c === 75) return '大雪'
  if (c === 77) return '米雪'
  if (c === 80 || c === 81) return '阵雨'
  if (c === 82) return '强阵雨'
  if (c === 85) return '阵雪'
  if (c === 86) return '强阵雪'
  if (c >= 95) return '雷暴'
  return '多云'
}
