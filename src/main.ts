import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { useCatalogStore } from './stores/catalog'
import '@/styles/global.scss'
import '@/styles/controls.scss'
import '@/styles/utilities.scss'
import '@/styles/print.scss'
import '@/styles/motion.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// httpBase emite este evento al recibir un 401: la sesión caducó.
window.addEventListener('auth:token-expired', () => {
  useUserStore(pinia).clear()
  useCatalogStore(pinia).clear()
  if (router.currentRoute.value.meta.requiresAuth) {
    router.replace({ name: 'Login', query: { next: router.currentRoute.value.fullPath } })
  }
})

app.mount('#app')
