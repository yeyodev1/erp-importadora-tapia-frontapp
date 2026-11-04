<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { usePopover } from '@/composables/usePopover'
import { useComboSearch } from '@/composables/useComboSearch'
import { thumb } from '@/utils/format'
import type { ComboOption } from '@/types'

const props = defineProps<{
  options: ComboOption[]
  id: string
  placeholder?: string
  /** Si se pasa, aparece primero una opción vacía con ese texto (ej: "Todos"). */
  emptyLabel?: string
  /** Con esto, lo que se escribe y no existe se puede crear ahí mismo. */
  createLabel?: string
  onCreate?: (name: string) => Promise<string>
  invalid?: boolean
  loading?: boolean
  disabled?: boolean
}>()

const model = defineModel<string>({ default: '' })

const { open, anchor, panel, style, onTriggerEscape } = usePopover({ matchWidth: true })
const { term, active, filtered, creatable: canCreate, total, move } = useComboSearch(toRef(props, 'options'), {
  emptyLabel: toRef(props, 'emptyLabel'),
  canCreate: computed(() => Boolean(props.onCreate)),
})
const creating = ref(false)
const search = ref<HTMLInputElement | null>(null)
const listId = `${props.id}-list`

const selected = computed(() => props.options.find((o) => o.value === model.value))
const withThumbs = computed(() => props.options.some((o) => o.image))

function scrollActive() {
  nextTick(() => panel.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
}

watch(open, async (value) => {
  if (!value) return
  term.value = ''
  active.value = Math.max(
    filtered.value.findIndex((o) => o.value === model.value),
    0,
  )
  await nextTick()
  search.value?.focus()
  scrollActive()
})

watch(term, () => (active.value = 0))

function close() {
  open.value = false
  anchor.value?.focus()
}

function choose(value: string) {
  model.value = value
  close()
}

async function create() {
  if (!props.onCreate || creating.value) return
  creating.value = true
  try {
    const id = await props.onCreate(term.value.trim())
    if (id) choose(id)
  } finally {
    creating.value = false
  }
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'Tab') {
    open.value = false
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    move(event.key === 'ArrowDown' ? 1 : -1)
    scrollActive()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const option = filtered.value[active.value]
    if (option) choose(option.value)
    else if (canCreate.value) create()
  }
}
</script>

<template>
  <button
    :id="id"
    ref="anchor"
    type="button"
    :disabled="disabled"
    class="field-trigger"
    :class="{ 'field-trigger--open': open, 'field-trigger--invalid': invalid }"
    role="combobox"
    aria-haspopup="listbox"
    :aria-expanded="open"
    :aria-controls="listId"
    @click="open = !open"
    @keydown.down.prevent="open = true"
    @keydown.esc="onTriggerEscape"
  >
    <img v-if="selected?.image" class="combo__thumb" :src="thumb(selected.image, 64)" alt="" />
    <span class="field-trigger__value" :class="{ 'field-trigger__value--placeholder': !selected }">
      {{ selected?.label ?? (model && loading ? 'Cargando…' : emptyLabel && !model ? emptyLabel : placeholder) }}
    </span>
    <AppIcon name="chevron-down" class="field-trigger__chevron" />
  </button>

  <Teleport to="body">
    <Transition name="pop">
      <div v-if="open" ref="panel" class="popover combo" :style="style">
        <div class="combo__search">
          <AppIcon name="search" />
          <input
            ref="search"
            v-model="term"
            type="text"
            autocomplete="off"
            :placeholder="onCreate ? 'Busca o escribe uno nuevo' : 'Buscar'"
            :aria-controls="listId"
            :aria-activedescendant="total ? `${listId}-${active}` : undefined"
            @keydown="onKey"
          />
        </div>

        <ul :id="listId" class="combo__list" role="listbox" :aria-busy="loading && !options.length">
          <template v-if="loading && !options.length">
            <li v-for="n in 4" :key="`sk-${n}`" class="opt" aria-hidden="true">
              <span class="skeleton" :style="{ width: `${40 + n * 10}%`, height: '0.8rem' }"></span>
            </li>
          </template>
          <li
            v-for="(option, i) in filtered"
            :id="`${listId}-${i}`"
            :key="option.value || '__empty'"
            role="option"
            class="opt"
            :class="{ 'opt--active': i === active }"
            :aria-selected="option.value === model"
            :data-active="i === active"
            @pointerenter="active = i"
            @click="choose(option.value)"
          >
            <template v-if="withThumbs && option.value">
              <img v-if="option.image" class="opt__thumb" :src="thumb(option.image, 64)" alt="" />
              <span v-else class="opt__thumb opt__thumb--empty"><AppIcon name="box" /></span>
            </template>
            <span class="opt__text">
              <span class="opt__label">{{ option.label }}</span>
              <span v-if="option.hint" class="opt__hint">{{ option.hint }}</span>
            </span>
            <AppIcon v-if="option.value === model" name="check" style="color: var(--accent)" />
          </li>

          <li
            v-if="canCreate"
            :id="`${listId}-${filtered.length}`"
            role="option"
            class="opt opt--create"
            :class="{ 'opt--active': active === filtered.length }"
            :aria-selected="false"
            :data-active="active === filtered.length"
            @pointerenter="active = filtered.length"
            @click="create"
          >
            <span class="opt__thumb opt__thumb--create">
              <AppIcon :name="creating ? 'spinner' : 'plus'" :spin="creating" />
            </span>
            <span class="opt__text">
              <span class="opt__label">{{ createLabel }} «{{ term.trim() }}»</span>
              <span class="opt__hint">Se agrega al catálogo y queda elegido</span>
            </span>
          </li>

          <li v-if="!total && !(loading && !options.length)" class="combo__empty">Sin resultados</li>
        </ul>

        <p v-if="onCreate && !term" class="combo__tip">
          <AppIcon name="plus" /> ¿No está? Escribe el nombre y créalo aquí mismo
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.combo {
  &__thumb {
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 6px;
    object-fit: cover;
    margin-left: -0.35rem;
  }

  &__search {
    @include flex(row, center, flex-start, 0.5rem);
    padding: 0.35rem 0.8rem;
    border-bottom: 1px solid $line;
    color: $ink-muted;

    input,
    input:focus {
      border: none;
      box-shadow: none;
      outline: none;
      padding: 0.55rem 0;
      background: transparent;
    }
  }

  &__list {
    list-style: none;
    max-height: 280px;
    overflow-y: auto;
    padding: 0.35rem;
    overscroll-behavior: contain;
  }

  &__empty {
    padding: 1rem;
    text-align: center;
    font-size: $text-sm;
    color: $ink-muted;
  }

  &__tip {
    @include flex(row, center, flex-start, 0.4rem);
    font-size: 0.75rem;
    color: $ink-muted;
    padding: 0.6rem 0.9rem;
    border-top: 1px solid $line;
    background: $paper;
  }
}

.opt {
  @include flex(row, center, flex-start, 0.65rem);
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.92rem;

  &--active {
    background: $sand;
  }

  &__thumb {
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;

    &--empty,
    &--create {
      @include flex(row, center, center);
      background: $paper;
      color: $ink-muted;
    }

    &--create {
      background: $accent-soft;
      color: $accent-deep;
    }
  }

  &__text {
    @include flex(column, flex-start, center, 0);
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-weight: 500;
    line-height: 1.3;
  }

  &__hint {
    font-size: 0.72rem;
    color: $ink-muted;
    line-height: 1.3;
  }

  &--create &__label {
    color: $accent-deep;
    font-weight: 600;
  }
}
</style>
