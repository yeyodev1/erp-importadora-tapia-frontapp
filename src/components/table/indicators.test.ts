// Correr con: pnpm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { overdueDays, overdueIndicator, signedLevel, stockLevel } from './indicators.ts'

test('días de atraso desde número o fecha de vencimiento', () => {
  assert.equal(overdueDays(5), 5)
  assert.equal(overdueDays('2026-11-01', '2026-11-04'), 3)
  assert.equal(overdueDays('2026-11-10T12:00:00.000Z', '2026-11-04'), -6)
  assert.equal(overdueDays(''), null)
  assert.equal(overdueDays('no es fecha'), null)
})

test('chip de vencimiento: al día, ámbar hasta 90, rojo después', () => {
  assert.deepEqual(overdueIndicator(-3), { level: 'success', label: 'Al día' })
  assert.deepEqual(overdueIndicator(0), { level: 'success', label: 'Al día' })
  assert.deepEqual(overdueIndicator(1), { level: 'warning', label: '1 día' })
  assert.deepEqual(overdueIndicator(90), { level: 'warning', label: '90 días' })
  assert.deepEqual(overdueIndicator(120), { level: 'danger', label: '+90 · 120 días' })
  assert.equal(overdueIndicator(null), null)
})

test('stock: negativo rojo, bajo el mínimo ámbar', () => {
  assert.equal(stockLevel(-1, 10), 'danger')
  assert.equal(stockLevel(4, 10), 'warning')
  assert.equal(stockLevel(10, 10), null)
  assert.equal(stockLevel(4), null)
  assert.equal(stockLevel(0, 0), null)
  assert.equal(signedLevel(-100), 'danger')
  assert.equal(signedLevel(100), null)
})
