// Correr con: pnpm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compactMoney, linePoints, niceScale } from './salesChart.ts'

test('niceScale redondea el tope del eje', () => {
  assert.deepEqual(niceScale(0), { max: 400, step: 100 })
  assert.deepEqual(niceScale(3_700_000), { max: 4_000_000, step: 1_000_000 })
  assert.deepEqual(niceScale(4_100_000), { max: 8_000_000, step: 2_000_000 })
  const s = niceScale(12_345_678)
  assert.ok(s.max >= 12_345_678 && s.max === s.step * 4)
})

test('compactMoney', () => {
  assert.equal(compactMoney(123_456_789), '$1.2M')
  assert.equal(compactMoney(4_500_000), '$45k')
  assert.equal(compactMoney(90_000), '$900')
  assert.equal(compactMoney(0), '$0')
})

test('linePoints: primero a la izquierda, último a la derecha, 0 abajo', () => {
  const box = { width: 100, height: 50, left: 10, right: 10, top: 5, bottom: 5 }
  const p = linePoints([0, 50, 100], 100, box)
  assert.deepEqual(p[0], { x: 10, y: 45 })
  assert.deepEqual(p[2], { x: 90, y: 5 })
  assert.equal(p[1]!.y, 25)
})
