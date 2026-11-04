<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import SaleDocForm from '@/components/sales/SaleDocForm.vue'
import { useAccess } from '@/composables/useAccess'
import { useList } from '@/composables/useList'
import { printReport } from '@/composables/usePrint'
import { blankLine, useSaleForm } from '@/composables/sales/useSaleForm'
import { salesService, type Proforma, type SaleLine } from '@/services/sales.service'
import { useToastStore } from '@/stores/toast'
import { formatDay } from '@/utils/format'
import { formatMoney } from '@/utils/money'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ApiError } from '@/types'

/** Proformas: misma cabecera y líneas que la factura, sin SRI ni stock; luego se facturan. */
const router = useRouter()
const { canWrite } = useAccess()
const toast = useToastStore()
const creating = ref(false)
const converting = ref<Proforma | null>(null)
const busy = ref(false)
const convertError = ref('')

const list = useList<Proforma>((p) => salesService.list<Proforma>('proformas', p))

const form = useSaleForm(async (body) => {
  const pf = await salesService.createProforma(body)
  toast.success(`${t.quotes.created}: ${pf.number}`)
  creating.value = false
  form.lines.value = [blankLine()]
  form.head.partyId = ''
  list.reload()
})

const c = t.cols
const columns: Column<Proforma>[] = [
  { key: 'date', label: c.date, format: 'date', width: '7rem' },
  { key: 'number', label: c.number, width: '10rem' },
  { key: 'customer.name', label: c.customer },
  { key: 'sellerName', label: c.seller, width: '9rem' },
  { key: 'total', label: t.totals.total, format: 'money', total: true },
  { key: 'status', label: c.status, help: t.colHelp.quoteStatus, width: '7rem' },
  { key: 'actions', label: c.actions, screenOnly: true, width: '9rem' },
]

const lineCols: Column<SaleLine>[] = [
  { key: 'code', label: c.code },
  { key: 'name', label: c.product },
  { key: 'qty', label: c.qty, format: 'qty' },
  { key: 'unitPrice', label: c.price, format: 'money' },
  { key: 'discount', label: c.discount, format: 'money', total: true },
  { key: 'subtotal', label: c.lineTotal, format: 'money', total: true },
]

function print(pf: Proforma) {
  const tt = t.totals
  printReport({
    title: `Proforma ${pf.number}`,
    filters: [
      `${c.customer}: ${pf.customer.name} (${pf.customer.identification})`,
      `${c.date}: ${formatDay(pf.date)} · ${c.seller}: ${pf.sellerName || '—'}`,
      `${tt.subtotal0} ${formatMoney(pf.subtotal0)} · ${tt.subtotalVat} ${formatMoney(pf.subtotalVat)} · ${tt.vat} ${formatMoney(pf.vat)} · ${tt.total} ${formatMoney(pf.total)}`,
    ],
    columns: lineCols,
    rows: pf.lines,
    totals: { discount: pf.discount, subtotal: pf.subtotal0 + pf.subtotalVat },
  })
}

async function convert() {
  if (!converting.value) return
  busy.value = true
  convertError.value = ''
  try {
    const inv = await salesService.invoiceProforma(converting.value._id)
    toast.success(`${t.quotes.invoiced}: ${inv.number}`)
    router.push({ name: 'InvoiceDetail', params: { id: inv._id } })
  } catch (e) {
    convertError.value = (e as ApiError).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.quotes.subtitle">
      <button v-if="canWrite && !creating" type="button" class="btn btn--primary" @click="creating = true">
        <AppIcon name="plus" /> {{ t.actions.newQuote }}
      </button>
    </PageHeader>

    <SaleDocForm v-if="creating" class="qv__form" :form="form" :submit-label="t.actions.save" id-prefix="pf" @cancel="creating = false" />

    <DataTable
      :columns="columns"
      :rows="list.items"
      :loading="list.loading"
      :error="list.error"
      :page="list.page"
      :pages="list.pages"
      :total="list.total"
      :fetch-all="list.fetchAll"
      :empty-message="t.pages.quotes.empty"
      @update:page="list.page = $event"
      @retry="list.reload"
    >
      <template #toolbar><SearchInput v-model="list.q" /></template>
      <template #cell-number="{ row }"><span class="mono">{{ row.number }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-actions="{ row }">
        <span class="qv__ops">
          <button type="button" class="btn btn--ghost btn--sm btn--icon" :title="t.actions.print" :aria-label="t.actions.print" @click="print(row)"><AppIcon name="print" /></button>
          <button v-if="canWrite && row.status === 'abierta'" type="button" class="btn btn--ghost btn--sm" @click="(converting = row), (convertError = '')">
            <AppIcon name="invoice" /> {{ t.actions.toInvoice }}
          </button>
        </span>
      </template>
    </DataTable>

    <ConfirmModal
      :open="!!converting"
      :title="t.quotes.toInvoiceTitle"
      :subject="converting ? `${converting.number} · ${converting.customer.name} · ${formatMoney(converting.total)}` : ''"
      :message="t.quotes.toInvoiceMessage"
      :confirm-label="t.actions.toInvoice"
      :loading="busy"
      :error="convertError"
      @confirm="convert"
      @cancel="converting = null"
    />
  </section>
</template>

<style scoped lang="scss">
.qv__form {
  margin-bottom: 1rem;
}

.qv__ops {
  @include flex(row, center, flex-end, 0.25rem);
}
</style>
