<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const existingGames = ref<any[]>([])
const newGameName = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  // Guard check
  if (!authStore.isAuthenticated || !authStore.user?.is_admin) {
    router.push('/discover')
    return
  }

  fetchGames()
})

const fetchGames = async () => {
  try {
    const res = await api.get('/admin/games')
    existingGames.value = res.data
  } catch (err) {
    console.error('Failed to load games', err)
  }
}

const addGame = async () => {
  if (!newGameName.value.trim()) return
  
  loading.value = true
  errorMsg.value = ''
  
  try {
    await api.post('/admin/games', { gameName: newGameName.value })
    newGameName.value = ''
    await fetchGames()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Failed to add game'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto w-full p-4 pt-12 animate-fade-in">
    <div class="mb-10">
      <h1 class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Admin Dashboard</h1>
      <p class="text-gray-400 mt-2 text-lg">Manage platform configuration</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Add Game Form -->
      <div class="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 class="text-2xl font-bold mb-4">Add New Game</h2>
        <form @submit.prevent="addGame" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1 ml-1">Game Name</label>
            <input 
              v-model="newGameName"
              type="text" 
              required 
              class="w-full px-4 py-3 bg-[#0B0F1A] border border-white/10 rounded-2xl outline-none focus:border-red-500 transition-all text-white placeholder-gray-600"
              placeholder="e.g. Counter Strike 2"
            />
          </div>
          <p v-if="errorMsg" class="text-red-400 text-sm font-medium">{{ errorMsg }}</p>
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3.5 mt-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {{ loading ? 'Adding...' : 'Add Game' }}
          </button>
        </form>
      </div>

      <!-- Existing Games List -->
      <div class="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col h-full max-h-[500px]">
        <h2 class="text-2xl font-bold mb-4">Current Games Directory</h2>
        
        <div class="flex-grow overflow-y-auto pr-2 space-y-2">
          <div 
            v-for="game in existingGames" 
            :key="game.id"
            class="flex items-center justify-between p-4 bg-[#0B0F1A]/50 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <span class="font-medium text-white">{{ game.game_name }}</span>
            <span class="text-xs text-gray-500 font-mono text-center px-2 py-1 bg-white/5 rounded-md">ID: {{ game.id }}</span>
          </div>
          
          <div v-if="existingGames.length === 0" class="text-center text-gray-500 py-8">
            No games added yet.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scrollbar hiding for list */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
</style>
