/**
 * Geometría del gráfico de ventas (SVG propio, sin librerías). Puro y sin
 * imports de la app para poder probarlo con node --test. Montos en CENTAVOS.
 */

/** Tope "redondo" del eje y su paso: 1, 2, 2.5 o 5 × 10^n, con `ticks` divisiones. */
export function niceScale(maxCents: number, ticks = 4): { max: number; step: number } {
  if (!(maxCents > 0)) return { max: ticks * 100, step: 100 }
  const raw = maxCents / ticks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  return { max: step * ticks, step }
}

/** 123456789 centavos → "$1.2M"; 4500000 → "$45k"; 90000 → "$900". Para el eje y etiquetas cortas. */
export function compactMoney(cents: number): string {
  const d = cents / 100
  const abs = Math.abs(d)
  const sign = d < 0 ? '-' : ''
  const fmt = (n: number, s: string) => `${sign}$${Number(n.toFixed(n < 10 ? 1 : 0))}${s}`
  if (abs >= 1e6) return fmt(abs / 1e6, 'M')
  if (abs >= 1e3) return fmt(abs / 1e3, 'k')
  return `${sign}$${Math.round(abs)}`
}

export interface ChartBox {
  width: number
  height: number
  left: number
  right: number
  top: number
  bottom: number
}

/** Puntos (x, y) de la serie dentro del área útil; y = 0 abajo. */
export function linePoints(values: number[], max: number, box: ChartBox): { x: number; y: number }[] {
  const w = box.width - box.left - box.right
  const h = box.height - box.top - box.bottom
  const n = values.length
  return values.map((v, i) => ({
    x: box.left + (n > 1 ? (i * w) / (n - 1) : w / 2),
    y: box.top + h - (max > 0 ? (Math.max(0, v) / max) * h : 0),
  }))
}
