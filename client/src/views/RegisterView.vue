<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '@/stores/register'

const router = useRouter()
const registerStore = useRegisterStore()

const email = ref(registerStore.email || '')
const password = ref(registerStore.password || '')
const confirmPassword = ref('')
const errorMsg = ref('')

const handleNext = () => {
  errorMsg.value = ''

  if (!email.value || !password.value || !confirmPassword.value) {
    errorMsg.value = 'Please fill in all fields.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match.'
    return
  }

  if (password.value.length < 6) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }

  registerStore.setCredentials(email.value, password.value)
  router.push('/register/profile')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm flex flex-col items-center">

      <!-- Profile Icon -->
      <div class="w-20 h-20 rounded-full bg-gm-panel flex items-center justify-center mb-8 shadow-md">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleNext" class="w-full space-y-4">
        <div>
          <input
            v-model="email"
            id="register-email"
            type="email"
            required
            class="w-full px-4 py-3.5 bg-gm-panel border border-transparent rounded-[12px] outline-none focus:border-gm-hover transition duration-200 text-white placeholder-gray-500 text-sm shadow-sm"
            placeholder="Email"
          />
        </div>

        <div>
          <input
            v-model="password"
            id="register-password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-3.5 bg-gm-panel border border-transparent rounded-[12px] outline-none focus:border-gm-hover transition duration-200 text-white placeholder-gray-500 text-sm shadow-sm"
            placeholder="Password"
          />
        </div>

        <div>
          <input 
            v-model="confirmPassword"
            id="register-confirm-password"
            type="password"
            required
            class="w-full px-4 py-3.5 bg-gm-panel border border-transparent rounded-[12px] outline-none focus:border-gm-hover transition duration-200 text-white placeholder-gray-500 text-sm shadow-sm"
            placeholder="Confirm Password"
          />
        </div>

        <p v-if="errorMsg" class="text-gm-danger text-sm text-center font-medium">{{ errorMsg }}</p>

        <button
          type="submit"
          id="register-next-button"
          class="w-full py-3.5 mt-2 bg-gm-primary text-white font-semibold rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-gm-hover hover:text-black transition duration-200 cursor-pointer text-sm"
        >
          Next
        </button>
      </form>

      <!-- Login Link -->
      <p class="text-center text-gray-500 mt-8 text-sm">
        Already have an account?
        <RouterLink to="/login" class="text-gm-primary hover:text-gm-hover font-bold transition-colors">Log in</RouterLink>
      </p>
    </div>
  </div>
</template>
