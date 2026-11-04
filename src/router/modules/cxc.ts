import { defineModule } from '../defineModule'

// Permisos: cartera y contabilidad escriben, facturación lee (config/access.ts, igual que receivables.routes del API).
export default defineModule('cxc', [
  {
    path: 'cobros',
    name: 'Collections',
    title: 'Cobros',
    section: 'procesos',
    component: () => import('@/views/cxc/CollectionsView.vue'),
  },
  {
    path: 'cheques-posfechados',
    name: 'PostdatedChecks',
    title: 'Cheques posfechados',
    section: 'procesos',
    component: () => import('@/views/cxc/PostdatedChecksView.vue'),
  },
  {
    path: 'retenciones',
    name: 'WithholdingsReceived',
    title: 'Retenciones recibidas',
    section: 'procesos',
    component: () => import('@/views/cxc/WithholdingsReceivedView.vue'),
  },
  {
    path: 'facturas-cobros',
    name: 'InvoicesReceipts',
    title: 'Facturas y cobros',
    section: 'reportes',
    component: () => import('@/views/cxc/InvoicesReceiptsView.vue'),
  },
  {
    path: 'cartera-edades',
    name: 'Aging',
    title: 'Cartera por edades',
    section: 'reportes',
    component: () => import('@/views/cxc/AgingView.vue'),
  },
  {
    path: 'estado-cuenta',
    name: 'CustomerStatement',
    title: 'Estado de cuenta',
    section: 'reportes',
    component: () => import('@/views/cxc/CustomerStatementView.vue'),
  },
  {
    path: 'retenciones-venta',
    name: 'SalesWithholdingsReport',
    title: 'Retenciones en venta',
    section: 'reportes',
    component: () => import('@/views/cxc/SalesWithholdingsReportView.vue'),
  },
  {
    path: 'comisiones',
    name: 'Commissions',
    title: 'Comisiones por vendedor',
    section: 'reportes',
    component: () => import('@/views/cxc/CommissionsView.vue'),
  },
  {
    path: 'clientes',
    name: 'ReceivablesCustomers',
    title: 'Clientes',
    section: 'mantenimientos',
    component: () => import('@/views/configuracion/PartiesView.vue'),
    writers: ['contabilidad', 'facturacion', 'cartera'],
    props: { kind: 'customer' },
  },
])
