<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  match: {
    id: number
    target_name: string
    target_avatar: string
    lastMessage?: string
    unreadCount?: number
  }
}>()

const router = useRouter()

const goToChat = () => {
  router.push(`/chat/${props.match.id}`)
}
</script>

<template>
  <button
    @click="goToChat"
    class="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
  >
    <!-- Avatar -->
    <div class="relative shrink-0">
      <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30">
        <img :src="match.target_avatar || '/placeholder-avatar.png'" class="w-full h-full object-cover" />
      </div>
      <!-- Online dot -->
      <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--color-dark-bg)]"></div>
    </div>

    <!-- Text Content -->
    <div class="flex-grow overflow-hidden min-w-0">
      <h3 class="font-semibold text-white text-[15px] truncate">{{ match.target_name || 'Match' }}</h3>
      <p class="text-sm text-gray-500 truncate mt-0.5">
        {{ match.lastMessage || "You've matched! Send a message now" }}
      </p>
    </div>

    <!-- Unread Badge or Chevron -->
    <div class="shrink-0">
      <span
        v-if="match.unreadCount"
        class="flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white px-1.5"
      >
        {{ match.unreadCount }}
      </span>
      <svg v-else class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  </button>
</template>
