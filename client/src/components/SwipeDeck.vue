<script setup lang="ts">
import { computed } from 'vue'
import SwipeCard from './SwipeCard.vue'
import { useSwipeStore } from '@/stores/swipe'

const swipeStore = useSwipeStore()

const visibleProfiles = computed(() => {
  return swipeStore.profiles.slice(0, 3).reverse()
})

const handleSwipe = (direction: 'LEFT' | 'RIGHT', profileId: number) => {
  swipeStore.registerSwipe(profileId, direction === 'RIGHT' ? 'LIKE' : 'SKIP')
  swipeStore.removeTopProfile()
}

const refreshProfiles = async () => {
  await swipeStore.fetchProfiles()
}
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Loading -->
    <div v-if="swipeStore.loading" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gm-background rounded-[12px]">
      <div class="w-14 h-14 border-4 border-gm-primary/30 border-t-gm-primary rounded-full animate-spin mb-4"></div>
      <p class="text-sm font-medium">Finding players near you...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="swipeStore.profiles.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gm-background p-8 text-center rounded-[12px] border border-white/5">
      <div class="w-24 h-24 rounded-full bg-gm-primary/10 flex items-center justify-center mb-5 border border-gm-primary/20">
        <svg class="w-12 h-12 text-gm-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">No more profiles!</h3>
      <p class="text-sm text-gray-500 mb-6">You've swiped through all available players.<br/>Check back later or refresh!</p>
      <button
        @click="refreshProfiles"
        class="px-6 py-2.5 bg-gm-primary text-white font-semibold rounded-[12px] hover:bg-gm-hover hover:text-black transition duration-200 shadow-md text-sm cursor-pointer active:scale-95"
      >
        <span class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </span>
      </button>
    </div>

    <!-- Card Stack -->
    <template v-else>
      <SwipeCard
        v-for="(profile, index) in visibleProfiles"
        :key="profile.id"
        :profile="profile"
        :isActive="index === visibleProfiles.length - 1"
        @swiped="handleSwipe"
        :style="{
          zIndex: index,
          transform: index < visibleProfiles.length - 1
            ? `scale(${1 - (visibleProfiles.length - 1 - index) * 0.05}) translateY(${(visibleProfiles.length - 1 - index) * 12}px)`
            : undefined,
          opacity: index < visibleProfiles.length - 1 ? 0.7 : 1,
          transition: 'transform 0.3s ease, opacity 0.3s ease'
        }"
      />
    </template>
  </div>
</template>
