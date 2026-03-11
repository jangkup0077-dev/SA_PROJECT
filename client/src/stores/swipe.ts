import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from './auth'

export interface SwipeProfile {
    id: number
    name: string
    bio: string
    country: string
    birth_date: string
    profile_image_url: string[]
    games: any[]
}

export const useSwipeStore = defineStore('swipe', {
    state: () => ({
        profiles: [] as SwipeProfile[],
        loading: false,
        matchTriggered: null as any | null,
    }),
    actions: {
        async fetchProfiles() {
            this.loading = true
            try {
                const res = await api.get('/swipe/candidates')
                
                const authStore = useAuthStore()
                const myId = authStore.user?.id  

                this.profiles = res.data
                    .filter((p: any) => p.user_id !== myId) 
                    .map((p: any) => ({
                        id: p.user_id,
                        name: p.display_name,
                        bio: p.bio,
                        country: p.country,
                        birth_date: p.birth_date,
                        profile_image_url: p.profile_image_url || [],
                        games: (p.shared_games || []).map((g: any) => ({
                            id: g.id,
                            game_name: g.name || g.game_name
                        }))
                    }))
            } catch (err) {
                console.error('Failed to fetch potential matches', err)
            } finally {
                this.loading = false
            }
        },
        async registerSwipe(targetId: number, action: 'LIKE' | 'SKIP') {
            console.log(`[SWIPE START] Sending swipe action for targetId: ${targetId}, status: ${action}`)
            try {
                const res = await api.post('/swipe', { targetId, status: action })
                console.log(`[SWIPE SUCCESS] Result from backend:`, res.data)
                
                if (res.data.isMatch) {
                    const targetProfile = this.profiles.find(p => p.id === targetId);
                    this.matchTriggered = {
                        userId: targetId,
                        matchId: res.data.matchId,
                        avatar: targetProfile?.profile_image_url?.[0] || '',
                        name: targetProfile?.name || 'User'
                    }
                }
            } catch (err: any) {
                console.error('[SWIPE ERROR] Swipe action failed. Payload was:', { targetId, status: action })
                console.error('[SWIPE ERROR DETAILS]', err.response?.data || err.message)
            }
        },
        removeTopProfile() {
            if (this.profiles.length > 0) {
                this.profiles.shift()
            }
        },
        clearMatch() {
            this.matchTriggered = null
        }
    }
})