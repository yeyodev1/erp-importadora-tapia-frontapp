<script setup lang="ts" generic="D">
import { nextTick, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { usePopover } from '@/composables/usePopover'
import { useRemoteSearch, type RemoteOption } from '@/composables/useRemoteSearch'
import { site } from '@/config/site'

/**
 * Base de PartyPicker, ProductPicker y AccountPicker: selector que busca en
 * el API. v-model = valor (id o código); `pick` entrega el registro completo
 * para autollenar el documento. Si `exact` encuentra algo (RUC exacto), se
 * elige solo.
 */
const props = defineProps<{
  id: string
  /** Texto del valor actual; lo resuelve el picker concreto. */
  display: string
  search: (q: string) => Promise<RemoteOption<D>[]>
  exact?: (q: string) => Promise<RemoteOption<D> | null>
  placeholder?: string
  searchPlaceholder?: string
  invalid?: boolean
  disabled?: boolean
  clearable?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ pick: [data: D | null] }>()

const { open, anchor, panel, style, onTriggerEscape } = usePopover({ matchWidth: true })
const term = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const { options, loading, error, exactHit, run } = useRemoteSearch(term, props.search, props.exact)
const listId = `${props.id}-list`

watch(open, async (value) => {
  if (!value) return
  term.value = ''
  active.value = 0
  run('')
  await nextTick()
  input.value?.focus()
})
watch(options, () => (active.value = 0))
watch(exactHit, (hit) => hit && choose(hit))

function close() {
  open.value = false
  anchor.value?.focus()
}

function choose(option: RemoteOption<D> | null) {
  model.value = option?.value ?? ''
  emit('pick', option?.data ?? null)
  close()
}

function onKey(event: KeyboardEvent) {
  const n = options.value.length
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'Tab') open.value = false
  else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && n) {
    event.preventDefault()
    active.value = (active.value + (event.key === 'ArrowDown' ? 1 : -1) + n) % n
    nextTick(() => panel.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }))
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const option = options.value[active.value]
    if (option) choose(option)
  }
}
</script>

<template>
  <div class="rp">
    <button
      :id="id"
      ref="anchor"
      type="button"
      class="field-trigger"
      :class="{ 'field-trigger--open': open, 'field-trigger--invalid': invalid }"
      :disabled="disabled"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open = !open"
      @keydown.down.prevent="open = true"
      @keydown.esc="onTriggerEscape"
    >
      <span class="field-trigger__value" :class="{ 'field-trigger__value--placeholder': !model }">
        {{ model ? display || model : placeholder }}
      </span>
      <AppIcon name="search" class="field-trigger__chevron" />
    </button>
    <button v-if="clearable && model && !disabled" type="button" class="rp__clear" :aria-label="site.pickers.clear" @click="choose(null)">
      <AppIcon name="x" />
    </button>
  </div>

  <Teleport to="body">
    <Transition name="pop">
      <div v-if="open" ref="panel" class="popover rp__panel" :style="style">
        <div class="rp__search">
          <AppIcon :name="loading ? 'spinner' : 'search'" :spin="loading" />
          <input
            ref="input"
            v-model="term"
            type="text"
            autocomplete="off"
            :placeholder="searchPlaceholder ?? site.pickers.typeToSearch"
            :aria-controls="listId"
            :aria-activedescendant="options.length ? `${listId}-${active}` : undefined"
            @keydown="onKey"
          />
        </div>
        <ul :id="listId" class="rp__list" role="listbox" :aria-busy="loading">
          <li
            v-for="(o, i) in options"
            :id="`${listId}-${i}`"
            :key="o.value"
            role="option"
            class="rp__opt"
            :class="{ 'rp__opt--active': i === active }"
            :aria-selected="o.value === model"
            :data-active="i === active"
            @pointerenter="active = i"
            @click="choose(o)"
          >
            <span class="rp__label">{{ o.label }}</span>
            <span v-if="o.hint" class="rp__hint">{{ o.hint }}</span>
          </li>
          <li v-if="!loading && !options.length" class="rp__empty">{{ error || site.pickers.noResults }}</li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.rp {
  position: relative;
  @include flex(row, center);

  &__clear {
    position: absolute;
    right: 2rem;
    @include flex(row, center, center);
    width: 1.5rem;
    height: 1.5rem;
    color: $ink-muted;
    border-radius: 50%;

    &:hover {
      background: $sand;
      color: $ink;
    }
  }

  &__search {
    @include flex(row, center, flex-start, 0.5rem);
    padding: 0.25rem 0.7rem;
    border-bottom: 1px solid $line;
    color: $ink-muted;

    input,
    input:focus {
      border: none;
      box-shadow: none;
      padding-inline: 0;
      background: transparent;
    }
  }

  &__list {
    list-style: none;
    max-height: 300px;
    overflow-y: auto;
    padding: 0.25rem;
    overscroll-behavior: contain;
  }

  &__opt {
    @include flex(column, flex-start, center, 0);
    padding: 0.4rem 0.55rem;
    border-radius: 4px;
    cursor: pointer;

    &--active {
      background: $sand;
    }
  }

  &__label {
    font-size: $text-sm;
    font-weight: 500;
  }

  &__hint {
    font-size: $text-xs;
    color: $ink-muted;
  }

  &__empty {
    padding: 0.9rem;
    text-align: center;
    font-size: $text-sm;
    color: $ink-muted;
  }
}
</style>
