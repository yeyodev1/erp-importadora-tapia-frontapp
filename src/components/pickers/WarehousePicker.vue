<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import { useCatalogStore } from '@/stores/catalog'

/** Bodega (= establecimiento SRI). v-model = _id. `emptyLabel` para filtros ("Todas"). */
defineProps<{ id: string; emptyLabel?: string; placeholder?: string; invalid?: boolean; disabled?: boolean }>()

const model = defineModel<string>({ default: '' })
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('warehouses'))

const options = computed(() =>
  catalog.warehouses
    .filter((w) => w.isActive || w._id === model.value)
    .map((w) => ({ value: w._id, label: w.name, hint: `${w.code} · Serie ${w.establishment}-${w.emissionPoint}` })),
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
