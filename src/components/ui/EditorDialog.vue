<script setup lang="ts">
import FormDialog from './FormDialog.vue'
import ConfirmModal from './ConfirmModal.vue'
import { site } from '@/config/site'
import type { Editor } from '@/composables/useEditor'

/**
 * Modal de crear/editar de un catálogo atado a `useEditor`: título según
 * sea nuevo o edición, error del API, solo lectura y la doble confirmación
 * al desactivar.
 */
defineProps<{
  editor: Editor
  titleNew: string
  titleEdit: string
  readonly?: boolean
  wide?: boolean
}>()
</script>

<template>
  <FormDialog
    :open="editor.open"
    :title="editor.id ? titleEdit : titleNew"
    :loading="editor.saving"
    :error="editor.error"
    :readonly="readonly"
    :wide="wide"
    @submit="editor.submit"
    @close="editor.close"
  >
    <slot />
  </FormDialog>
  <ConfirmModal
    :open="editor.confirming"
    danger
    :title="site.confirm.deactivateTitle"
    :message="site.confirm.deactivateMessage"
    :second-message="site.confirm.deactivateSecond"
    :second-label="site.confirm.deactivateLabel"
    :loading="editor.saving"
    @confirm="editor.persist"
    @cancel="editor.cancelConfirm"
  />
</template>
