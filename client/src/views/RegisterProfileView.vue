<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '@/stores/register'

const router = useRouter()
const registerStore = useRegisterStore()

const username = ref(registerStore.username || '')
const birth_date = ref('')
const bio = ref(registerStore.bio || '')
const country = ref(registerStore.country || '')
const errorMsg = ref('')

const isLocating = ref(false)

onMounted(async () => {
  if (!country.value) {
    isLocating.value = true
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.country_name) {
        country.value = data.country_name // เช่น "Thailand"
      }
      console.log('[IP API] Auto-detected country:', data.country_name)
    } catch (err) {
      console.error('Failed to auto-detect country', err)
    } finally {
      isLocating.value = false
    }
  }
})

const goBack = () => {
  router.push('/register')
}

const handleNext = () => {
  if (!username.value || !birth_date.value) {
    errorMsg.value = 'Please fill in all required fields'
    return
  }

  registerStore.setProfile(username.value, birth_date.value, bio.value, country.value)
  router.push('/register/tags')
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4">
    <!-- Back Arrow -->
    <button
      @click="goBack"
      id="profile-back-button"
      class="w-10 h-10 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mt-2 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>

    <!-- Centered Content -->
    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-sm flex flex-col items-center">

        <!-- Profile Icon -->
        <div class="w-20 h-20 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mb-8 shadow-lg shadow-purple-500/10">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleNext" class="w-full space-y-4">
          <div>
            <input
              v-model="username"
              id="profile-username"
              type="text"
              required
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
              placeholder="Username"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 ml-1">Date of Birth</label>
            <input
              v-model="birth_date"
              type="date"
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
            />
          </div>

          <div>
            <textarea
              v-model="bio"
              id="profile-bio"
              rows="3"
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm resize-none"
              placeholder="Bio"
            ></textarea>
          </div>

          <p v-if="errorMsg" class="text-red-400 text-sm text-center font-medium">{{ errorMsg }}</p>

          <button
            type="submit"
            id="profile-next-button"
            class="w-full py-3.5 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-sm"
          >
            Next
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
