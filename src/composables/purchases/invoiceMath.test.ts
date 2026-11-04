// pnpm test. El caso es el asiento del video 1 (factura de mantenimiento de 192.68).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeInvoice, entryReady, invoiceEntry } from './invoiceMath.ts'

const code = (id: string, tax: 'renta' | 'iva', rate: number) => ({ _id: id, tax, code: id, description: '', rate, accountCode: `ret-${id}`, isActive: true })

test('factura con retenciones repartidas en varios códigos cuadra al centavo', () => {
  const expenseLines = [{ accountCode: 'gasto', description: '', base0: 0, baseVat: 16755 }]
  const t = computeInvoice({
    expenseLines,
    productLines: [],
    vatOverride: null,
    codes: [code('312', 'renta', 2), code('307', 'renta', 3), code('721', 'iva', 10), code('723', 'iva', 20)],
    withholdings: [
      { codeId: '312', base: 2800, rate: 2 },
      { codeId: '307', base: 13955, rate: 3 },
      { codeId: '721', base: 419, rate: 10 },
      { codeId: '723', base: 2094, rate: 20 },
    ],
  })
  assert.equal(t.vat, 2513)
  assert.equal(t.total, 19268)
  assert.deepEqual(t.withholdings.map((w) => w.amount), [56, 419, 42, 419])
  assert.equal(t.withholdingTotal, 936)
  assert.equal(t.payable, 18332)
  const entry = invoiceEntry(t, expenseLines, [], { vatPurchases: 'iva', suppliers: 'prov' })
  assert.ok(entryReady(entry))
  assert.ok(!entryReady(invoiceEntry(t, expenseLines, [], { vatPurchases: 'iva' })), 'sin cuenta de proveedores no se graba')
})
