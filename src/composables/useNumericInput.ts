import { ref, watch, type Ref } from 'vue'

/**
 * Texto ↔ número de MoneyInput y QtyInput. Mientras se escribe el texto
 * manda; al salir del campo se reescribe con formato. El modelo solo cambia
 * con un número válido.
 */
export function useNumericInput(
  model: Ref<number | null>,
  parse: (text: string) => number | null,
  format: (value: number | null) => string,
  allowNegative: () => boolean,
) {
  const text = ref(format(model.value))
  const focused = ref(false)

  watch(model, (value) => {
    if (!focused.value) text.value = format(value)
  })

  function onInput(event: Event) {
    text.value = (event.target as HTMLInputElement).value
    if (!text.value.trim()) {
      model.value = null
      return
    }
    const value = parse(text.value)
    if (value != null && (allowNegative() || value >= 0)) model.value = value
  }

  function onFocus(event: FocusEvent) {
    focused.value = true
    ;(event.target as HTMLInputElement).select()
  }

  function onBlur() {
    focused.value = false
    text.value = format(model.value)
  }

  return { text, onInput, onFocus, onBlur }
}
