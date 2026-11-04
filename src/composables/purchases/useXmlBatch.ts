import { computed, onMounted, ref, shallowRef } from 'vue'
import { purchasesService } from '@/services/purchases.service'
import type { ApiError } from '@/types'
import type { XmlBatch } from '@/types/purchases'

// El lote sobrevive a ir y volver del formulario: al regresar se revisa de nuevo y la recién grabada pasa a "ya ingresadas".
const files = shallowRef<{ name: string; xml: string }[]>([])
const batch = shallowRef<XmlBatch | null>(null)

/** Lote de XML de facturas recibidas: cuáles faltan por ingresar y cuáles ya están. */
export function useXmlBatch() {
  const loading = ref(false)
  const error = ref('')

  async function check() {
    if (!files.value.length) return
    loading.value = true
    error.value = ''
    try {
      batch.value = await purchasesService.importBatch(files.value.map((f) => f.xml))
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loading.value = false
    }
  }

  async function add(list: FileList | null) {
    if (!list?.length) return
    const read = await Promise.all([...list].map(async (f) => ({ name: f.name, xml: await f.text() })))
    // Mismo archivo dos veces: se queda uno.
    const known = new Set(files.value.map((f) => f.xml))
    files.value = [...files.value, ...read.filter((f) => !known.has(f.xml))]
    await check()
  }

  function clear() {
    files.value = []
    batch.value = null
  }

  const nameOf = (index: number) => files.value[index]?.name ?? `#${index + 1}`
  const xmlOf = (index: number) => files.value[index]?.xml ?? ''
  const count = computed(() => files.value.length)

  onMounted(check)

  return { batch, loading, error, count, add, clear, check, nameOf, xmlOf }
}
