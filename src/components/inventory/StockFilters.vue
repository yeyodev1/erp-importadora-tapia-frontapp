<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ReportFilters from '@/components/report/ReportFilters.vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import { useCatalogStore } from '@/stores/catalog'
import { inventario as copy } from '@/config/copy/inventario'
import type { StockFilterValues } from './stockFilters'

/** ReportFilters con bodega, grupo, subgrupo y proveedor (saldos, toma física, bajo mínimo). */
defineProps<{ loading?: boolean }>()
const model = defineModel<StockFilterValues>({ required: true })
const emit = defineEmits<{ apply: [summary: string[]] }>()

const c = copy.common
const catalog = useCatalogStore()
const supplier = ref('')
onMounted(() => catalog.ensure('productGroups'))

const groups = computed(() => catalog.productGroups.map((g) => ({ value: g._id, label: g.name })))
const subgroups = computed(() =>
  (catalog.productGroups.find((g) => g._id === model.value.groupId)?.subgroups ?? []).map((s) => ({ value: s, label: s })),
)

function onGroup(id: string) {
  model.value.groupId = id
  model.value.subgroup = ''
}

function apply(summary: string[]) {
  const group = catalog.productGroups.find((g) => g._id === model.value.groupId)?.name
  if (group) summary.push(`${c.group}: ${group}`)
  if (model.value.subgroup) summary.push(`${c.subgroup}: ${model.value.subgroup}`)
  if (model.value.partyId && supplier.value) summary.push(`${c.supplier}: ${supplier.value}`)
  emit('apply', summary)
}
</script>

<template>
  <ReportFilters v-model="model" :fields="['warehouse']" :loading="loading" @apply="apply">
    <FormField :label="c.group" :help="c.groupHelp" for="sf-group">
      <BaseCombobox id="sf-group" :model-value="model.groupId" :options="groups" :empty-label="c.allGroups" @update:model-value="onGroup" />
    </FormField>
    <FormField :label="c.subgroup" :help="c.subgroupHelp" for="sf-sub">
      <BaseCombobox id="sf-sub" v-model="model.subgroup" :options="subgroups" :empty-label="c.allGroups" :disabled="!subgroups.length" />
    </FormField>
    <FormField :label="c.supplier" :help="c.supplierHelp" for="sf-supplier">
      <PartyPicker id="sf-supplier" v-model="model.partyId" role="supplier" clearable @pick="supplier = $event?.name ?? ''" />
    </FormField>
    <slot />
  </ReportFilters>
</template>
