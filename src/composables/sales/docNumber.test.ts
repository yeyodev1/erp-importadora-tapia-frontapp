// Correr con: node --test src/composables/sales/docNumber.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitNumber } from './docNumber.ts'

test('separa serie y número de un comprobante SRI', () => {
  assert.deepEqual(splitNumber('001-001-000012190'), { series: '001-001', seq: '000012190' })
  assert.deepEqual(splitNumber('COB-000125'), { series: '', seq: 'COB-000125' })
  assert.deepEqual(splitNumber(undefined), { series: '', seq: '' })
})
