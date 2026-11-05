import { defineModule } from '../defineModule'

// Nómina: contabilidad graba (admin siempre); el auditor solo lee.
export default defineModule('nomina', [
  {
    path: 'rol-pagos',
    name: 'Payroll',
    title: 'Rol de pagos',
    section: 'procesos',
    component: () => import('@/views/nomina/PayrollView.vue'),
    writers: ['contabilidad'],
  },
  {
    path: 'empleados',
    name: 'Employees',
    title: 'Empleados',
    section: 'mantenimientos',
    component: () => import('@/views/nomina/EmployeesView.vue'),
    writers: ['contabilidad'],
  },
  {
    path: 'prestamos',
    name: 'EmployeeLoans',
    title: 'Préstamos',
    section: 'mantenimientos',
    component: () => import('@/views/nomina/LoansView.vue'),
    writers: ['contabilidad'],
  },
])
