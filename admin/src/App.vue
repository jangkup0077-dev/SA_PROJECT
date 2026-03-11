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
  <div class="min-h-screen bg-gray-950 text-white flex flex-col">
    <nav v-if="authStore.isAuthenticated" class="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 tracking-tight">
          GameMatch<span class="text-white ml-2 text-sm font-mono opacity-50 block uppercase tracking-widest mt-0.5">Admin</span>
        </h1>
        <div class="flex gap-4">
          <router-link to="/dashboard" class="px-3 py-2 rounded-lg transition-colors" :class="route.name === 'dashboard' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white'">Dashboard</router-link>
          <router-link to="/users" class="px-3 py-2 rounded-lg transition-colors" :class="route.name === 'users' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white'">Users</router-link>
          <router-link to="/reports" class="px-3 py-2 rounded-lg transition-colors" :class="route.name === 'reports' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white'">Reports</router-link>
          <router-link to="/games" class="px-3 py-2 rounded-lg transition-colors" :class="route.name === 'games' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:text-white'">Games</router-link>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-400">Signed in as <strong class="text-white">{{ authStore.admin?.name }}</strong></span>
        <button @click="logout" class="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors">Logout</button>
      </div>
    </nav>

    <main class="flex-grow p-8">
      <router-view />
    </main>
  </div>
</template>
