<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import TransactionsTable from '@/components/purchases/TransactionsTable.vue'
import AdvanceDialog from '@/components/purchases/AdvanceDialog.vue'
import AdvanceApplyDialog from '@/components/purchases/AdvanceApplyDialog.vue'
import { useAccess } from '@/composables/useAccess'
import { cxp } from '@/config/copy/cxp'
import type { PayableTransaction } from '@/types/purchases'

const t = cxp.advances
const { canWrite } = useAccess()
const tab = ref<'anticipo' | 'cruce' | 'devolucion'>('anticipo')
const creating = ref(false)
const applying = ref<PayableTransaction | null>(null)
const mode = ref<'cross' | 'refund'>('cross')
// Cambiar la clave vuelve a montar la tabla: después de grabar se ve el saldo al día.
const version = ref(0)

function apply(row: PayableTransaction, m: 'cross' | 'refund') {
  mode.value = m
  applying.value = row
}

function onSaved() {
  creating.value = false
  applying.value = null
  version.value++
}
</script>

<template>
  <section class="adv">
    <PageHeader>
      <button v-if="canWrite" type="button" class="btn btn--primary" @click="creating = true"><AppIcon name="plus" /> {{ t.add }}</button>
    </PageHeader>
    <BaseSegmented
      v-model="tab"
      tabs
      :options="[
        { value: 'anticipo', label: 'Anticipos' },
        { value: 'cruce', label: 'Cruces' },
        { value: 'devolucion', label: 'Devoluciones' },
      ]"
    />
    <TransactionsTable :key="`${tab}-${version}`" :kind="tab" :can-write="canWrite" :with-open="tab === 'anticipo'">
      <template #actions="{ row }">
        <template v-if="tab === 'anticipo' && row.amount > row.applied">
          <button type="button" class="btn btn--primary btn--sm" @click="apply(row, 'cross')">{{ t.cross }}</button>
          <button type="button" class="btn btn--ghost btn--sm" @click="apply(row, 'refund')">{{ t.refund }}</button>
        </template>
      </template>
    </TransactionsTable>

    <AdvanceDialog :open="creating" @close="creating = false" @saved="onSaved" />
    <AdvanceApplyDialog :advance="applying" :mode="mode" @close="applying = null" @saved="onSaved" />
  </section>
</template>

<style scoped lang="scss">
.adv {
  @include flex(column, stretch, flex-start, 1rem);
}
</style>
