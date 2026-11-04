/**
 * Reparte `amount` (centavos) sobre las facturas en el orden dado (la más
 * antigua primero) sin pasar el saldo de ninguna. Lo que sobre no se aplica.
 */
export function applyOldestFirst(amount: number, invoices: { _id: string; balance: number }[]) {
  const out: Record<string, number | null> = {}
  let left = amount
  for (const inv of invoices) {
    const take = Math.min(left, inv.balance)
    out[inv._id] = take > 0 ? take : null
    left -= Math.max(take, 0)
  }
  return out
}
