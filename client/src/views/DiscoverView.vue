<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SwipeDeck from '@/components/SwipeDeck.vue'
import MatchModal from '@/components/MatchModal.vue'
import { useSwipeStore } from '@/stores/swipe'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const swipeStore = useSwipeStore()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (swipeStore.profiles.length === 0) {
    await swipeStore.fetchProfiles()
  }
})

const triggerLeft = () => {
  const top = swipeStore.profiles[0]
  if (top) {
    swipeStore.registerSwipe(top.id, 'SKIP')
    swipeStore.removeTopProfile()
  }
}

const triggerRight = () => {
  const top = swipeStore.profiles[0]
  if (top) {
    swipeStore.registerSwipe(top.id, 'LIKE')
    swipeStore.removeTopProfile()
  }
}
</script>

<template>
  <div class="flex-grow flex flex-col items-center relative overflow-hidden h-full">
    <!-- Full-height Card Area -->
    <div class="flex-grow w-full max-w-lg relative h-full">
      <SwipeDeck class="absolute inset-0" />
    </div>

    <!-- Bottom Action Buttons — overlaid on the card -->
    <div
      v-if="swipeStore.profiles.length > 0"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 z-30"
    >
      <button
        @click="triggerLeft"
        id="swipe-reject-button"
        class="w-16 h-16 rounded-full bg-[rgba(15,20,40,0.7)] backdrop-blur-md border border-white/10 flex items-center justify-center text-purple-400 hover:text-purple-300 hover:border-purple-500/40 transition-all shadow-xl active:scale-90 cursor-pointer"
      >
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        @click="triggerRight"
        id="swipe-like-button"
        class="w-16 h-16 rounded-full bg-[rgba(15,20,40,0.7)] backdrop-blur-md border border-white/10 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:border-rose-500/40 transition-all shadow-xl active:scale-90 cursor-pointer"
      >
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    </div>

    <!-- Match Modal Overlay -->
    <MatchModal
      v-if="swipeStore.matchTriggered"
      :matchData="swipeStore.matchTriggered"
    />
  </div>
</template>
