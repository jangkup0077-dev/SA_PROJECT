<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'

const users = ref<any[]>([])
const loading = ref(false)

const loadUsers = async () => {
    loading.value = true
    try {
        const res = await api.get('/admin/users')
        users.value = res.data
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const actionMap: Record<string, string> = {
    suspend: 'Suspend User',
    warn: 'Send Warning',
    ban: 'Permanently Ban'
}

const performAction = async (userId: number, action: 'suspend' | 'warn' | 'ban') => {
    const reason = prompt(`Enter reason to ${actionMap[action]}:`)
    if (!reason) return

    let payload: any = { reason }
    if (action === 'suspend') {
        const durationHours = prompt('Enter suspension duration (hours):', '24')
        if (!durationHours) return
        payload.durationHours = Number(durationHours)
    }

    try {
        await api.post(`/admin/${action}/${userId}`, payload)
        await loadUsers()
    } catch (e: any) {
        alert('Action failed: ' + (e.response?.data?.message || e.message))
    }
}

onMounted(() => loadUsers())
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">User Management</h1>
        <p class="text-gray-400 mt-2">View and moderate all registered users.</p>
      </div>
      <button @click="loadUsers" class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">
        Refresh List
      </button>
    </div>

    <div class="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-white/5 text-sm uppercase text-gray-400 tracking-wider">
                    <td class="px-6 py-4 font-medium border-b border-white/5">ID</td>
                    <td class="px-6 py-4 font-medium border-b border-white/5">Name</td>
                    <td class="px-6 py-4 font-medium border-b border-white/5">Email</td>
                    <td class="px-6 py-4 font-medium border-b border-white/5">Status</td>
                    <td class="px-6 py-4 font-medium border-b border-white/5 text-right">Actions</td>
                </tr>
            </thead>
            <tbody v-if="!loading">
                <tr v-for="user in users" :key="user.id" class="border-b border-white/5 hover:bg-white/5 transition">
                    <td class="px-6 py-4 text-mono text-gray-500">#{{ user.id }}</td>
                    <td class="px-6 py-4 font-medium">
                        {{ user.name }}
                        <span v-if="user.is_admin" class="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded text-mono font-bold">ADMIN</span>
                    </td>
                    <td class="px-6 py-4 text-gray-400">{{ user.email }}</td>
                    <td class="px-6 py-4">
                        <span v-if="user.is_banned" class="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold uppercase">Banned</span>
                        <span v-else-if="user.is_suspended" class="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs font-bold uppercase" :title="'Until: ' + new Date(user.suspension_until).toLocaleString()">Suspended</span>
                        <span v-else class="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold uppercase">Active</span>
                    </td>
                    <td class="px-6 py-4">
                        <div v-if="!user.is_admin && !user.is_banned" class="flex items-center justify-end gap-2">
                           <button @click="performAction(user.id, 'warn')" class="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-md text-xs font-bold transition">Warn</button>
                           <button @click="performAction(user.id, 'suspend')" class="px-3 py-1.5 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-md text-xs font-bold transition">Suspend</button>
                           <button @click="performAction(user.id, 'ban')" class="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md text-xs font-bold transition">Ban</button>
                        </div>
                    </td>
                </tr>
            </tbody>
            <tbody v-else>
                <tr><td colspan="5" class="px-6 py-12 text-center text-gray-500">Loading user database...</td></tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
