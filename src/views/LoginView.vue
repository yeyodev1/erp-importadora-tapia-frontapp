<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToastStore } from '@/stores/toast'
import { site } from '@/config/site'
import type { ApiError } from '@/types'
import AppIcon from '@/components/ui/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const toast = useToastStore()
const t = site.login

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await userStore.login(email.value.trim(), password.value)
    toast.success(`${t.welcome} ${user.name || user.email}`)
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/'
    router.replace(next)
  } catch (e) {
    error.value = (e as ApiError).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="login">
    <form class="login__card" @submit.prevent="submit">
      <div class="login__brand">
        <span class="login__logo">T</span>
        <div>
          <p class="login__eyebrow">{{ t.eyebrow }}</p>
          <p class="login__company">{{ site.company.legalName }}</p>
        </div>
      </div>
      <h1 class="login__title">{{ t.title }}</h1>

      <div class="login__field">
        <label for="email">{{ t.email }}</label>
        <input id="email" v-model="email" type="email" autocomplete="email" :placeholder="t.emailPlaceholder" required />
      </div>

      <div class="login__field">
        <label for="password">{{ t.password }}</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" :placeholder="t.passwordPlaceholder" required />
      </div>

      <Transition name="rise">
        <p v-if="error" class="login__error" role="alert"><AppIcon name="alert-circle" /> {{ error }}</p>
      </Transition>

      <button class="btn btn--primary login__submit" type="submit" :disabled="loading">
        <AppIcon v-if="loading" name="spinner" spin />
        {{ loading ? t.loading : t.submit }}
      </button>
    </form>
  </section>
</template>

<style scoped lang="scss">
.login {
  @include flex(column, center, center);
  min-height: 100vh;
  padding: 1.25rem;
  background: $nav-bg;

  &__card {
    @include card;
    @include flex(column, stretch, flex-start, 0.9rem);
    width: 100%;
    max-width: 400px;
    padding: 1.75rem 1.5rem;
    box-shadow: $shadow-lg;
  }

  &__brand {
    @include flex(row, center, flex-start, 0.7rem);
  }

  &__logo {
    @include flex(row, center, center);
    width: 2.4rem;
    height: 2.4rem;
    border-radius: $radius-sm;
    background: $accent;
    color: #fff;
    font-weight: 700;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  &__eyebrow {
    @include eyebrow;
  }

  &__company {
    font-size: $text-xs;
    color: $ink-soft;
  }

  &__title {
    @include display($display-sm);
  }

  &__field {
    @include flex(column, stretch, flex-start, 0.3rem);
  }

  &__error {
    @include flex(row, center, flex-start, 0.5rem);
    font-size: $text-sm;
    color: $danger;
    background: $danger-bg;
    padding: 0.6rem 0.75rem;
    border-radius: $radius-sm;
  }

  &__submit {
    margin-top: 0.3rem;
    min-height: 2.6rem;
  }
}
</style>
