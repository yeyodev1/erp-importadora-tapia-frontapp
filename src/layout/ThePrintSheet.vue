<script setup lang="ts">
import { computed } from 'vue'
import { printJob } from '@/composables/usePrint'
import { alignOf, formatValue, rawValue } from '@/components/table/columns'
import { useUserStore } from '@/stores/user'
import { site } from '@/config/site'
import { formatDateTime } from '@/utils/format'

/**
 * Hoja de impresión de todos los reportes, como los de hoy: razón social,
 * dirección y RUC arriba; título y filtros; tabla; pie con usuario, fecha y
 * hora. El <thead> y el <tfoot> (pie) se repiten en cada página.
 */
const user = useUserStore()
const job = printJob
const columns = computed(() => job.value?.columns.filter((c) => !c.screenOnly) ?? [])
const printedAt = computed(() => (job.value ? formatDateTime() : ''))
</script>

<template>
  <Teleport to="body">
    <div v-if="job" class="print-sheet">
      <header class="ps__head">
        <strong class="ps__company">{{ site.company.legalName }}</strong>
        <span>{{ site.company.address }} · {{ site.company.city }}</span>
        <span>RUC {{ site.company.ruc }}</span>
        <h1 class="ps__title">{{ job.title }}</h1>
        <p v-for="f in job.filters ?? []" :key="f" class="ps__filter">{{ f }}</p>
      </header>

      <table class="ps__table">
        <thead>
          <tr>
            <th v-for="c in columns" :key="c.key" :class="`is-${alignOf(c)}`">{{ c.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in job.rows" :key="i">
            <td v-for="c in columns" :key="c.key" :class="`is-${alignOf(c)}`">{{ formatValue(c, rawValue(c, row)) }}</td>
          </tr>
          <tr v-if="job.totals && Object.keys(job.totals).length" class="ps__totals">
            <td v-for="(c, i) in columns" :key="c.key" :class="`is-${alignOf(c)}`">
              {{ c.key in job.totals ? formatValue(c, job.totals[c.key]) : i === 0 ? site.table.totals : '' }}
            </td>
          </tr>
        </tbody>
        <!-- El navegador repite <tfoot> al pie de cada página: ahí va usuario y fecha -->
        <tfoot>
          <tr>
            <td :colspan="columns.length" class="ps__foot">
              {{ site.print.user }}: {{ user.user?.name || user.user?.email }} · {{ site.print.date }}: {{ printedAt }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </Teleport>
</template>

<style lang="scss">
// Sin scoped: la hoja vive fuera de #app y solo se ve al imprimir.
.print-sheet {
  font-family: $font-principal;
  color: #000;

  .ps__head {
    @include flex(column, center, flex-start, 1pt);
    text-align: center;
    font-size: 8.5pt;
    margin-bottom: 8pt;
  }

  .ps__company {
    font-size: 11pt;
  }

  .ps__title {
    font-size: 12pt;
    margin-top: 6pt;
  }

  .ps__filter {
    font-size: 8.5pt;
    color: #333;
  }

  .ps__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;

    thead {
      display: table-header-group;
    }

    tr {
      break-inside: avoid;
    }

    th {
      text-align: left;
      font-weight: 700;
      border-top: 1pt solid #000;
      border-bottom: 1pt solid #000;
      padding: 3pt 4pt;
    }

    td {
      padding: 2pt 4pt;
      border-bottom: 0.5pt solid #ccc;
    }

    tfoot {
      display: table-footer-group;
    }

    .ps__totals td {
      font-weight: 700;
      border-top: 1pt solid #000;
      border-bottom: none;
    }

    .is-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .is-center {
      text-align: center;
    }
  }

  .ps__table .ps__foot {
    font-size: 7.5pt;
    color: #333;
    border-top: 0.5pt solid #999;
    border-bottom: none;
    padding-top: 4pt;
  }
}
</style>
