<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import { useCatalogStore } from '@/stores/catalog'

/**
 * Banco o caja de la empresa. v-model = _id. Con `kind` solo bancos (para
 * cheques y conciliación) o solo cajas. La cuenta contable de cada uno está
 * en `catalog.bankAccounts` (accountCode).
 */
const props = defineProps<{
  id: string
  kind?: 'banco' | 'caja'
  emptyLabel?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
}>()

const model = defineModel<string>({ default: '' })
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('bankAccounts'))

const options = computed(() =>
  catalog.bankAccounts
    .filter((b) => (b.isActive || b._id === model.value) && (!props.kind || b.kind === props.kind))
    .map((b) => ({
      value: b._id,
      label: b.name,
      hint: b.kind === 'banco' ? [b.bank, b.type, b.number].filter(Boolean).join(' · ') : 'Caja',
    })),
)
</script>

<template>
  <BaseCombobox
    :id="id"
    v-model="model"
    :options="options"
    :empty-label="emptyLabel"
    :placeholder="placeholder ?? 'Elegir banco o caja'"
    :invalid="invalid"
    :disabled="disabled"
    :loading="!catalog.loaded.bankAccounts"
  />
</template>
