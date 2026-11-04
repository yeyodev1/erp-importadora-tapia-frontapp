import { defineModule } from '../defineModule'

export default defineModule('impuestos', [
  {
    path: 'ats',
    name: 'Ats',
    title: 'ATS',
    section: 'procesos',
    component: () => import('@/views/impuestos/AtsView.vue'),
  },
  {
    path: 'retenciones',
    name: 'WithholdingsReport',
    title: 'Retenciones',
    section: 'reportes',
    component: () => import('@/views/impuestos/WithholdingsReportView.vue'),
  },
  {
    path: 'compras-sustento',
    name: 'PurchasesBySupport',
    title: 'Compras por sustento',
    section: 'reportes',
    component: () => import('@/views/impuestos/PurchasesBySupportView.vue'),
  },
  {
    path: 'cuadre-mensual',
    name: 'TaxMonthlyCheck',
    title: 'Cuadre mensual',
    section: 'reportes',
    component: () => import('@/views/impuestos/MonthlyCheckView.vue'),
  },
])
