<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'

const existingGames = ref<any[]>([])
const newGameName = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => { fetchGames() })

const fetchGames = async () => {
  try {
    const res = await api.get('/profile/all-games') // Global public path
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
    await api.post('/admin/games', { game_name: newGameName.value })
    newGameName.value = ''
    await fetchGames()
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Failed to add game'
  } finally {
    loading.value = false
  }
}

const deleteGame = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this game tag from the database? This might orphaned users.')) return
    try {
        await api.delete(`/admin/games/${id}`)
        await fetchGames()
    } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete')
    }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div>
      <h1 class="text-3xl font-bold">Game Tags Platform Configuration</h1>
      <p class="text-gray-400 mt-2">Manage backend platform games and tags.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Add section -->
      <div class="col-span-1 border border-white/5 bg-gray-900 p-6 rounded-2xl h-min">
         <h2 class="text-xl font-bold mb-4">Register Tag</h2>
         <form @submit.prevent="addGame" class="space-y-4">
             <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Game Name</label>
                <input 
                  v-model="newGameName"
                  type="text" 
                  required 
                  class="w-full px-4 py-3 bg-gray-950 border border-white/10 rounded-xl outline-none focus:border-red-500 transition-all text-white placeholder-gray-600"
                  placeholder="e.g. Counter Strike 2"
                />
             </div>
             <p v-if="errorMsg" class="text-red-400 text-sm font-medium">{{ errorMsg }}</p>
             <button type="submit" :disabled="loading" class="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all">
                {{ loading ? 'Saving...' : 'Add Game Component' }}
             </button>
         </form>
      </div>

      <!-- List section -->
      <div class="col-span-1 lg:col-span-2 border border-white/5 bg-gray-900 p-6 rounded-2xl overflow-hidden flex flex-col max-h-[600px]">
          <h2 class="text-xl font-bold mb-4">Active Database Records</h2>
          <div class="overflow-y-auto pr-2 space-y-2 flex-grow">
               <div v-for="game in existingGames" :key="game.id" class="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                   <div class="flex items-center gap-4">
                      <span class="text-sm font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">ID: {{ game.id }}</span>
                      <span class="font-bold text-white tracking-wide">{{ game.game_name }}</span>
                   </div>
                   <button @click="deleteGame(game.id)" class="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Delete Game">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
               </div>
               <div v-if="existingGames.length === 0" class="text-center py-12 text-gray-500">Database array is empty.</div>
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
</style>
