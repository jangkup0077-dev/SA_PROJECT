import { defineStore } from 'pinia'
import api from '@/services/api'

export interface NotificationItem {
  id: string
  type: string
  message: string
  isRead: boolean
  timestamp: string
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as NotificationItem[],
  }),
  getters: {
    unreadCount: (state) => {
      return state.notifications.filter(n => !n.isRead).length
    },
    hasUnread(): boolean {
      return this.unreadCount > 0
    }
  },
  actions: {
    pushNotification(notification: Omit<NotificationItem, 'id' | 'isRead' | 'timestamp'>) {
      const newNotification: NotificationItem = {
        ...notification,
        id: crypto.randomUUID(),
        isRead: false,
        timestamp: new Date().toISOString()
      }
      this.notifications.unshift(newNotification)
    },
    async fetchNotifications() {
      try {
        const res = await api.get('/notifications')
        this.notifications = res.data.map((n: any) => ({
          id: n.id.toString(),
          type: n.type,
          message: n.message,
          isRead: n.is_read,
          timestamp: n.created_at
        }))
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      }
    },
    async markAsRead(id: string) {
      try {
        await api.patch(`/notifications/${id}/read`)
        const notification = this.notifications.find(n => n.id === id)
        if (notification) {
          notification.isRead = true
        }
      } catch (error) {
        console.error('Failed to mark notification as read', error)
      }
    },
    async markAllAsRead() {
      try {
        await api.patch('/notifications/read-all')
        this.notifications.forEach(n => n.isRead = true)
      } catch (error) {
        console.error('Failed to mark all as read', error)
      }
    },
    clearAll() {
      this.notifications = []
    }
  }
})
