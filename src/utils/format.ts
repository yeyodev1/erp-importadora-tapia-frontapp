/** Fechas. Los documentos usan "AAAA-MM-DD" (el API los guarda a mediodía UTC). */

const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-10-30" o ISO completo → "30/10/2026", como los reportes de hoy. */
export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return ''
  const iso = typeof value === 'string' ? value : value.toISOString()
  const [y, m, d] = iso.slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : ''
}

const month = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "2026-09" → "septiembre de 2026" */
export function formatMonth(value: string): string {
  return month.format(new Date(`${value}-15T12:00:00Z`))
}

/** Fecha y hora locales: "30/10/2026 14:12" (pie de los reportes). */
export function formatDateTime(value: string | Date = new Date()): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Hoy en Ecuador como "AAAA-MM-DD", el formato del selector de fecha y del API. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date())
}

/** Primer día del mes de una fecha "AAAA-MM-DD". */
export function monthStart(iso = todayISO()): string {
  return `${iso.slice(0, 7)}-01`
}

/** "2026-01" → "2025-12". */
export function shiftMonth(period: string, step: number): string {
  const [y = 0, m = 1] = period.split('-').map(Number)
  const total = y * 12 + (m - 1) + step
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

/** Foto más liviana servida por Cloudinary para miniaturas. */
export function thumb(url: string, width = 320): string {
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/c_fill,w_${width},h_${width},q_auto,f_auto/`) : url
}
