<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AvatarUploader from '@/components/AvatarUploader.vue'
import GameTag from '@/components/GameTag.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const bio = ref('')
const age = ref<number | ''>('')
const country = ref('')
const avatarFile = ref<File | null>(null)

const availableGames = ref<any[]>([])
const selectedGames = ref<number[]>([])

const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  try {
    // Backend: GET /api/profile/all-games
    const res = await api.get('/profile/all-games')
    availableGames.value = res.data
  } catch {
    // Fallback mock games if endpoint fails
    availableGames.value = [
      { id: 1, game_name: 'Valorant' },
      { id: 2, game_name: 'League of Legends' },
      { id: 3, game_name: 'ROV' },
      { id: 4, game_name: 'Apex' },
      { id: 5, game_name: 'Fortnite' }
    ]
  }
})

const handleAvatarChange = (file: File | null) => {
  avatarFile.value = file
}

const toggleGame = (gameId: number) => {
  const index = selectedGames.value.indexOf(gameId)
  if (index > -1) {
    selectedGames.value.splice(index, 1)
  } else {
    selectedGames.value.push(gameId)
  }
}

const handleSetup = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    let uploadedUrls: string[] = []

    // Upload avatar if exists
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('image', avatarFile.value)
      // Backend: POST /api/upload/
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      uploadedUrls.push(uploadRes.data.imageUrl)
    }

    // Backend: PUT /api/profile/
    await api.put('/profile', {
      display_name: authStore.user?.name || '',
      bio: bio.value,
      age: Number(age.value) || 0,
      country: country.value,
      profile_images: uploadedUrls
    })

    // Backend: POST /api/profile/games
    for (const gameId of selectedGames.value) {
      await api.post('/profile/games', { gameId })
    }

    router.push('/discover')
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Failed to setup profile.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen p-4 flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-start pt-12 pb-24">
    <!-- Left Column: Avatar & Bio -->
    <div class="w-full md:w-1/2 flex flex-col gap-6">
      <div>
        <h1 class="text-3xl font-bold mb-2">Build your profile</h1>
        <p class="text-gray-400">Let others know who you are</p>
      </div>

      <div class="w-full max-w-[240px] mx-auto md:mx-0">
        <label class="block text-sm font-medium text-gray-400 mb-2">Profile Photo</label>
        <AvatarUploader size="lg" @change="handleAvatarChange" />
      </div>

      <div class="space-y-4 w-full">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1 ml-1" for="bio">Bio</label>
          <textarea
            v-model="bio"
            id="bio"
            rows="3"
            class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-purple-500 transition-all text-white placeholder-gray-500 resize-none"
            placeholder="I mainly play duelist roles..."
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1 ml-1" for="age">Age</label>
            <input
              v-model="age"
              id="age"
              type="number"
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-purple-500 transition-all text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1 ml-1" for="country">Country</label>
            <input
              v-model="country"
              id="country"
              type="text"
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-purple-500 transition-all text-white"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Game Interests & Submit -->
    <div class="w-full md:w-1/2 flex flex-col gap-6 md:pt-16">
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-3 ml-1">Select your games</label>
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

      <p v-if="errorMsg" class="text-red-400 text-sm font-medium mt-4">{{ errorMsg }}</p>

      <button
        @click="handleSetup"
        :disabled="loading"
        class="w-full py-4 mt-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:-translate-y-1 transition-all disabled:opacity-50"
      >
        {{ loading ? 'Saving...' : 'Start Matching!' }}
      </button>
    </div>
  </div>
</template>
