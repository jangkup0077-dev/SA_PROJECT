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
</script>

<template>
  <div class="relative w-full h-full">
    <div v-if="swipeStore.loading" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-[var(--color-input-bg)]">
      <div class="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
      <p class="text-sm">Finding players near you...</p>
    </div>

    <div v-else-if="swipeStore.profiles.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-[var(--color-input-bg)] p-6 text-center">
      <div class="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
        <svg class="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">No more profiles!</h3>
      <p class="text-sm">You've swiped through all available players. Check back later!</p>
    </div>

    <template v-else>
      <SwipeCard
        v-for="(profile, index) in visibleProfiles"
        :key="profile.id"
        :profile="profile"
        :isActive="index === visibleProfiles.length - 1"
        @swiped="handleSwipe"
        :style="{
          zIndex: index
        }"
      />
    </template>
  </div>
</template>
