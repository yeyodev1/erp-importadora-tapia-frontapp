import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { canView, canWrite, moduleAccess } from '@/config/access'

/**
 * Lo que el usuario puede hacer en la pantalla actual. Las vistas esconden
 * botones de grabar con `canWrite`; el API igual lo valida.
 */
export function useAccess() {
  const route = useRoute()
  const user = useUserStore()
  return {
    role: computed(() => user.role),
    canWrite: computed(() => canWrite(user.role, route.meta)),
    /** Ve la pantalla pero no graba (auditor, o rol con lectura en el módulo). */
    readOnly: computed(
      () =>
        Boolean(route.meta.module) &&
        canView(user.role, route.meta) &&
        moduleAccess(user.role, route.meta.module!) === 'read',
    ),
  }
}
