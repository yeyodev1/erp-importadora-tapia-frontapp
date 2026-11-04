<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DataTable from '@/components/table/DataTable.vue'
import PeriodBar from '@/components/accounting/PeriodBar.vue'
import KpiCard from '@/components/dashboard/KpiCard.vue'
import SalesChart from '@/components/dashboard/SalesChart.vue'
import { useDashboardCards } from '@/components/dashboard/useDashboardCards'
import type { Column } from '@/components/table/columns'
import { currentMonth, monthLabel, useReport } from '@/composables/accounting/useReport'
import { dashboardService, type Dashboard, type MonthSales } from '@/services/dashboard.service'
import { useUserStore } from '@/stores/user'
import { canView } from '@/config/access'
import { site } from '@/config/site'
import { dashboard as t } from '@/config/copy/dashboard'

/** Tablero de Inicio: el API recorta las secciones según el rol; aquí solo se pinta lo que llega. */
const router = useRouter()
const user = useUserStore()
const month = ref(currentMonth())
const report = useReport(() => dashboardService.load(month.value))
const data = report.data
report.run()

const cards = useDashboardCards(data)
/** Una tarjeta enlaza solo si el rol puede abrir esa pantalla. */
const linkFor = (to: RouteLocationRaw) => (canView(user.role, router.resolve(to).meta) ? to : undefined)

const C = t.cols
const warehouseCols: Column<MonthSales['byWarehouse'][number]>[] = [
  { key: 'name', label: C.warehouse },
  { key: 'count', label: C.count, format: 'int', total: true },
  { key: 'sales', label: C.sales, format: 'money', total: true },
]
const sellerCols: Column<MonthSales['bySeller'][number]>[] = [
  { key: 'sellerName', label: C.seller },
  { key: 'count', label: C.count, format: 'int', total: true },
  { key: 'sales', label: C.sales, format: 'money', total: true },
]
const productCols: Column<NonNullable<Dashboard['topProducts']>[number]>[] = [
  { key: 'code', label: C.code },
  { key: 'name', label: C.name },
  { key: 'qty', label: C.qty, format: 'qty' },
  { key: 'value', label: C.sales, format: 'money' },
]
const customerCols: Column<NonNullable<Dashboard['topCustomers']>[number]>[] = [
  { key: 'name', label: C.name },
  { key: 'identification', label: 'RUC / CI' },
  { key: 'count', label: C.count, format: 'int' },
  { key: 'sales', label: C.sales, format: 'money' },
]

const monthText = computed(() => (data.value ? [monthLabel(data.value.period)] : []))
const year = computed(() => (data.value?.period ?? month.value).slice(0, 4))
const isEmpty = computed(() => data.value && !cards.value.length && !data.value.topProducts && !data.value.topCustomers)
</script>

<template>
  <section class="db">
    <PageHeader :subtitle="user.user ? `${site.login.welcome} ${user.user.name}` : undefined" />
    <PeriodBar id="db-month" v-model="month" :field="t.month" :loading="report.loading.value" @submit="report.run" />

    <EmptyState v-if="report.error.value" tone="error" :message="report.error.value" @retry="report.run" />
    <EmptyState v-else-if="isEmpty" :message="t.empty" />

    <template v-else-if="data">
      <div v-if="cards.length" class="db__cards">
        <KpiCard v-for="{ key, ...c } in cards" :key="key" v-bind="c" :to="linkFor(c.to)" :delta-label="t.cards.vsPrev" />
      </div>

      <SalesChart v-if="data.sales" class="db__block" :series="data.sales.series" :title="t.chart.title" :empty="t.chart.empty" />

      <div v-if="data.sales" class="db__pair">
        <DataTable :columns="warehouseCols" :rows="data.sales.current.byWarehouse" row-key="warehouseId" :title="t.byWarehouse" :filters-text="monthText">
          <template #toolbar><h2 class="db__h">{{ t.byWarehouse }}</h2></template>
        </DataTable>
        <DataTable :columns="sellerCols" :rows="data.sales.current.bySeller" row-key="sellerName" :title="t.bySeller" :filters-text="monthText">
          <template #toolbar><h2 class="db__h">{{ t.bySeller }}</h2></template>
        </DataTable>
      </div>

      <div class="db__pair">
        <DataTable v-if="data.topProducts" :columns="productCols" :rows="data.topProducts" row-key="productId" :title="`${t.topProducts} ${year}`">
          <template #toolbar><h2 class="db__h">{{ t.topProducts }} {{ year }}</h2></template>
        </DataTable>
        <DataTable v-if="data.topCustomers" :columns="customerCols" :rows="data.topCustomers" row-key="partyId" :title="`${t.topCustomers} ${year}`">
          <template #toolbar><h2 class="db__h">{{ t.topCustomers }} {{ year }}</h2></template>
        </DataTable>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
.db {
  &__cards {
    @include flex-cards(220px, 0.75rem);
    margin-bottom: 0.75rem;
  }

  &__block {
    margin-bottom: 0.75rem;
  }

  &__pair {
    @include flex-cards(340px, 0.75rem);
    margin-bottom: 0.75rem;
  }

  &__h {
    font-size: $text-sm;
    font-weight: 600;
  }
}
</style>
