import { onMounted, reactive, watch } from 'vue'
import type { ListParams } from '@/services/catalog.service'
import type { ApiError, Paginated } from '@/types'

/**
 * Listado con búsqueda y paginación del servidor (`{ items, total, page,
 * pages }`). `filters` se vuelve a leer en cada carga; si cambia, vuelve a
 * la página 1. `fetchAll` trae todas las páginas para Excel/impresión.
 */
export function useList<T>(
  fetch: (params: ListParams) => Promise<Paginated<T>>,
  filters: () => ListParams = () => ({}),
  limit = 50,
) {
  const list = reactive({
    q: '',
    page: 1,
    items: [] as T[],
    total: 0,
    pages: 1,
    loading: false,
    error: '',
    reload: load,
    fetchAll,
  })
  let ticket = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const params = (): ListParams => ({ ...filters(), q: list.q.trim() || undefined })

  async function load() {
    const mine = ++ticket
    list.loading = true
    list.error = ''
    try {
      const res = await fetch({ ...params(), page: list.page, limit })
      if (mine !== ticket) return
      list.items = res.items as typeof list.items
      list.total = res.total
      list.pages = res.pages
    } catch (e) {
      if (mine === ticket) list.error = (e as ApiError).message
    } finally {
      if (mine === ticket) list.loading = false
    }
  }

  async function fetchAll(): Promise<T[]> {
    const all: T[] = []
    for (let page = 1; ; page++) {
      const res = await fetch({ ...params(), page, limit: 500 })
      all.push(...res.items)
      if (page >= res.pages) return all
    }
  }

  function restart() {
    if (list.page !== 1) list.page = 1
    else load()
  }

  watch(
    () => list.q,
    () => {
      clearTimeout(timer)
      timer = setTimeout(restart, 300)
    },
  )
  watch(() => JSON.stringify(filters()), restart)
  watch(() => list.page, load)
  onMounted(load)

  return list
}
