import { reactive } from 'vue'
import { useToastStore } from '@/stores/toast'
import { site } from '@/config/site'
import type { ApiError } from '@/types'
import { cloneData } from '@/utils/clone'

/**
 * Estado del modal de crear/editar de un catálogo. Si se apaga `isActive`
 * de un registro activo, pide doble confirmación antes de grabar
 * (EditorDialog muestra el ConfirmModal).
 */
export function useEditor<F extends { isActive?: boolean }>(opts: {
  blank: () => F
  save: (form: F, id: string | null) => Promise<unknown>
  /** Devuelve un mensaje si el formulario no está listo. */
  validate?: (form: F, id: string | null) => string | null
  onSaved?: () => void
}) {
  const toast = useToastStore()
  const ed = reactive({
    open: false,
    id: null as string | null,
    form: opts.blank(),
    saving: false,
    error: '',
    confirming: false,
    wasActive: true,
    openNew,
    openEdit,
    submit,
    persist,
    close,
    cancelConfirm: () => (ed.confirming = false),
  })
  const form = () => ed.form as F

  function openNew(partial: Partial<F> = {}) {
    Object.assign(ed, { id: null, error: '', wasActive: true, confirming: false, open: true })
    ed.form = { ...opts.blank(), ...partial } as typeof ed.form
  }

  function openEdit(id: string, value: F) {
    Object.assign(ed, { id, error: '', wasActive: value.isActive !== false, confirming: false, open: true })
    ed.form = cloneData(value) as typeof ed.form
  }

  async function submit() {
    ed.error = opts.validate?.(form(), ed.id) ?? ''
    if (ed.error) return
    if (ed.id && ed.wasActive && form().isActive === false) {
      ed.confirming = true
      return
    }
    await persist()
  }

  async function persist() {
    ed.saving = true
    try {
      await opts.save(form(), ed.id)
      toast.success(ed.id ? site.common.saved : site.common.created)
      ed.open = false
      opts.onSaved?.()
    } catch (e) {
      ed.error = (e as ApiError).message
    } finally {
      ed.saving = false
      ed.confirming = false
    }
  }

  function close() {
    if (!ed.saving) ed.open = false
  }

  return ed
}

/** Lo que necesita EditorDialog, sin depender del tipo del formulario. */
export type Editor = Pick<
  ReturnType<typeof useEditor>,
  'open' | 'id' | 'saving' | 'error' | 'confirming' | 'submit' | 'persist' | 'close' | 'cancelConfirm'
>

/** Formulario de un documento del API: todo menos _id y fechas de auditoría. */
export type FormOf<T> = Omit<T, '_id' | 'createdAt' | 'updatedAt'>

/** Documento del API → formulario editable. */
export function formOf<T extends { _id: string }>(doc: T): FormOf<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, createdAt, updatedAt, __v, ...rest } = doc as T & { createdAt?: string; updatedAt?: string; __v?: number }
  return rest as FormOf<T>
}
