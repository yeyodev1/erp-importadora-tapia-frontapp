<script setup lang="ts">
import { icons, type IconName } from './icons'

withDefaults(
  defineProps<{
    name: IconName
    size?: string
    spin?: boolean
    /** Solo si el icono va sin texto al lado; si no, se oculta a lectores de pantalla. */
    label?: string
  }>(),
  { size: undefined, spin: false, label: undefined },
)
</script>

<template>
  <i
    class="icon fa-fw"
    :class="[icons[name], { 'fa-spin': spin }]"
    :style="size ? { fontSize: size } : undefined"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  ></i>
</template>

<style scoped lang="scss">
.icon {
  flex-shrink: 0;
  line-height: 1;
}
</style>
