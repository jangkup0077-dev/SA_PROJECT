<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores/chat'

const props = defineProps<{
  match: {
    id: number
    partner_id: number
    target_name: string
    target_avatar: string
    is_online: boolean
    last_active_at?: string
    lastMessage?: string
    unreadCount?: number
    matched_at?: string
  }
}>()

const router = useRouter()
const chatStore = useChatStore()
const showingConfirm = ref(false)

const handleUnmatch = () => {
  showingConfirm.value = true
}

const confirmUnmatch = async () => {
  try {
    await chatStore.unmatch(props.match.id)
    showingConfirm.value = false
  } catch (err) {
    alert('Failed to unmatch')
  }
}

const goToChat = () => {
  router.push(`/chat/${props.match.id}`)
}

const onImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = '/placeholder-avatar.png'
}

const timeAgo = computed(() => {
  return ''
})
</script>

<template>
  <button
    @click="goToChat"
    class="w-full flex items-center gap-4 px-5 py-4 bg-[rgba(255,255,255,0.03)] hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
  >
    <!-- Avatar -->
    <div 
      class="relative shrink-0 cursor-pointer hover:scale-105 transition-transform"
      @click.stop="router.push(`/profile/${match.partner_id}`)"
    >
      <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500/30 bg-gray-800">
        <img
          :src="match.target_avatar || '/placeholder-avatar.png'"
          @error="onImgError"
          class="w-full h-full object-cover"
        />
      </div>
    </div>

    <!-- Text Content -->
    <div class="flex-grow overflow-hidden min-w-0">
      <div class="flex items-baseline justify-between gap-2">
        <h3 class="font-semibold text-white text-[15px] truncate">{{ match.target_name || 'Match' }}</h3>
      </div>
      <p class="text-sm text-gray-500 truncate mt-0.5">
        {{ match.lastMessage || "You've matched! Send a message now 💬" }}
      </p>
    </div>

    <!-- Unread Badge or Chevron -->
    <div class="shrink-0 flex items-center gap-3">
      <button
        @click.stop="handleUnmatch"
        class="p-2 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
        title="Unmatch"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </button>

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

  <!-- Confirm Modal -->
  <div v-if="showingConfirm" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
    <div class="bg-[#0B0F1A] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
      <h3 class="text-xl font-bold text-white mb-2">Unmatch User?</h3>
      <p class="text-gray-400 text-sm mb-6">
        This will permanently remove your connection with <b>{{ match.target_name }}</b>.
      </p>
      <div class="flex gap-3">
        <button @click="showingConfirm = false" class="flex-1 py-3 rounded-2xl bg-white/5 text-gray-400 font-semibold hover:bg-white/10 cursor-pointer">Cancel</button>
        <button @click="confirmUnmatch" class="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-500 cursor-pointer">Unmatch</button>
      </div>
    </div>
  </div>
</template>
