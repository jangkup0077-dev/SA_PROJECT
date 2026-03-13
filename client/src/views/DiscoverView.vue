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
    <div class="flex-grow w-full max-w-lg relative h-full p-3 pt-4">
      <SwipeDeck class="absolute inset-3" />
    </div>

    <!-- Bottom Action Buttons -->
    <div
      v-if="swipeStore.profiles.length > 0"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30"
      :class="{ 'opacity-30 pointer-events-none': authStore.user?.is_suspended }"
    >
      <!-- PASS Button -->
      <div class="flex flex-col items-center gap-1.5">
        <button
          @click="triggerLeft"
          :disabled="authStore.user?.is_suspended"
          id="swipe-reject-button"
          class="w-[68px] h-[68px] rounded-full bg-gm-background border border-white/10 flex items-center justify-center text-gm-danger hover:bg-gm-danger hover:text-white transition duration-200 shadow-xl active:scale-90 cursor-pointer"
        >
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pass</span>
      </div>

      <!-- LIKE Button -->
      <div class="flex flex-col items-center gap-1.5">
        <button
          @click="triggerRight"
          :disabled="authStore.user?.is_suspended"
          id="swipe-like-button"
          class="w-[68px] h-[68px] rounded-full bg-gm-background border border-white/10 flex items-center justify-center text-gm-primary hover:bg-gm-hover hover:text-black transition duration-200 shadow-xl active:scale-90 cursor-pointer"
        >
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <span class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Like</span>
      </div>
    </div>

    <!-- Suspension Overlay -->
    <div 
      v-if="authStore.user?.is_suspended" 
      class="absolute inset-x-0 bottom-24 p-6 z-50 pointer-events-none"
    >
      <div class="bg-red-500/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm mx-auto border border-white/20">
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <p class="font-black text-sm uppercase italic">Account Restricted</p>
          <p class="text-xs font-medium opacity-90 mt-0.5 leading-tight">Your account is suspended. Discover and swiping features have been disabled.</p>
        </div>
      </div>
    </div>

    <!-- Match Modal Overlay -->
    <MatchModal
      v-if="swipeStore.matchTriggered"
      :matchData="swipeStore.matchTriggered"
    />
  </div>
</template>
