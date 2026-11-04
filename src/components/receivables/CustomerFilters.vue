<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import { useCatalogStore } from '@/stores/catalog'
import { facturacion as t } from '@/config/copy/facturacion'
import type { CustomerFilterKey, CustomerFilterValues } from './customerFilters'

/**
 * Filtros de cliente que usa el sistema de hoy en ventas y cartera:
 * Vendedor, Parroquia, Sucursal, Tipo de cliente y Serie. Vacío = "Todos".
 * Va dentro del slot de ReportFilters.
 */
const props = withDefaults(defineProps<{ fields?: CustomerFilterKey[]; idPrefix?: string }>(), {
  fields: () => ['sellerName', 'customerType', 'branch', 'series'],
  idPrefix: 'cf',
})
const model = defineModel<CustomerFilterValues>({ required: true })

const catalog = useCatalogStore()
onMounted(() => catalog.ensure('warehouses'))
const has = (k: CustomerFilterKey) => props.fields.includes(k)
const seriesOptions = computed(() =>
  catalog.warehouses.map((w) => ({ value: `${w.establishment}-${w.emissionPoint}`, label: `${w.establishment}-${w.emissionPoint}`, hint: w.name })),
)
const f = t.fields
const ph = t.placeholders
</script>

<template>
  <FormField v-if="has('sellerName')" v-bind="f.seller" :for="`${idPrefix}-seller`">
    <input :id="`${idPrefix}-seller`" v-model="model.sellerName" :placeholder="ph.seller" />
  </FormField>
  <FormField v-if="has('parish')" v-bind="f.parish" :for="`${idPrefix}-parish`">
    <input :id="`${idPrefix}-parish`" v-model="model.parish" :placeholder="ph.parish" />
  </FormField>
  <FormField v-if="has('branch')" v-bind="f.branch" :for="`${idPrefix}-branch`">
    <input :id="`${idPrefix}-branch`" v-model="model.branch" :placeholder="ph.branch" />
  </FormField>
  <FormField v-if="has('customerType')" v-bind="f.customerType" :for="`${idPrefix}-ctype`">
    <input :id="`${idPrefix}-ctype`" v-model="model.customerType" :placeholder="ph.customerType" />
  </FormField>
  <FormField v-if="has('series')" v-bind="f.series" :for="`${idPrefix}-series`">
    <BaseCombobox :id="`${idPrefix}-series`" v-model="model.series" :options="seriesOptions" :empty-label="f.all" />
  </FormField>
</template>
