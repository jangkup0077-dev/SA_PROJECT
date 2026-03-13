<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
    <nav v-if="authStore.isAuthenticated" class="bg-[#09090b] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div class="flex items-center gap-8">
        <div class="p-6">
          <h2 class="text-xl font-black tracking-tighter text-white">Squader <span class="text-[10px] bg-indigo-500 px-1.5 py-0.5 rounded ml-1 uppercase">HQ</span></h2>
          <p class="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">Management Console</p>
        </div>
        <div class="flex gap-1.5 hidden md:flex">
          <router-link to="/dashboard" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" :class="route.name === 'dashboard' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'">Overview</router-link>
          <router-link to="/users" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" :class="route.name === 'users' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'">Users</router-link>
          <router-link to="/reports" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" :class="route.name === 'reports' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'">Reports</router-link>
          <router-link to="/games" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" :class="route.name === 'games' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'">Platform Tags</router-link>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-zinc-400 hidden sm:inline">{{ authStore.admin?.name }}</span>
        <button @click="logout" class="px-3 py-1.5 border border-white/5 hover:bg-white/5 rounded-md text-xs font-medium transition-colors text-zinc-300">Sign out</button>
      </div>
    </nav>

    <main class="flex-grow p-6 md:p-10">
      <router-view />
    </main>
  </div>
</template>
