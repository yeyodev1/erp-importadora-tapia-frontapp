import { defineModule } from '../defineModule'

export default defineModule('inicio', [
  {
    path: '',
    name: 'Home',
    title: 'Inicio',
    section: 'procesos',
    component: () => import('@/views/inicio/DashboardView.vue'),
  },
  // Fuera del menú: se entra por la campana del topbar (y su badge ya avisa).
  {
    path: 'notificaciones',
    name: 'Notifications',
    title: 'Notificaciones',
    section: 'general',
    hidden: true,
    component: () => import('@/views/inicio/NotificationsView.vue'),
  },
])
