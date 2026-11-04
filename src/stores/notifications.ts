import { defineStore } from 'pinia'
import { notificationsService, type Notice } from '@/services/notifications.service'
import { worstLevel, type Level } from '@/components/ui/levels'
import { useToastStore } from './toast'
import { useUserStore } from './user'
import { notifications as t } from '@/config/copy/notifications'
import type { ApiError } from '@/types'

/** Cada 2 minutos y al volver a la pestaña. */
export const REFRESH_MS = 120_000

const storageKey = (userId: string) => `tapia:notifications:seen:${userId}`
// Visto = "vi este aviso con esta cantidad": si la cantidad cambia, vuelve a ser nuevo.
const signature = (n: Notice) => n.count

function readSeen(userId: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

/** Ruta sin query: "/cxc/cartera-edades?bucket=d90" → "/cxc/cartera-edades". */
export const pathOf = (link: string) => link.split('?')[0] ?? link

/**
 * Avisos de la campana. El API los recalcula en cada consulta; aquí solo se
 * guarda cuáles vio el usuario (localStorage, por usuario) y se avisa con un
 * toast cuando aparece uno rojo nuevo.
 */
export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as Notice[],
    seen: {} as Record<string, number>,
    userId: '',
    loading: false,
    error: '',
    loadedAt: null as Date | null,
  }),

  getters: {
    isNew: (s) => (n: Notice) => s.seen[n.id] !== signature(n),
    unseen(): Notice[] {
      return this.items.filter((n) => this.isNew(n))
    },
    /** Nivel del badge de la campana: el peor de los no vistos. */
    worst(): Level | undefined {
      return worstLevel(this.unseen.map((n) => n.level))
    },
  },

  actions: {
    /** Suma de pendientes y peor nivel de los avisos cuyo enlace cumple `match` (badges del menú). */
    summary(match: (path: string) => boolean): { count: number; level: Level } | null {
      const list = this.items.filter((n) => match(pathOf(n.link)))
      const level = worstLevel(list.map((n) => n.level))
      return level ? { count: list.reduce((a, n) => a + n.count, 0), level } : null
    },

    async refresh() {
      const user = useUserStore().user
      if (!user || this.loading) return
      if (this.userId !== user.id) {
        this.userId = user.id
        this.seen = readSeen(user.id)
        this.items = []
        this.loadedAt = null
      }
      this.loading = true
      try {
        const items = await notificationsService.list()
        this.toastNewDanger(items)
        this.items = items
        this.error = ''
        this.loadedAt = new Date()
        // Lo resuelto deja de contar como visto: si el problema vuelve, vuelve como nuevo.
        const ids = new Set(items.map((n) => n.id))
        this.seen = Object.fromEntries(Object.entries(this.seen).filter(([id]) => ids.has(id)))
        this.persist()
      } catch (e) {
        this.error = (e as ApiError).message ?? t.error
      } finally {
        this.loading = false
      }
    },

    toastNewDanger(next: Notice[]) {
      const before = new Map(this.items.map((n) => [n.id, n.count]))
      const fresh = next.filter((n) => n.level === 'danger' && this.isNew(n) && (before.get(n.id) ?? 0) < n.count)
      if (fresh.length) useToastStore().error(t.urgent(fresh[0]!.title, fresh.length - 1))
    },

    markSeen(n: Notice) {
      this.seen[n.id] = signature(n)
      this.persist()
    },

    markAllSeen() {
      for (const n of this.items) this.seen[n.id] = signature(n)
      this.persist()
    },

    persist() {
      try {
        if (this.userId) localStorage.setItem(storageKey(this.userId), JSON.stringify(this.seen))
      } catch {
        // Modo privado: lo visto dura lo que dure la pestaña.
      }
    },
  },
})
