import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'

let socket: Socket | null = null

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            withCredentials: true,
            transports: ['websocket']
        })
    }
    return socket
}

export const connectSocket = (token: string) => {
    const skt = getSocket()
    skt.auth = { token }
    skt.connect()
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}
