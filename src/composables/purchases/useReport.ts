import { reactive } from 'vue'
import type { ApiError } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
type Result = { items: Row[]; totals?: Record<string, number>; [k: string]: unknown }

/**
 * Estado de un reporte de CxP que se consulta con un botón (no paginado):
 * filas, totales del servidor, el resto de la respuesta y el resumen de
 * filtros para la hoja impresa.
 */
export function useReport(fetch: () => Promise<Result>) {
  const r = reactive({
    rows: [] as Row[],
    totals: undefined as Record<string, number> | undefined,
    data: null as Result | null,
    loading: false,
    error: '',
    summary: [] as string[],
    ran: false,
    run,
  })

  async function run(summary: string[] = []) {
    r.loading = true
    r.error = ''
    r.summary = summary
    try {
      r.data = await fetch()
      r.rows = r.data.items
      r.totals = r.data.totals
      r.ran = true
    } catch (e) {
      r.error = (e as ApiError).message
    } finally {
      r.loading = false
    }
  }

  return r
}

/** Reportes agrupados del API ({ ...grupo, items }): resumido = un renglón por grupo; detallado = cada documento con su grupo. */
export function flattenGroups(groups: Row[], detailed: boolean, label: (g: Row) => string): Row[] {
  if (!detailed) return groups.map((g) => ({ ...g, group: label(g) }))
  return groups.flatMap((g) => (g.items ?? [g]).map((i: Row, n: number) => ({ ...i, group: label(g), _id: `${label(g)}-${n}` })))
}
