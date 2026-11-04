<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/table/DataTable.vue'
import PeriodBar from '@/components/accounting/PeriodBar.vue'
import WarningList from '@/components/accounting/WarningList.vue'
import type { Column } from '@/components/table/columns'
import { currentMonth, monthLabel, useReport } from '@/composables/accounting/useReport'
import { taxesService, type Reconciliation, type ReconciliationItem } from '@/services/taxes.service'
import { shiftMonth } from '@/utils/format'
import { formatMoney } from '@/utils/money'
import { accounting } from '@/config/copy/accounting'
import { taxes as t } from '@/config/copy/taxes'

/** Cuadre mensual: documentos del ATS contra el movimiento contable del mes, concepto por concepto. */
const c = t.check
const period = ref(shiftMonth(currentMonth(), -1))
const report = useReport(() => taxesService.reconciliation(period.value))
const data = report.data
const selected = ref('')
const run = () => {
  selected.value = ''
  report.run()
}
run()

const columns: Column<ReconciliationItem>[] = [
  { key: 'label', label: c.concept },
  { key: 'valorDocumentos', label: c.documents, format: 'money' },
  { key: 'valorContable', label: c.books, format: 'money' },
  { key: 'diferencia', label: c.difference, format: 'money' },
  { key: 'cuadra', label: c.status, align: 'center', value: (r) => (r.cuadra ? c.ok : c.bad) },
]
type Box = Reconciliation['form104']['casilleros'][number]
const boxColumns: Column<Box>[] = [
  { key: 'casillero', label: c.box, width: '6rem' },
  { key: 'label', label: c.concept },
  { key: 'valor', label: c.value, format: 'money' },
]

const detail = computed(() => data.value?.items.find((i) => i.concepto === selected.value) ?? null)
const byType = computed(() => Object.entries(detail.value?.byEntryType ?? {}).map(([type, amount]) => ({ type, amount })))
const excluded = computed(() => c.excluded.replace('{types}', (data.value?.excludedEntryTypes ?? []).map((x) => accounting.entryTypes[x] ?? x).join(', ')))
const filtersText = computed(() => (data.value ? [`${t.period.label}: ${monthLabel(data.value.period)}`] : []))
</script>

<template>
  <section class="mc">
    <PageHeader :subtitle="c.intro">
      <RouterLink :to="{ name: 'Ats' }" class="btn btn--ghost btn--sm"><AppIcon name="report" /> ATS</RouterLink>
      <RouterLink :to="{ name: 'WithholdingsReport' }" class="btn btn--ghost btn--sm"><AppIcon name="report" /> {{ t.links.withholdings }}</RouterLink>
      <RouterLink :to="{ name: 'PurchasesBySupport' }" class="btn btn--ghost btn--sm"><AppIcon name="report" /> {{ t.links.support }}</RouterLink>
    </PageHeader>
    <PeriodBar v-model="period" :field="t.period" :loading="report.loading.value" @submit="run" />

    <DataTable
      :columns="columns"
      :rows="data?.items ?? []"
      row-key="concepto"
      :loading="report.loading.value"
      :error="report.error.value"
      :filters-text="filtersText"
      :row-class="(r) => (r.concepto === selected ? 'is-selected' : undefined)"
      clickable
      @row-click="(r) => (selected = selected === r.concepto ? '' : r.concepto)"
      @retry="run"
    >
      <template #toolbar>
        <BaseBadge v-if="data" :tone="data.cuadra ? 'success' : 'danger'">
          <AppIcon :name="data.cuadra ? 'check-circle' : 'alert'" /> {{ data.cuadra ? c.allOk : c.someBad }}
        </BaseBadge>
      </template>
      <template #cell-cuadra="{ row }">
        <BaseBadge :tone="row.cuadra ? 'success' : 'danger'">{{ row.cuadra ? c.ok : c.bad }}</BaseBadge>
      </template>
      <template #cell-diferencia="{ row }">
        <span :class="{ 'mc__bad': row.diferencia !== 0 }">{{ formatMoney(row.diferencia) }}</span>
      </template>
    </DataTable>

    <div v-if="detail" class="panel panel--pad mc__detail">
      <h3>{{ detail.label }}</h3>
      <p class="mc__muted">{{ c.accounts }}: <span class="mono">{{ detail.cuentas.join(', ') || '—' }}</span></p>
      <h4 class="mc__sub">{{ c.byType }}</h4>
      <ul class="mc__types">
        <li v-for="r in byType" :key="r.type">
          <span>{{ accounting.entryTypes[r.type] ?? r.type }}</span><strong class="num">{{ formatMoney(r.amount) }}</strong>
        </li>
        <li v-if="!byType.length" class="mc__muted">—</li>
      </ul>
      <p class="mc__muted">{{ excluded }}</p>
    </div>

    <WarningList v-if="data" :title="t.warnings" :items="data.warnings" />

    <template v-if="data">
      <h2 class="mc__title">{{ c.form104 }} <BaseBadge tone="warning">{{ c.referencial }}</BaseBadge></h2>
      <p class="mc__muted">{{ data.form104.nota }}</p>
      <DataTable :columns="boxColumns" :rows="data.form104.casilleros" row-key="casillero" :title="`${c.form104} (${c.referencial})`" :filters-text="filtersText" />
    </template>
  </section>
</template>

<style scoped lang="scss">
.mc {
  :deep(tr.is-selected td) {
    background: $accent-soft;
  }

  &__bad {
    color: $danger;
    font-weight: 600;
  }

  &__detail {
    @include flex(column, stretch, flex-start, 0.5rem);
    margin: 0.75rem 0;
  }

  &__sub {
    @include eyebrow;
  }

  &__types {
    @include flex(column, stretch, flex-start, 0.25rem);
    list-style: none;
    padding: 0;
    max-width: 420px;

    li {
      @include flex(row, center, space-between, 1rem);
      font-size: $text-sm;
    }
  }

  &__muted {
    color: $ink-muted;
    font-size: $text-sm;
  }

  &__title {
    @include flex(row, center, flex-start, 0.5rem);
    margin: 1.25rem 0 0.25rem;
    font-size: $text-base;
  }
}
</style>
