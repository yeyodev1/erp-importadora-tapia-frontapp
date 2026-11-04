<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useAccess } from '@/composables/useAccess'
import { settingsService } from '@/services/settings.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { formatMonth, shiftMonth, todayISO } from '@/utils/format'
import { site } from '@/config/site'
import type { ApiError } from '@/types'

/** Cierre de meses: `lockedThrough` = último mes cerrado; nada se graba en o antes de él. */
const t = site.catalogs.periodLock
const { canWrite } = useAccess()
const catalog = useCatalogStore()
const toast = useToastStore()

const current = shiftMonth(todayISO().slice(0, 7), 0)
const month = ref(shiftMonth(current, -1))
const pending = ref<{ period: string | null; close: boolean } | null>(null)
const saving = ref(false)
const error = ref('')

onMounted(() => catalog.invalidate('settings'))
const locked = computed(() => catalog.settings?.lockedThrough ?? null)
const label = (p: string) => formatMonth(p).replace(/^./, (c) => c.toUpperCase())
const months = computed(() =>
  Array.from({ length: 36 }, (_, i) => shiftMonth(current, -i)).map((p) => ({
    value: p,
    label: label(p),
    hint: locked.value && p <= locked.value ? t.closedHint : t.openHint,
  })),
)

const canClose = computed(() => !locked.value || month.value > locked.value)
const canReopen = computed(() => Boolean(locked.value && month.value <= locked.value))

function ask(close: boolean, all = false) {
  error.value = ''
  pending.value = { close, period: close ? month.value : all ? null : shiftMonth(month.value, -1) }
}

async function confirm() {
  if (!pending.value) return
  saving.value = true
  try {
    catalog.settings = await settingsService.lock(pending.value.period)
    toast.success(pending.value.close ? t.closed : t.reopened)
    pending.value = null
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    saving.value = false
  }
}

const subject = computed(() => {
  const p = pending.value
  if (!p) return ''
  if (p.close) return `${t.closeMessage} ${label(month.value)}.`
  return `${t.reopenMessage} ${p.period ? label(shiftMonth(p.period, 1)) : 'cualquier fecha'}.`
})
</script>

<template>
  <section>
    <PageHeader :subtitle="t.intro" />
    <div class="panel panel--pad lock">
      <p class="lock__status">
        <AppIcon :name="locked ? 'lock' : 'unlock'" />
        {{ t.current }}:
        <BaseBadge :tone="locked ? 'warning' : 'neutral'">{{ locked ? label(locked) : t.none }}</BaseBadge>
      </p>

      <div class="form-grid">
        <FormField v-bind="t.month" for="lock-month">
          <BaseCombobox id="lock-month" v-model="month" :options="months" :disabled="!canWrite" />
        </FormField>
      </div>

      <div v-if="canWrite" class="lock__actions">
        <button type="button" class="btn btn--primary" :disabled="!canClose" @click="ask(true)"><AppIcon name="lock" /> {{ t.close }}</button>
        <button type="button" class="btn btn--ghost" :disabled="!canReopen" @click="ask(false)"><AppIcon name="unlock" /> {{ t.reopen }}</button>
        <button type="button" class="btn btn--ghost" :disabled="!locked" @click="ask(false, true)">{{ t.reopenAll }}</button>
      </div>
    </div>

    <ConfirmModal
      :open="!!pending"
      danger
      :title="pending?.close ? t.closeTitle : t.reopenTitle"
      :message="subject"
      :second-message="pending?.close ? t.closeSecond : t.reopenSecond"
      :second-label="pending?.close ? t.closeTitle : t.reopenTitle"
      :loading="saving"
      :error="error"
      @confirm="confirm"
      @cancel="pending = null"
    />
  </section>
</template>

<style scoped lang="scss">
.lock {
  @include flex(column, stretch, flex-start, 1rem);
  max-width: 640px;

  &__status {
    @include flex(row, center, flex-start, 0.5rem);
    font-weight: 500;
  }

  &__actions {
    @include flex(row, center, flex-start, 0.5rem);
    flex-wrap: wrap;
  }
}
</style>
