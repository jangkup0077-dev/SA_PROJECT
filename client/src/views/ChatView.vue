<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()

const matchId = Number(route.params.matchId)
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const matchData = ref<any>(null)
const showingUnmatchConfirm = ref(false)
const showOptionsMenu = ref(false)
const showInfo = ref(false)

// Report Modal States
const showReportModal = ref(false)
const reportTopic = ref('')
const reportDesc = ref('')
const reportImages = ref<File[]>([])
const isSubmittingReport = ref(false)
const reportFileInput = ref<HTMLInputElement | null>(null)

const reportTopics = [
  'Inappropriate Behavior / Toxicity',
  'Harassment / Hate Speech',
  'Spam / Scam / Bot',
  'Fake Profile / Catfishing',
  'Other'
]

const openReportModal = () => {
  showOptionsMenu.value = false
  showInfo.value = false
  showReportModal.value = true
}

const closeReportModal = () => {
  showReportModal.value = false
  reportTopic.value = ''
  reportDesc.value = ''
  reportImages.value = []
}

const handleReportImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files) return

  const newFiles = Array.from(target.files)
  if (reportImages.value.length + newFiles.length > 3) {
    alert('You can only upload up to 3 images as evidence.')
    return
  }

  const currentTotalSize = reportImages.value.reduce((sum, file) => sum + file.size, 0)
  const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0)
  
  if (currentTotalSize + newFilesSize > 20 * 1024 * 1024) {
    alert('Total image size cannot exceed 20MB. Please select smaller images.')
    return
  }

  reportImages.value.push(...newFiles)
  target.value = '' 
}

const removeReportImage = (index: number) => {
  reportImages.value.splice(index, 1)
}

const getObjectUrl = (file: File) => URL.createObjectURL(file)

const submitReport = async () => {
  if (!reportTopic.value) return

  isSubmittingReport.value = true
  try {
    const uploadedUrls: string[] = []
    
    for (const file of reportImages.value) {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      uploadedUrls.push(uploadRes.data.url)
    }

    await api.post('/profile/report', {
      reportedId: matchData.value?.target_id,
      reportType: reportTopic.value,
      description: reportDesc.value,
      images: uploadedUrls
    })

    alert('Your report has been submitted to the admin. Thank you for keeping the community safe.')
    closeReportModal()
    
    if(confirm('Would you like to unmatch with this user as well?')) {
      await handleUnmatch()
    }
  } catch (err) {
    console.error('Failed to submit report', err)
    alert('Failed to submit report. Please try again.')
  } finally {
    isSubmittingReport.value = false
  }
}

// Unmatch logic
const handleUnmatch = async () => {
  showOptionsMenu.value = false
  showingUnmatchConfirm.value = true
}

const confirmUnmatch = async () => {
  try {
    await api.put(`/swipe/unmatch/${matchId}`)
    router.push('/matches')
  } catch (err) {
    console.error('Failed to unmatch', err)
    alert('Could not unmatch. Please try again.')
  }
}

// Chat logic
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const closeMenu = (e: MouseEvent) => {
  if (showOptionsMenu.value && !(e.target as HTMLElement).closest('.relative')) {
    showOptionsMenu.value = false
  }
}

watch(() => chatStore.messages.length, () => {
  scrollToBottom()
})

onMounted(async () => {
  window.addEventListener('click', closeMenu)
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

  setTimeout(scrollToBottom, 100)
})

onUnmounted(() => {
  window.removeEventListener('click', closeMenu)
  chatStore.activeMatchId = null
})

const targetAge = computed(() => {
  if (!matchData.value?.target_birth_date) return ''
  const dob = new Date(matchData.value.target_birth_date)
  const ageDifMs = Date.now() - dob.getTime()
  const ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
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

const groupedMessages = computed(() => {
  const myId = Number(authStore.user?.id || (authStore.user as any)?.user_id)
  return chatStore.messages.map(msg => ({
    ...msg,
    isSelf: Number(msg.sender_id) === myId,
    time: formatTime(msg.sent_at)
  }))
})

const send = () => {
  const txt = messageInput.value.trim()
  if (!txt) return
  chatStore.sendMessage(matchId, txt)
  messageInput.value = ''
  scrollToBottom()
}

const avatarFallbackError = (e: Event) => {
  (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=User&background=random'
}
</script>

<template>
  <div class="flex flex-col h-full absolute inset-0 bg-gm-background overflow-hidden">
    <!-- Chat Header -->
    <div class="relative flex items-center justify-between px-4 py-4 bg-gm-panel border-b border-white/5 shrink-0 z-20 shadow-md">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/matches')"
          class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <router-link 
          :to="`/profile/${matchData?.target_id}`" 
          class="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <div class="relative">
            <div class="w-11 h-11 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-purple-500 to-indigo-500 group-hover:from-purple-400 group-hover:to-indigo-400 transition-all">
              <div class="w-full h-full rounded-full overflow-hidden bg-gray-900 border border-black/50">
                <img :src="matchData?.target_avatar || 'https://ui-avatars.com/api/?name=User&background=random'" @error="avatarFallbackError" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-white text-[16px] tracking-tight leading-tight group-hover:text-purple-400 transition-colors">{{ matchData?.target_name || 'Match' }}</span>
          </div>
        </router-link>
      </div>

      <div class="flex gap-2">
        <button 
          @click="showInfo = true" 
          class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Match Options & Profile"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" class="flex-grow overflow-y-auto px-4 py-6 flex flex-col gap-6 custom-scrollbar relative z-10">
      <div v-if="chatStore.messages.length === 0" class="flex-grow flex flex-col items-center justify-center text-center">
        <div class="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-4 border border-white/5">
          <span class="text-4xl">👋</span>
        </div>
        <h4 class="text-white font-bold mb-1">Start the magic</h4>
        <p class="text-gray-500 text-sm max-w-[180px]">Don't be shy! Send the first message to get things going.</p>
      </div>

      <template v-for="(msg, idx) in groupedMessages" :key="msg.id">
        <div class="flex w-full group" :class="msg.isSelf ? 'justify-end' : 'justify-start'">
          <div class="flex items-end gap-2 max-w-[85%]" :class="msg.isSelf ? 'flex-row-reverse' : 'flex-row'">
            
            <div 
              v-if="!msg.isSelf" 
              class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-sm self-end mb-1"
            >
              <img 
                :src="matchData?.target_avatar || 'https://ui-avatars.com/api/?name=User&background=random'" 
                @error="avatarFallbackError"
                class="w-full h-full object-cover" 
              />
            </div>

            <div class="flex flex-col" :class="msg.isSelf ? 'items-end' : 'items-start'">
              <div
                class="relative px-4 py-2.5 text-[15px] leading-relaxed shadow-md w-fit max-w-full whitespace-pre-wrap text-white transition duration-200"
                :class="[
                  msg.isSelf
                    ? 'bg-gm-primary rounded-[18px] rounded-br-[4px]'
                    : 'bg-gm-panel rounded-[18px] rounded-bl-[4px] border border-white/5'
                ]"
              >
                {{ msg.message_content }}
              </div>
              <div v-if="msg.time && (idx === groupedMessages.length - 1 || groupedMessages[idx + 1]?.isSelf !== msg.isSelf)" 
                   class="flex items-center gap-1.5 mt-1.5 px-0.5 text-[10px] font-semibold text-gray-500/80 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{{ msg.time }}</span>
                <svg v-if="msg.isSelf" class="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="px-4 py-6 bg-gm-background shrink-0 relative z-20">
      <div v-if="authStore.user?.is_suspended" class="max-w-2xl mx-auto mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
        <svg class="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <p class="text-xs font-bold text-red-400">Account Restricted: You cannot send messages while suspended.</p>
      </div>
      <form @submit.prevent="send" class="relative max-w-2xl mx-auto group" :class="{ 'opacity-50 pointer-events-none': authStore.user?.is_suspended }">
        <div class="relative flex items-center gap-2 bg-gm-panel border border-transparent focus-within:border-gm-hover transition duration-200 rounded-[24px] p-2 pl-5 pr-2 shadow-lg">
          <input
            v-model="messageInput"
            type="text"
            :placeholder="authStore.user?.is_suspended ? 'Messaging disabled' : 'Write a message...'"
            :disabled="authStore.user?.is_suspended"
            class="flex-grow bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm py-2"
          />
          <button
            type="submit"
            :disabled="!messageInput.trim() || authStore.user?.is_suspended"
            class="w-10 h-10 rounded-2xl flex items-center justify-center bg-gm-primary text-white shadow-md transition duration-200 hover:bg-gm-hover hover:text-black active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <svg class="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>

    <!-- Modals -->

    <!-- Info Profile Drawer -->
    <Transition name="fade">
      <div 
        v-if="showInfo" 
        class="fixed inset-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
        @click.self="showInfo = false"
      >
        <div class="w-full max-w-sm bg-gm-panel border border-transparent rounded-[12px] p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative scale-in">
          <button 
            @click="showInfo = false" 
            class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div class="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-purple-500/30 mb-4 bg-[var(--color-input-bg)] shadow-[0_0_20px_rgba(124,58,237,0.15)]">
            <img :src="matchData?.target_avatar || 'https://ui-avatars.com/api/?name=User&background=random'" @error="avatarFallbackError" class="w-full h-full object-cover" />
          </div>

          <h3 class="text-xl font-bold text-center text-white flex items-center justify-center gap-2">
            {{ matchData?.target_name || 'Match' }}
            <span v-if="targetAge" class="text-gray-400 font-normal text-lg">{{ targetAge }}</span>
          </h3>

          <div class="mt-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 min-h-[60px] flex items-center justify-center">
            <p class="text-sm text-gray-300 leading-relaxed text-center">
              {{ matchData?.target_bio || 'No bio provided.' }}
            </p>
          </div>

          <div class="mt-5 mb-8">
            <p class="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Interested Games</p>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="game in (matchData?.target_games || [])" 
                :key="game.id" 
                class="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-semibold"
              >
                {{ game.name }}
              </span>
              <span v-if="!matchData?.target_games?.length" class="text-xs text-gray-500">No games selected.</span>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button 
              @click="handleUnmatch" 
              class="w-full py-3 bg-white/5 text-white font-semibold rounded-[12px] border border-transparent hover:bg-gm-hover hover:text-black transition duration-200 cursor-pointer text-sm shadow-md"
            >
              Unmatch
            </button>
            <button 
              @click="openReportModal" 
              class="w-full py-3 bg-gm-danger text-white font-bold rounded-[12px] border border-transparent hover:brightness-110 transition duration-200 cursor-pointer text-sm shadow-md"
            >
              Report User
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Unmatch Confirmation Modal -->
    <Transition name="fade">
      <div v-if="showingUnmatchConfirm" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
        <div class="bg-gm-panel border border-transparent p-8 rounded-[12px] w-full max-w-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] scale-in">
          <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-gm-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-2xl font-black text-white text-center mb-3">Break the link?</h3>
          <p class="text-gray-400 text-sm text-center mb-8 leading-relaxed px-2">
            This will permanently remove <b>{{ matchData?.target_name }}</b> from your matches and delete the conversation.
          </p>
          <div class="flex flex-col gap-3">
            <button 
              @click="confirmUnmatch"
              class="w-full py-3 rounded-[12px] bg-gm-danger text-white font-bold hover:brightness-110 transition duration-200 active:scale-95 cursor-pointer shadow-md"
            >
              Unmatch Now
            </button>
            <button 
              @click="showingUnmatchConfirm = false"
              class="w-full py-3 rounded-[12px] bg-white/5 text-white font-semibold hover:bg-gm-hover hover:text-black transition duration-200 cursor-pointer"
            >
              Actually, wait
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Report Modal -->
    <Transition name="fade">
      <div v-if="showReportModal" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md" @click.self="closeReportModal">
        <div class="bg-gm-panel border border-transparent p-8 rounded-[12px] w-full max-w-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] scale-in max-h-[90vh] overflow-y-auto relative">
          <button 
            @click="closeReportModal" 
            class="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div class="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-2xl font-black text-white text-center mb-3">Report User</h3>
          <p class="text-gray-400 text-sm text-center mb-6 px-2">
            Tell us why you are reporting <b>{{ matchData?.target_name }}</b>. Your safety is our priority.
          </p>
          
          <div class="space-y-4 mb-8">
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Topic <span class="text-red-400">*</span></label>
              <select 
                v-model="reportTopic"
                class="w-full px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-red-500 transition-all text-white text-sm"
              >
                <option value="" disabled class="bg-gray-900 text-gray-500">Select a reason...</option>
                <option v-for="topic in reportTopics" :key="topic" :value="topic" class="bg-gray-900 text-white">{{ topic }}</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 pt-2">Evidence (Max 3)</label>
              <div class="flex flex-wrap gap-3">
                <div 
                  v-for="(file, idx) in reportImages" 
                  :key="idx" 
                  class="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group bg-black"
                >
                  <img :src="getObjectUrl(file)" class="w-full h-full object-cover opacity-80" />
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button @click="removeReportImage(idx)" class="w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center cursor-pointer border-none outline-none">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                <div 
                  v-if="reportImages.length < 3"
                  @click="() => reportFileInput?.click()"
                  class="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 hover:border-red-500/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-gray-500"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span class="text-[10px] font-medium">Add Image</span>
                </div>
                
                <input ref="reportFileInput" type="file" accept="image/*" multiple class="hidden" @change="handleReportImageUpload" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 pt-2">Additional Details</label>
              <textarea 
                v-model="reportDesc"
                placeholder="Provide more context..."
                class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500 transition-colors h-24 resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <button 
              @click="submitReport"
              :disabled="!reportTopic || isSubmittingReport"
              class="w-full py-3 rounded-[12px] bg-gm-primary text-white font-bold hover:bg-gm-hover hover:text-black transition duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {{ isSubmittingReport ? 'Uploading Evidence...' : 'Submit Report' }}
            </button>
            <button 
              @click="closeReportModal"
              class="w-full py-3 rounded-[12px] bg-white/5 text-white font-semibold hover:bg-gm-hover hover:text-black transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.1);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.1; transform: scale(1); }
  50% { opacity: 0.15; transform: scale(1.1); }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

/* Fix dropdown options being translucent */
select option {
  background-color: var(--color-dark-bg);
  color: white;
}
</style>
