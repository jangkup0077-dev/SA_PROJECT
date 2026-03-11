<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { getSocket } from '@/services/socket'
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
const showingReportModal = ref(false)
const reportReason = ref('')
const reportDetails = ref('')
const isSubmittingReport = ref(false)
const reportMediaFile = ref<File | null>(null)
const reportMediaPreview = ref('')
const isUploadingReportMedia = ref(false)

const handleUnmatch = () => {
  showOptionsMenu.value = false
  showingUnmatchConfirm.value = true
}

const handleReportRequest = () => {
  showOptionsMenu.value = false
  showingReportModal.value = true
}

const handleReportMediaFile = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    reportMediaFile.value = file
    reportMediaPreview.value = URL.createObjectURL(file)
  }
}

const removeReportMedia = () => {
  reportMediaFile.value = null
  reportMediaPreview.value = ''
}

const submitReport = async () => {
  if (!reportReason.value) return
  
  isSubmittingReport.value = true
  try {
    let mediaUrl = ''

    // Upload media if attached
    if (reportMediaFile.value) {
      isUploadingReportMedia.value = true
      const formData = new FormData()
      formData.append('file', reportMediaFile.value)
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      mediaUrl = uploadRes.data.url || uploadRes.data.imageUrl || ''
      isUploadingReportMedia.value = false
    }

    await api.post('/reports', {
      reportedUserId: matchData.value?.target_id,
      reason: reportReason.value,
      description: reportDetails.value,
      mediaUrl: mediaUrl || undefined
    })
    alert('Report submitted successfully. We will review it shortly.')
    showingReportModal.value = false
    reportReason.value = ''
    reportDetails.value = ''
    reportMediaFile.value = null
    reportMediaPreview.value = ''
  } catch (err) {
    alert('Failed to submit report. Please try again.')
  } finally {
    isSubmittingReport.value = false
    isUploadingReportMedia.value = false
  }
}

const confirmUnmatch = async () => {
  try {
    await chatStore.unmatch(matchId)
    router.push('/matches')
  } catch (err) {
    alert('Failed to unmatch. Please try again.')
  }
}

const showInfo = ref(false)

// ==========================================
// Report
// ==========================================
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
  target.value = '' // ล้างค่า input ให้กดเลือกรูปเดิมซ้ำได้
}

const removeReportImage = (index: number) => {
  reportImages.value.splice(index, 1)
}

const submitReport = async () => {
  if (!reportTopic.value) return

  isSubmittingReport.value = true
  try {
    const uploadedUrls: string[] = []
    
    for (const file of reportImages.value) {
      const formData = new FormData()
      formData.append('image', file)
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      uploadedUrls.push(uploadRes.data.imageUrl)
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
      handleUnmatch()
    }
  } catch (err) {
    console.error('Failed to submit report', err)
    alert('Failed to submit report. Please try again.')
  } finally {
    isSubmittingReport.value = false
  }
}

// ==========================================
// Chat
// ==========================================
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
  const currentUserId = authStore.user?.id || (authStore.user as any)?.user_id
  return chatStore.messages.map(msg => ({
    ...msg,
    isSelf: Number(msg.sender_id) === Number(currentUserId),
  const myId = Number(authStore.user?.id || (authStore.user as any)?.user_id)
  return chatStore.messages.map(msg => ({
    ...msg,
    isSelf: Number(msg.sender_id) === myId,
    time: formatTime(msg.sent_at)
  }))
})

const openImage = (url: string) => {
  window.open(url, '_blank')
}

const send = () => {
  if (!messageInput.value.trim()) return

  chatStore.sendMessage(matchId, messageInput.value)

  chatStore.sendMessage(matchId, messageInput.value.trim())
  messageInput.value = ''
  scrollToBottom()
}

const handleUnmatch = async () => {
  if (!confirm('Are you sure you want to unmatch? This action cannot be undone.')) return
  try {
    await api.put(`/swipe/unmatch/${matchId}`)
    router.push('/matches')
  } catch (err) {
    console.error('Failed to unmatch', err)
    alert('Could not unmatch. Please try again.')
  }
}

// Helper สร้าง URL สำหรับ Preview รูปก่อนอัปโหลด
const getObjectUrl = (file: File) => URL.createObjectURL(file)
</script>

<template>
  <div class="flex flex-col h-full absolute inset-0 bg-[#0A0D14] overflow-hidden">
    <!-- Animated Background Pulse -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 1s"></div>

    <!-- Chat Header -->
    <div class="relative flex items-center justify-between px-4 py-4 bg-white/[0.02] backdrop-blur-xl border-b border-white/5 shrink-0 z-20">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/matches')"
          class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
  <div class="flex flex-col h-full absolute inset-0 bg-[var(--color-dark-bg)]">
    <div class="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/5 shrink-0 z-10">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/matches')"
          class="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              <div class="w-full h-full rounded-full overflow-hidden bg-gray-900">
                <img :src="matchData?.target_avatar || '/placeholder-avatar.png'" class="w-full h-full object-cover" />
              </div>
            </div>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/30 bg-[var(--color-input-bg)]">
            <img :src="matchData?.target_avatar || '/placeholder-avatar.png'" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-white text-[16px] tracking-tight leading-tight group-hover:text-purple-400 transition-colors">{{ matchData?.target_name || 'Match' }}</span>
          </div>
        </router-link>
      </div>

      <div class="relative">
        <button 
          @click="showOptionsMenu = !showOptionsMenu"
          class="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <Transition name="fade">
          <div v-if="showOptionsMenu" 
               @click.away="showOptionsMenu = false"
               class="absolute right-0 mt-2 w-48 py-2 bg-[#1A1F2E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[60]">
            <button 
              @click="handleReportRequest"
              class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors"
            >
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report User
            </button>
            <div class="h-px bg-white/5 mx-2 my-1"></div>
            <button 
              @click="handleUnmatch"
              class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/5 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Unmatch
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <Transition name="fade">
      <div v-if="showingUnmatchConfirm" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
        <div class="bg-[#121620] border border-white/10 p-8 rounded-[32px] w-full max-w-sm shadow-2xl scale-in">
          <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              class="w-full py-4 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-900/20"
            >
              Unmatch Now
            </button>
            <button 
              @click="showingUnmatchConfirm = false"
              class="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-semibold hover:bg-white/10 transition-all cursor-pointer"
            >
              Actually, wait
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Report Modal -->
    <Transition name="fade">
      <div v-if="showingReportModal" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
        <div class="bg-[#121620] border border-white/10 p-8 rounded-[32px] w-full max-w-md shadow-2xl scale-in">
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
            <div class="flex flex-wrap gap-2 justify-center">
              <button 
                v-for="reason in ['Harassment', 'Spam', 'Fake Profile', 'Inappropriate Content', 'Other']"
                :key="reason"
                @click="reportReason = reason"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                :class="reportReason === reason 
                  ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'"
              >
                {{ reason }}
              </button>
            </div>
            
            <textarea 
              v-model="reportDetails"
              placeholder="Provide more details (optional)..."
              class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500 transition-colors h-24 resize-none"
            ></textarea>

            <!-- Media Evidence Upload -->
            <div>
              <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Attach Evidence (optional)</label>
              <div v-if="!reportMediaPreview" class="relative">
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  @change="handleReportMediaFile"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div class="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-dashed border-white/20 rounded-2xl text-gray-400 text-sm hover:bg-white/10 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Upload image or video</span>
                </div>
              </div>
              <div v-else class="relative rounded-2xl overflow-hidden border border-white/10">
                <img v-if="reportMediaFile?.type.startsWith('image')" :src="reportMediaPreview" class="w-full h-32 object-cover" />
                <video v-else :src="reportMediaPreview" class="w-full h-32 object-cover" />
                <button @click="removeReportMedia" class="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <button 
              @click="submitReport"
              :disabled="!reportReason || isSubmittingReport"
              class="w-full py-4 rounded-2xl bg-amber-500 text-black font-extrabold hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale cursor-pointer shadow-lg shadow-amber-900/20"
            >
              {{ isSubmittingReport ? 'Submitting...' : 'Submit Report' }}
            </button>
            <button 
              @click="showingReportModal = false"
              class="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-semibold hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-grow overflow-y-auto px-4 py-6 flex flex-col gap-6 custom-scrollbar relative z-10">
      <div v-if="chatStore.messages.length === 0" class="flex-grow flex flex-col items-center justify-center text-center">
        <div class="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
          <span class="text-4xl">👋</span>
        </div>
        <h4 class="text-white font-bold mb-1">Start the magic</h4>
        <p class="text-gray-500 text-sm max-w-[180px]">Don't be shy! Send the first message to get things going.</p>
      </div>

      <template v-for="(msg, idx) in groupedMessages" :key="msg.id">
        <div class="flex w-full group" :class="msg.isSelf ? 'justify-end' : 'justify-start'">
          <div class="flex items-end gap-2 max-w-[85%]" :class="msg.isSelf ? 'flex-row-reverse' : 'flex-row'">
            <!-- Avatar (Small Messenger Style) -->
            <div 
              v-if="!msg.isSelf" 
              class="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-sm self-end mb-1"
      <button 
        @click="showInfo = true" 
        class="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
    </div>

    <div ref="messagesContainer" class="flex-grow overflow-y-auto px-4 py-4 flex flex-col gap-2">
      <div v-if="chatStore.messages.length === 0" class="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
        <p class="text-sm">No messages yet. Say hi! 👋</p>
      </div>

      <template v-for="(msg, idx) in groupedMessages" :key="msg.id">
        <div class="flex w-full" :class="msg.isSelf ? 'justify-end' : 'justify-start'">
          <div class="flex flex-col max-w-[75%]" :class="msg.isSelf ? 'items-end' : 'items-start'">
            <div
              class="px-[18px] py-[14px] text-[15px] text-left leading-[1.5] shadow-[0_2px_6px_rgba(0,0,0,0.03)] whitespace-pre-wrap [word-break:break-word]"
              :class="[
                msg.isSelf
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-[18px] rounded-br-[4px]'
                  : 'bg-white/[0.08] text-gray-100 rounded-[18px] rounded-bl-[4px] border border-white/[0.05]'
              ]"
            >
              <img 
                :src="matchData?.target_avatar || '/placeholder-avatar.png'" 
                class="w-full h-full object-cover" 
              />
            </div>

            <div class="flex flex-col" :class="msg.isSelf ? 'items-end' : 'items-start'">
              <div
                class="relative px-4 py-2.5 text-[15px] leading-relaxed shadow-xl transition-all w-fit max-w-full"
                style="word-wrap: break-word; white-space: pre-wrap; min-width: 50px;"
                :class="[
                  msg.isSelf
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl rounded-br-sm'
                    : 'bg-white/[0.08] backdrop-blur-md text-gray-100 rounded-2xl rounded-bl-sm border border-white/5'
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

    <!-- Input Bar -->
    <div class="px-4 py-6 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/95 to-transparent shrink-0 relative z-20">
      <form @submit.prevent="send" class="relative max-w-2xl mx-auto group">
        <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[24px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
        <div class="relative flex items-center gap-2 bg-[#161B28]/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 pl-5 pr-2">
          <input
            v-model="messageInput"
            type="text"
            placeholder="Write a message..."
            class="flex-grow bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm py-2"
          />
          <button
            type="submit"
            :disabled="!messageInput.trim()"
            class="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-110 active:scale-90 disabled:grayscale disabled:opacity-30 cursor-pointer"
          >
            <svg class="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
    <div class="px-4 py-3 bg-white/[0.02] border-t border-white/5 shrink-0">
      <form @submit.prevent="send" class="flex gap-2 items-center max-w-lg mx-auto w-full">
        <input
          v-model="messageInput"
          type="text"
          placeholder="Message..."
          @keydown.enter.prevent="send"
          class="flex-grow px-4 py-3 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-400 text-sm transition-all"
        />
        <button
          type="submit"
          :disabled="!messageInput.trim()"
          class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-500 transition-colors disabled:opacity-30 disabled:bg-white/10 disabled:text-gray-500 cursor-pointer shrink-0"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19V5m-7 7l7-7 7 7" />
          </svg>
        </button>
      </form>
    </div>

    <div 
      v-if="showInfo" 
      class="fixed inset-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" 
      @click.self="showInfo = false"
    >
      <div class="w-full max-w-sm bg-[var(--color-dark-bg)] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl relative">
        <button 
          @click="showInfo = false" 
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-purple-500/30 mb-4 bg-[var(--color-input-bg)] shadow-[0_0_20px_rgba(124,58,237,0.15)]">
          <img :src="matchData?.target_avatar || '/placeholder-avatar.png'" class="w-full h-full object-cover" />
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
            class="w-full py-3 bg-white/5 text-gray-400 font-bold rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-sm"
          >
            Unmatch
          </button>
          <button 
            @click="openReportModal" 
            class="w-full py-3 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer text-sm"
          >
            Report User
          </button>
        </div>
      </div>
    </div>

    <div 
      v-if="showReportModal" 
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      @click.self="closeReportModal"
    >
      <div class="w-full max-w-sm bg-[var(--color-dark-bg)] border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          @click="closeReportModal" 
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 class="text-xl font-bold text-white mb-1">Report User</h2>
        <p class="text-sm text-gray-400 mb-6">Tell us what happened with {{ matchData?.target_name }}.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Topic <span class="text-red-400">*</span></label>
            <select 
              v-model="reportTopic"
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-white text-sm"
            >
              <option value="" disabled>Select a reason...</option>
              <option v-for="topic in reportTopics" :key="topic" :value="topic">{{ topic }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Evidence (Max 3)</label>
            <div class="flex flex-wrap gap-3">
              <div 
                v-for="(file, idx) in reportImages" 
                :key="idx" 
                class="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group bg-black"
              >
                <img :src="getObjectUrl(file)" class="w-full h-full object-cover opacity-80" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button @click="removeReportImage(idx)" class="w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center cursor-pointer">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <button 
                v-if="reportImages.length < 3"
                @click="() => reportFileInput?.click()"
                class="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 hover:border-red-500/50 hover:bg-white/5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-gray-500"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span class="text-[10px] font-medium">Add Image</span>
              </button>
              
              <input ref="reportFileInput" type="file" accept="image/*" multiple class="hidden" @change="handleReportImageUpload" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Additional Details</label>
            <textarea 
              v-model="reportDesc"
              rows="3"
              placeholder="Provide more context..."
              class="w-full px-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all text-white text-sm resize-none"
            ></textarea>
          </div>

          <button 
            @click="submitReport"
            :disabled="isSubmittingReport || !reportTopic"
            class="w-full py-4 mt-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {{ isSubmittingReport ? 'Uploading Evidence...' : 'Submit Report' }}
          </button>
        </div>
      </div>
    </div>
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
</style>



.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
