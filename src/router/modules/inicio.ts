import { defineModule } from '../defineModule'

export default defineModule('inicio', [
  {
    path: '',
    name: 'Home',
    title: 'Inicio',
    section: 'procesos',
    component: () => import('@/views/inicio/DashboardView.vue'),
  },
])
