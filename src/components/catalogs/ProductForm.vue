<script setup lang="ts">
import { computed, onMounted } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseCombobox from '@/components/ui/BaseCombobox.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import QtyInput from '@/components/ui/QtyInput.vue'
import PartyPicker from '@/components/pickers/PartyPicker.vue'
import DocumentLines from '@/components/documents/DocumentLines.vue'
import type { LineColumn } from '@/components/documents/lines'
import { useCatalogStore } from '@/stores/catalog'
import { site } from '@/config/site'
import type { ProductForm } from './productForm'

/** Ficha de producto: datos generales, doble unidad (control + compra con factor), clasificación, control/IVA y lista de precios. */
defineProps<{ readonly?: boolean }>()
const form = defineModel<ProductForm>({ required: true })

const t = site.catalogs.products
const f = t.fields
const catalog = useCatalogStore()
onMounted(() => catalog.ensure('productGroups'))

const groups = computed(() =>
  catalog.productGroups.filter((g) => g.isActive || g._id === form.value.groupId).map((g) => ({ value: g._id, label: g.name })),
)
const subgroups = computed(() =>
  (catalog.productGroups.find((g) => g._id === form.value.groupId)?.subgroups ?? []).map((s) => ({ value: s, label: s })),
)
const kinds = [
  { value: 'bien' as const, label: t.kinds.bien, help: t.kindHelp.bien },
  { value: 'servicio' as const, label: t.kinds.servicio, help: t.kindHelp.servicio },
]
const vatRates = [
  { value: 0 as const, label: t.vat[0], help: t.vatHelp[0] },
  { value: 15 as const, label: t.vat[15], help: t.vatHelp[15] },
]
// "Calc." de la ficha de hoy, a la vista: 1 SACOS = 100 LIBRAS.
const calc = computed(() => {
  const { name, factor } = form.value.purchaseUnit
  return name && factor ? `1 ${name.toUpperCase()} = ${factor} ${form.value.unit.toUpperCase()}` : undefined
})
const priceColumns: LineColumn[] = [
  { key: 'list', label: f.priceList.label, type: 'text', placeholder: 'GENERAL' },
  { key: 'price', label: f.price.label, type: 'money' },
]
</script>

<template>
  <!-- Mismo orden que la ficha de Producto de hoy: producto y códigos, unidades con factor, grupo/subgrupo/proveedor/ubicación/mínimo, checks y lista de precios. -->
  <div class="form-grid">
    <FormField v-bind="f.name" for="pr-name" required full>
      <input id="pr-name" v-model="form.name" required :placeholder="t.ph.name" />
    </FormField>
    <FormField v-bind="f.code" for="pr-code" required class="narrow">
      <input id="pr-code" v-model="form.code" class="mono" required :placeholder="t.ph.code" />
    </FormField>
    <FormField v-bind="f.barcode" for="pr-bar" class="narrow">
      <input id="pr-bar" v-model="form.barcode" class="mono" inputmode="numeric" :placeholder="t.ph.barcode" />
    </FormField>

    <p class="form-section full">{{ t.unitsSection }}</p>
    <FormField v-bind="f.unit" for="pr-unit" required>
      <input id="pr-unit" v-model="form.unit" class="upper" required :placeholder="t.ph.unit" />
    </FormField>
    <FormField v-bind="f.factor" for="pr-factor" required :hint="calc">
      <QtyInput id="pr-factor" v-model="form.purchaseUnit.factor" :unit="form.unit" />
    </FormField>
    <FormField v-bind="f.purchaseUnitName" for="pr-punit">
      <input id="pr-punit" v-model="form.purchaseUnit.name" class="upper" :placeholder="t.ph.purchaseUnitName" />
    </FormField>

    <p class="form-section full">{{ t.classSection }}</p>
    <FormField v-bind="f.groupId" for="pr-group" required>
      <BaseCombobox id="pr-group" v-model="form.groupId" :options="groups" :loading="!catalog.loaded.productGroups" placeholder="Elegir grupo" />
    </FormField>
    <FormField v-bind="f.subgroup" for="pr-sub">
      <BaseCombobox id="pr-sub" v-model="form.subgroup" :options="subgroups" empty-label="Sin subgrupo" :disabled="!form.groupId" />
    </FormField>
    <FormField v-bind="f.supplierId" for="pr-sup">
      <PartyPicker id="pr-sup" v-model="form.supplierId" role="supplier" clearable />
    </FormField>
    <FormField v-bind="f.location" for="pr-loc">
      <input id="pr-loc" v-model="form.location" :placeholder="t.ph.location" />
    </FormField>
    <FormField v-bind="f.minQty" for="pr-min">
      <QtyInput id="pr-min" v-model="form.minQty" :unit="form.unit" />
    </FormField>

    <p class="form-section full">{{ t.controlSection }}</p>
    <FormField v-bind="f.kind">
      <BaseSegmented v-model="form.kind" :options="kinds" :label="f.kind.label" />
    </FormField>
    <FormField v-bind="f.vatRate">
      <BaseSegmented v-model="form.vatRate" :options="vatRates" :label="f.vatRate.label" />
    </FormField>
    <div class="switches">
      <BaseSwitch v-model="form.controlsStock" v-bind="f.controlsStock" :disabled="form.kind === 'servicio'" />
      <BaseSwitch v-model="form.controlsLot" v-bind="f.controlsLot" />
      <BaseSwitch v-model="form.isActive" v-bind="f.isActive" />
    </div>

    <p class="form-section full">{{ t.pricesSection }}</p>
    <FormField v-bind="f.prices" full>
      <DocumentLines v-model="form.prices" :columns="priceColumns" :new-line="() => ({ list: '', price: null })" :readonly="readonly" id-prefix="pr-price" />
    </FormField>
  </div>
</template>

<style scoped lang="scss">
.switches {
  @include flex(row, center, flex-start, 0.5rem 1.25rem);
  flex-wrap: wrap;
}

.upper {
  text-transform: uppercase;
}
</style>
