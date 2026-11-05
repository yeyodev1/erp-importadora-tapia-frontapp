import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const GAP = 6
const MARGIN = 8

/**
 * Panel flotante (lista, calendario) pegado a su disparador.
 *
 * Se teletransporta a <body> con position: fixed para que ningún contenedor
 * con overflow (el modal, una tabla) lo recorte. Abre hacia arriba si abajo
 * no cabe.
 */
/** Se avisa al abrir una lista o calendario: las ayudas (tooltips) abiertas se cierran para no quedar tapadas. */
export const POPOVER_OPEN_EVENT = 'erp:popover-open'

export function usePopover(options: { matchWidth?: boolean; width?: number; preferTop?: boolean; tooltip?: boolean } = {}) {
  const open = ref(false)
  const anchor = ref<HTMLElement | null>(null)
  const panel = ref<HTMLElement | null>(null)
  // Oculto con opacidad y no con visibility: un elemento con visibility hidden
  // no recibe foco, y el buscador se enfoca antes de terminar de ubicar el panel.
  const HIDDEN = { opacity: '0', pointerEvents: 'none' }
  const style = ref<Record<string, string>>(HIDDEN)

  function place() {
    if (!anchor.value || !panel.value) return
    const rect = anchor.value.getBoundingClientRect()
    const wanted = options.matchWidth ? Math.max(rect.width, 260) : (options.width ?? 300)
    const width = Math.min(wanted, window.innerWidth - MARGIN * 2)
    const height = panel.value.offsetHeight

    const below = rect.bottom + GAP
    const above = rect.top - GAP - height
    // Las ayudas van arriba: abajo está el campo que la persona está llenando.
    const fitsAbove = above > MARGIN
    const fitsBelow = below + height <= window.innerHeight - MARGIN
    const useTop = options.preferTop ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove
    const top = useTop ? above : below
    const origin = useTop ? 'bottom center' : 'top center'
    const left = Math.min(Math.max(rect.left, MARGIN), window.innerWidth - width - MARGIN)

    style.value = { top: `${top}px`, left: `${left}px`, width: `${width}px`, transformOrigin: origin }
  }

  function swallowClick(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
  }

  function onPointerDown(event: PointerEvent) {
    const target = event.target as Element
    if (anchor.value?.contains(target) || panel.value?.contains(target)) return
    open.value = false

    // Tocar el fondo para cerrar la lista no debe cerrar también el modal de
    // atrás; tocar otro campo sí debe funcionar al primer clic.
    if (target.closest?.('button, a, input, textarea, label')) return
    window.addEventListener('click', swallowClick, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 400)
  }

  function listen(on: boolean) {
    if (on) {
      window.addEventListener('pointerdown', onPointerDown, true)
      window.addEventListener('resize', place)
      window.addEventListener('scroll', place, true)
    } else {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }

  watch(open, async (value) => {
    listen(value)
    if (!value) return
    if (!options.tooltip) window.dispatchEvent(new Event(POPOVER_OPEN_EVENT))
    style.value = HIDDEN
    await nextTick()
    place()
  })

  onBeforeUnmount(() => listen(false))

  /** Escape con el panel abierto cierra solo el panel, no el modal que lo contiene. */
  function onTriggerEscape(event: KeyboardEvent) {
    if (!open.value) return
    event.stopPropagation()
    open.value = false
  }

  return { open, anchor, panel, style, place, onTriggerEscape }
}
