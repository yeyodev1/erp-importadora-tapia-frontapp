<script setup lang="ts">
import { lineHelp } from '@/config/copy/lineHelp'
import { computed, reactive, ref, watch } from 'vue'
import FormDialog from '@/components/ui/FormDialog.vue'
import LockedDateBanner from '@/components/ui/LockedDateBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import type { LineColumn } from '@/components/documents/lines'
import { purchasesService } from '@/services/purchases.service'
import { useToastStore } from '@/stores/toast'
import { computeInvoice, type ExpenseLine, type ProductLine } from '@/composables/purchases/invoiceMath'
import { blankExpense } from '@/composables/purchases/useInvoiceForm'
import { formatMoney } from '@/utils/money'
import { todayISO } from '@/utils/format'
import { cxp } from '@/config/copy/cxp'
import type { ApiError } from '@/types'
import type { PurchaseInvoice } from '@/types/purchases'

/** Nota de crédito del proveedor aplicada a una de sus facturas con saldo (faltantes, devoluciones). */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const t = cxp.creditNotes
const f = cxp.invoices.fields
const toast = useToastStore()
const invoices = ref<PurchaseInvoice[]>([])
const saving = ref(false)
const error = ref('')
const blank = () => ({
  supplierId: '',
  invoiceId: '',
  series: '',
  number: '',
  date: todayISO(),
  authorization: '',
  reason: '',
  kind: 'gasto' as 'gasto' | 'producto',
  lines: [blankExpense()] as ExpenseLine[],
  productLines: [] as ProductLine[],
})
const form = reactive(blank())

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, blank())
    error.value = ''
  },
)
watch(
  () => form.supplierId,
  async (id) => {
    form.invoiceId = ''
    invoices.value = id ? (await purchasesService.listInvoices({ supplierId: id, pending: 'true', limit: 500 })).items : []
  },
)

const invoice = computed(() => invoices.value.find((i) => i._id === form.invoiceId))
const free = computed(() => (invoice.value ? invoice.value.balance - invoice.value.approved : 0))
const invoiceOptions = computed(() =>
  invoices.value.map((i) => ({ value: i._id, label: i.docNumber, hint: `Libre ${formatMoney(i.balance - i.approved)}` })),
)
watch(invoice, (inv) => {
  form.productLines = (inv?.productLines ?? []).map((l) => ({ ...l, qty: null, subtotal: null }))
  form.kind = 'gasto'
  const account = inv?.expenseLines[0]?.accountCode ?? ''
  form.lines = [blankExpense(account)]
})

const totals = computed(() =>
  computeInvoice({
    expenseLines: form.kind === 'gasto' ? form.lines : [],
    productLines: form.kind === 'producto' ? form.productLines.filter((l) => l.qty) : [],
    vatOverride: null,
    withholdings: [],
    codes: [],
  }),
)

const expenseColumns: LineColumn<ExpenseLine>[] = [
  { key: 'accountCode', label: 'Cuenta contable', type: 'account', width: '40%', help: lineHelp.account },
  { key: 'base0', label: 'Base 0 %', type: 'money', total: true, help: lineHelp.base0 },
  { key: 'baseVat', label: 'Base 15 %', type: 'money', total: true, help: lineHelp.baseVat },
]
const productColumns: LineColumn<ProductLine>[] = [
  { key: 'description', label: 'Producto', type: 'readonly', width: '40%', help: lineHelp.product },
  { key: 'qty', label: 'Cantidad', type: 'qty', total: true, help: lineHelp.returnQty },
  { key: 'subtotal', label: 'Subtotal', type: 'money', total: true, help: lineHelp.subtotal },
]

async function submit() {
  error.value = ''
  if (!invoice.value) return (error.value = 'Elige la factura')
  if (totals.value.total <= 0) return (error.value = 'La nota de crédito no tiene valor')
  if (totals.value.total > free.value) return (error.value = `La factura solo tiene ${formatMoney(free.value)} libres`)
  saving.value = true
  try {
    await purchasesService.createCreditNote({
      invoiceId: form.invoiceId,
      series: form.series,
      number: form.number,
      date: form.date,
      authorization: form.authorization,
      accessKey: /^\d{49}$/.test(form.authorization) ? form.authorization : '',
      reason: form.reason,
      lines: form.kind === 'gasto' ? form.lines.map((l) => ({ ...l, base0: l.base0 ?? 0, baseVat: l.baseVat ?? 0 })) : [],
      productLines: form.kind === 'producto' ? form.productLines.filter((l) => l.qty).map(({ productId, qty, subtotal }) => ({ productId, qty, subtotal: subtotal ?? 0 })) : [],
    })
    toast.success(t.saved)
    emit('saved')
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <FormDialog :open="open" :title="t.newTitle" wide :loading="saving" :error="error" @submit="submit" @close="emit('close')">
    <LockedDateBanner :date="form.date" />
    <div class="form-grid">
      <FormField v-bind="f.supplier" for="nc-supplier" required>
        <PartyPicker id="nc-supplier" v-model="form.supplierId" role="supplier" />
      </FormField>
      <FormField v-bind="t.fields.invoice" for="nc-invoice" required :hint="form.supplierId && !invoices.length ? t.noPending : ''">
        <BaseCombobox id="nc-invoice" v-model="form.invoiceId" :options="invoiceOptions" :disabled="!invoices.length" />
      </FormField>
      <FormField v-bind="f.series" for="nc-series" required class="narrow">
        <input id="nc-series" v-model="form.series" class="mono" maxlength="7" :placeholder="cxp.invoices.placeholders.series" />
      </FormField>
      <FormField v-bind="f.number" for="nc-number" required class="narrow">
        <input id="nc-number" v-model="form.number" class="mono" maxlength="9" :placeholder="cxp.invoices.placeholders.number" />
      </FormField>
      <FormField v-bind="f.date" for="nc-date" required class="narrow">
        <BaseDatePicker id="nc-date" v-model="form.date" :range-start="invoice?.date.slice(0, 10)" />
      </FormField>
      <FormField v-bind="f.authorization" for="nc-auth">
        <input id="nc-auth" v-model="form.authorization" class="mono" maxlength="49" :placeholder="cxp.invoices.placeholders.authorization" />
      </FormField>
      <FormField v-bind="t.fields.reason" for="nc-reason" full>
        <input id="nc-reason" v-model="form.reason" maxlength="200" :placeholder="t.reasonPlaceholder" />
      </FormField>
    </div>

    <template v-if="invoice">
      <BaseSegmented
        v-if="invoice.productLines.length"
        v-model="form.kind"
        tabs
        :options="t.kinds"
        :label="t.newTitle"
      />
      <DocumentLines v-if="form.kind === 'gasto'" v-model="form.lines" id-prefix="ncl" :columns="expenseColumns" :new-line="() => blankExpense()" />
      <DocumentLines v-else v-model="form.productLines" id-prefix="ncp" :columns="productColumns" :new-line="() => ({ ...form.productLines[0]!, qty: null, subtotal: null })" />
      <p class="nc__totals">
        IVA <strong class="num">{{ formatMoney(totals.vat) }}</strong> · Total <strong class="num">{{ formatMoney(totals.total) }}</strong> · Libre en la factura
        <strong class="num">{{ formatMoney(free) }}</strong>
      </p>
    </template>
  </FormDialog>
</template>

<style scoped lang="scss">
.nc__totals {
  margin-top: 0.75rem;
  text-align: right;
  color: $ink-soft;
}
</style>
