import { ref, shallowRef } from 'vue'
import type { ApiError } from '@/types'

/** Reporte que se pide de una vez (sin paginación): datos, carga, error y resumen de filtros para la hoja impresa. */
export function useReport<T>(fetch: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref('')
  const summary = ref<string[]>([])
  let ticket = 0

  async function run(s: string[] = summary.value) {
    const mine = ++ticket
    summary.value = s
    loading.value = true
    error.value = ''
    try {
      const res = await fetch()
      if (mine === ticket) data.value = res
    } catch (e) {
      if (mine === ticket) error.value = (e as ApiError).message
    } finally {
      if (mine === ticket) loading.value = false
    }
  }

  return { data, loading, error, summary, run }
}
