import { nextTick, shallowRef } from 'vue'
import type { Column } from '@/components/table/columns'

/**
 * Impresión / PDF de reportes. Se llena el trabajo, ThePrintSheet (montado
 * una vez en App.vue, fuera de #app) lo pinta con el encabezado de la
 * empresa y el pie con usuario y fecha, y se abre el diálogo del navegador
 * (que también guarda como PDF).
 */
export interface PrintJob {
  title: string
  /** Una línea por filtro: "Desde 01/10/2026 hasta 31/10/2026". */
  filters?: string[]
  columns: Column[]
  rows: unknown[]
  totals?: Record<string, number>
  /** Hoja horizontal para reportes anchos. */
  landscape?: boolean
}

export const printJob = shallowRef<PrintJob | null>(null)

export async function printReport(job: PrintJob) {
  printJob.value = job
  await nextTick()
  document.body.classList.add('is-printing')
  if (job.landscape) document.body.classList.add('is-landscape')
  const done = () => {
    document.body.classList.remove('is-printing', 'is-landscape')
    printJob.value = null
  }
  window.addEventListener('afterprint', done, { once: true })
  window.print()
}
