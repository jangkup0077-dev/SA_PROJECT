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
    <div class="w-full max-w-sm bg-gm-panel border border-white/10 rounded-[12px] p-8 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] transform transition-transform duration-300 scale-100">
      
      <div class="w-full text-center mb-8">
        <h2 class="text-4xl font-black italic tracking-wider text-gm-hover">
          IT'S A MATCH!
        </h2>
        <p class="text-gray-400 mt-2 text-sm">You and {{ matchData.name }} liked each other</p>
      </div>

      <div class="flex items-center justify-center gap-4 mb-10">
        <!-- Optional: Show current user's avatar ideally, but here just showing the matched user -->
        <div class="w-28 h-28 rounded-full border-4 border-gm-primary shadow-lg overflow-hidden">
          <img :src="matchData.avatar || 'https://ui-avatars.com/api/?name=User&background=random'" @error="(e: Event) => (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User&background=random'" alt="Avatar" class="w-full h-full object-cover" />
        </div>
      </div>

      <div class="w-full space-y-3">
        <button 
          @click="handleStartChat"
          class="w-full py-4 bg-gm-primary text-white font-bold rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-gm-hover hover:text-black transition duration-200"
        >
          Send a Message
        </button>
        <button 
          @click="handleKeepSwiping"
          class="w-full py-4 bg-white/5 border border-transparent text-white font-bold rounded-[12px] hover:bg-gm-hover hover:text-black transition duration-200"
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
