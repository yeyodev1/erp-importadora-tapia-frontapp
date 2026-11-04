import { computed, ref } from 'vue'

/** Hay una navegación en curso (chunk de la vista cargando, sesión verificándose). */
export const navigating = ref(false)

/** Peticiones al API en vuelo (las cuenta httpBase). */
export const requests = ref(0)

/** Algo se está cargando: lo muestra la barra superior (TheProgressBar). */
export const busy = computed(() => navigating.value || requests.value > 0)
