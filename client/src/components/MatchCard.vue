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
    class="w-full flex items-center gap-4 px-5 py-4 bg-transparent hover:bg-gm-panel transition duration-200 text-left cursor-pointer"
  >
    <!-- Avatar -->
    <div 
      class="relative shrink-0 cursor-pointer hover:scale-105 transition-transform"
      @click.stop="router.push(`/profile/${match.partner_id}`)"
    >
      <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500/30 bg-gray-800">
        <img
          :src="match.target_avatar || '/placeholder-avatar.png'"
          @error="(e: Event) => (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User&background=random'"
          class="w-full h-full object-cover"
        />
      </div>
      
      <!-- Online Indicator -->
      <div 
        v-if="match.is_online" 
        class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F1428] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      ></div>
    </div>
    
    <!-- Info -->
    <div class="flex-1 min-w-0 flex flex-col justify-center">
      <div class="flex items-center gap-2 mb-1">
        <h4 class="text-[15px] font-bold text-white truncate leading-tight">{{ match.target_name || 'Match' }}</h4>
      </div>
      <p class="text-sm text-gray-500 truncate mt-0.5">
        {{ match.lastMessage || "You've matched! Send a message now 💬" }}
      </p>
    </div>

    <!-- Unread Badge or Chevron -->
    <div class="shrink-0 flex items-center gap-3">
      <!-- Small Avatar for large screens -->
      <div class="hidden sm:block shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 border-white/5 ml-2 opacity-50 group-hover:opacity-100 transition-opacity">
        <img 
          :src="match.target_avatar || 'https://ui-avatars.com/api/?name=User&background=random'" 
          class="w-full h-full object-cover"
        />
      </div>

      <button
        @click.stop="handleUnmatch"
        class="p-2 rounded-xl text-gray-500 hover:text-gm-danger hover:bg-white/5 transition duration-200 cursor-pointer"
        title="Unmatch"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </button>

      <span
        v-if="match.unreadCount"
        class="flex h-5 min-w-5 items-center justify-center rounded-full bg-gm-primary text-[10px] font-bold text-white px-1.5"
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
    <div class="bg-gm-panel border border-transparent p-6 rounded-[12px] w-full max-w-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <h3 class="text-xl font-bold text-white mb-2">Unmatch User?</h3>
      <p class="text-gray-400 text-sm mb-6">
        This will permanently remove your connection with <b>{{ match.target_name }}</b>.
      </p>
      <div class="flex gap-3">
        <button @click="showingConfirm = false" class="flex-1 py-3 rounded-[12px] bg-white/5 text-gray-400 font-semibold hover:bg-gm-hover hover:text-black transition duration-200 cursor-pointer">Cancel</button>
        <button @click="confirmUnmatch" class="flex-1 py-3 rounded-[12px] bg-gm-danger text-white font-bold hover:brightness-110 transition duration-200 cursor-pointer shadow-md">Unmatch</button>
      </div>
    </div>
  </div>
</template>
