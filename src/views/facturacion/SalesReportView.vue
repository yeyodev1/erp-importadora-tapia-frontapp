<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import CustomerFilters from '@/components/receivables/CustomerFilters.vue'
import { useSalesReport } from '@/composables/sales/useSalesReport'
import { useCatalogStore } from '@/stores/catalog'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ReportType } from '@/services/sales.service'

/**
 * Reporte "Ventas Factura": resumido, detallado, resumido por vendedor o por
 * cliente, con los filtros de hoy (grupo, subgrupo, vendedor, cliente,
 * parroquia, sucursal, tipo de cliente, bodega, serie y anulados).
 */
const r = useSalesReport()
const { type, filters, extra, customer, summary, columns, rows, totals, loading, error, title } = r
const catalog = useCatalogStore()
catalog.ensure('productGroups')

const f = t.fields
const types = (Object.keys(t.report.types) as ReportType[]).map((value) => ({ value, label: t.report.types[value], help: t.report.typeHelp[value] }))
const groups = computed(() => catalog.productGroups.map((g) => ({ value: g._id, label: g.name })))
const subgroups = computed(() => (catalog.productGroups.find((g) => g._id === extra.groupId)?.subgroups ?? []).map((s) => ({ value: s, label: s })))
const onGroup = (id: string) => Object.assign(extra, { groupId: id, subgroup: '' })
const rowClass = (row: Record<string, unknown>) => (row.status === 'anulado' ? 'is-void' : row.kind && row.kind !== 'row' ? `is-${row.kind}` : undefined)
</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.salesReport.subtitle" />
    <BaseSegmented v-model="type" class="sr__types" :options="types" tabs :label="title" />

    <ReportFilters v-model="filters" :fields="['range', 'warehouse', 'party']" party-role="customer" :loading="loading" @apply="r.run">
      <FormField v-bind="f.group" for="sr-group">
        <BaseCombobox id="sr-group" :model-value="extra.groupId" :options="groups" :empty-label="f.all" @update:model-value="onGroup" />
      </FormField>
      <FormField v-bind="f.subgroup" for="sr-sub">
        <BaseCombobox id="sr-sub" v-model="extra.subgroup" :options="subgroups" :empty-label="f.all" :disabled="!subgroups.length" />
      </FormField>
      <CustomerFilters v-model="customer" :fields="['sellerName', 'parish', 'branch', 'customerType', 'series']" id-prefix="sr" />
      <BaseSwitch v-model="extra.includeVoided" v-bind="f.includeVoided" />
    </ReportFilters>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      :totals="totals"
      :title="title"
      :filters-text="summary"
      :empty-message="t.pages.salesReport.empty"
      :row-class="rowClass"
      landscape
      @retry="r.run()"
    />
  </section>
</template>

<style scoped lang="scss">
.sr__types {
  margin-bottom: 0.75rem;
}

// Título de bodega y de día, y su subtotal, como en el reporte impreso de hoy.
:deep(.is-group td) {
  font-weight: 700;
  text-transform: uppercase;
  background: $sand;
}

:deep(.is-day td) {
  font-weight: 600;
  color: $ink-soft;
}

:deep(.is-subtotal td) {
  font-weight: 600;
  background: $paper;
}
</style>
