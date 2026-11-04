<script setup lang="ts">
import RemotePicker from './RemotePicker.vue'
import { useDisplayLabel, type RemoteOption } from '@/composables/useRemoteSearch'
import { catalogService } from '@/services/catalog.service'
import { site } from '@/config/site'
import type { Product } from '@/types'

/**
 * Producto por código, nombre o código de barras. `pick` entrega el
 * Product (unidad, factor, IVA, precios) para llenar la línea.
 */
defineProps<{
  id: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  clearable?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ pick: [product: Product | null] }>()

const label = (p: Product) => `${p.code} · ${p.name}`
const { display, remember } = useDisplayLabel(model, 'product', async (id) => label(await catalogService.getOne('products', id)))

async function search(q: string): Promise<RemoteOption<Product>[]> {
  const { items } = await catalogService.list('products', { q, limit: 25 })
  return items.map((p) => ({
    value: p._id,
    label: label(p),
    hint: `${p.unit} · IVA ${p.vatRate} %${p.purchaseUnit?.factor > 1 ? ` · ${p.purchaseUnit.name} × ${p.purchaseUnit.factor}` : ''}`,
    data: p,
  }))
}

function onPick(product: Product | null) {
  if (product) remember(product._id, label(product))
  emit('pick', product)
}
</script>

<template>
  <RemotePicker
    :id="id"
    v-model="model"
    :display="display"
    :search="search"
    :placeholder="placeholder ?? site.pickers.searchProduct"
    :search-placeholder="site.pickers.searchProduct"
    :invalid="invalid"
    :disabled="disabled"
    :clearable="clearable"
    @pick="onPick"
  />
</template>
