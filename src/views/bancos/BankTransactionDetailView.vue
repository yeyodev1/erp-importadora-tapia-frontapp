<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EntryPreview from '@/components/documents/EntryPreview.vue'
import DataTable from '@/components/table/DataTable.vue'
import type { Column } from '@/components/table/columns'
import ReasonConfirm from '@/components/banks/ReasonConfirm.vue'
import { useAccess } from '@/composables/useAccess'
import { entryOf } from '@/composables/banks/useBankTxForm'
import { banksService, type BankMovement, type BankTransaction } from '@/services/banks.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { bancos } from '@/config/copy/bancos'
import { formatMoney } from '@/utils/money'
import { formatDateTime, formatDay } from '@/utils/format'
import type { ApiError } from '@/types'

const t = bancos.tx
const route = useRoute()
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const toast = useToastStore()

const tx = ref<(BankTransaction & { movements: BankMovement[] }) | null>(null)
const loadError = ref('')
const voiding = ref(false)
const saving = ref(false)
const voidError = ref('')

async function load() {
  loadError.value = ''
  try {
    await catalog.ensure('bankAccounts')
    tx.value = await banksService.getTransaction(String(route.params.id))
  } catch (e) {
    loadError.value = (e as ApiError).message
  }
}
onMounted(load)

const find = (id: string | null) => catalog.bankAccounts.find((b) => b._id === id)
const entry = computed(() =>
  tx.value ? entryOf(tx.value.type, find(tx.value.bankAccountId), find(tx.value.targetBankAccountId), tx.value.amount, tx.value.lines, tx.value.description) : [],
)
const facts = computed(() => {
  const x = tx.value
  if (!x) return []
  return [
    [t.cols.date, formatDay(x.date)],
    [t.cols.type, bancos.types[x.type].label],
    [t.cols.bank, find(x.bankAccountId)?.name ?? ''],
    [t.fields.target.label, find(x.targetBankAccountId)?.name ?? ''],
    [t.cols.check, x.checkNumber],
    [t.fields.beneficiary.label, x.beneficiary],
    [t.cols.amount, formatMoney(x.amount)],
    [t.createdBy, `${x.createdBy?.name ?? ''} · ${formatDateTime(x.createdAt)}`],
    [t.voidReason, x.voidReason],
  ].filter(([, v]) => v)
})

const movCols: Column<BankMovement>[] = [
  { key: 'date', label: t.cols.date, format: 'date' },
  { key: 'bank', label: t.cols.bank, value: (m) => find(m.bankAccountId)?.name ?? '' },
  { key: 'type', label: t.cols.type, value: (m) => bancos.movType(m.type) },
  { key: 'checkNumber', label: t.cols.check },
  { key: 'amount', label: t.cols.amount, format: 'money', value: (m) => (m.direction === 'in' ? m.amount : -m.amount) },
  { key: 'status', label: t.cols.status },
]

async function doVoid(reason: string) {
  saving.value = true
  voidError.value = ''
  try {
    await banksService.voidTransaction(tx.value!._id, reason)
    toast.success(t.voided)
    voiding.value = false
    await load()
  } catch (e) {
    voidError.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <PageHeader :title="tx ? `${t.detailTitle} ${tx.number}` : t.detailTitle">
      <RouterLink :to="{ name: 'BankTransactions' }" class="btn btn--ghost"><AppIcon name="arrow-left" /> {{ t.back }}</RouterLink>
      <button v-if="canWrite && tx?.status === 'vigente'" type="button" class="btn btn--danger" @click="voiding = true">
        <AppIcon name="trash" /> {{ t.voidAction }}
      </button>
    </PageHeader>

    <EmptyState v-if="loadError" tone="error" :message="loadError" @retry="load" />
    <div v-else-if="tx" class="txd">
      <div class="panel panel--pad">
        <div class="txd__head">
          <StatusBadge :status="tx.status" />
          <p class="txd__desc mono">{{ tx.description }}</p>
        </div>
        <dl class="txd__facts">
          <div v-for="[k, v] in facts" :key="k" class="txd__fact">
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </div>
        </dl>
        <p class="txd__note"><AppIcon name="info" /> {{ t.noEdit }}</p>
      </div>
      <EntryPreview :lines="entry" />
      <DataTable :columns="movCols" :rows="tx.movements" :title="t.movements" :exportable="false">
        <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      </DataTable>
    </div>

    <ReasonConfirm
      :open="voiding"
      :title="t.voidTitle"
      :subject="tx ? `${tx.number} · ${tx.description}` : ''"
      :message="t.voidMessage"
      :second-message="t.voidSecond"
      :confirm-label="t.voidLabel"
      :reason="{ label: t.voidReason, help: bancos.reason.help }"
      :loading="saving"
      :error="voidError"
      @confirm="doVoid"
      @cancel="voiding = false"
    />
  </section>
</template>

<style scoped lang="scss">
.txd {
  @include flex(column, stretch, flex-start, 1rem);

  &__head {
    @include flex(row, center, flex-start, 0.75rem);
    flex-wrap: wrap;
  }

  &__desc {
    margin: 0;
    flex: 1 1 260px;
  }

  &__facts {
    @include flex(row, flex-start, flex-start, 0.75rem 1.5rem);
    flex-wrap: wrap;
    margin: 1rem 0 0;
  }

  &__fact {
    flex: 1 1 160px;

    dt {
      font-size: 0.8rem;
      color: $ink-muted;
    }

    dd {
      margin: 0.15rem 0 0;
      font-weight: 500;
    }
  }

  &__note {
    @include flex(row, center, flex-start, 0.4rem);
    margin: 1rem 0 0;
    font-size: 0.85rem;
    color: $ink-soft;
  }
}
</style>
