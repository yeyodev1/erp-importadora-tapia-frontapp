// Correr con: node --test src/composables/sales/saleMath.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lineSubtotal, saleTotals } from './saleMath.ts'

test('totales iguales a los del API (caso de sales.test.ts del back)', () => {
  const t = saleTotals([
    { qty: 40, unitPrice: 300, discount: 0, vatRate: 0 },
    { qty: 10, unitPrice: 900, discount: 500, vatRate: 15 },
  ])
  assert.deepEqual(t, { subtotal0: 12000, subtotalVat: 8500, discount: 500, vat: 1275, total: 21775 })
})

test('cantidad con decimales redondea al centavo y líneas vacías no suman', () => {
  assert.equal(lineSubtotal({ qty: 2.5, unitPrice: 145, discount: 0, vatRate: 0 }), 363)
  assert.equal(saleTotals([{ qty: null, unitPrice: null, discount: null, vatRate: 15 }]).total, 0)
})
