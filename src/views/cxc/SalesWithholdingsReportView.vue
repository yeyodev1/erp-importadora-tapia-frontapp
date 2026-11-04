<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { defaultFilters, filterParams } from '@/components/report/filters'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import { useReport } from '@/composables/receivables/useReport'
import { receivablesService } from '@/services/receivables.service'
import { cxc } from '@/config/copy/cxc'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import CustomerFilters from '@/components/receivables/CustomerFilters.vue'
import { blankCustomerFilters, customerSummary } from '@/components/receivables/customerFilters'
import { splitNumber } from '@/composables/sales/docNumber'

/**
 * Retenciones en venta del rango, como el reporte de hoy: por factura
 * (Fecha | Tipo | Serie | Número | Cliente | Identificación | Vendedor | % |
 * base | valor, con el comprobante) o por tipo; ordenado por factura o cliente.
 * El formato ATS vive en Impuestos > ATS (botón en la barra).
 */
const t = cxc.withholdingsReport
const w = cxc.withholdings
const filters = ref(defaultFilters())
const tax = ref<'' | 'renta' | 'iva'>('')
const mode = ref<'invoice' | 'type'>('invoice')
const order = ref<'invoice' | 'customer'>('invoice')
const customer = ref(blankCustomerFilters())
const orders = [
  { value: 'invoice' as const, label: t.orderInvoice, help: t.orderHelp.invoice },
  { value: 'customer' as const, label: t.orderCustomer, help: t.orderHelp.customer },
]
const byType = computed(() => mode.value === 'type')
const taxTabs = [
  { value: '' as const, label: t.taxAll, help: t.taxHelp[''] },
  { value: 'renta' as const, label: w.renta, help: t.taxHelp.renta },
  { value: 'iva' as const, label: w.iva, help: t.taxHelp.iva },
]
const modes = [
  { value: 'invoice' as const, label: t.byInvoice, help: t.modeHelp.invoice },
  { value: 'type' as const, label: t.byType, help: t.modeHelp.type },
]

const report = useReport(() =>
  receivablesService.withholdingsReport({
    ...filterParams(filters.value),
    tax: tax.value || undefined,
    sellerName: customer.value.sellerName.trim() || undefined,
    groupBy: byType.value ? 'type' : undefined,
  }),
)
onMounted(() => report.run())
watch([tax, mode], () => report.run())

const rate = (n: number) => `${String(n).replace('.', ',')} %`
const taxName = (k: string) => (k === 'renta' ? w.renta : w.iva)

const rows = computed(() => {
  const d = report.data.value
  if (!d) return []
  if (byType.value) return (d.types ?? []).map((x) => ({ ...x, key: `${x.tax}-${x.rate}` }))
  // shortcut: la serie se filtra aquí sobre el número de factura (pocas filas por mes); pasarla al API si crece.
  const series = customer.value.series
  const kept = (d.rows ?? []).filter((row) => !series || splitNumber(row.invoiceNumber).series === series)
  const sorted = order.value === 'customer' ? [...kept].sort((a, b) => (a.customer ?? '').localeCompare(b.customer ?? '')) : kept
  return sorted.flatMap((row, i) =>
    row.lines.map((l, j) => ({ ...row, ...l, ...splitNumber(row.invoiceNumber), doc: t.invoiceDoc, key: `${i}-${j}` })),
  )
})

const columns = computed<Column[]>(() =>
  byType.value
    ? [
        { key: 'tax', label: 'Impuesto', value: (x) => taxName(x.tax) },
        { key: 'rate', ...w.rate, value: (x) => rate(x.rate), align: 'right' },
        { key: 'count', ...t.cols.count, format: 'int', total: true },
        { key: 'base', ...t.cols.base, format: 'money', total: true },
        { key: 'amount', ...t.cols.amount, format: 'money', total: true },
      ]
    : [
        { key: 'date', label: 'Fecha', format: 'date', width: '6.5rem' },
        { key: 'doc', label: 'Tipo', width: '7.5rem' },
        { key: 'series', label: 'Serie', width: '5.5rem' },
        { key: 'seq', label: 'Número', width: '7rem' },
        { key: 'customer', label: 'Cliente' },
        { key: 'identification', label: 'Identificación', width: '9rem' },
        { key: 'sellerName', label: 'Vendedor' },
        { key: 'voucherNumber', ...w.cols.voucher, width: '10rem' },
        // "%" como el reporte de hoy, con el impuesto delante para no sumar una columna: "Renta 1 %".
        { key: 'rate', label: '%', help: w.rate.help, value: (x) => `${taxName(x.tax)} ${rate(x.rate)}`, align: 'right' },
        { key: 'base', ...t.cols.base, format: 'money', total: true },
        { key: 'amount', ...t.cols.amount, format: 'money', total: true },
      ],
)
</script>

<template>
  <section>
    <PageHeader :subtitle="t.subtitle" />
    <ReportFilters
      v-model="filters"
      :fields="['range', 'party']"
      party-role="customer"
      :loading="report.loading.value"
      @apply="report.run"
    >
      <CustomerFilters v-model="customer" :fields="['sellerName', 'series']" id-prefix="wr" />
    </ReportFilters>
    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="key"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="[...report.summary.value, ...customerSummary(customer), taxTabs.find((x) => x.value === tax)!.label]"
      :empty-message="t.empty"
      landscape
      @retry="report.run()"
    >
      <template #toolbar>
        <BaseSegmented v-model="mode" :options="modes" :label="cxc.reports.modeLabel" />
        <BaseSegmented v-model="tax" :options="taxTabs" :label="t.taxLabel" />
        <BaseSegmented v-if="!byType" v-model="order" :options="orders" :label="t.orderLabel" />
        <RouterLink :to="{ name: 'Ats' }" class="btn btn--ghost btn--sm" :title="t.atsHelp"><AppIcon name="taxes" /> {{ t.ats }}</RouterLink>
      </template>
    </DataTable>
  </section>
</template>
