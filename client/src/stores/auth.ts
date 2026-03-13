import { defineStore } from 'pinia'
import api from '@/services/api'
import { connectSocket, disconnectSocket } from '@/services/socket'

export interface User {
    id: number
    name: string
    email: string
    is_admin: boolean
    is_suspended?: boolean
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        token: localStorage.getItem('token') || null,
        isAuthenticated: false,
    }),
    actions: {
        setAuth(token: string, user: User) {
            this.token = token
            this.user = user
            this.isAuthenticated = true
            localStorage.setItem('token', token)
            connectSocket(token)
        },
        logout() {
            this.token = null
            this.user = null
            this.isAuthenticated = false
            localStorage.removeItem('token')
            disconnectSocket()
        },
        async checkAuth() {
            if (!this.token) return false
            try {
                // Backend: GET /api/profile/ returns the current user's profile
                const res = await api.get('/profile/')
                const userData = res.data.user || res.data
                this.user = {
                    ...userData,
                    id: userData.id || userData.user_id,
                    is_suspended: userData.is_suspended
                }
                this.isAuthenticated = true
                connectSocket(this.token!)
                return true
            } catch {
                this.logout()
                return false
            }
        }
    }
})
