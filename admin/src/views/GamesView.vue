<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'

const existingGames = ref<any[]>([])
const newGameName = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => { fetchGames() })

const fetchGames = async () => {
    loading.value = true
    try {
        const res = await api.get('/profile/all-games')
        existingGames.value = res.data
    } catch (err) {
        console.error('Failed to load tags', err)
    } finally {
        loading.value = false
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
    alert('Tag registered successfully')
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Failed to add tag'
  } finally {
    loading.value = false
  }
}

const deleteGame = async (id: number) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this tag? This might affect users who have selected it.')) return
    try {
        await api.delete(`/admin/games/${id}`)
        await fetchGames()
    } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete tag')
    }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/5 pb-6">
      <div>
        <h1 class="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Platform Tags</h1>
        <p class="text-sm text-zinc-500 mt-1">Manage global interest tags available for users and matchmaking.</p>
      </div>
      <button @click="fetchGames" class="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-zinc-300 transition-all cursor-pointer">
        ↻ Refresh Tags
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Register Section -->
      <div class="col-span-1 bg-[#121214] p-8 rounded-[32px] border border-white/5 shadow-2xl h-min sticky top-24">
         <h2 class="text-lg font-black text-white mb-2">Create New Tag</h2>
         <p class="text-xs text-zinc-500 mb-6 leading-relaxed">Add a new category that users can select to find matches based on shared interests.</p>
         
         <form @submit.prevent="addGame" class="space-y-6">
             <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 ml-1">Tag Identifier</label>
                <input 
                  v-model="newGameName"
                  type="text" 
                  required 
                  class="w-full px-5 py-4 bg-black/40 border border-white/5 rounded-2xl outline-none focus:border-indigo-500/50 transition-all text-white placeholder-zinc-700 font-bold"
                  placeholder="e.g. Valorant, League, Chess"
                />
             </div>
             
             <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                 <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                 <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider">{{ errorMsg }}</p>
             </div>

             <button type="submit" :disabled="loading" class="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                {{ loading ? 'Processing...' : 'Register Tag' }}
             </button>
         </form>
      </div>

      <!-- Inventory Section -->
      <div class="col-span-1 lg:col-span-2 bg-[#121214] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
          <div class="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <h2 class="text-lg font-black text-white">Active Tags <span class="text-zinc-600 ml-2 font-normal text-sm">{{ existingGames.length }} total</span></h2>
          </div>
          
          <div v-if="loading && existingGames.length === 0" class="py-20 flex justify-center items-center">
              <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.03] overflow-y-auto max-h-[800px] custom-scrollbar">
              <div 
                v-for="game in existingGames" 
                :key="game.id" 
                class="bg-[#121214] p-6 flex items-center justify-between group hover:bg-white/[0.01] transition-colors"
              >
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/5 flex items-center justify-center text-zinc-600 font-black text-sm group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                          #
                      </div>
                      <div>
                          <p class="text-zinc-100 font-bold group-hover:text-white transition-colors">{{ game.game_name }}</p>
                          <p class="text-[10px] font-mono text-zinc-600 mt-0.5 uppercase tracking-tighter">ID: {{ game.id }}</p>
                      </div>
                  </div>
                  
                  <button @click="deleteGame(game.id)" class="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer" title="Delete record">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
              </div>
          </div>

          <div v-if="existingGames.length === 0 && !loading" class="py-20 text-center">
              <p class="text-zinc-500 font-bold uppercase tracking-widest text-xs">No tags registered in database</p>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
</style>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
