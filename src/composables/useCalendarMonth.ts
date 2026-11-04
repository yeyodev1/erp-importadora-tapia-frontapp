import { computed, ref, type Ref } from 'vue'

const pad = (n: number) => String(n).padStart(2, '0')
const monthName = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export interface CalendarCell {
  day: number
  /** "AAAA-MM-DD": se compara como texto, que en ISO equivale a comparar fechas. */
  value: string
}

/** Mes visible del calendario: celdas con la semana desde el lunes y navegación. */
export function useCalendarMonth() {
  const view = ref({ y: 2026, m: 0 })

  const title = computed(() => monthName.format(new Date(Date.UTC(view.value.y, view.value.m, 15))))

  const cells = computed(() => {
    const { y, m } = view.value
    const offset = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7
    const count = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    const days: Array<CalendarCell | null> = Array(offset).fill(null)
    for (let d = 1; d <= count; d++) days.push({ day: d, value: `${y}-${pad(m + 1)}-${pad(d)}` })
    return days
  })

  /** Muestra el mes que contiene esa fecha. */
  function show(iso: string) {
    const [y = 2026, m = 1] = iso.split('-').map(Number)
    view.value = { y, m: m - 1 }
  }

  function shift(delta: number) {
    const d = new Date(Date.UTC(view.value.y, view.value.m + delta, 1))
    view.value = { y: d.getUTCFullYear(), m: d.getUTCMonth() }
  }

  return { title, cells, show, shift }
}

/**
 * Rango entre "desde" y "hasta" pintado sobre el calendario de uno de los dos.
 * rangeStart = este campo es el "hasta"; rangeEnd = este campo es el "desde".
 */
export function useDateRange(opts: {
  model: Ref<string>
  hovered: Ref<string>
  pressed: Ref<string>
  today: string
  rangeStart: () => string | undefined
  rangeEnd: () => string | undefined
}) {
  // Extremos: el día propio (o el que está bajo el cursor) y el del otro campo.
  const bounds = computed(() => {
    const own = opts.hovered.value || opts.model.value
    const start = opts.rangeStart()
    const end = opts.rangeEnd()
    const b = start ? { start, end: own } : end ? { start: own, end } : null
    return b && b.start && b.end && b.start < b.end ? b : null
  })

  function disabled(value: string) {
    const start = opts.rangeStart()
    const end = opts.rangeEnd()
    return Boolean((start && value < start) || (end && value > end))
  }

  function cellClass(value: string) {
    const b = bounds.value
    return {
      'cal__cell--in': b && value > b.start && value < b.end,
      'cal__cell--start': b && value === b.start,
      'cal__cell--end': b && value === b.end,
    }
  }

  function dayClass(value: string) {
    const own = opts.model.value
    return {
      'day--selected': value === own,
      'day--anchor': value !== own && (value === opts.rangeStart() || value === opts.rangeEnd()),
      'day--today': value === opts.today,
      'day--pressed': value === opts.pressed.value,
    }
  }

  return { disabled, cellClass, dayClass }
}
