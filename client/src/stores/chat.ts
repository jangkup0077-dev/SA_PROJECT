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
    }),
    actions: {
        async fetchMatches() {
            try {
                // Backend: GET /api/swipe/matches
                const res = await api.get('/swipe/matches')
                this.matchesList = res.data
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
            } catch (err) {
                console.error('Fetch history failed', err)
            }
        },
        sendMessage(matchId: number, content: string) {
            const socket = getSocket()
            if (socket) {
                socket.emit('sendMessage', { matchId, message: content })
            }
        },
        receiveMessage(msg: ChatMessage) {
            if (msg.match_id === this.activeMatchId) {
                this.messages.push(msg)
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
                socket.off('newMessage')
                socket.on('newMessage', (data: ChatMessage) => {
                    this.receiveMessage(data)
                })
            }
        }
    }
})
