import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('admin_token') || null,
        admin: null as any | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token && !!state.admin
    },
    actions: {
        async login(credentials: Record<string, string>) {
            try {
                const res = await api.post('/auth/login', credentials)
                if (!res.data.user.isAdmin) {
                    throw new Error("Unauthorized: Admin privileges required")
                }
                this.token = res.data.token
                this.admin = res.data.user
                localStorage.setItem('admin_token', this.token!)
            } catch (err: any) {
                console.error('Login Error', err)
                throw err.response?.data?.message || err.message || 'Login failed'
            }
        },
        async checkAuth() {
            if (!this.token) return
            try {
                const res = await api.get('/auth/me')
                if (!res.data.is_admin) {
                     this.logout()
                     return
                }
                this.admin = res.data
            } catch {
                this.logout()
            }
        },
        logout() {
            this.token = null
            this.admin = null
            localStorage.removeItem('admin_token')
        }
    }
})
