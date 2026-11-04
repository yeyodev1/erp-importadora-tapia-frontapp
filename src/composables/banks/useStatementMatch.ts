import { computed, reactive, ref } from 'vue'
import { banksService, type ColumnKey, type ColumnMapping, type MatchResult, type Reconciliation, type StatementLine } from '@/services/banks.service'
import { useToastStore } from '@/stores/toast'
import { bancos } from '@/config/copy/bancos'
import type { ApiError } from '@/types'

export const COLUMN_KEYS: ColumnKey[] = ['date', 'description', 'reference', 'debit', 'credit', 'amount']

/**
 * Encabezados probables del CSV para el mapeo manual cuando el API no los
 * reconoce (su error no los devuelve). Toma la primera fila con 3+ celdas.
 * shortcut: no respeta comillas al partir; si un banco pone comas dentro de
 * un encabezado entre comillas, usar el parser del API (exponer headers en el error).
 */
export function guessHeaders(csv: string): string[] {
  const rows = csv.split(/\r?\n/).filter((r) => r.trim())
  const sep = [';', '\t', ','].sort((a, b) => rows.slice(0, 20).join('').split(b).length - rows.slice(0, 20).join('').split(a).length)[0]!
  const row = rows.find((r) => r.split(sep).length >= 3) ?? rows[0] ?? ''
  return row.split(sep).map((c) => c.trim().replace(/^"|"$/g, '')).filter(Boolean)
}

/**
 * Conciliación semiautomática. `propose` solo lee (match); el contador
 * acepta o descarta cada propuesta y recién `confirm` graba las marcas.
 * Las líneas sin pareja se registran como nota de débito/crédito (eso sí graba).
 */
export function useStatementMatch(recId: string, onSaved: (rec: Reconciliation) => void) {
  const toast = useToastStore()
  const csv = ref('')
  const mapping = reactive<ColumnMapping>({})
  const headers = ref<string[]>([])
  const result = ref<MatchResult | null>(null)
  const accepted = ref(new Set<string>())
  const running = ref(false)
  const error = ref('')
  const showMapping = ref(false)

  async function readFile(file: File | undefined) {
    if (!file) return
    csv.value = await file.text()
  }

  async function propose() {
    error.value = ''
    if (!csv.value.trim()) return (error.value = bancos.statement.paste.label)
    running.value = true
    try {
      const clean = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v)) as ColumnMapping
      const res = await banksService.matchStatement(recId, csv.value, clean)
      result.value = res
      headers.value = res.headers
      accepted.value = new Set(res.proposals.map((p) => p.movementId))
    } catch (e) {
      error.value = (e as ApiError).message
      result.value = null
      headers.value = guessHeaders(csv.value)
      showMapping.value = true
    } finally {
      running.value = false
    }
  }

  const toggle = (id: string, on: boolean) => {
    const next = new Set(accepted.value)
    if (on) next.add(id)
    else next.delete(id)
    accepted.value = next
  }
  const setAll = (on: boolean) => (accepted.value = new Set(on ? result.value?.proposals.map((p) => p.movementId) : []))
  const acceptedCount = computed(() => accepted.value.size)

  async function confirm() {
    if (!accepted.value.size) return
    running.value = true
    try {
      const ids = [...accepted.value]
      onSaved(await banksService.confirmMatches(recId, ids))
      toast.success(bancos.statement.confirmed(ids.length))
      // Quedan a la vista lo descartado y lo sin pareja (para registrar notas).
      if (result.value) result.value.proposals = result.value.proposals.filter((p) => !accepted.value.has(p.movementId))
      accepted.value = new Set()
    } catch (e) {
      toast.error((e as ApiError).message)
    } finally {
      running.value = false
    }
  }

  /** Graba la nota y saca la línea de la lista; las propuestas pendientes siguen sin grabar. */
  async function registerNote(line: StatementLine, accountCode: string) {
    const rec = await banksService.noteFromLine(recId, line, accountCode)
    onSaved(rec)
    if (result.value) result.value.unmatchedLines = result.value.unmatchedLines.filter((l) => l !== line)
    toast.success(bancos.statement.noteSaved)
  }

  function reset() {
    result.value = null
    accepted.value = new Set()
    error.value = ''
  }

  return { csv, mapping, headers, result, accepted, acceptedCount, running, error, showMapping, readFile, propose, toggle, setAll, confirm, registerNote, reset }
}
