import { computed, ref, type Ref } from 'vue'
import type { ComboOption } from '@/types'

// "anis" encuentra "ANÍS": se compara sin tildes ni mayúsculas.
const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Filtro, alta de lo escrito y fila activa del selector con búsqueda. */
export function useComboSearch(
  options: Ref<ComboOption[]>,
  settings: { emptyLabel: Ref<string | undefined>; canCreate: Ref<boolean> },
) {
  const term = ref('')
  const active = ref(0)

  const filtered = computed<ComboOption[]>(() => {
    const q = normalize(term.value)
    const list = q ? options.value.filter((o) => normalize(o.label).includes(q)) : options.value
    return settings.emptyLabel.value && !q ? [{ value: '', label: settings.emptyLabel.value }, ...list] : list
  })

  const creatable = computed(
    () =>
      settings.canCreate.value &&
      Boolean(term.value.trim()) &&
      !options.value.some((o) => normalize(o.label) === normalize(term.value)),
  )

  // Filas navegables con teclado: las opciones y, al final, "Crear…".
  const total = computed(() => filtered.value.length + (creatable.value ? 1 : 0))

  function move(step: number) {
    if (total.value) active.value = (active.value + step + total.value) % total.value
  }

  return { term, active, filtered, creatable, total, move }
}
