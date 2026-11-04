<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import RoleAccess from './RoleAccess.vue'
import { site } from '@/config/site'
import { accessCopy as c, roleGuide } from '@/config/copy/roles'
import { ROLES, type Role } from '@/types'

/** Panel plegable en Usuarios: cada rol con su resumen; al tocarlo, el detalle por módulo. */
const open = ref<Role | null>(null)
const toggle = (r: Role) => (open.value = open.value === r ? null : r)
</script>

<template>
  <section class="panel panel--pad ro" :aria-label="c.compareTitle">
    <h2 class="ro__title">{{ c.compareTitle }} <HelpTip :text="c.compareHelp" :label="c.compareTitle" /></h2>
    <div v-for="r in ROLES" :key="r" class="ro__item">
      <button type="button" class="ro__head" :aria-expanded="open === r" :aria-controls="`ro-${r}`" @click="toggle(r)">
        <strong>{{ site.roles[r] }}</strong>
        <span class="ro__sum">{{ roleGuide[r].summary }}</span>
        <AppIcon :name="open === r ? 'chevron-up' : 'chevron-down'" />
      </button>
      <Transition name="ro-fade">
        <div v-if="open === r" :id="`ro-${r}`" class="ro__body"><RoleAccess :role="r" compact /></div>
      </Transition>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ro {
  @include flex(column, stretch, flex-start, 0.25rem);
  margin-bottom: 0.75rem;

  &__title {
    @include flex(row, center, flex-start, 0.35rem);
    margin: 0 0 0.5rem;
    font-size: $text-base;
  }

  &__item {
    border-top: 1px solid $line;
  }

  &__head {
    @include flex(row, center, flex-start, 0.75rem);
    width: 100%;
    padding: 0.6rem 0.25rem;
    background: none;
    border: 0;
    color: inherit;
    text-align: left;
    cursor: pointer;

    strong {
      flex: 0 0 9rem;
    }

    &:focus-visible {
      outline: 2px solid $accent;
      outline-offset: 2px;
    }
  }

  &__sum {
    flex: 1;
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__body {
    padding: 0 0.25rem 0.75rem;
  }
}

.ro-fade-enter-active,
.ro-fade-leave-active {
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.ro-fade-enter-from,
.ro-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .ro-fade-enter-active,
  .ro-fade-leave-active {
    transition: none;
  }
}
</style>
