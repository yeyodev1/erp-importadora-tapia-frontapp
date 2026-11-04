<script setup lang="ts">
import { computed } from 'vue'
import RemotePicker from './RemotePicker.vue'
import { useDisplayLabel, type RemoteOption } from '@/composables/useRemoteSearch'
import { catalogService } from '@/services/catalog.service'
import { site } from '@/config/site'
import type { Party } from '@/types'

/**
 * Tercero por nombre o RUC/cédula. Si se escribe una identificación exacta
 * (10 o 13 dígitos) se busca con /catalog/parties/by-id y se elige sola.
 * `pick` entrega el Party completo para autollenar dirección, crédito, etc.
 */
const props = defineProps<{
  id: string
  /** Limita a clientes, proveedores o empleados. */
  role?: 'customer' | 'supplier' | 'employee'
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  clearable?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ pick: [party: Party | null] }>()

const { display, remember } = useDisplayLabel(model, 'party', async (id) => (await catalogService.getOne('parties', id)).name)

const flag = computed(() =>
  props.role === 'customer' ? 'isCustomer' : props.role === 'supplier' ? 'isSupplier' : props.role === 'employee' ? 'isEmployee' : '',
)

const toOption = (p: Party): RemoteOption<Party> => ({ value: p._id, label: p.name, hint: p.identification, data: p })

async function search(q: string) {
  const params = { q, limit: 20, ...(flag.value ? { [flag.value]: 'true' } : {}) }
  return (await catalogService.list('parties', params)).items.map(toOption)
}

async function exact(q: string) {
  if (!/^\d{10}(\d{3})?$/.test(q)) return null
  const party = await catalogService.partyByIdentification(q)
  if (flag.value && !party[flag.value as 'isCustomer']) return null
  return toOption(party)
}

function onPick(party: Party | null) {
  if (party) remember(party._id, party.name)
  emit('pick', party)
}
</script>

<template>
  <RemotePicker
    :id="id"
    v-model="model"
    :display="display"
    :search="search"
    :exact="exact"
    :placeholder="placeholder ?? site.pickers.searchParty"
    :search-placeholder="site.pickers.searchParty"
    :invalid="invalid"
    :disabled="disabled"
    :clearable="clearable"
    @pick="onPick"
  />
</template>
