<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import DataTable from '@/components/table/DataTable.vue'
import PeriodBar from '@/components/accounting/PeriodBar.vue'
import WarningList from '@/components/accounting/WarningList.vue'
import StatChips from '@/components/accounting/StatChips.vue'
import type { Column } from '@/components/table/columns'
import { currentMonth, monthLabel, useReport } from '@/composables/accounting/useReport'
import { useAtsXml } from '@/composables/accounting/useAtsXml'
import { taxesService, type AtsPurchase, type AtsSale, type AtsSummary } from '@/services/taxes.service'
import { shiftMonth } from '@/utils/format'
import { taxes as t } from '@/config/copy/taxes'
import { cxp } from '@/config/copy/cxp'

/** ATS del mes: resumen previsualizable con advertencias, y el XML para descargar o copiar. */
const a = t.ats
const C = a.cols
const H = a.colsHelp
/** Código del SRI con su nombre: "01 · Factura". */
const named = (code: string, names: Record<string, string>) => (names[code] ? `${code} · ${names[code]}` : code)
const supports = Object.fromEntries(cxp.taxSupports.map((o) => [o.value, o.label.replace(/^\d+\s*/, '')]))
const period = ref(shiftMonth(currentMonth(), -1))
const report = useReport(() => taxesService.ats(period.value))
const data = report.data
const xml = useAtsXml(() => data.value?.period ?? period.value)
watch(period, xml.reset)
report.run()

const tab = ref<'compras' | 'ventas' | 'anulados'>('compras')
const tabs = computed(() => [
  { value: 'compras' as const, label: a.purchases, count: data.value?.compras.length, help: a.tabsHelp.compras },
  { value: 'ventas' as const, label: a.sales, count: data.value?.ventas.length, help: a.tabsHelp.ventas },
  { value: 'anulados' as const, label: a.voided, count: data.value?.anulados.length, help: a.tabsHelp.anulados },
])

const chips = computed(() => {
  const totals = data.value?.totals ?? {}
  return Object.entries(a.totals).map(([key, label]) => ({ label, value: totals[key] ?? 0, money: !['compras', 'anulados'].includes(key) }))
})

const docNumber = (r: { establecimiento: string; puntoEmision: string; secuencial?: string; secuencialInicio?: string }) =>
  [r.establecimiento, r.puntoEmision, r.secuencial ?? r.secuencialInicio].join('-')

const purchaseCols: Column<AtsPurchase>[] = [
  { key: 'fechaEmision', label: C.date, format: 'date' },
  { key: 'supplierName', label: C.supplier },
  { key: 'idProv', label: C.id, help: H.id },
  { key: 'codSustento', label: C.support, help: H.support, value: (r) => named(r.codSustento, supports) },
  { key: 'tipoComprobante', label: C.docType, help: H.docType, value: (r) => named(r.tipoComprobante, t.docTypes) },
  { key: 'number', label: C.number, value: docNumber },
  { key: 'baseImponible', label: C.base0, help: H.base0, format: 'money', total: true },
  { key: 'baseImpGrav', label: C.baseVat, help: H.baseVat, format: 'money', total: true },
  { key: 'montoIva', label: C.vat, help: H.vat, format: 'money', total: true },
]
const saleCols: Column<AtsSale>[] = [
  { key: 'customerName', label: C.customer },
  { key: 'idCliente', label: C.id, help: H.id },
  { key: 'tipoComprobante', label: C.docType, help: H.docType, value: (r) => named(r.tipoComprobante, t.docTypes) },
  { key: 'numeroComprobantes', label: C.count, help: H.count, format: 'int', total: true },
  { key: 'baseImponible', label: C.base0, help: H.base0, format: 'money', total: true },
  { key: 'baseImpGrav', label: C.baseVat, help: H.baseVat, format: 'money', total: true },
  { key: 'montoIva', label: C.vat, help: H.vat, format: 'money', total: true },
  { key: 'valorRetIva', label: C.retIva, help: H.retIva, format: 'money', total: true },
  { key: 'valorRetRenta', label: C.retRenta, help: H.retRenta, format: 'money', total: true },
]
const voidCols: Column<AtsSummary['anulados'][number]>[] = [
  { key: 'tipoComprobante', label: C.docType, help: H.docType, value: (r) => named(r.tipoComprobante, t.docTypes) },
  { key: 'number', label: C.number, value: docNumber },
  { key: 'autorizacion', label: C.auth, help: H.auth },
]
const filtersText = computed(() => (data.value ? [`${t.period.label}: ${monthLabel(data.value.period)}`] : []))
</script>

<template>
  <section class="ats">
    <PageHeader :subtitle="a.intro">
      <RouterLink :to="{ name: 'WithholdingsReport' }" class="btn btn--ghost btn--sm"><AppIcon name="report" /> {{ t.links.withholdings }}</RouterLink>
      <RouterLink :to="{ name: 'PurchasesBySupport' }" class="btn btn--ghost btn--sm"><AppIcon name="report" /> {{ t.links.support }}</RouterLink>
    </PageHeader>
    <PeriodBar v-model="period" :field="t.period" :loading="report.loading.value" @submit="report.run" />

    <p v-if="report.error.value" class="ats__error" role="alert"><AppIcon name="alert" /> {{ report.error.value }}</p>

    <template v-if="data">
      <div class="panel panel--pad ats__head">
        <p>
          <strong>{{ a.informant }}:</strong> {{ data.informante.razonSocial }} · RUC {{ data.informante.IdInformante }} · {{ monthLabel(data.period) }}
        </p>
        <div class="ats__actions">
          <button type="button" class="btn btn--primary" :disabled="xml.busy.value" @click="xml.download"><AppIcon name="download" /> {{ a.download }}</button>
          <button type="button" class="btn btn--ghost" :disabled="xml.busy.value" @click="xml.copy"><AppIcon name="check" /> {{ a.copy }}</button>
          <button type="button" class="btn btn--ghost" :disabled="xml.busy.value" @click="xml.toggle">
            <AppIcon :name="xml.busy.value ? 'spinner' : 'search'" :spin="xml.busy.value" /> {{ xml.visible.value ? a.hide : a.show }}
          </button>
        </div>
        <textarea v-if="xml.visible.value" class="ats__xml mono" readonly rows="12" :value="xml.xml.value" @focus="($event.target as HTMLTextAreaElement).select()" />
      </div>

      <StatChips :items="chips" />
      <WarningList :title="t.warnings" :items="data.warnings" />

      <BaseSegmented v-model="tab" :options="tabs" tabs class="ats__tabs" />
      <DataTable v-if="tab === 'compras'" :columns="purchaseCols" :rows="data.compras" row-key="docId" :title="`ATS ${a.purchases}`" :filters-text="filtersText" :empty-message="a.empty.compras" landscape />
      <DataTable v-else-if="tab === 'ventas'" :columns="saleCols" :rows="data.ventas" :title="`ATS ${a.sales}`" :filters-text="filtersText" :empty-message="a.empty.ventas" landscape />
      <DataTable v-else :columns="voidCols" :rows="data.anulados" :title="`ATS ${a.voided}`" :filters-text="filtersText" :empty-message="a.empty.anulados" />
    </template>
  </section>
</template>

<style scoped lang="scss">
.ats {
  &__head {
    @include flex(column, stretch, flex-start, 0.75rem);
    margin-bottom: 0.75rem;
    font-size: $text-sm;
  }

  &__actions {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }

  &__xml {
    font-size: 0.75rem;
    white-space: pre;
  }

  &__error {
    color: $danger;
    margin-bottom: 0.75rem;
  }

  &__tabs {
    margin-bottom: 0.5rem;
  }
}
</style>
