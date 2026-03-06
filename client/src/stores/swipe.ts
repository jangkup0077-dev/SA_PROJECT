import { defineStore } from 'pinia'
import api from '@/services/api'

export interface SwipeProfile {
    id: number
    name: string
    bio: string
    country: string
    age: number
    profile_images: string[]
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
                // Backend: GET /api/swipe/candidates
                const res = await api.get('/swipe/candidates')
                this.profiles = res.data.map((p: any) => ({
                    id: p.user_id,
                    name: p.display_name,
                    bio: p.bio,
                    country: p.country,
                    age: p.age,
                    profile_images: p.profile_images || [],
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
                // Backend: POST /api/swipe/  body: { targetId, status }
                const res = await api.post('/swipe', { targetId, status: action })
                console.log(`[SWIPE SUCCESS] Result from backend:`, res.data)
                // If the backend returns a match property in the response
                if (res.data.isMatch) {
                    this.matchTriggered = {
                        userId: targetId,
                        matchId: res.data.matchId,
                        avatar: res.data.targetAvatar || '',
                        name: res.data.targetName || 'User'
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
