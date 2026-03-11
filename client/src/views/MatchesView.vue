<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import MatchCard from '@/components/MatchCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  chatStore.hasUnread = false
  await chatStore.fetchMatches()
})
</script>

<template>
  <div class="max-w-lg mx-auto w-full flex flex-col h-full">
    <!-- Header -->
    <div class="px-5 pt-6 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Matches</h1>
        <p class="text-xs text-gray-500 mt-0.5">{{ chatStore.matchesList.length }} connections</p>
      </div>
      <button
        @click="router.push('/discover')"
        class="px-4 py-1.5 bg-gm-primary/20 text-white border border-transparent rounded-[12px] text-xs font-semibold hover:bg-gm-primary hover:text-white transition duration-200 cursor-pointer shadow-sm"
      >
        Find More
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="chatStore.matchesList.length === 0" class="flex-grow flex flex-col items-center justify-center text-center px-8">
      <div class="w-20 h-20 rounded-full bg-gm-primary/10 flex items-center justify-center mb-4 border border-gm-primary/20">
        <svg class="w-10 h-10 text-gm-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 class="text-lg font-bold text-white mb-1">No matches yet</h3>
      <p class="text-gray-500 text-sm mb-6">Keep swiping to find your gaming duo!</p>
      <button
        @click="router.push('/discover')"
        class="px-6 py-2.5 bg-gm-primary text-white font-medium rounded-[12px] hover:bg-gm-hover hover:text-black transition duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-sm cursor-pointer"
      >
        Start Swiping
      </button>
    </div>

    <!-- Match List -->
    <div v-else class="flex-grow overflow-y-auto pb-24">
      <div class="divide-y divide-white/5">
        <MatchCard
          v-for="match in chatStore.matchesList"
          :key="match.id"
          :match="match"
        />
      </div>
    </div>
  </div>
</template>
