<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSwipeStore } from '@/stores/swipe'

const props = defineProps<{
  matchData: {
    userId: number
    matchId: number
    avatar: string
    name: string
  }
}>()

const router = useRouter()
const swipeStore = useSwipeStore()

const handleStartChat = () => {
  swipeStore.clearMatch()
  router.push(`/chat/${props.matchData.matchId}`)
}

const handleKeepSwiping = () => {
  swipeStore.clearMatch()
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
    <div class="w-full max-w-sm bg-[var(--color-dark-bg)] border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_60px_rgba(124,58,237,0.3)] transform transition-transform duration-300 scale-100">
      
      <div class="w-full text-center mb-8">
        <h2 class="text-4xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
          IT'S A MATCH!
        </h2>
        <p class="text-gray-400 mt-2 text-sm">You and {{ matchData.name }} liked each other</p>
      </div>

      <div class="flex items-center justify-center gap-4 mb-10">
        <!-- Optional: Show current user's avatar ideally, but here just showing the matched user -->
        <div class="w-28 h-28 rounded-full border-4 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)] overflow-hidden">
          <img :src="matchData.avatar || '/placeholder-avatar.png'" alt="Avatar" class="w-full h-full object-cover" />
        </div>
      </div>

      <div class="w-full space-y-3">
        <button 
          @click="handleStartChat"
          class="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:-translate-y-1 transition-all shadow-lg shadow-emerald-500/30"
        >
          Send a Message
        </button>
        <button 
          @click="handleKeepSwiping"
          class="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors"
        >
          Keep Swiping
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
