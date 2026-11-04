import { ref } from 'vue'
import { salesService, type DocKind, type RideFormat } from '@/services/sales.service'
import { useToastStore } from '@/stores/toast'
import type { ApiError } from '@/types'

/**
 * Imprime el RIDE que arma el API (A4 = la factura grande; ticket 80 mm =
 * la pequeña que firma el cliente). El HTML trae su propio @page, así que
 * se imprime desde un iframe oculto y no con la hoja de reportes.
 */
export function useRide() {
  const toast = useToastStore()
  const printing = ref('')

  async function printRide(kind: DocKind, id: string, format: RideFormat) {
    if (printing.value) return
    printing.value = `${id}-${format}`
    try {
      const html = await salesService.ride(kind, id, format)
      const frame = document.createElement('iframe')
      frame.setAttribute('aria-hidden', 'true')
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
      document.body.appendChild(frame)
      frame.onload = () => {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
        // El diálogo de impresión bloquea; al volver ya se puede quitar.
        setTimeout(() => frame.remove(), 1000)
      }
      frame.srcdoc = html
    } catch (e) {
      toast.error((e as ApiError).message)
    } finally {
      printing.value = ''
    }
  }

  return { printRide, printing }
}
