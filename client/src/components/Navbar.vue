<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeIcon, ChatBubbleLeftIcon, UserCircleIcon } from '@heroicons/vue/24/outline'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

// Hide navbar on login, register (all steps), setup
const hideNavbar = computed(() => {
  return ['/login', '/setup-profile'].includes(route.path) || route.path.startsWith('/register') || route.path === '/'
})
</script>

<template>
  <nav v-if="!hideNavbar" class="w-full flex items-center justify-between px-6 py-4 bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.05)] sticky top-0 z-50 backdrop-blur-md">
    <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/discover')">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
        GM
      </div>
      <span class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        GameMatch
      </span>
    </div>

    <div class="flex items-center gap-6 text-gray-400">
      <button 
        @click="router.push('/discover')"
        class="transition-colors hover:text-white"
        :class="{ 'text-purple-400': route.path === '/discover' }"
      >
        <HomeIcon class="h-7 w-7" />
      </button>
      <button 
        @click="router.push('/matches')"
        class="transition-colors hover:text-white relative"
        :class="{ 'text-purple-400': route.path.startsWith('/matches') || route.path.startsWith('/chat') }"
      >
        <ChatBubbleLeftIcon class="h-7 w-7" />
        <!-- Notification badge would theoretically hook to a chat store here -->
        <span v-if="chatStore.hasUnread" class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-dark-bg)]"></span>
      </button>
      <button 
        @click="router.push('/profile')"
        class="transition-colors hover:text-white"
        :class="{ 'text-purple-400': route.path === '/profile' }"
      >
        <UserCircleIcon class="h-7 w-7" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
</style>
