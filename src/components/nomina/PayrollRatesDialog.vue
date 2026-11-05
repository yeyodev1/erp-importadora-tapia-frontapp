<script setup lang="ts">
import FormDialog from '@/components/ui/FormDialog.vue'
import FormField from '@/components/ui/FormField.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import { useSettingsForm } from '@/composables/useSettingsForm'
import { nominaRol as t } from '@/config/copy/nominaRol'
import type { PayrollRates } from '@/types'

/** SBU y tasas de la nómina (Configuración › settings.payroll). Rigen para los roles que se generen. */
defineProps<{ open: boolean; readonly?: boolean }>()
const emit = defineEmits<{ close: [] }>()

type RateKey = Exclude<keyof PayrollRates, 'sbu'>
const RATE_KEYS: RateKey[] = ['iessPersonalRate', 'iessEmployerRate', 'secapRate', 'ieceRate', 'reserveFundRate']
const f = t.rateFields

const { form, loading, saving, error, save } = useSettingsForm(
  (s) => ({
    sbu: s.payroll?.sbu ?? null,
    rates: Object.fromEntries(RATE_KEYS.map((k) => [k, String(s.payroll?.[k] ?? '')])) as Record<RateKey, string>,
  }),
  (v) => ({
    payroll: { sbu: v.sbu ?? 0, ...Object.fromEntries(RATE_KEYS.map((k) => [k, Number(v.rates[k].replace(',', '.'))])) } as PayrollRates,
  }),
)

async function submit() {
  await save()
  if (!error.value) emit('close')
}
</script>

<template>
  <FormDialog :open="open" :title="t.ratesTitle" :loading="saving" :error="error" :readonly="readonly" @submit="submit" @close="emit('close')">
    <p class="rd__note"><AppIcon name="alert" /> {{ t.ratesNote }}</p>
    <SkeletonBlock v-if="loading || !form" :lines="4" />
    <fieldset v-else class="form-grid rd__fields" :disabled="readonly">
      <FormField v-bind="f.sbu" for="rt-sbu" required>
        <MoneyInput id="rt-sbu" v-model="form.sbu" />
      </FormField>
      <FormField v-for="k in RATE_KEYS" :key="k" v-bind="f[k]" :for="`rt-${k}`" required class="narrow">
        <input :id="`rt-${k}`" v-model="form.rates[k]" inputmode="decimal" class="num" />
      </FormField>
    </fieldset>
  </FormDialog>
</template>

<style scoped lang="scss">
.rd__note {
  @include flex(row, flex-start, flex-start, 0.5rem);
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: $radius-sm;
  background: $warning-bg;
  color: $warning;
  font-size: $text-sm;
}

.rd__fields {
  border: none;
  min-width: 0;
}
</style>
