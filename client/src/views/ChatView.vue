<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()

const matchId = Number(route.params.matchId)
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const matchData = ref<any>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  chatStore.hasUnread = false

  if (chatStore.matchesList.length === 0) {
    await chatStore.fetchMatches()
  }
  matchData.value = chatStore.matchesList.find(m => m.id === matchId)

  await chatStore.fetchHistory(matchId)
  chatStore.initSocketListeners()
  scrollToBottom()
})

onUnmounted(() => {
  chatStore.activeMatchId = null
})

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${hours}:${mins}`
  } catch {
    return ''
  }
}

// Group messages to show time labels
const groupedMessages = computed(() => {
  return chatStore.messages.map(msg => ({
    ...msg,
    isSelf: Number(msg.sender_id) === Number(authStore.user?.id),
    time: formatTime(msg.sent_at)
  }))
})

const send = () => {
  if (!messageInput.value.trim()) return

  chatStore.sendMessage(matchId, messageInput.value)

  chatStore.messages.push({
    id: Date.now(),
    match_id: matchId,
    sender_id: authStore.user?.id || 0,
    message_content: messageInput.value.trim(),
    sent_at: new Date().toISOString()
  })

  messageInput.value = ''
  scrollToBottom()
}
</script>

<template>
  <div class="flex flex-col h-full absolute inset-0 bg-[var(--color-dark-bg)]">
    <!-- Chat Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/5 shrink-0 z-10">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/matches')"
          id="chat-back-button"
          class="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/30">
            <img :src="matchData?.target_avatar || '/placeholder-avatar.png'" class="w-full h-full object-cover" />
          </div>
          <span class="font-semibold text-white text-[15px]">{{ matchData?.target_name || 'Match' }}</span>
        </div>
      </div>

      <!-- Emoji/Info button -->
      <button class="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-2">
      <div v-if="chatStore.messages.length === 0" class="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
        <p class="text-sm">No messages yet. Say hi! 👋</p>
      </div>

      <template v-for="(msg, idx) in groupedMessages" :key="msg.id">
        <div
          class="flex w-full"
          :class="msg.isSelf ? 'justify-end' : 'justify-start'"
        >
          <div class="flex flex-col" :class="msg.isSelf ? 'items-end' : 'items-start'">
            <div
              class="max-w-[75%] px-4 py-2.5 text-[14px] leading-relaxed break-words"
              :class="[
                msg.isSelf
                  ? 'bg-[var(--color-input-bg)] text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white/[0.06] text-gray-200 rounded-2xl rounded-tl-sm border border-white/5'
              ]"
            >
              {{ msg.message_content }}
            </div>
            <span
              v-if="msg.time && (idx === groupedMessages.length - 1 || groupedMessages[idx + 1]?.isSelf !== msg.isSelf)"
              class="text-[10px] text-gray-600 mt-1 px-1"
            >
              {{ msg.time }}
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Input Box -->
    <div class="px-4 py-3 bg-white/[0.02] border-t border-white/5 shrink-0">
      <form @submit.prevent="send" class="flex gap-2 items-center max-w-lg mx-auto w-full">
        <input
          v-model="messageInput"
          type="text"
          placeholder="typing"
          @keydown.enter.prevent="send"
          class="flex-grow px-4 py-3 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-600 text-sm"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          id="chat-send-button"
          class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-30 cursor-pointer shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
}
</style>
