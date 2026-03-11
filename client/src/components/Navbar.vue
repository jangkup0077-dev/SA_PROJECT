<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeIcon, ChatBubbleLeftIcon, UserCircleIcon, BellIcon } from '@heroicons/vue/24/outline'
import { useChatStore } from '@/stores/chat'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()
const notificationStore = useNotificationStore()

const showNotifications = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const hideNavbar = computed(() => {
  return ['/login', '/setup-profile'].includes(route.path) || route.path.startsWith('/register') || route.path === '/'
})

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    // If we have unread notifications, mark them all as read on the backend
    if (notificationStore.hasUnread) {
      await notificationStore.markAllAsRead()
    }
  }
}

const formatTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Fetch notification history
  notificationStore.fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <nav v-if="!hideNavbar" class="w-full flex items-center justify-between px-6 py-4 bg-gm-background border-b border-white/5 sticky top-0 z-50 shadow-md">
    <div class="flex items-center gap-2 cursor-pointer group" @click="router.push('/discover')">
      <div class="w-8 h-8 rounded-[8px] bg-gm-primary flex items-center justify-center font-bold text-white shadow-lg shadow-gm-primary/20 group-hover:bg-gm-hover group-hover:text-black transition duration-200">
        GM
      </div>
      <span class="text-xl font-bold tracking-tight text-white group-hover:text-gm-hover transition duration-200">
        GameMatch
      </span>
    </div>

    <div class="flex items-center gap-6 text-gray-400">
      <button 
        @click="router.push('/discover')"
        class="transition-colors hover:text-gm-hover"
        :class="{ 'text-gm-hover': route.path === '/discover' }"
      >
        <HomeIcon class="h-7 w-7" />
      </button>

      
      <button 
        @click="router.push('/matches')"
        class="transition-colors hover:text-gm-hover relative"
        :class="{ 'text-gm-hover': route.path.startsWith('/matches') || route.path.startsWith('/chat') }"
      >
        <ChatBubbleLeftIcon class="h-7 w-7" />
        <span v-if="chatStore.hasUnread" class="absolute top-0 right-0 w-2 h-2 bg-gm-danger rounded-full border border-gm-background"></span>
      </button>

      <!-- Notification Bell Desktop -->
      <div class="relative" ref="dropdownRef">
        <button 
          @click.stop="toggleNotifications"
          class="transition-colors hover:text-gm-hover relative"
          :class="{ 'text-gm-hover': showNotifications }"
        >
          <BellIcon class="h-7 w-7" />
          <span v-if="notificationStore.hasUnread" class="absolute top-0 right-1 w-2.5 h-2.5 bg-gm-danger rounded-full border-2 border-gm-background animate-pulse"></span>
        </button>

        <!-- Notification Dropdown -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0 m-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0 m-0"
        >
          <div v-if="showNotifications" class="absolute right-0 mt-3 w-80 bg-gm-panel border border-white/10 rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden z-[100]">
            <div class="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 class="font-bold text-white tracking-tight">Notifications</h3>
              <button 
                v-if="notificationStore.notifications.length > 0"
                @click.stop="notificationStore.clearAll()" 
                class="text-xs text-gray-400 hover:text-red-400 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
            
            <div class="max-h-[360px] overflow-y-auto w-full">
              <div v-if="notificationStore.notifications.length === 0" class="p-8 text-center flex flex-col items-center justify-center">
                <BellIcon class="h-10 w-10 text-gray-600 mb-3" />
                <p class="text-gray-500 font-medium text-sm">You have no notifications</p>
              </div>

              <div 
                v-for="notif in notificationStore.notifications" 
                :key="notif.id"
                class="p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors flex gap-3 relative overflow-hidden"
              >
                <!-- Icon based on type -->
                <div class="shrink-0 mt-0.5">
                  <div v-if="notif.type === 'match'" class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                  <div v-else-if="notif.type === 'message'" class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <ChatBubbleLeftIcon class="w-5 h-5" />
                  </div>
                  <div v-else-if="notif.type === 'ACCOUNT_SUSPENDED' || notif.type === 'REPORT_UPDATE'" class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div v-else class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center text-white shadow-lg shadow-gray-500/20">
                    <BellIcon class="w-5 h-5" />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 pr-2">
                  <p class="text-sm text-gray-200 font-medium leading-snug">{{ notif.message }}</p>
                  <p class="text-xs text-gray-500 mt-1 font-medium">{{ formatTime(notif.timestamp) }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="notificationStore.notifications.length > 0" class="p-3 border-t border-white/5 bg-black/20 text-center">
               <span class="text-xs text-gray-500 font-medium">All caught up!</span>
            </div>
          </div>
        </Transition>
      </div>

      <button 
        @click="router.push('/profile')"
        class="transition-colors hover:text-white"
        :class="{ 'text-purple-400': route.path === '/profile' }"
      >
        <UserCircleIcon class="h-7 w-7" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
</style>