import { computed, reactive, ref, watch } from 'vue'
import type { EntryLine } from '@/components/documents/lines'
import { inventoryService, type InventoryTransaction, type JournalEntry } from '@/services/inventory.service'
import { inventario as copy } from '@/config/copy/inventario'
import { moduleAccess } from '@/config/access'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import type { ApiError } from '@/types'

/** Carga la transacción, su asiento (si el rol ve contabilidad) y la anula con motivo. */
export function useTransactionDetail(id: () => string) {
  const t = copy.detail
  const user = useUserStore()
  const toast = useToastStore()
  const doc = ref<InventoryTransaction | null>(null)
  const entry = ref<JournalEntry | null>(null)
  const loading = ref(false)
  const error = ref('')
  // El API de asientos es de contabilidad: bodega ve el documento pero no el asiento.
  const seesEntry = computed(() => moduleAccess(user.role, 'contabilidad') !== 'none')

  async function load() {
    loading.value = true
    error.value = ''
    entry.value = null
    try {
      doc.value = await inventoryService.getOne(id())
      if (doc.value.journalEntryId && seesEntry.value) entry.value = await inventoryService.entry(doc.value.journalEntryId)
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loading.value = false
    }
  }
  watch(id, load, { immediate: true })

  const entryLines = computed<EntryLine[]>(() =>
    (entry.value?.lines ?? []).map((l) => ({ accountCode: l.accountCode, accountName: l.accountName, description: l.description, debit: l.debit, credit: l.credit })),
  )

  const voiding = reactive({ show: false, confirm: false, reason: '', saving: false, error: '' })

  function askVoid() {
    if (!voiding.reason.trim()) return toast.error(t.reasonRequired)
    voiding.error = ''
    voiding.confirm = true
  }

  async function confirmVoid() {
    voiding.saving = true
    voiding.error = ''
    try {
      await inventoryService.voidTransaction(id(), voiding.reason.trim())
      toast.success(t.voided)
      Object.assign(voiding, { show: false, confirm: false, reason: '' })
      await load()
    } catch (e) {
      voiding.error = (e as ApiError).message
    } finally {
      voiding.saving = false
    }
  }

  return { doc, entryLines, seesEntry, loading, error, load, voiding, askVoid, confirmVoid }
}
