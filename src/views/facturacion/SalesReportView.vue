<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import DataTable from '@/components/table/DataTable.vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import { useSalesReport } from '@/composables/sales/useSalesReport'
import { useCatalogStore } from '@/stores/catalog'
import { facturacion as t } from '@/config/copy/facturacion'
import type { ReportType } from '@/services/sales.service'

/** Reporte de ventas: resumido, detallado, por vendedor o por cliente, con Excel e impresión. */
const r = useSalesReport()
const { type, filters, extra, summary, columns, rows, totals, loading, error, title } = r
const catalog = useCatalogStore()
catalog.ensure('productGroups')

const f = t.fields
const types = (Object.keys(t.report.types) as ReportType[]).map((value) => ({ value, label: t.report.types[value], help: t.report.typeHelp[value] }))
const groups = computed(() => catalog.productGroups.map((g) => ({ value: g._id, label: g.name })))
</script>

<template>
  <section>
    <PageHeader :subtitle="t.pages.salesReport.subtitle" />
    <BaseSegmented v-model="type" class="sr__types" :options="types" tabs :label="title" />

    <ReportFilters v-model="filters" :fields="['range', 'warehouse', 'party']" party-role="customer" :loading="loading" @apply="r.run">
      <FormField v-bind="f.group" for="sr-group">
        <BaseCombobox id="sr-group" v-model="extra.groupId" :options="groups" :empty-label="t.fields.all" />
      </FormField>
      <FormField v-bind="f.seller" for="sr-seller">
        <input id="sr-seller" v-model="extra.sellerName" :placeholder="t.placeholders.seller" />
      </FormField>
      <FormField v-bind="f.parish" for="sr-parish">
        <input id="sr-parish" v-model="extra.parish" :placeholder="t.placeholders.parish" />
      </FormField>
      <FormField v-bind="f.customerType" for="sr-ctype">
        <input id="sr-ctype" v-model="extra.customerType" :placeholder="t.placeholders.customerType" />
      </FormField>
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
      :row-class="(row) => (row.status === 'anulado' ? 'is-void' : undefined)"
      landscape
      @retry="r.run()"
    />
  </section>
</template>

<style scoped lang="scss">
.sr__types {
  margin-bottom: 0.75rem;
}
</style>
