<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import { monthOptions } from '@/composables/accounting/useReport'
import { site } from '@/config/site'

/** Barra de un reporte por mes (AAAA-MM): el mes, filtros propios en el slot y Consultar. */
withDefaults(defineProps<{ field?: { label: string; help: string }; id?: string; loading?: boolean }>(), {
  field: () => ({ label: 'Período', help: 'Mes que muestra el reporte. Abre en el mes actual. Ej.: Octubre 2026.' }),
  id: 'period',
})
const period = defineModel<string>({ required: true })
const emit = defineEmits<{ submit: [] }>()
const months = monthOptions()
</script>

<template>
  <form class="pb panel panel--pad" @submit.prevent="emit('submit')">
    <div class="form-grid">
      <FormField v-bind="field" :for="id">
        <BaseCombobox :id="id" v-model="period" :options="months" />
      </FormField>
      <slot />
      <div class="pb__submit">
        <BaseButton type="submit" variant="primary" icon="search" :loading="loading">{{ site.filters.apply }}</BaseButton>
      </div>
    </div>
  </form>
</template>

<style scoped lang="scss">
.pb {
  margin-bottom: 0.75rem;

  &__submit {
    @include flex(row, flex-end, flex-start);
    flex: 0 0 auto !important;
  }
}
</style>
