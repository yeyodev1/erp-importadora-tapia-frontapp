import { computed, ref, watch } from 'vue'
import { payrollService, type Payroll } from '@/services/payroll.service'
import { useToastStore } from '@/stores/toast'
import { currentMonth } from '@/composables/accounting/useReport'
import { cloneData } from '@/utils/clone'
import { nominaRol as t } from '@/config/copy/nominaRol'
import type { ApiError } from '@/types'

/**
 * Estado del rol del mes elegido: carga el vigente (o el último anulado),
 * genera, guarda las ediciones del borrador, aprueba y anula.
 */
export function usePayroll() {
  const toast = useToastStore()
  const period = ref(currentMonth())
  const payroll = ref<Payroll | null>(null)
  const saved = ref('')
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const actionError = ref('')
  let ticket = 0

  const isDraft = computed(() => payroll.value?.status === 'borrador')
  const dirty = computed(() => Boolean(payroll.value) && JSON.stringify(payroll.value!.lines) !== saved.value)

  function set(p: Payroll | null) {
    payroll.value = p ? cloneData(p) : null
    saved.value = p ? JSON.stringify(payroll.value!.lines) : ''
  }

  async function load() {
    const mine = ++ticket
    loading.value = true
    error.value = ''
    try {
      const { items } = await payrollService.payrolls(period.value)
      const current = items.find((p) => p.status !== 'anulado') ?? items[0]
      const full = current ? await payrollService.payroll(current._id) : null
      if (mine === ticket) set(full)
    } catch (e) {
      if (mine === ticket) error.value = (e as ApiError).message
    } finally {
      if (mine === ticket) loading.value = false
    }
  }
  watch(period, load, { immediate: true })

  async function act(fn: () => Promise<Payroll>, message: string) {
    busy.value = true
    actionError.value = ''
    try {
      set(await fn())
      toast.success(message)
      return true
    } catch (e) {
      actionError.value = (e as ApiError).message
      toast.error(actionError.value)
      return false
    } finally {
      busy.value = false
    }
  }

  const edits = () =>
    payroll.value!.lines.map((l) => ({ employeeId: l.employeeId, days: l.days, extras: l.extras ?? 0, commissions: l.commissions ?? 0, otherDeductions: l.otherDeductions ?? 0 }))

  const generate = () => act(() => payrollService.generate(period.value), t.generated)
  const save = () => act(() => payrollService.saveLines(payroll.value!._id, edits()), t.saved)
  async function approve() {
    if (dirty.value && !(await save())) return false
    return act(() => payrollService.approve(payroll.value!._id), t.approved)
  }
  const voidPayroll = (reason: string) => act(() => payrollService.void(payroll.value!._id, reason), t.voided)

  return { period, payroll, loading, busy, error, actionError, isDraft, dirty, load, generate, save, approve, voidPayroll }
}
