<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '@/stores/register'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const registerStore = useRegisterStore()
const authStore = useAuthStore()

const loading = ref(false)
const errorMsg = ref('')

// 4 slots, each can hold a File or null
const photoSlots = ref<(File | null)[]>([null, null, null, null])

const previewUrls = computed(() => {
  return photoSlots.value.map(file => {
    if (file) return URL.createObjectURL(file)
    return null
  })
})

const triggerFileInput = (index: number) => {
  const input = document.getElementById(`photo-input-${index}`) as HTMLInputElement
  input?.click()
}

const handleFileChange = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    photoSlots.value[index] = file
    registerStore.addPhoto(file)
  }
}

const removePhoto = (index: number) => {
  photoSlots.value[index] = null
}

// Find first empty slot index for the "+" button
const firstEmptySlot = computed(() => {
  return photoSlots.value.findIndex(slot => slot === null)
})

const handleCreateAccount = async () => {
  errorMsg.value = ''
  loading.value = true

  try {
    // 1. Register
    await api.post('/auth/register', {
      name: registerStore.username,
      email: registerStore.email,
      password: registerStore.password
    })

    // 2. Auto-login
    const loginRes = await api.post('/auth/login', {
      email: registerStore.email,
      password: registerStore.password
    })
    authStore.setAuth(loginRes.data.token, loginRes.data.user)

    // 3. Upload photos & update profile
    const uploadedUrls: string[] = []
    const photos = photoSlots.value.filter(f => f !== null) as File[]

    for (const photo of photos) {
      try {
        const formData = new FormData()
        formData.append('image', photo)
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrls.push(uploadRes.data.imageUrl)
      } catch {
        // If upload fails, continue
      }
    }

    // 4. Update profile
    await api.put('/profile', {
      display_name: registerStore.username,
      bio: registerStore.bio,
      age: Number(registerStore.age) || 0,
      profile_images: uploadedUrls
    })

    // 5. Add game tags
    if (registerStore.selectedTags.length > 0) {
      try {
        const gamesRes = await api.get('/profile/all-games')
        const allGames = gamesRes.data
        for (const tagName of registerStore.selectedTags) {
          const game = allGames.find((g: any) => g.game_name === tagName)
          if (game) {
            await api.post('/profile/games', { gameId: game.id })
          }
        }
      } catch {
        // If game tags fail, continue
      }
    }

    // 6. Clean up & redirect
    registerStore.reset()
    router.push('/discover')

  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Registration failed. Try a different email.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4">
    <!-- Back Arrow -->
    <button
      @click="router.push('/register/tags')"
      id="photos-back-button"
      class="w-10 h-10 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mt-2 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>

    <!-- Centered Content -->
    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-sm flex flex-col items-center">

        <!-- Icon -->
        <div class="w-20 h-20 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mb-8 shadow-lg shadow-purple-500/10">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </div>

        <!-- 2x2 Photo Grid -->
        <div class="w-full grid grid-cols-2 gap-3 mb-8">
          <template v-for="(slot, index) in photoSlots" :key="index">
            <!-- Hidden file input -->
            <input
              :id="`photo-input-${index}`"
              type="file"
              accept="image/*"
              class="hidden"
              @change="(e) => handleFileChange(index, e)"
            />

            <!-- Slot with image -->
            <div
              v-if="slot"
              class="relative aspect-square rounded-2xl overflow-hidden border-2 border-purple-500/30 group cursor-pointer"
              @click="triggerFileInput(index)"
            >
              <img
                :src="previewUrls[index]!"
                alt="Uploaded photo"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  @click.stop="removePhoto(index)"
                  class="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center cursor-pointer"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Empty slot — shows "+" on the first empty, photo icon on others -->
            <div
              v-else
              @click="triggerFileInput(index)"
              class="aspect-square rounded-2xl border-2 border-dashed border-white/15 bg-[var(--color-input-bg)]/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-500/40 hover:bg-white/5 transition-all"
            >
              <!-- First empty slot gets "+" button -->
              <template v-if="index === firstEmptySlot">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </template>
              <!-- Other empty slots show photo icon -->
              <template v-else>
                <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </template>
            </div>
          </template>
        </div>

        <p v-if="errorMsg" class="text-red-400 text-sm text-center font-medium mb-4">{{ errorMsg }}</p>

        <!-- Create Account Button -->
        <button
          @click="handleCreateAccount"
          :disabled="loading"
          id="create-account-button"
          class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </div>
    </div>
  </div>
</template>
