import { ref, watch, type Ref } from 'vue'
import type { ApiError } from '@/types'

/** Opción de un picker remoto: además del texto, el registro completo. */
export interface RemoteOption<D = unknown> {
  value: string
  label: string
  hint?: string
  data: D
}

/**
 * Búsqueda contra el API mientras se escribe: espera 250 ms entre teclas y
 * descarta respuestas viejas (la última búsqueda manda).
 */
export function useRemoteSearch<D>(
  term: Ref<string>,
  search: (q: string) => Promise<RemoteOption<D>[]>,
  exact?: (q: string) => Promise<RemoteOption<D> | null>,
) {
  const options = ref<RemoteOption<D>[]>([]) as Ref<RemoteOption<D>[]>
  const loading = ref(false)
  const error = ref('')
  const exactHit = ref<RemoteOption<D> | null>(null) as Ref<RemoteOption<D> | null>
  let ticket = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  async function run(q: string) {
    const mine = ++ticket
    loading.value = true
    error.value = ''
    try {
      const hit = exact ? await exact(q).catch(() => null) : null
      if (mine !== ticket) return
      if (hit) {
        exactHit.value = hit
        options.value = [hit]
        return
      }
      const found = await search(q)
      if (mine === ticket) options.value = found
    } catch (e) {
      if (mine === ticket) error.value = (e as ApiError).message
    } finally {
      if (mine === ticket) loading.value = false
    }
  }

  watch(term, (q) => {
    clearTimeout(timer)
    timer = setTimeout(() => run(q.trim()), 250)
  })

  return { options, loading, error, exactHit, run }
}

/**
 * Texto a mostrar para el valor actual de un picker (el v-model es un id o
 * un código). Se guarda en un caché compartido por tipo de picker para no
 * volver a pedirlo en cada fila de una grilla.
 */
const caches = new Map<string, Map<string, string>>()

export function useDisplayLabel(model: Ref<string>, kind: string, resolve: (value: string) => Promise<string>) {
  if (!caches.has(kind)) caches.set(kind, new Map())
  const cache = caches.get(kind)!
  const display = ref('')
  watch(
    model,
    async (value) => {
      if (!value) return (display.value = '')
      if (cache.has(value)) return (display.value = cache.get(value)!)
      display.value = ''
      const label = await resolve(value).catch(() => value)
      cache.set(value, label)
      if (model.value === value) display.value = label
    },
    { immediate: true },
  )
  /** Al elegir una opción ya se sabe su texto: se guarda sin ir al API. */
  const remember = (value: string, label: string) => {
    cache.set(value, label)
    display.value = label
  }
  return { display, remember }
}
