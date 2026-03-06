<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    })
    authStore.setAuth(res.data.token, res.data.user)
    router.push('/discover')
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm flex flex-col items-center">

      <!-- Profile Icon -->
      <div class="w-20 h-20 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mb-8 shadow-lg shadow-purple-500/10">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="w-full space-y-4">
        <div>
          <input
            v-model="email"
            id="login-email"
            type="email"
            required
            class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
            placeholder="Email"
          />
        </div>

        <div>
          <input
            v-model="password"
            id="login-password"
            type="password"
            required
            class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
            placeholder="Password"
          />
        </div>

        <p v-if="errorMsg" class="text-red-400 text-sm text-center font-medium">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          id="login-button"
          class="w-full py-3.5 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <!-- Register Link -->
      <p class="text-center text-gray-500 mt-8 text-sm">
        Don't have an account?
        <RouterLink to="/register" class="text-purple-400 hover:text-purple-300 font-medium transition-colors">Register</RouterLink>
      </p>
    </div>
  </div>
</template>
