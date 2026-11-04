<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import { useCatalogStore } from '@/stores/catalog'

/**
 * Bodega (= establecimiento SRI). v-model = _id. `emptyLabel` para filtros ("Todas").
 * Sin `emptyLabel` el campo nunca queda vacío: si el usuario no tiene bodega
 * asignada, toma la primera activa (Guayaquil). `exclude` quita una bodega
 * (el destino de una transferencia nunca es la de origen).
 */
const props = defineProps<{ id: string; emptyLabel?: string; placeholder?: string; invalid?: boolean; disabled?: boolean; exclude?: string }>()

const model = defineModel<string>({ default: '' })
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('warehouses'))

const options = computed(() =>
  catalog.warehouses
    .filter((w) => (w.isActive || w._id === model.value) && w._id !== props.exclude)
    .map((w) => ({ value: w._id, label: w.name, hint: `${w.code} · Serie ${w.establishment}-${w.emissionPoint}` })),
)

watch(
  options,
  (list) => {
    if (model.value && props.exclude && model.value === props.exclude) model.value = ''
    if (!model.value && props.emptyLabel === undefined && !props.disabled && list[0]) model.value = list[0].value
  },
  { immediate: true },
)
</script>

<template>
  <BaseCombobox
    :id="id"
    v-model="model"
    :options="options"
    :empty-label="emptyLabel"
    :placeholder="placeholder ?? 'Elegir bodega'"
    :invalid="invalid"
    :disabled="disabled"
    :loading="!catalog.loaded.warehouses"
  />
</template>
