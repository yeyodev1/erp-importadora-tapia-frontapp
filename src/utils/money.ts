/**
 * Dinero y cantidades. El API trabaja en CENTAVOS ENTEROS (12345 = $123.45):
 * acá nunca se suman floats de dólares. Sumar centavos es sumar enteros.
 */

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/** 123456 → "$1,234.56"; -5 → "-$0.05". `symbol: false` → "1,234.56". */
export function formatMoney(cents: number | null | undefined, symbol = true): string {
  if (cents == null || !Number.isFinite(cents)) return ''
  const n = Math.round(cents)
  const abs = Math.abs(n)
  const text = `${group(String(Math.trunc(abs / 100)))}.${String(abs % 100).padStart(2, '0')}`
  return `${n < 0 ? '-' : ''}${symbol ? '$' : ''}${text}`
}

/**
 * Lee un número escrito a mano y lo devuelve escalado a entero
 * (`decimals` = 2 → centavos). Acepta "1.234,56", "1,234.56", "1234.56",
 * "1234,5", "$ 1 234" y negativos. Sin floats: se arma desde los dígitos.
 * Devuelve null si el texto no es un número.
 *
 * Regla del separador: si aparecen "." y ",", el último es el decimal. Si
 * solo aparece uno y se repite, o separa 1-3 dígitos de exactamente 3
 * ("1.234": un monto no tiene 3 decimales), es de miles.
 */
export function parseScaled(text: string, decimals: number): number | null {
  let s = String(text ?? '').replace(/[\s$]/g, '')
  if (!s) return null
  const negative = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'))
  s = s.replace(/^[-(]|\)$/g, '')
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null

  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  let decimalSep = ''
  if (lastDot >= 0 && lastComma >= 0) decimalSep = lastDot > lastComma ? '.' : ','
  else {
    const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : ''
    const count = sep ? s.split(sep).length - 1 : 0
    const after = sep ? s.length - s.lastIndexOf(sep) - 1 : 0
    const lead = sep ? s.slice(0, s.indexOf(sep)) : ''
    const thousands = count > 1 || (after === 3 && decimals < 3 && /^[1-9]\d{0,2}$/.test(lead))
    decimalSep = sep && !thousands ? sep : ''
  }

  const [intRaw, fracRaw = ''] = decimalSep ? [s.slice(0, s.lastIndexOf(decimalSep)), s.slice(s.lastIndexOf(decimalSep) + 1)] : [s, '']
  if (/[.,]/.test(fracRaw)) return null
  // Los miles, si vienen, bien agrupados y con un solo separador: "1.2,3" no es un monto.
  if (/[.,]/.test(intRaw) && !/^\d{1,3}(\.\d{3})+$|^\d{1,3}(,\d{3})+$/.test(intRaw)) return null
  const intDigits = intRaw.replace(/[.,]/g, '') || '0'

  // Redondeo a `decimals` con el dígito siguiente (mitad hacia arriba).
  const frac = (fracRaw + '0'.repeat(decimals + 1)).slice(0, decimals + 1)
  let scaled = Number(intDigits + frac.slice(0, decimals))
  if (Number(frac[decimals]) >= 5) scaled += 1
  if (!Number.isSafeInteger(scaled)) return null
  return negative ? -scaled : scaled
}

/** "1.234,56" o "1234.56" → 123456 centavos; null si no es un monto. */
export function toCents(text: string): number | null {
  return parseScaled(text, 2)
}

/** Cantidad escrita → número con 4 decimales exactos (1.23456 → 1.2346). */
export function toQty(text: string): number | null {
  const scaled = parseScaled(text, 4)
  return scaled == null ? null : scaled / 10000
}

/** Redondea una cantidad a 4 decimales, igual que `roundQty` del API. */
export function roundQty(qty: number): number {
  return Math.round(qty * 10000) / 10000
}

const qtyFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

/** 1234.5 → "1,234.50"; 0.12345 → "0.1235". */
export function formatQty(qty: number | null | undefined): string {
  if (qty == null || !Number.isFinite(qty)) return ''
  return qtyFormat.format(roundQty(qty))
}

/** Suma un campo en centavos de una lista (enteros: el total es exacto). */
export function sumCents<T>(rows: T[], pick: (row: T) => number | null | undefined): number {
  return rows.reduce((acc, row) => acc + Math.round(pick(row) ?? 0), 0)
}
