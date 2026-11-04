import { reactive } from 'vue'
import { useToastStore } from '@/stores/toast'
import type { ApiError } from '@/types'

/**
 * Reporte que se consulta a pedido (botón Consultar de ReportFilters):
 * guarda el resultado, el error y el resumen de filtros para la hoja impresa.
 * `validate` devuelve el mensaje si faltan filtros obligatorios.
 */
export function useReport<T>(fetch: () => Promise<T>, validate: () => string | null = () => null) {
  const toast = useToastStore()
  const state = reactive({
    loading: false,
    error: '',
    data: null as T | null,
    summary: [] as string[],
    run,
  })
  let ticket = 0

  async function run(summary: string[] = state.summary) {
    const problem = validate()
    if (problem) return toast.error(problem)
    const mine = ++ticket
    state.summary = summary
    state.loading = true
    state.error = ''
    try {
      const data = await fetch()
      if (mine === ticket) state.data = data as typeof state.data
    } catch (e) {
      if (mine === ticket) state.error = (e as ApiError).message
    } finally {
      if (mine === ticket) state.loading = false
    }
  }

  return state
}
