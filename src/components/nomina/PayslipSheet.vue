<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { site } from '@/config/site'
import { nomina } from '@/config/copy/nomina'
import { nominaRol } from '@/config/copy/nominaRol'
import { monthLabel } from '@/composables/accounting/useReport'
import { formatMoney } from '@/utils/money'
import type { Payroll, PayrollLine } from '@/types/payroll'

/**
 * Rol individual impreso: ingresos, descuentos y neto, con firmas. Uno por
 * hoja. Vive fuera de #app con la clase print-sheet (como ThePrintSheet):
 * solo se ve al imprimir. `print(lines)` abre el diálogo del navegador.
 */
const props = defineProps<{ payroll: Payroll }>()
const s = nominaRol.slip
const c = nominaRol.cols
const lines = ref<PayrollLine[]>([])

const slips = computed(() =>
  lines.value.map((l) => ({
    line: l,
    income: [
      [c.salaryEarned.label, l.salaryEarned],
      [c.extras.label, l.extras],
      [c.commissions.label, l.commissions],
      [s.reserveFund, l.reserveFundPaid],
    ].filter(([, v]) => v) as [string, number][],
    deductions: [
      [c.iessPersonal.label, l.iessPersonal],
      [c.interno.label, l.loanTotals.interno],
      [c.quirografario.label, l.loanTotals.quirografario],
      [c.hipotecario.label, l.loanTotals.hipotecario],
      [c.otherDeductions.label, l.otherDeductions],
    ].filter(([, v]) => v) as [string, number][],
  })),
)

async function print(which: PayrollLine[]) {
  lines.value = which
  await nextTick()
  document.body.classList.add('is-printing')
  window.addEventListener(
    'afterprint',
    () => {
      document.body.classList.remove('is-printing')
      lines.value = []
    },
    { once: true },
  )
  window.print()
}
defineExpose({ print })
</script>

<template>
  <Teleport to="body">
    <div v-if="lines.length" class="print-sheet slips">
      <article v-for="{ line, income, deductions } in slips" :key="line.employeeId" class="slip">
        <header class="slip__head">
          <strong>{{ site.company.legalName }}</strong>
          <span>RUC {{ site.company.ruc }} · {{ site.company.address }} · {{ site.company.city }}</span>
          <h1>{{ s.title }} · {{ monthLabel(props.payroll.period) }}</h1>
        </header>
        <dl class="slip__who">
          <div><dt>{{ s.employee }}</dt><dd>{{ line.name }}</dd></div>
          <div><dt>{{ s.identification }}</dt><dd>{{ line.identification }}</dd></div>
          <div><dt>{{ s.position }}</dt><dd>{{ line.position || '—' }}</dd></div>
          <div><dt>{{ s.department }}</dt><dd>{{ nomina.departments[line.department] }}</dd></div>
          <div><dt>{{ s.days }}</dt><dd>{{ line.days }}</dd></div>
        </dl>
        <div class="slip__cols">
          <table>
            <thead><tr><th colspan="2">{{ s.income }}</th></tr></thead>
            <tbody>
              <tr v-for="[label, value] in income" :key="label"><td>{{ label }}</td><td class="n">{{ formatMoney(value) }}</td></tr>
            </tbody>
            <tfoot><tr><td>{{ s.totalIncome }}</td><td class="n">{{ formatMoney(line.totalIncome) }}</td></tr></tfoot>
          </table>
          <table>
            <thead><tr><th colspan="2">{{ s.deductions }}</th></tr></thead>
            <tbody>
              <tr v-for="[label, value] in deductions" :key="label"><td>{{ label }}</td><td class="n">{{ formatMoney(value) }}</td></tr>
            </tbody>
            <tfoot><tr><td>{{ s.totalDeductions }}</td><td class="n">{{ formatMoney(line.totalDeductions) }}</td></tr></tfoot>
          </table>
        </div>
        <p class="slip__net">{{ s.net }}: <strong>{{ formatMoney(line.net) }}</strong></p>
        <div class="slip__sign">
          <span>{{ s.company }}</span>
          <span>{{ s.received }} · {{ line.name }}</span>
        </div>
      </article>
    </div>
  </Teleport>
</template>

<style lang="scss">
// Sin scoped: la hoja vive fuera de #app y solo se ve al imprimir.
.slips {
  font-family: $font-principal;
  color: #000;
  font-size: 9pt;

  .slip {
    display: flex;
    flex-direction: column;
    gap: 8pt;
    break-after: page;
  }

  .slip__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1pt;
    text-align: center;

    h1 {
      font-size: 11pt;
      margin-top: 6pt;
    }
  }

  .slip__who {
    display: flex;
    flex-wrap: wrap;
    gap: 4pt 16pt;
    border-top: 1pt solid #000;
    border-bottom: 1pt solid #000;
    padding: 4pt 0;

    dt {
      font-size: 7pt;
      color: #333;
    }

    dd {
      font-weight: 600;
    }
  }

  .slip__cols {
    display: flex;
    gap: 16pt;

    table {
      flex: 1 1 0;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      border-bottom: 1pt solid #000;
      padding: 2pt 0;
    }

    td {
      padding: 2pt 0;
      border-bottom: 0.5pt solid #ccc;
    }

    tfoot td {
      font-weight: 700;
      border-top: 1pt solid #000;
      border-bottom: none;
    }

    .n {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
  }

  .slip__net {
    text-align: right;
    font-size: 11pt;
  }

  .slip__sign {
    display: flex;
    justify-content: space-between;
    gap: 24pt;
    margin-top: 40pt;

    span {
      flex: 1 1 0;
      border-top: 0.75pt solid #000;
      padding-top: 3pt;
      text-align: center;
      font-size: 8pt;
    }
  }
}
</style>
