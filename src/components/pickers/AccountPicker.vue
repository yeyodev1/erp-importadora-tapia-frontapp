<script setup lang="ts">
import RemotePicker from './RemotePicker.vue'
import { useDisplayLabel, type RemoteOption } from '@/composables/useRemoteSearch'
import { catalogService } from '@/services/catalog.service'
import { site } from '@/config/site'
import type { Account } from '@/types'

/**
 * Cuenta contable de MOVIMIENTO (las de mayor no reciben asientos).
 * v-model = código ("1.1.01.02.01.004"); se muestra código + nombre.
 */
defineProps<{
  id: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  clearable?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ pick: [account: Account | null] }>()

const label = (a: Account) => `${a.code}  ${a.name}`
const { display, remember } = useDisplayLabel(model, 'account', async (code) => {
  const { items } = await catalogService.list('accounts', { q: code, active: 'all', limit: 20 })
  const found = items.find((a) => a.code === code)
  return found ? label(found) : code
})

async function search(q: string): Promise<RemoteOption<Account>[]> {
  const { items } = await catalogService.list('accounts', { q, kind: 'movimiento', limit: 40 })
  return items.map((a) => ({ value: a.code, label: label(a), data: a }))
}

function onPick(account: Account | null) {
  if (account) remember(account.code, label(account))
  emit('pick', account)
}
</script>

<template>
  <RemotePicker
    :id="id"
    v-model="model"
    :display="display"
    :search="search"
    :placeholder="placeholder ?? site.pickers.searchAccount"
    :search-placeholder="site.pickers.searchAccount"
    :invalid="invalid"
    :disabled="disabled"
    :clearable="clearable"
    @pick="onPick"
  />
</template>
