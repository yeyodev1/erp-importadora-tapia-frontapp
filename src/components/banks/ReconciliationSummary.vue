<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import type { ReconSummary } from '@/services/banks.service'
import { bancos } from '@/config/copy/bancos'
import { formatMoney } from '@/utils/money'

/** Panel "Resumen" y "Registros" de la conciliación, como el sistema actual. */
defineProps<{ summary: ReconSummary }>()
const t = bancos.rec.summary
</script>

<template>
  <div class="rs panel panel--pad" aria-live="polite">
    <p class="form-section">{{ t.title }}</p>
    <div class="rs__totals">
      <div class="rs__kpi">
        <span>{{ t.statement }} <HelpTip :text="t.help.statement" /></span><strong class="num">{{ formatMoney(summary.statementBalance) }}</strong>
      </div>
      <div class="rs__kpi">
        <span>{{ t.book }} <HelpTip :text="t.help.book" /></span><strong class="num">{{ formatMoney(summary.bookBalance) }}</strong>
      </div>
    </div>

    <div class="rs__scroll">
      <table class="rs__table">
        <thead>
          <tr>
            <th>{{ t.type }}</th>
            <th class="num"><span class="rs__th">{{ t.previous }} <HelpTip :text="t.help.previous" /></span></th>
            <th class="num"><span class="rs__th">{{ t.pending }} <HelpTip :text="t.help.pending" /></span></th>
            <th class="num"><span class="rs__th">{{ t.bookCol }} <HelpTip :text="t.help.bookCol" /></span></th>
            <th class="num"><span class="rs__th">{{ t.records }}: {{ t.pending }} <HelpTip :text="t.help.recordsPending" /></span></th>
            <th class="num"><span class="rs__th">{{ t.records }}: {{ t.cleared }} <HelpTip :text="t.help.cleared" /></span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in summary.rows" :key="r.type">
            <td>{{ bancos.rec.types[r.type] }}</td>
            <td class="num">{{ formatMoney(r.previousMonths) }}</td>
            <td class="num">{{ formatMoney(r.pendingInPeriod) }}</td>
            <td class="num">{{ formatMoney(r.bookInPeriod) }}</td>
            <td class="num">{{ r.records.pending }}</td>
            <td class="num">{{ r.records.cleared }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="rs__totals">
      <div class="rs__kpi">
        <span>{{ t.adjusted }} <HelpTip :text="t.help.adjusted" /></span><strong class="num">{{ formatMoney(summary.adjustedBalance) }}</strong>
      </div>
      <div class="rs__kpi" :class="{ 'is-off': !summary.balanced }">
        <span>{{ t.difference }} <HelpTip :text="t.help.difference" /></span><strong class="num">{{ formatMoney(summary.difference) }}</strong>
      </div>
    </div>
    <p class="rs__msg" :class="summary.balanced ? 'is-ok' : 'is-off'">
      <AppIcon :name="summary.balanced ? 'check-circle' : 'alert'" /> {{ summary.balanced ? t.balanced : summary.message }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.rs {
  @include flex(column, stretch, flex-start, 0.75rem);

  &__totals {
    @include flex(row, stretch, flex-start, 0.75rem);
    flex-wrap: wrap;
  }

  &__kpi {
    @include flex(column, flex-start, flex-start, 0.2rem);
    flex: 1 1 180px;
    padding: 0.6rem 0.75rem;
    background: $sand;
    border-radius: 6px;

    span {
      @include flex(row, center, flex-start, 0.3rem);
      font-size: 0.8rem;
      color: $ink-muted;
    }

    &.is-off strong {
      color: $danger;
    }
  }

  &__th {
    @include flex(row, center, flex-end, 0.25rem);
  }

  &__scroll {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;

    th,
    td {
      padding: 0.4rem 0.5rem;
      border-bottom: 1px solid $line;
      white-space: nowrap;
    }

    th {
      font-size: 0.78rem;
      font-weight: 600;
      color: $ink-muted;
      text-align: left;
    }

    .num {
      text-align: right;
    }
  }

  &__msg {
    @include flex(row, center, flex-start, 0.5rem);
    margin: 0;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;

    &.is-ok {
      color: $success;
      background: $success-bg;
    }

    &.is-off {
      color: $danger;
      background: $danger-bg;
    }
  }
}
</style>
