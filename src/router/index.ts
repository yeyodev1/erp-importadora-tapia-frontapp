import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import { site } from '@/config/site'
import { canView } from '@/config/access'
import { navigating } from '@/composables/useProgress'
import { modules } from './modules'
import './types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Ingresar', guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/layout/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      ...Object.values(modules).flatMap((m) => m.routes),
      {
        path: ':pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { title: 'Página no encontrada', requiresAuth: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { left: 0, top: 0 }
  },
})

router.beforeEach(async (to) => {
  navigating.value = true
  const userStore = useUserStore()

  if (to.meta.guestOnly) {
    await userStore.restore()
    if (userStore.isAuthenticated) return { name: 'Home', replace: true }
    return
  }

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    if (!userStore.hasStoredToken()) return { name: 'Login', query: { next: to.fullPath }, replace: true }
    // Aquí sí se espera a /auth/me: sin el rol no se sabe qué puede ver.
    const user = await userStore.restore()
    if (!user) return { name: 'Login', query: { next: to.fullPath }, replace: true }
  }

  if (!canView(userStore.role, to.meta)) {
    useToastStore().error(site.access.denied)
    return to.name === 'Home' ? false : { name: 'Home', replace: true }
  }
})

router.onError(() => (navigating.value = false))

router.afterEach((to) => {
  navigating.value = false
  const title = to.meta.title
  document.title = title && title !== site.name ? `${title} — ${site.name}` : site.name
})

export default router
