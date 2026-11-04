// Correr con: pnpm test (node --test; Node 24 entiende TypeScript sin compilar).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMoney, toCents, toQty, sumCents } from './money.ts'

test('formatMoney', () => {
  assert.equal(formatMoney(123456), '$1,234.56')
  assert.equal(formatMoney(5), '$0.05')
  assert.equal(formatMoney(-123456789), '-$1,234,567.89')
  assert.equal(formatMoney(0), '$0.00')
  assert.equal(formatMoney(100000, false), '1,000.00')
  assert.equal(formatMoney(null), '')
})

test('toCents', () => {
  assert.equal(toCents('1.234,56'), 123456)
  assert.equal(toCents('1234.56'), 123456)
  assert.equal(toCents('1,234.56'), 123456)
  assert.equal(toCents('1234,5'), 123450)
  assert.equal(toCents('$ 1,234'), 123400)
  assert.equal(toCents('1.234'), 123400)
  assert.equal(toCents('1.234.567'), 123456700)
  assert.equal(toCents('0.1'), 10)
  assert.equal(toCents('0.005'), 1)
  assert.equal(toCents('19.9999'), 2000)
  assert.equal(toCents('19.999'), 1999900) // ambiguo: se lee como miles (formato es-EC)
  assert.equal(toCents('-25,50'), -2550)
  assert.equal(toCents('12'), 1200)
  assert.equal(toCents(''), null)
  assert.equal(toCents('abc'), null)
  assert.equal(toCents('1,2,3.4.5'), null)
})

test('toQty: 4 decimales', () => {
  assert.equal(toQty('1.23456'), 1.2346)
  assert.equal(toQty('100'), 100)
  assert.equal(toQty('2,5'), 2.5)
  assert.equal(toQty('1.234'), 1.234)
})

test('sumCents no acumula error de floats', () => {
  assert.equal(sumCents([{ v: 10 }, { v: 20 }, { v: 70 }], (r) => r.v), 100)
})
