<script setup lang="ts">
import RemotePicker from '@/components/pickers/RemotePicker.vue'
import { useDisplayLabel, type RemoteOption } from '@/composables/useRemoteSearch'
import { catalogService } from '@/services/catalog.service'
import { site } from '@/config/site'
import type { Account } from '@/types'

/**
 * Como AccountPicker, pero también deja elegir cuentas de MAYOR: el libro
 * mayor de una cuenta de mayor trae todas sus hijas.
 */
defineProps<{ id: string; invalid?: boolean; disabled?: boolean }>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ pick: [account: Account | null] }>()

const label = (a: Account) => `${a.code}  ${a.name}${a.kind === 'mayor' ? ' (mayor)' : ''}`
const { display, remember } = useDisplayLabel(model, 'ledger-account', async (code) => {
  const { items } = await catalogService.list('accounts', { q: code, active: 'all', limit: 20 })
  const found = items.find((a) => a.code === code)
  return found ? label(found) : code
})

async function search(q: string): Promise<RemoteOption<Account>[]> {
  const { items } = await catalogService.list('accounts', { q, active: 'all', limit: 40 })
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
    :placeholder="site.pickers.searchAccount"
    :search-placeholder="site.pickers.searchAccount"
    :invalid="invalid"
    :disabled="disabled"
    clearable
    @pick="onPick"
  />
</template>
