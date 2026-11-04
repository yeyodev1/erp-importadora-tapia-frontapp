import { ref } from 'vue'
import { taxesService } from '@/services/taxes.service'
import { useToastStore } from '@/stores/toast'
import { taxes as t } from '@/config/copy/taxes'
import type { ApiError } from '@/types'

/**
 * XML del ATS: descargarlo con un Blob o copiarlo. El sandbox de la app
 * puede bloquear descargas, por eso también se copia o se muestra el texto.
 */
export function useAtsXml(period: () => string) {
  const toast = useToastStore()
  const xml = ref('')
  const loadedFor = ref('')
  const busy = ref(false)
  const visible = ref(false)

  async function ensure(): Promise<string | null> {
    if (loadedFor.value === period() && xml.value) return xml.value
    busy.value = true
    try {
      xml.value = await taxesService.atsXml(period())
      loadedFor.value = period()
      return xml.value
    } catch (e) {
      toast.error((e as ApiError).message)
      return null
    } finally {
      busy.value = false
    }
  }

  async function download() {
    const text = await ensure()
    if (!text) return
    const [y, m] = period().split('-')
    const url = URL.createObjectURL(new Blob([text], { type: 'application/xml' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `ATS_${m}_${y}.xml` })
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function copy() {
    const text = await ensure()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t.ats.copied)
    } catch {
      visible.value = true
      toast.error(t.ats.copyFailed)
    }
  }

  async function toggle() {
    if (visible.value) visible.value = false
    else if (await ensure()) visible.value = true
  }

  /** Al cambiar de mes el XML viejo deja de valer. */
  function reset() {
    xml.value = ''
    loadedFor.value = ''
    visible.value = false
  }

  return { xml, busy, visible, download, copy, toggle, reset }
}
