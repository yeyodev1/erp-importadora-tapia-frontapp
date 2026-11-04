<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalog'
import { formatMonth } from '@/utils/format'
import { notifications as t } from '@/config/copy/notifications'
import AlertBanner from './AlertBanner.vue'

/**
 * "Este mes está cerrado": en formularios con fecha, aparece si la fecha cae
 * en un mes ya cerrado (`settings.lockedThrough`). El API igual lo rechaza;
 * esto evita llenar todo el documento para enterarse al grabar.
 */
const props = defineProps<{ date: string | null | undefined }>()

const catalog = useCatalogStore()
onMounted(() => catalog.ensure('settings').catch(() => {}))

const locked = computed(() => catalog.settings?.lockedThrough ?? null)
const closed = computed(() => !!props.date && !!locked.value && props.date.slice(0, 7) <= locked.value)
</script>

<template>
  <AlertBanner v-if="closed" level="danger" icon="lock" :title="t.lockedDate.title" :message="t.lockedDate.message(formatMonth(locked!))" />
</template>
