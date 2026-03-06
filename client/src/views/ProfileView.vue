<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import GameTag from '@/components/GameTag.vue'

const router = useRouter()
const authStore = useAuthStore()

// Profile data
const displayName = ref('')
const email = ref('')
const bio = ref('')
const age = ref<number | ''>('')
const country = ref('')
const avatarUrl = ref('')
const profileImages = ref<string[]>([])
const avatarFile = ref<File | null>(null)

const availableGames = ref<any[]>([])
const selectedGames = ref<number[]>([])

const loading = ref(false)
const saveSuccess = ref(false)
const isEditing = ref(false)

onMounted(async () => {
  try {
    const gamesRes = await api.get('/profile/all-games').catch(() => ({ data: [] }))
    availableGames.value = gamesRes.data.length ? gamesRes.data : [
      { id: 1, game_name: 'Valorant' },
      { id: 2, game_name: 'League of Legends' },
      { id: 3, game_name: 'ROV' },
      { id: 4, game_name: 'CS2' },
      { id: 5, game_name: 'PubG' },
      { id: 6, game_name: 'Hayday' }
    ]

    const profileRes = await api.get('/profile/').catch(() => ({ data: null }))
    if (profileRes.data) {
      displayName.value = profileRes.data.display_name || profileRes.data.name || authStore.user?.name || ''
      email.value = profileRes.data.email || authStore.user?.email || ''
      bio.value = profileRes.data.bio || ''
      age.value = profileRes.data.age || ''
      country.value = profileRes.data.country || ''
      avatarUrl.value = profileRes.data.profile_images?.[0] || ''
      profileImages.value = profileRes.data.profile_images || []

      if (profileRes.data.games) {
        selectedGames.value = profileRes.data.games.map((g: any) => g.id)
      }
    }
  } catch (err) {
    console.error('Failed to load profile data', err)
  }
})

const userGames = computed(() => {
  return availableGames.value.filter(g => selectedGames.value.includes(g.id))
})

const toggleGame = (gameId: number) => {
  const index = selectedGames.value.indexOf(gameId)
  if (index > -1) {
    selectedGames.value.splice(index, 1)
  } else {
    selectedGames.value.push(gameId)
  }
}

const triggerAvatarUpload = () => {
  const input = document.getElementById('avatar-file-input') as HTMLInputElement
  input?.click()
}

const handleAvatarFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    avatarFile.value = file
    avatarUrl.value = URL.createObjectURL(file)
  }
}

const handleSave = async () => {
  saveSuccess.value = false
  loading.value = true
  try {
    let newAvatarUrl = avatarUrl.value

    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('image', avatarFile.value)
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      newAvatarUrl = uploadRes.data.imageUrl
    }

    await api.put('/profile', {
      display_name: displayName.value,
      bio: bio.value,
      age: Number(age.value) || 0,
      country: country.value,
      profile_images: newAvatarUrl ? [newAvatarUrl] : []
    })

    for (const gameId of selectedGames.value) {
      await api.post('/profile/games', { gameId }).catch(() => {})
    }

    saveSuccess.value = true
    isEditing.value = false
    avatarFile.value = null
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const cancelEdit = () => {
  isEditing.value = false
  avatarFile.value = null
}
</script>

<template>
  <div class="max-w-lg mx-auto w-full px-4 pb-28 pt-6 animate-fade-in">

    <!-- ============= VIEW MODE ============= -->
    <template v-if="!isEditing">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Profile</h1>
        <button
          @click="handleLogout"
          id="profile-logout-button"
          class="px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>

      <!-- Avatar Card -->
      <div class="flex flex-col items-center mb-8">
        <div class="relative">
          <div class="w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-500/30 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Profile"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-[var(--color-input-bg)] flex items-center justify-center">
              <svg class="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>
          <!-- Online indicator -->
          <div class="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--color-dark-bg)]"></div>
        </div>
        <h2 class="text-xl font-bold mt-3">{{ displayName || authStore.user?.name || 'User' }}</h2>
        <p class="text-gray-500 text-sm">{{ email || authStore.user?.email }}</p>
      </div>

      <!-- Photos Section -->
      <div v-if="profileImages.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-400">Photos</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="(img, idx) in profileImages"
            :key="idx"
            class="aspect-square rounded-xl overflow-hidden border border-white/5"
          >
            <img :src="img" alt="Photo" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="space-y-3 mb-6">
        <!-- Bio -->
        <div v-if="bio" class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</span>
          <p class="text-white text-sm mt-1.5 leading-relaxed">{{ bio }}</p>
        </div>

        <!-- Details Row -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Age</span>
            <p class="text-white text-sm mt-1.5 font-medium">{{ age || '—' }}</p>
          </div>
          <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Country</span>
            <p class="text-white text-sm mt-1.5 font-medium">{{ country || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Game Tags -->
      <div v-if="userGames.length > 0" class="mb-8">
        <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Games</span>
        <div class="flex flex-wrap gap-2 mt-3">
          <GameTag
            v-for="game in userGames"
            :key="game.id"
            :name="game.game_name"
            :selected="true"
          />
        </div>
      </div>

      <!-- Edit Button -->
      <button
        @click="isEditing = true"
        id="edit-profile-button"
        class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-sm"
      >
        Edit Profile
      </button>

      <!-- Success Toast -->
      <Transition name="toast">
        <div v-if="saveSuccess" class="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-2xl text-sm font-medium backdrop-blur-md shadow-lg">
          ✓ Profile updated successfully
        </div>
      </Transition>
    </template>

    <!-- ============= EDIT MODE ============= -->
    <template v-else>

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button
            @click="cancelEdit"
            class="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold tracking-tight">Edit Profile</h1>
        </div>
      </div>

      <!-- Avatar Upload -->
      <div class="flex flex-col items-center mb-8">
        <input id="avatar-file-input" type="file" accept="image/*" class="hidden" @change="handleAvatarFile" />
        <div
          @click="triggerAvatarUpload"
          class="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-500/30 cursor-pointer group"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            alt="Profile"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full bg-[var(--color-input-bg)] flex items-center justify-center">
            <svg class="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
        </div>
        <span class="text-gray-500 text-xs mt-2">Tap to change photo</span>
      </div>

      <!-- Edit Form -->
      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 ml-1" for="edit-name">Display Name</label>
          <input
            v-model="displayName"
            id="edit-name"
            type="text"
            class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
            placeholder="Your display name"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 ml-1" for="edit-bio">Bio</label>
          <textarea
            v-model="bio"
            id="edit-bio"
            rows="3"
            class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm resize-none"
            placeholder="Tell others about yourself..."
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 ml-1" for="edit-age">Age</label>
            <input
              v-model="age"
              id="edit-age"
              type="number"
              min="1"
              max="120"
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
              placeholder="Age"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 ml-1" for="edit-country">Country</label>
            <input
              v-model="country"
              id="edit-country"
              type="text"
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <!-- Game Tags -->
      <div class="mb-8">
        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 ml-1">Your Games</label>
        <div class="flex flex-wrap gap-2">
          <GameTag
            v-for="game in availableGames"
            :key="game.id"
            :name="game.game_name"
            :selected="selectedGames.includes(game.id)"
            @toggle="toggleGame(game.id)"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <button
          @click="handleSave"
          :disabled="loading"
          id="save-profile-button"
          class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
        <button
          @click="cancelEdit"
          class="w-full py-3.5 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-2xl hover:bg-white/10 transition-all cursor-pointer text-sm"
        >
          Cancel
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.3s ease-in;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
