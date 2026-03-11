import { defineStore } from 'pinia'
import api from '@/services/api'
import { getSocket } from '@/services/socket'

export interface ChatMessage {
    id: number
    match_id: number
    sender_id: number
    message_content: string
    sent_at: string
}

export const useChatStore = defineStore('chat', {
    state: () => ({
        messages: [] as ChatMessage[],
        activeMatchId: null as number | null,
        matchesList: [] as any[],
        hasUnread: false,
    }),
    actions: {
        async fetchMatches() {
            try {
                const res = await api.get('/swipe/matches')
                this.matchesList = res.data.map((m: any) => ({
                    id: m.match_id,
                    target_id: m.partner_id,
                    target_name: m.partner_name,
                    target_avatar: m.partner_images && m.partner_images.length > 0 ? m.partner_images[0] : '',
                    target_bio: m.partner_bio || '',
                    target_birth_date: m.partner_birth_date || '',
                    target_games: m.partner_games || [], 
                    lastMessage: m.last_message || '' 
                }))
            } catch (err) {
                console.error('Fetch matches failed', err)
            }
        },
        async fetchHistory(matchId: number) {
            this.activeMatchId = matchId
            try {
                // Backend: GET /api/chat/:matchId
                const res = await api.get(`/chat/${matchId}`)
                this.messages = res.data

                // Join the socket room for this match
                const socket = getSocket()
                if (socket) {
                    socket.emit('join_match', matchId)
                }
            } catch (err) {
                console.error('Fetch history failed', err)
            }
        },
        async sendMessage(matchId: number, content: string) {
            try {
                // Backend: POST /api/chat/:matchId  body: { message_content }
                await api.post(`/chat/${matchId}`, { message_content: content })
            } catch (err) {
                console.error('Failed to send message', err)
            }
        },
        async unmatch(matchId: number) {
            try {
                await api.delete(`/swipe/unmatch/${matchId}`)
                // Remove from local list
                this.matchesList = this.matchesList.filter(m => m.id !== matchId)
                if (this.activeMatchId === matchId) {
                    this.activeMatchId = null
                }
            } catch (err) {
                console.error('Failed to unmatch', err)
                throw err
            }
        },
        receiveMessage(msg: ChatMessage) {
            if (msg.match_id === this.activeMatchId) {
                // Defensive check: don't push if ID already exists
                if (!this.messages.find(m => m.id === msg.id)) {
                    this.messages.push(msg)
                }
            }
            // Also update latest message in matchesList
            const matchIndex = this.matchesList.findIndex((m: any) => m.id === msg.match_id)
            if (matchIndex !== -1) {
                this.matchesList[matchIndex].lastMessage = msg.message_content
            }
        },
        initSocketListeners() {
            const socket = getSocket()
            if (socket) {
                socket.off('receive_message')
                socket.on('receive_message', (data: ChatMessage) => {
                    this.receiveMessage(data)
                })
            }
        }
    }
})
