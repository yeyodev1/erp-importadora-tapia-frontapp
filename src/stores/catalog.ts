import { defineStore } from 'pinia'
import { catalogService } from '@/services/catalog.service'
import { settingsService } from '@/services/settings.service'
import type { BankAccount, ProductGroup, Settings, Warehouse } from '@/types'

type Key = 'warehouses' | 'bankAccounts' | 'productGroups' | 'settings'

// Una carga a la vez por catálogo: varios pickers en la misma pantalla piden lo mismo.
const inflight = new Map<Key, Promise<unknown>>()

/**
 * Catálogos chicos que casi toda pantalla usa (bodegas, bancos, grupos,
 * configuración). Se cargan una vez; quien los edita llama `invalidate`.
 */
export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    warehouses: [] as Warehouse[],
    bankAccounts: [] as BankAccount[],
    productGroups: [] as ProductGroup[],
    settings: null as Settings | null,
    loaded: {} as Partial<Record<Key, boolean>>,
  }),

  getters: {
    warehouseName: (s) => (id: string | null | undefined) => s.warehouses.find((w) => w._id === id)?.name ?? '',
  },

  actions: {
    async ensure(key: Key) {
      if (this.loaded[key]) return
      if (!inflight.has(key)) {
        const job = this.fetch(key).finally(() => inflight.delete(key))
        inflight.set(key, job)
      }
      await inflight.get(key)
    },

    async fetch(key: Key) {
      if (key === 'warehouses') this.warehouses = await catalogService.listAll('warehouses', { active: 'all' })
      if (key === 'bankAccounts') this.bankAccounts = await catalogService.listAll('bank-accounts', { active: 'all' })
      if (key === 'productGroups') this.productGroups = await catalogService.listAll('product-groups', { active: 'all' })
      if (key === 'settings') this.settings = await settingsService.load()
      this.loaded[key] = true
    },

    /** Tras crear o editar: la próxima lectura vuelve al API. */
    invalidate(key: Key) {
      this.loaded[key] = false
      return this.ensure(key)
    },

    clear() {
      this.$reset()
    },
  },
})
