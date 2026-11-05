import { test } from 'node:test'
import assert from 'node:assert/strict'
import { accountCode, chartCsvFromCells, macioReportKind, suppliersFromCells, type Cells } from './macioExcel.ts'

// Filas como salen del .xls de Macio: código en la col 1 (mayor) o 2 (movimiento), X de Mayor en la 24 y de Movimiento en la 27.
const row = (cells: Record<number, string>) => Array.from({ length: 50 }, (_, i) => cells[i] ?? '')

test('plan de cuentas de Macio → CSV del importador', () => {
  assert.equal(accountCode('1.1.01. . . .'), '1.1.01')
  assert.equal(accountCode('1.1.01.01.01.001.'), '1.1.01.01.01.001')
  assert.equal(accountCode('0993014214001'), null, 'el RUC del título no es una cuenta')
  const cells: Cells = [
    row({ 7: 'IMPORTADORA TAPIA' }),
    row({ 7: '0993014214001' }),
    row({ 11: 'Plan de cuentas' }),
    row({ 1: 'Código', 9: 'Clave', 14: 'Nombre' }),
    row({ 1: '1. . . . . .', 14: 'ACTIVO', 24: 'X' }),
    row({ 1: '1.1. . . . .', 14: 'ACTIVO CORRIENTE', 24: 'X' }),
    row({ 2: '1.1.01.', 9: '18679', 14: 'Caja; Chica', 27: 'X', 33: 'Caja' }),
    row({ 1: '2', 27: 'X', 33: '.NULL.' }),
    row({ 36: 'Pág. # 1' }),
  ]
  assert.equal(macioReportKind(cells), 'plan')
  assert.deepEqual(chartCsvFromCells(cells), { csv: '1;ACTIVO;mayor\n1.1;ACTIVO CORRIENTE;mayor\n1.1.01;Caja, Chica;movimiento', count: 3 })
})

test('listado de proveedores de Macio → filas con cada dato en su columna', () => {
  const cells: Cells = [
    row({ 9: 'Reporte de Proveedores por tipo' }),
    row({ 5: 'Proveedor', 14: 'Identificación', 18: 'Dirección', 22: 'Teléfono', 30: 'Email' }),
    row({ 1: 'SIN ASIGNAR TIPO' }),
    row({ 2: 'ABAD ERAS JULY CARLA', 14: '0703687236001', 18: 'BARRIO MANANTIAL', 24: '999999999 -' }),
    row({ 2: 'ACGROUP', 14: '0992304219001', 24: '593426801-00', 29: 'a@acgroup.ec;b@acgroup.ec' }),
    row({ 4: 'Usuario:Geovanny Fecha:05/11/2026' }),
    row({ 2: 'Total de Registros :', 18: '1486' }),
    row({ 5: 'Proveedor', 14: 'Identificación', 18: 'Dirección' }),
  ]
  assert.equal(macioReportKind(cells), 'proveedores')
  assert.deepEqual(suppliersFromCells(cells), [
    { line: 4, name: 'ABAD ERAS JULY CARLA', identification: '0703687236001', address: 'BARRIO MANANTIAL', phone: '999999999 -', email: '' },
    { line: 5, name: 'ACGROUP', identification: '0992304219001', address: '', phone: '593426801-00', email: 'a@acgroup.ec;b@acgroup.ec' },
  ])
})
