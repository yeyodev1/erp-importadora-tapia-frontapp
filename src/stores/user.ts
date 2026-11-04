import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'
import type { SessionUser } from '@/types'

const TOKEN_KEY = 'access_token'

// Una sola verificación a la vez: el guard y las vistas pueden pedirla juntos.
let restoring: Promise<SessionUser | null> | null = null

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as SessionUser | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (s) => Boolean(s.user),
    role: (s) => s.user?.role,
    isAdmin: (s) => s.user?.role === 'admin',
  },

  actions: {
    setSession(token: string, user: SessionUser) {
      try {
        localStorage.setItem(TOKEN_KEY, token)
      } catch {
        // Modo privado: la sesión dura lo que dure la pestaña.
      }
      this.user = user
    },

    async login(email: string, password: string): Promise<SessionUser> {
      const { token, user } = await authService.login(email, password)
      this.setSession(token, user)
      return user
    },

    /** Recupera la sesión desde el token guardado, verificándola con el API. */
    async restore(): Promise<SessionUser | null> {
      if (this.user) return this.user
      if (!this.hasStoredToken()) return null

      restoring ??= (async () => {
        this.loading = true
        try {
          this.user = await authService.me()
          return this.user
        } catch {
          this.clear()
          return null
        } finally {
          this.loading = false
          restoring = null
        }
      })()
      return restoring
    },

    /** Método y no getter: un getter sin dependencias reactivas quedaría cacheado. */
    hasStoredToken(): boolean {
      try {
        return Boolean(localStorage.getItem(TOKEN_KEY))
      } catch {
        return false
      }
    },

    clear() {
      this.user = null
      try {
        localStorage.removeItem(TOKEN_KEY)
      } catch {
        /* nada que limpiar */
      }
    },
  },
})
