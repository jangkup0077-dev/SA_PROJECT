<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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
    await authStore.login({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (err: any) {
    errorMsg.value = err
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-[80vh] flex items-center justify-center">
    <div class="bg-gray-900 p-8 rounded-3xl w-full max-w-md border border-white/5 shadow-2xl">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 tracking-tight">GameMatch</h1>
        <p class="text-sm font-mono text-gray-500 mt-2 uppercase tracking-[0.2em]">Operations Portal</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1 ml-1" for="email">Admin Email</label>
          <input
            v-model="email"
            id="email"
            type="email"
            required
            class="w-full px-4 py-3 bg-gray-950 border border-white/10 rounded-xl outline-none focus:border-red-500 transition-all text-white placeholder-gray-600"
            placeholder="admin@gamematch.com"
          />
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-400 mb-1 ml-1" for="password">Security Key</label>
           <input
            v-model="password"
            id="password"
            type="password"
            required
            class="w-full px-4 py-3 bg-gray-950 border border-white/10 rounded-xl outline-none focus:border-red-500 transition-all text-white placeholder-gray-600"
            placeholder="••••••••"
          />
        </div>

        <p v-if="errorMsg" class="text-red-400 text-sm font-medium text-center">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-4 mt-6 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          {{ loading ? 'Authenticating...' : 'Access Subsystem' }}
        </button>
      </form>
    </div>
  </div>
</template>
