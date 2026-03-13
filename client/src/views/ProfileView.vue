<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import GameTag from '@/components/GameTag.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const profileId = computed(() => route.params.userId ? Number(route.params.userId) : null)
const isOwnProfile = computed(() => !profileId.value || profileId.value === authStore.user?.id)

// Profile data
const displayName = ref('')
const email = ref('')
const bio = ref('')
const birth_date = ref('')
const country = ref('')

// 4 slots, can be string (URL) or File (newly selected) or null
const photoSlots = ref<(string | File | null)[]>([null, null, null, null])

const availableGames = ref<any[]>([])
const selectedGames = ref<number[]>([])
const originalGames = ref<number[]>([])

const loading = ref(false)
const saveSuccess = ref(false)
const isEditing = ref(false)

onMounted(async () => {
  try {
    const gamesRes = await api.get('/profile/all-games').catch(() => ({ data: [] }))
    availableGames.value = gamesRes.data

    const endpoint = isOwnProfile.value ? '/profile' : `/profile/${profileId.value}`
    const profileRes = await api.get(endpoint).catch(() => ({ data: null }))
    
    if (profileRes.data) {
      displayName.value = profileRes.data.display_name || profileRes.data.name || ''
      email.value = profileRes.data.email || ''
      bio.value = profileRes.data.bio || ''
      
      if (profileRes.data.birth_date) {
        birth_date.value = new Date(profileRes.data.birth_date).toISOString().split('T')[0] || ''
      }
      
      country.value = profileRes.data.country || ''
      
      const images = Array.isArray(profileRes.data.profile_image_url)
        ? profileRes.data.profile_image_url
        : profileRes.data.profile_image_url ? [profileRes.data.profile_image_url] : []
        
      // Map existing images to slots
      photoSlots.value = [null, null, null, null]
      images.forEach((url: string, i: number) => {
          if (i < 4) photoSlots.value[i] = url
      })

      if (profileRes.data.games) {
        const mappedGames = profileRes.data.games.map((g: any) => g.game_id || g.id)
        selectedGames.value = [...mappedGames]
        originalGames.value = [...mappedGames]
      }
    }
  } catch (err) {
    console.error('Failed to load profile data', err)
  }
})

const getPreviewUrl = (slot: string | File | null) => {
    if (!slot) return null
    if (typeof slot === 'string') return slot
    return URL.createObjectURL(slot)
}

const userGames = computed(() => {
  return availableGames.value.filter(g => selectedGames.value.includes(g.id))
})

const gameSearchQuery = ref('')

const filteredAvailableGames = computed(() => {
  if (!gameSearchQuery.value.trim()) return []
  const q = gameSearchQuery.value.toLowerCase()
  return availableGames.value.filter(g => 
    !selectedGames.value.includes(g.id) && 
    g.game_name.toLowerCase().includes(q)
  )
})

const removeGame = (gameId: number) => {
  selectedGames.value = selectedGames.value.filter(id => id !== gameId)
}

const addGame = (gameId: number) => {
  if (!selectedGames.value.includes(gameId)) {
    selectedGames.value.push(gameId)
  }
  gameSearchQuery.value = ''
}

const triggerFileInput = (index: number) => {
  const input = document.getElementById(`photo-input-${index}`) as HTMLInputElement
  input?.click()
}

const handleFileChange = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    photoSlots.value[index] = file
  }
}

const removePhoto = (index: number) => {
  photoSlots.value[index] = null
}

const firstEmptySlot = computed(() => {
  return photoSlots.value.findIndex(slot => slot === null)
})

const handleSave = async () => {
  saveSuccess.value = false
  loading.value = true
  try {
    const uploadedUrls: string[] = []

    for (const slot of photoSlots.value) {
        if (!slot) continue
        
        if (typeof slot === 'string') {
            uploadedUrls.push(slot)
            continue
        }
        
        // Upload new file
        const formData = new FormData()
        formData.append('file', slot)
        const uploadRes = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        uploadedUrls.push(uploadRes.data.url)
    }

    await api.put('/profile', {
      display_name: displayName.value,
      bio: bio.value,
      birth_date: birth_date.value,
      country: country.value,
      profile_image_url: uploadedUrls
    })

    // Games sync
    const gamesToAdd = selectedGames.value.filter(id => !originalGames.value.includes(id))
    const gamesToRemove = originalGames.value.filter(id => !selectedGames.value.includes(id))

    for (const gameId of gamesToAdd) {
      await api.post('/profile/games', { gameId }).catch(console.error)
    }
    for (const gameId of gamesToRemove) {
      await api.delete(`/profile/games/${gameId}`).catch(console.error)
    }

    originalGames.value = [...selectedGames.value]
    // Update labels and states
    photoSlots.value = [null, null, null, null]
    uploadedUrls.forEach((url, i) => photoSlots.value[i] = url)

    saveSuccess.value = true
    isEditing.value = false
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err) {
    console.error(err)
    alert('Failed to save profile')
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
}
</script>

<template>
  <div class="max-w-lg mx-auto w-full px-4 pb-28 pt-6 animate-fade-in text-white">

    <template v-if="!isEditing">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <button
            @click="router.back()"
            class="w-10 h-10 rounded-[12px] bg-white/5 border border-transparent flex items-center justify-center text-gray-400 hover:text-gm-hover hover:bg-white/10 transition-all cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold tracking-tight">Profile</h1>
        </div>
        <button
          v-if="isOwnProfile"
          @click="handleLogout"
          class="px-4 py-2 text-sm text-gm-danger border border-transparent rounded-[12px] hover:bg-gm-danger hover:text-white transition duration-200 cursor-pointer shadow-md"
        >
          Log out
        </button>
      </div>

      <!-- Avatar Section (Displays first photo) -->
      <div class="flex flex-col items-center mb-10">
        <div class="relative">
          <div class="w-32 h-32 rounded-[32px] overflow-hidden ring-4 ring-gm-primary/30 shadow-[0_0_40px_rgba(124,58,237,0.2)]">
            <img
              v-if="photoSlots[0]"
              :src="getPreviewUrl(photoSlots[0])!"
              alt="Profile"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full bg-gm-panel flex items-center justify-center">
              <svg class="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>
          <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-gm-primary rounded-xl flex items-center justify-center border-2 border-[#0f172a]">
             <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4" />
             </svg>
          </div>
        </div>
        <h2 class="text-2xl font-black mt-4">{{ displayName || authStore.user?.name || 'User' }}</h2>
        <p class="text-zinc-500 text-sm font-medium">{{ email || authStore.user?.email }}</p>
      </div>

      <!-- Photos Grid (Read Only) -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-black uppercase tracking-widest text-zinc-600">Gallery</span>
          <span class="text-[10px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">{{ photoSlots.filter(s => !!s).length }}/4 Photos</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="(slot, idx) in photoSlots"
            :key="idx"
            class="aspect-square rounded-[20px] overflow-hidden border border-white/5 bg-gm-panel relative shadow-lg"
          >
            <img v-if="slot" :src="getPreviewUrl(slot)!" alt="Photo" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-8 h-8 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-3 mb-8">
        <div v-if="bio" class="bg-gm-panel border border-white/5 rounded-[24px] p-6 shadow-xl">
          <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">About Me</span>
          <p class="text-zinc-200 text-sm mt-3 leading-relaxed font-medium">{{ bio }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gm-panel border border-white/5 rounded-[24px] p-6 shadow-xl">
            <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Gamer Age</span>
            <p class="text-zinc-200 text-sm mt-2 font-bold">{{ birth_date || '—' }}</p>
          </div>
          <div class="bg-gm-panel border border-white/5 rounded-[24px] p-6 shadow-xl">
            <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Location</span>
            <p class="text-zinc-200 text-sm mt-2 font-bold">{{ country || '—' }}</p>
          </div>
        </div>
      </div>

      <div v-if="userGames.length > 0" class="mb-10">
        <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Platform Interests</span>
        <div class="flex flex-wrap gap-2 mt-4">
          <GameTag
            v-for="game in userGames"
            :key="game.id"
            :name="game.game_name"
            :selected="true"
          />
        </div>
      </div>

      <button
        v-if="isOwnProfile"
        @click="isEditing = true"
        class="w-full py-4 bg-gm-primary text-white font-black uppercase tracking-[0.2em] rounded-[20px] shadow-2xl hover:bg-gm-hover hover:text-black transition duration-300 cursor-pointer text-xs"
      >
        Edit My Profile
      </button>

      <Transition name="toast">
        <div v-if="saveSuccess" class="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-2xl">
          ✓ Profile Synced
        </div>
      </Transition>
    </template>

    <!-- Editing Mode -->
    <template v-else>
      <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-black tracking-tighter">Edit Settings</h1>
          <button
            @click="cancelEdit"
            class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
      </div>

      <!-- Photo Grid Editor (Up to 4) -->
      <div class="mb-10">
        <div class="flex items-center justify-between mb-4 px-1">
            <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Personal Photos</span>
            <span class="text-[10px] font-bold text-zinc-500">2x2 GRID (MAX 4)</span>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div v-for="(slot, index) in photoSlots" :key="index" class="relative">
            <input
              :id="`photo-input-${index}`"
              type="file"
              accept="image/*"
              class="hidden"
              @change="(e) => handleFileChange(index, e)"
            />
            
            <div
              v-if="slot"
              class="relative aspect-square rounded-[24px] overflow-hidden border-2 border-gm-primary/40 group cursor-pointer shadow-xl"
              @click="triggerFileInput(index)"
            >
              <img
                :src="getPreviewUrl(slot)!"
                alt="Profile photo"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  @click.stop="removePhoto(index)"
                  class="w-10 h-10 rounded-full bg-gm-danger flex items-center justify-center cursor-pointer shadow-lg active:scale-90"
                >
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-else
              @click="triggerFileInput(index)"
              class="aspect-square rounded-[24px] border-2 border-dashed border-white/5 bg-gm-panel flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gm-hover hover:bg-white/5 transition-all group"
            >
               <div v-if="index === firstEmptySlot" class="w-10 h-10 rounded-xl bg-gm-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
               </div>
               <svg v-else class="w-8 h-8 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
               </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6 mb-10">
        <div>
          <label class="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Display Name</label>
          <input
            v-model="displayName"
            type="text"
            class="w-full px-5 py-4 bg-gm-panel border border-white/5 rounded-[20px] outline-none focus:border-gm-primary transition duration-300 text-white font-bold"
            placeholder="Identity Label"
          />
        </div>

        <div>
          <label class="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Bio / Intel</label>
          <textarea
            v-model="bio"
            rows="3"
            class="w-full px-5 py-4 bg-gm-panel border border-white/5 rounded-[20px] outline-none focus:border-gm-primary transition duration-300 text-white font-medium resize-none"
            placeholder="Encoded background details..."
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Birth Date</label>
            <input
              v-model="birth_date"
              type="date"
              class="w-full px-5 py-4 bg-gm-panel border border-white/5 rounded-[20px] outline-none focus:border-gm-primary transition duration-300 text-white font-bold"
            />
          </div>
          <div>
            <label class="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Home Base</label>
            <input
              v-model="country"
              type="text"
              class="w-full px-5 py-4 bg-gm-panel border border-white/5 rounded-[20px] outline-none focus:border-gm-primary transition duration-300 text-white font-bold"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <!-- Games Manager -->
      <div class="mb-10">
        <label class="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 ml-1">Platform Interests</label>
        
        <div class="flex flex-wrap gap-2 mb-6">
          <span
            v-for="game in userGames"
            :key="game.id"
            class="flex items-center gap-2 px-4 py-2 bg-gm-primary/20 text-white border border-gm-primary/30 rounded-full text-xs font-black uppercase tracking-wider"
          >
            {{ game.game_name }}
            <button @click="removeGame(game.id)" class="text-gm-primary hover:text-white transition-colors cursor-pointer">
              ✕
            </button>
          </span>
          <span v-if="userGames.length === 0" class="text-xs text-zinc-700 italic px-2">No active tags</span>
        </div>

        <div class="relative">
          <input
            v-model="gameSearchQuery"
            type="text"
            class="w-full px-5 py-4 bg-gm-panel border border-white/5 rounded-[20px] outline-none focus:border-gm-primary transition duration-300 text-white font-bold"
            placeholder="Search tags..."
          />
          
          <div v-if="gameSearchQuery.trim()" class="absolute z-50 w-full mt-3 bg-gm-panel border border-white/10 rounded-[24px] shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
            <button
               v-for="game in filteredAvailableGames"
               :key="game.id"
               @click="addGame(game.id)"
               class="w-full text-left px-6 py-4 hover:bg-white/5 text-white text-sm font-bold transition-all flex items-center justify-between group border-b border-white/5 last:border-0"
            >
               <span># {{ game.game_name }}</span>
               <span class="text-gm-primary opacity-0 group-hover:opacity-100 font-black tracking-widest text-[10px] uppercase transition-all">Add +</span>
            </button>
            <div v-if="filteredAvailableGames.length === 0" class="p-6 text-center text-zinc-500 font-bold text-xs">NO RESULTS</div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <button
          @click="handleSave"
          :disabled="loading"
          class="w-full py-4 bg-gm-primary text-white font-black uppercase tracking-[0.2em] rounded-[20px] shadow-2xl hover:bg-gm-hover hover:text-black transition duration-300 disabled:opacity-50 cursor-pointer text-xs"
        >
          {{ loading ? 'Saving...' : 'Confirm Changes' }}
        </button>
        <button
          @click="cancelEdit"
          class="w-full py-4 bg-white/5 text-zinc-400 font-black uppercase tracking-[0.2em] rounded-[20px] hover:bg-white/10 transition duration-300 cursor-pointer text-xs"
        >
          Discard
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.toast-enter-active, .toast-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -20px); }
</style>