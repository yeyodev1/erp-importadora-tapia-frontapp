/**
 * Totales de un documento de venta en CENTAVOS, con el mismo redondeo del
 * API (salesCommon.priceLine/computeTotals): IVA por línea y luego se suma,
 * como el XML del SRI. Sin imports para poder probarlo con node --test.
 */
export interface MathLine {
  qty: number | null
  unitPrice: number | null
  discount: number | null
  vatRate: number
}

const round = (v: number) => Math.round(v + Number.EPSILON * Math.sign(v))

export function lineSubtotal(l: MathLine): number {
  return round((l.qty ?? 0) * (l.unitPrice ?? 0)) - (l.discount ?? 0)
}

export function lineVat(l: MathLine): number {
  return round((lineSubtotal(l) * l.vatRate) / 100)
}

export function saleTotals(lines: MathLine[]) {
  let subtotal0 = 0
  let subtotalVat = 0
  let discount = 0
  let vat = 0
  for (const l of lines) {
    const sub = lineSubtotal(l)
    if (l.vatRate > 0) subtotalVat += sub
    else subtotal0 += sub
    discount += l.discount ?? 0
    vat += lineVat(l)
  }
  return { subtotal0, subtotalVat, discount, vat, total: subtotal0 + subtotalVat + vat }
}
