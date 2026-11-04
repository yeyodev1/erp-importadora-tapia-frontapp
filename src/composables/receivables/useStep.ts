import { ref, shallowRef } from 'vue'
import { useToastStore } from '@/stores/toast'
import type { CheckStep } from '@/services/receivables.service'
import type { ApiError } from '@/types'

/** Acción pendiente sobre un registro (qué fila y qué paso) con su guardado y error, para StepDialog. */
export function useStep<R, A extends string>(
  run: (row: R, action: A, step: CheckStep) => Promise<unknown>,
  done: (action: A) => string,
  after: () => void,
) {
  const toast = useToastStore()
  const target = shallowRef<{ row: R; action: A } | null>(null)
  const saving = ref(false)
  const error = ref('')

  function ask(row: R, action: A) {
    error.value = ''
    target.value = { row, action }
  }

  async function confirm(step: CheckStep) {
    if (!target.value) return
    saving.value = true
    error.value = ''
    try {
      await run(target.value.row, target.value.action, step)
      toast.success(done(target.value.action))
      target.value = null
      after()
    } catch (e) {
      error.value = (e as ApiError).message
    } finally {
      saving.value = false
    }
  }

  return { target, saving, error, ask, confirm, cancel: () => (target.value = null) }
}
