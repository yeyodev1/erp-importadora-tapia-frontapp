import { defineModule } from '../defineModule'
import type { Role } from '@/types'

// Igual que requireRoles del API de inventario (gerencia pasa siempre).
const WRITERS: Role[] = ['contabilidad', 'bodega']

export default defineModule('inventario', [
  {
    path: 'transacciones',
    name: 'InventoryTransactions',
    title: 'Transacciones',
    section: 'procesos',
    component: () => import('@/views/inventario/TransactionsView.vue'),
    writers: WRITERS,
  },
  {
    path: 'transacciones/nueva',
    name: 'InventoryTransactionNew',
    title: 'Nueva transacción',
    section: 'procesos',
    component: () => import('@/views/inventario/TransactionFormView.vue'),
    writers: WRITERS,
    hidden: true,
  },
  {
    path: 'transacciones/:id',
    name: 'InventoryTransactionDetail',
    title: 'Transacción',
    section: 'procesos',
    component: () => import('@/views/inventario/TransactionDetailView.vue'),
    writers: WRITERS,
    hidden: true,
  },
  {
    path: 'toma-fisica',
    name: 'PhysicalCount',
    title: 'Toma física',
    section: 'procesos',
    component: () => import('@/views/inventario/PhysicalCountView.vue'),
    writers: WRITERS,
  },
  {
    path: 'kardex',
    name: 'Kardex',
    title: 'Kardex',
    section: 'reportes',
    component: () => import('@/views/inventario/KardexView.vue'),
  },
  {
    path: 'saldos',
    name: 'StockBalances',
    title: 'Saldos',
    section: 'reportes',
    component: () => import('@/views/inventario/StockBalancesView.vue'),
  },
  {
    path: 'negativos',
    name: 'InventoryNegatives',
    title: 'Negativos en el kardex',
    section: 'reportes',
    component: () => import('@/views/inventario/NegativesView.vue'),
  },
  {
    path: 'bajo-minimo',
    name: 'BelowMinimum',
    title: 'Stock bajo el mínimo',
    section: 'reportes',
    component: () => import('@/views/inventario/BelowMinimumView.vue'),
  },
  {
    path: 'productos',
    name: 'InventoryProducts',
    title: 'Productos',
    section: 'mantenimientos',
    component: () => import('@/views/configuracion/ProductsView.vue'),
    writers: ['contabilidad', 'bodega'],
  },
  {
    path: 'grupos',
    name: 'InventoryGroups',
    title: 'Grupos de producto',
    section: 'mantenimientos',
    component: () => import('@/views/configuracion/ProductGroupsView.vue'),
    writers: ['contabilidad'],
  },
  {
    path: 'bodegas',
    name: 'InventoryWarehouses',
    title: 'Bodegas',
    section: 'mantenimientos',
    component: () => import('@/views/configuracion/WarehousesView.vue'),
    writers: [],
  },
])
