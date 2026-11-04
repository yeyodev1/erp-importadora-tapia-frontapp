// Correr con: node --test src/composables/receivables/allocate.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyOldestFirst } from './allocate.ts'

const invs = [
  { _id: 'a', balance: 1000 },
  { _id: 'b', balance: 2500 },
  { _id: 'c', balance: 700 },
]

test('reparte de la más antigua a la más nueva sin pasar saldos', () => {
  assert.deepEqual(applyOldestFirst(3000, invs), { a: 1000, b: 2000, c: null })
})

test('lo que sobra queda sin aplicar', () => {
  assert.deepEqual(applyOldestFirst(5000, invs), { a: 1000, b: 2500, c: 700 })
})

test('cero no aplica nada', () => {
  assert.deepEqual(applyOldestFirst(0, invs), { a: null, b: null, c: null })
})
