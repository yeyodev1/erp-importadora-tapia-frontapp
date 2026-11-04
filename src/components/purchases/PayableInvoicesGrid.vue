<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import FormField from '@/components/ui/FormField.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { purchasesService } from '@/services/purchases.service'
import { formatMoney } from '@/utils/money'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError, Party } from '@/types'
import type { InvoiceAmountLine, PurchaseInvoice } from '@/types/purchases'

/**
 * Facturas por pagar de uno o varios proveedores con la columna editable
 * "Aprobar" (o "Cruzar"): todo el saldo libre o una parte. Libre = saldo −
 * lo ya aprobado y no pagado. v-model = líneas con valor > 0.
 */
const props = withDefaults(defineProps<{ amountLabel?: string; allowAll?: boolean; reloadKey?: number }>(), {
  amountLabel: 'Aprobar',
  allowAll: false,
  reloadKey: 0,
})
const lines = defineModel<InvoiceAmountLine[]>({ required: true })

const t = cxp.approvals
const suppliers = ref<{ id: string; name: string }[]>([])
const picker = ref('')
const invoices = ref<PurchaseInvoice[]>([])
const amounts = reactive<Record<string, number | null>>({})
const loading = ref(false)
const error = ref('')

const free = (i: PurchaseInvoice) => i.balance - i.approved
const supplierOf = (i: PurchaseInvoice) => (typeof i.supplierId === 'string' ? i.supplierId : i.supplierId._id)
const daysLate = (i: PurchaseInvoice) => Math.round((Date.parse(todayISO()) - Date.parse(i.dueDate.slice(0, 10))) / 86400000)

async function load() {
  for (const k of Object.keys(amounts)) delete amounts[k]
  if (!suppliers.value.length && !props.allowAll) return (invoices.value = [])
  loading.value = true
  error.value = ''
  try {
    const ids = suppliers.value.map((s) => s.id).join(',')
    const res = await purchasesService.listInvoices({ pending: 'true', supplierIds: ids || undefined, limit: 500 })
    invoices.value = res.items.filter((i) => free(i) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
watch([() => suppliers.value.length, () => props.reloadKey], load, { immediate: true })

function addSupplier(p: Party | null) {
  if (p && !suppliers.value.some((s) => s.id === p._id)) suppliers.value = [...suppliers.value, { id: p._id, name: p.name }]
  setTimeout(() => (picker.value = ''))
}
const removeSupplier = (id: string) => (suppliers.value = suppliers.value.filter((s) => s.id !== id))

watch(
  amounts,
  () => {
    lines.value = invoices.value
      .filter((i) => (amounts[i._id] ?? 0) > 0)
      .map((i) => ({ invoiceId: i._id, supplierId: supplierOf(i), amount: amounts[i._id]! }))
  },
  { deep: true },
)

const fillAll = () => invoices.value.forEach((i) => (amounts[i._id] = free(i)))
const clear = () => invoices.value.forEach((i) => (amounts[i._id] = null))
const total = computed(() => lines.value.reduce((a, l) => a + l.amount, 0))
const over = computed(() => invoices.value.filter((i) => (amounts[i._id] ?? 0) > free(i)).map((i) => i._id))

const columns = computed<Column<PurchaseInvoice>[]>(() => [
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'date', label: 'Fecha', format: 'date', width: '7rem' },
  { key: 'dueDate', label: 'Vencimiento', format: 'date', width: '7rem' },
  { key: 'days', label: 'Días vencida', format: 'int', value: daysLate, width: '4rem', help: t.columns.days },
  { key: 'docNumber', label: 'Número', width: '10rem' },
  { key: 'payable', label: 'Neto a pagar', format: 'money', help: t.columns.payable },
  { key: 'balance', label: 'Saldo', format: 'money', total: true, help: cxp.invoices.columns.balance },
  { key: 'approved', label: 'Ya aprobado', format: 'money', total: true, help: t.columns.approved },
  { key: 'free', label: 'Libre', format: 'money', value: free, total: true, help: t.columns.free },
  { key: 'amount', label: props.amountLabel, format: 'money', value: (i) => amounts[i._id] ?? 0, total: true, width: '9rem' },
])

defineExpose({ over, reload: load })
</script>

<template>
  <div class="pg">
    <div class="pg__suppliers">
      <FormField v-bind="t.fields.suppliers" for="pg-supplier" class="pg__picker">
        <PartyPicker id="pg-supplier" v-model="picker" role="supplier" :placeholder="t.addSupplier" @pick="addSupplier" />
      </FormField>
      <span v-if="!suppliers.length && allowAll" class="pg__all">{{ t.allSuppliers }}</span>
      <span v-for="s in suppliers" :key="s.id" class="pg__chip">
        {{ s.name }}
        <button type="button" class="pg__x" :aria-label="`Quitar ${s.name}`" @click="removeSupplier(s.id)"><AppIcon name="x" /></button>
      </span>
    </div>

    <DataTable :columns="columns" :rows="invoices" :loading="loading" :error="error" :row-class="(r) => (over.includes(r._id) ? 'is-over' : undefined)" @retry="load" :empty-message="t.gridEmpty">
      <template #toolbar>
        <button type="button" class="btn btn--ghost btn--sm" :disabled="!invoices.length" @click="fillAll"><AppIcon name="check" /> {{ t.approveAll }}</button>
        <button type="button" class="btn btn--ghost btn--sm" :disabled="!lines.length" @click="clear">{{ t.clear }}</button>
        <span class="toolbar__spacer"></span>
        <span class="pg__total">{{ amountLabel }}: <strong class="num">{{ formatMoney(total) }}</strong></span>
      </template>
      <template #cell-docNumber="{ row }"><span class="mono">{{ row.docNumber }}</span></template>
      <template #cell-days="{ row }"><span :class="{ 'pg__late': daysLate(row) > 0 }">{{ daysLate(row) }}</span></template>
      <template #cell-amount="{ row }">
        <MoneyInput :id="`pg-amount-${row._id}`" v-model="amounts[row._id]" :invalid="over.includes(row._id)" />
      </template>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.pg {
  @include flex(column, stretch, flex-start, 0.75rem);
}

.pg__suppliers {
  @include flex(row, flex-end, flex-start, 0.5rem);
  flex-wrap: wrap;
}

.pg__picker {
  flex: 1 1 260px;
  max-width: 380px;
}

.pg__all {
  color: $ink-muted;
  font-size: 0.9rem;
}

.pg__chip {
  @include flex(row, center, flex-start, 0.35rem);
  padding: 0.25rem 0.35rem 0.25rem 0.7rem;
  border-radius: 999px;
  background: $accent-soft;
  color: $accent-deep;
  font-size: 0.85rem;
}

.pg__x {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
}

.pg__late {
  color: $danger;
  font-weight: 600;
}

.pg__total strong {
  font-size: 1.05rem;
}

:deep(.is-over) td {
  background: $danger-bg;
}
</style>
