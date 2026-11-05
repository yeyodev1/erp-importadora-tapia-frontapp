import { onMounted, ref, type Ref } from 'vue'
import { cloneData } from '@/utils/clone'
import { settingsService } from '@/services/settings.service'
import { useCatalogStore } from '@/stores/catalog'
import { useToastStore } from '@/stores/toast'
import { site } from '@/config/site'
import type { ApiError, Settings } from '@/types'

/**
 * Carga la configuración, arma una copia editable con `pick` y la graba.
 * La guarda en el store para que el resto de la app vea el cambio.
 */
export function useSettingsForm<F>(pick: (s: Settings) => F, toBody: (f: F) => Parameters<typeof settingsService.save>[0]) {
  const catalog = useCatalogStore()
  const toast = useToastStore()
  const form = ref<F | null>(null) as Ref<F | null>
  const loading = ref(true)
  const saving = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      await catalog.invalidate('settings')
      form.value = cloneData(pick(catalog.settings!))
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      loading.value = false
    }
  }
  onMounted(load)

  async function save() {
    if (!form.value) return
    saving.value = true
    error.value = ''
    try {
      catalog.settings = await settingsService.save(toBody(form.value))
      form.value = cloneData(pick(catalog.settings))
      toast.success(site.common.saved)
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  return { form, loading, saving, error, load, save, settings: () => catalog.settings }
}
