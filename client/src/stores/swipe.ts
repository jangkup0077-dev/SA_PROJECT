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
                    .map((p: any) => {
                        // Normalize profile_image_url: pg can return TEXT[] as string "{url1,url2}"
                        let images = p.profile_image_url
                        if (typeof images === 'string') {
                            images = images.replace(/^\{|\}$/g, '').split(',').filter(Boolean)
                        }
                        if (!Array.isArray(images)) images = []

                        return {
                            id: p.user_id,
                            name: p.display_name,
                            bio: p.bio,
                            country: p.country,
                            birth_date: p.birth_date,
                            profile_image_url: images,
                            games: (p.shared_games || []).map((g: any) => ({
                                id: g.id,
                                game_name: g.name || g.game_name
                            }))
                        }
                    })
            } catch (err) {
                console.error('Failed to fetch potential matches', err)
            } finally {
                this.loading = false
            }
        },
        async registerSwipe(targetId: number, action: 'LIKE' | 'SKIP') {
            console.log(`[SWIPE START] Sending swipe action for targetId: ${targetId}, status: ${action}`)
            
            // Capture profile info NOW before it gets removed from the local array
            const targetProfile = this.profiles.find(p => p.id === targetId);
            const profileName = targetProfile?.name || 'User';
            const profileAvatar = (targetProfile?.profile_image_url && targetProfile.profile_image_url.length > 0) 
                ? targetProfile.profile_image_url[0] 
                : '';

            try {
                const res = await api.post('/swipe', { targetId, status: action })
                console.log(`[SWIPE SUCCESS] Result from backend:`, res.data)
                
                if (res.data.isMatch) {
                    this.matchTriggered = {
                        userId: targetId,
                        matchId: res.data.matchId,
                        avatar: profileAvatar,
                        name: profileName
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