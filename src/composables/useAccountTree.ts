import { computed, onMounted, reactive, ref } from 'vue'
import { catalogService } from '@/services/catalog.service'
import type { Account, ApiError } from '@/types'

const NORMALIZE = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** "1.1.10" va después de "1.1.9": se compara tramo por tramo como número. */
function compareCodes(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? -1) - (pb[i] ?? -1)
    if (d) return d
  }
  return 0
}

const ancestors = (code: string) => {
  const parts = code.split('.')
  return parts.slice(1).map((_, i) => parts.slice(0, i + 1).join('.'))
}

/**
 * Plan de cuentas como árbol por código. Se trae completo (son cientos de
 * cuentas) y se filtra en el navegador: buscar muestra la cuenta y sus padres.
 */
export function useAccountTree() {
  const all = ref<Account[]>([])
  const state = reactive({ loading: true, error: '', q: '', showInactive: false })
  const collapsed = ref(new Set<string>())

  async function load() {
    state.loading = true
    state.error = ''
    try {
      const items = await catalogService.listAll('accounts', { active: 'all' })
      all.value = items.sort((a, b) => compareCodes(a.code, b.code))
      // Al abrir se ven los dos primeros niveles, como el plan impreso.
      if (!collapsed.value.size) collapsed.value = new Set(all.value.filter((a) => a.kind === 'mayor' && a.level >= 2).map((a) => a.code))
    } catch (e) {
      state.error = (e as ApiError).message
    } finally {
      state.loading = false
    }
  }
  onMounted(load)

  const parents = computed(() => new Set(all.value.map((a) => a.parentCode).filter(Boolean) as string[]))

  const rows = computed(() => {
    const base = state.showInactive ? all.value : all.value.filter((a) => a.isActive)
    const q = NORMALIZE(state.q.trim())
    if (q) {
      const hits = base.filter((a) => a.code.startsWith(q) || NORMALIZE(a.name).includes(q))
      const keep = new Set(hits.flatMap((a) => [a.code, ...ancestors(a.code)]))
      return base.filter((a) => keep.has(a.code))
    }
    return base.filter((a) => !ancestors(a.code).some((c) => collapsed.value.has(c)))
  })

  function toggle(code: string) {
    const next = new Set(collapsed.value)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    collapsed.value = next
  }

  const expandAll = () => (collapsed.value = new Set())
  const collapseAll = () => (collapsed.value = new Set(all.value.filter((a) => a.kind === 'mayor').map((a) => a.code)))

  return { state, rows, collapsed, parents, load, toggle, expandAll, collapseAll }
}
