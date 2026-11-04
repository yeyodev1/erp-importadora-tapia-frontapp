<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { usePopover } from '@/composables/usePopover'
import { useCalendarMonth, useDateRange, WEEKDAYS } from '@/composables/useCalendarMonth'
import { formatDay, todayISO } from '@/utils/format'

const props = defineProps<{
  id: string
  placeholder?: string
  clearable?: boolean
  invalid?: boolean
  disabled?: boolean
  /** Este campo es el "hasta": se marca el inicio y no se deja elegir antes. */
  rangeStart?: string
  /** Este campo es el "desde": se marca el final y no se deja elegir después. */
  rangeEnd?: string
}>()

/** Siempre "AAAA-MM-DD" (o vacío): el mismo formato que espera el API. */
const model = defineModel<string>({ default: '' })

const { open, anchor, panel, style, onTriggerEscape } = usePopover({ width: 300 })
const { title, cells, show, shift } = useCalendarMonth()
const today = todayISO()
const hovered = ref('')
const pressed = ref('')
let closeTimer: ReturnType<typeof setTimeout> | undefined

const { disabled: isDayDisabled, cellClass, dayClass } = useDateRange({
  model,
  hovered,
  pressed,
  today,
  rangeStart: () => props.rangeStart,
  rangeEnd: () => props.rangeEnd,
})

const short = (iso: string) => formatDay(iso)
const label = computed(() => (model.value ? short(model.value) : props.placeholder))

watch(open, async (value) => {
  if (!value) return
  clearTimeout(closeTimer)
  hovered.value = ''
  pressed.value = ''
  show(model.value || props.rangeStart || props.rangeEnd || today)
  await nextTick()
  panel.value?.querySelector<HTMLElement>('.day--selected, .day--anchor, .day--today, .day:not(:disabled)')?.focus()
})

/** El día queda marcado un instante antes de cerrar: se ve qué se eligió. */
function pick(value: string) {
  if (value && isDayDisabled(value)) return
  model.value = value
  pressed.value = value
  clearTimeout(closeTimer)
  closeTimer = setTimeout(
    () => {
      open.value = false
      anchor.value?.focus()
    },
    value ? 220 : 0,
  )
}

function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  open.value = false
  anchor.value?.focus()
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
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = !open"
    @keydown.esc="onTriggerEscape"
  >
    <AppIcon name="calendar" class="field-trigger__icon" />
    <span class="field-trigger__value" :class="{ 'field-trigger__value--placeholder': !model }">{{ label }}</span>
    <AppIcon name="chevron-down" class="field-trigger__chevron" />
  </button>

  <Teleport to="body">
    <Transition name="pop">
      <div v-if="open" ref="panel" class="popover cal" :style="style" role="dialog" aria-label="Elegir fecha" @keydown="onKey">
        <header class="cal__head">
          <button type="button" class="cal__nav" aria-label="Mes anterior" @click="shift(-1)">
            <AppIcon name="chevron-left" />
          </button>
          <span class="cal__title">{{ title }}</span>
          <button type="button" class="cal__nav" aria-label="Mes siguiente" @click="shift(1)">
            <AppIcon name="chevron-right" />
          </button>
        </header>

        <div class="cal__grid" @pointerleave="hovered = ''">
          <span v-for="w in WEEKDAYS" :key="w" class="cal__weekday">{{ w }}</span>
          <span v-for="(cell, i) in cells" :key="i" class="cal__cell" :class="cell ? cellClass(cell.value) : undefined">
            <button
              v-if="cell"
              type="button"
              class="day"
              :class="dayClass(cell.value)"
              :disabled="isDayDisabled(cell.value)"
              :aria-pressed="cell.value === model"
              @pointerenter="hovered = cell.value"
              @click="pick(cell.value)"
            >
              {{ cell.day }}
            </button>
          </span>
        </div>

        <footer class="cal__foot">
          <span v-if="rangeStart || rangeEnd" class="cal__legend">
            <span class="cal__ring"></span> {{ rangeStart ? 'Desde' : 'Hasta' }} {{ short(rangeStart || rangeEnd || '') }}
          </span>
          <button v-if="clearable && model" type="button" class="cal__link cal__link--muted" @click="pick('')">
            Quitar
          </button>
          <button type="button" class="cal__link" :disabled="isDayDisabled(today)" @click="pick(today)">Hoy</button>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.cal {
  padding: 0.8rem;

  &__head {
    @include flex(row, center, space-between, 0.5rem);
    margin-bottom: 0.5rem;
  }

  &__title {
    font-weight: 600;
    text-transform: capitalize;
  }

  &__nav {
    @include flex(row, center, center);
    width: 2.1rem;
    height: 2.1rem;
    border-radius: $radius-pill;
    color: $ink-soft;

    &:hover {
      background: $sand;
    }
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }

  &__weekday,
  &__cell {
    width: calc(100% / 7);
    @include flex(row, center, center);
  }

  &__weekday {
    font-size: 0.68rem;
    font-weight: 600;
    color: $ink-muted;
    padding-block: 0.3rem;
  }

  // La banda del rango va en la celda; el círculo del día queda encima.
  &__cell {
    aspect-ratio: 1;
    padding: 2px 0;
    transition: background 0.15s ease;

    &--in {
      background: $accent-soft;
    }

    &--start {
      background: linear-gradient(90deg, transparent 50%, $accent-soft 50%);
    }

    &--end {
      background: linear-gradient(90deg, $accent-soft 50%, transparent 50%);
    }
  }

  &__foot {
    @include flex(row, center, flex-end, 0.6rem);
    margin-top: 0.4rem;
    padding-top: 0.6rem;
    border-top: 1px solid $line;
  }

  &__legend {
    @include flex(row, center, flex-start, 0.4rem);
    margin-right: auto;
    font-size: 0.75rem;
    color: $ink-soft;
  }

  &__ring {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px $accent;
  }

  &__link {
    font-size: $text-sm;
    font-weight: 600;
    color: $accent-deep;
    padding: 0.3rem 0.4rem;

    &--muted {
      color: $ink-muted;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.day {
  width: calc(100% - 4px);
  height: 100%;
  border-radius: $radius-pill;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  transition:
    background 0.15s ease,
    transform 0.15s $ease;

  &:hover:not(:disabled) {
    background: $sand;
  }

  &:active:not(:disabled) {
    transform: scale(0.88);
  }

  &--today {
    font-weight: 700;
    text-decoration: underline 2px $accent;
    text-underline-offset: 3px;
  }

  &--anchor {
    box-shadow: inset 0 0 0 2px $accent;
    color: $accent-deep;
    font-weight: 600;
  }

  &--selected,
  &--selected:hover:not(:disabled) {
    background: $accent;
    color: $surface;
    font-weight: 600;
    text-decoration: none;
  }

  &--pressed {
    animation: day-press 0.22s $ease;
  }

  &:disabled {
    color: $ink-muted;
    opacity: 0.35;
    cursor: not-allowed;
  }
}

@keyframes day-press {
  0% {
    transform: scale(0.8);
  }
  60% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}
</style>
