import { ref, shallowRef } from 'vue'
import { formatMonth, shiftMonth, todayISO } from '@/utils/format'
import type { ApiError, ComboOption } from '@/types'

/**
 * Un reporte que se consulta a pedido: `run` llama al API y guarda el
 * resultado; si se pide otro antes de que llegue el anterior, gana el último.
 */
export function useReport<T>(fetch: () => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref('')
  let ticket = 0

  async function run() {
    const mine = ++ticket
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

  return { data, loading, error, run }
}

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase())

/** "2026-09" → "Septiembre de 2026". */
export const monthLabel = (period: string) => cap(formatMonth(period))

/** Mes actual y los `count − 1` anteriores, para BaseCombobox. */
export function monthOptions(count = 36): ComboOption[] {
  const current = todayISO().slice(0, 7)
  return Array.from({ length: count }, (_, i) => shiftMonth(current, -i)).map((p) => ({ value: p, label: monthLabel(p) }))
}

export const currentMonth = () => todayISO().slice(0, 7)

/** Último día de un mes "AAAA-MM" → "30 de septiembre de 2026" (título del Reporte de saldos). */
export function monthEndLong(period: string): string {
  const [y = 0, m = 1] = period.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${last} de ${cap(formatMonth(period)).replace(' de ', ' del ')}`
}
