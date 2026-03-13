import axios from 'axios'

// Fetch the API URL from environment variables, or default to the backend server
// const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const baseURL = 'server-production-7a8f.up.railway.app/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add a request interceptor to auto-inject the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Global response error handler
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // ล้าง token ทิ้ง
            localStorage.removeItem('token')
            
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
