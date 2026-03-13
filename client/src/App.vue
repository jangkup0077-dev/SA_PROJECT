<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationStore } from '@/stores/notification'
import { getSocket } from '@/services/socket'

const authStore = useAuthStore()
const chatStore = useChatStore()
const notificationStore = useNotificationStore()
const route = useRoute()
const router = useRouter()

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.user) {
    const socket = getSocket()

    const userId = authStore.user?.id || (authStore.user as any)?.user_id

    const joinGlobalRoom = () => {
      if (userId) {
        console.log(`🔗 Joining global room for user: ${userId}`)
        socket.emit('join_global', userId)
      }
    }

    socket.on('connect', joinGlobalRoom)
    if (socket.connected) {
      joinGlobalRoom()
    }

    socket.off('new_notification')
    socket.on('new_notification', (data) => {
      // Data is now the full notification object from backend
      notificationStore.notifications.unshift({
        id: data.id?.toString() || crypto.randomUUID(),
        type: data.type || 'info',
        message: data.message || 'New notification',
        isRead: false,
        timestamp: data.created_at || new Date().toISOString()
      })

      if (data.type === 'message') {
        chatStore.hasUnread = true 
        chatStore.fetchMatches()
      }
      
      console.log('🔔 New Notification Received:', data)
    })

    socket.off('moderation_action')
    socket.on('moderation_action', (data: { status: 'BANNED' | 'SUSPENDED' | 'ACTIVE', message?: string }) => {
      console.log('🛡️ Moderation Action:', data)
      
      if (data.status === 'BANNED') {
        alert(data.message || 'Your account has been permanently banned.')
        authStore.logout()
        router.push('/login')
      } else if (data.status === 'SUSPENDED') {
        if (authStore.user) {
          authStore.user.is_suspended = true
          // We might not have suspension_until in the payload from all emitters, 
          // but the backend will block actions either way.
        }
        alert(data.message || 'Your account has been suspended.')
      } else if (data.status === 'ACTIVE') {
        if (authStore.user) {
          authStore.user.is_suspended = false
        }
        alert('Your account restrictions have been lifted.')
      }
    })
  }
}, { immediate: true })

const handleGlobalClick = (event: MouseEvent) => {
  if (authStore.user?.is_suspended) {
    const target = event.target as HTMLElement
    // Only alert if clicking something potentially interactive
    const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]')
    if (isInteractive) {
      event.preventDefault()
      event.stopPropagation()
      alert('suspended!!')
    }
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick, true)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick, true)
})
</script>

<template>
  <div class="h-screen flex flex-col w-full overflow-hidden bg-[var(--color-dark-bg)]">
    <Navbar />
    <main class="flex-1 flex flex-col relative overflow-y-auto min-h-0">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>