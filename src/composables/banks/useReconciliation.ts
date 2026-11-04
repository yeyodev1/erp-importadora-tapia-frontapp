import { computed, onBeforeUnmount, ref } from 'vue'
import { banksService, type BankMovement, type Reconciliation, type ReconSummary } from '@/services/banks.service'
import { liveSummary } from './reconMath'
import { printReport } from '@/composables/usePrint'
import { useToastStore } from '@/stores/toast'
import { bancos } from '@/config/copy/bancos'
import { formatMoney } from '@/utils/money'
import type { ApiError } from '@/types'

export function useReconciliation(id: string) {
  const toast = useToastStore()
  const rec = ref<Reconciliation | null>(null)
  const loadError = ref('')
  const busy = ref(false)
  const isOpen = computed(() => rec.value?.status === 'abierta')
  const summary = computed<ReconSummary | null>(() => {
    if (!rec.value) return null
    if (!isOpen.value) return rec.value.summary
    const s = liveSummary(rec.value, rec.value.statementBalance)
    return { ...s, message: s.balanced ? bancos.rec.summary.balanced : `${bancos.rec.summary.difference} ${formatMoney(s.difference)}` }
  })

  let timer: ReturnType<typeof setTimeout> | undefined
  let ticket = 0

  async function fetch() {
    loadError.value = ''
    try {
      rec.value = await banksService.getReconciliation(id)
    } catch (e) {
      loadError.value = (e as ApiError).message
    }
  }

  /** Corre una acción del API que devuelve la conciliación completa. */
  async function act(job: () => Promise<Reconciliation>, ok?: string) {
    busy.value = true
    try {
      await saveMarks() // nada de cerrar con marcas sin grabar
      rec.value = await job()
      if (ok) toast.success(ok)
      return true
    } catch (e) {
      toast.error((e as ApiError).message)
      return false
    } finally {
      busy.value = false
    }
  }

  // Marcas y saldo del estado de cuenta se graban con espera: varios clics seguidos = un solo PATCH.
  let dirty = false
  async function saveMarks() {
    clearTimeout(timer)
    if (!dirty || !rec.value) return
    dirty = false
    const mine = ++ticket
    const clearedIds = rec.value.movements.filter((m) => m.cleared).map((m) => m._id)
    try {
      const fresh = await banksService.updateReconciliation(id, { clearedIds, statementBalance: rec.value.statementBalance })
      if (mine === ticket && !dirty) rec.value = fresh
    } catch (e) {
      toast.error((e as ApiError).message)
      if (mine === ticket) await fetch()
    }
  }
  function persistMarks() {
    dirty = true
    clearTimeout(timer)
    timer = setTimeout(saveMarks, 400)
  }
  onBeforeUnmount(saveMarks) // salir de la pantalla no pierde marcas

  function mark(m: BankMovement, value: boolean) {
    m.cleared = value
    persistMarks()
  }

  function markAll(value: boolean) {
    rec.value?.movements.forEach((m) => (m.cleared = value))
    persistMarks()
  }

  function setStatementBalance(cents: number | null) {
    if (!rec.value) return
    rec.value.statementBalance = cents ?? 0
    persistMarks()
  }
  const load = () => act(() => banksService.loadMovements(id), bancos.rec.loaded)
  const close = (reason = '') => act(() => banksService.closeReconciliation(id, reason ? { force: true, reason } : {}), bancos.rec.closed)
  const reopen = (reason: string) => act(() => banksService.reopenReconciliation(id, reason), bancos.rec.reopened)
  const replace = (fresh: Reconciliation) => (rec.value = fresh)

  /** Reporte como el del sistema actual: Fecha | Descripción | Valor, por secciones. */
  async function print() {
    try {
      const r = await banksService.reconciliationReport(id)
      const c = bancos.rec.report
      const head = (description: string, amount?: number) => ({ date: '', description, amount })
      const detail = (d: typeof r.outstandingChecks) =>
        d.items.map((i) => ({ date: i.date, description: i.description, amount: i.amount }))
      const rows = [
        head(c.statement, r.statementBalance),
        head(c.checks, r.outstandingChecks.total),
        ...detail(r.outstandingChecks),
        head(c.deposits, r.depositsInTransit.total),
        ...detail(r.depositsInTransit),
        head(c.reconciled, r.reconciledBankBalance),
        head(c.accounting, r.accountingBalance),
        head(c.adjusted, r.adjustedBalance),
        head(c.difference, r.difference),
      ]
      const filters = [r.message, `${c.records}: ${r.totalRecords}`, r.forceReason ? `${c.force}: ${r.forceReason}` : ''].filter(Boolean)
      printReport({
        title: r.title,
        filters,
        columns: [
          { key: 'date', label: c.cols.date, format: 'date', width: '7rem' },
          { key: 'description', label: c.cols.description },
          { key: 'amount', label: c.cols.amount, format: 'money' },
        ],
        rows,
      })
    } catch (e) {
      toast.error((e as ApiError).message)
    }
  }

  fetch()
  return { rec, loadError, busy, isOpen, summary, fetch, mark, markAll, setStatementBalance, load, close, reopen, replace, print }
}
