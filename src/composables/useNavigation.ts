import { computed } from 'vue'
import { site, type SectionKey } from '@/config/site'
import { canView } from '@/config/access'
import { modules } from '@/router/modules'
import { useUserStore } from '@/stores/user'

const ORDER = Object.keys(site.sections) as SectionKey[]

/**
 * Menú lateral según el rol: módulos en el orden del sistema actual, cada
 * uno con sus submenús (Procesos, Mantenimientos, Reportes…). Sale de las
 * mismas pantallas de src/router/modules: no hay una lista aparte que mantener.
 */
export function useNavigation() {
  const user = useUserStore()

  const nav = computed(() =>
    site.modules
      .map((mod) => {
        const screens = modules[mod.key].screens.filter(
          (s) => !s.hidden && canView(user.role, { module: mod.key, adminOnly: s.adminOnly }),
        )
        const sections = ORDER.map((key) => ({
          key,
          label: site.sections[key],
          items: screens.filter((s) => s.section === key),
        })).filter((s) => s.items.length)
        return { ...mod, screens, sections }
      })
      .filter((mod) => mod.screens.length),
  )

  return { nav }
}
