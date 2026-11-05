import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cloneData } from './clone.ts'

test('copia objetos envueltos en Proxy (como los reactivos de Vue) sin compartir referencias', () => {
  const raw = { company: { ruc: '0993014214001', keepsAccounting: true }, accounts: { customers: '1.1.02.01.01.001' } }
  const proxy = new Proxy(raw, {})
  assert.throws(() => structuredClone(proxy))
  const copy = cloneData(proxy)
  assert.deepEqual(copy, raw)
  copy.company.ruc = 'x'
  assert.equal(raw.company.ruc, '0993014214001')
})
