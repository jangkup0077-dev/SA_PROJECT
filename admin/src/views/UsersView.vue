<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'

const users = ref<any[]>([])
const loading = ref(false)
const activeDropdownUserId = ref<number | null>(null)

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

const toggleDropdown = (userId: number) => {
    if (activeDropdownUserId.value === userId) {
        activeDropdownUserId.value = null
    } else {
        activeDropdownUserId.value = userId
    }
}

const warnUser = async (userId: number) => {
    const reason = prompt('Warning reason:')
    if (!reason) return
    try {
        await api.post(`/admin/warn/${userId}`, { reason })
        alert('User warned successfully')
    } catch (err) {
        alert('Failed to warn user')
    }
}

const suspendUser = async (userId: number) => {
    const reason = prompt('Reason for suspension:')
    if (!reason) return
    const hours = prompt('Suspension duration (hours):', '72')
    if (!hours) return
    try {
        await api.post(`/admin/suspend/${userId}`, { reason, duration_hours: Number(hours) })
        await loadUsers()
        alert('User suspended successfully')
    } catch (err) {
        alert('Failed to suspend user')
    }
}

const unbanUser = async (userId: number) => {
    if (!confirm('Are you sure you want to lift the ban for this user?')) return
    try {
        await api.post(`/admin/unban/${userId}`)
        await loadUsers()
        alert('User unbanned successfully')
    } catch (err) {
        alert('Failed to unban user')
    }
}

const banUser = async (userId: number) => {
    const reason = prompt('Reason for permanent ban:')
    if (!reason) return
    if (!confirm('Are you sure you want to PERMANENTLY ban this user?')) return
    try {
        await api.post(`/admin/ban/${userId}`, { reason })
        await loadUsers()
        alert('User banned successfully')
    } catch (err) {
        alert('Failed to ban user')
    }
}

const unsuspendUser = async (userId: number) => {
  if (!confirm('Are you sure you want to lift this user\'s suspension?')) return
  try {
    await api.post(`/admin/unsuspend/${userId}`)
    await loadUsers()
    alert('User unsuspended successfully')
  } catch (err) {
    alert('Failed to unsuspend user')
  }
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(() => loadUsers())
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/5 pb-6">
      <div>
        <h1 class="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">User Management</h1>
        <p class="text-sm text-zinc-500 mt-1">Review activity, manage access, and enforce platform guidelines.</p>
      </div>
      <button @click="loadUsers" class="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-zinc-300 transition-all cursor-pointer backdrop-blur-sm">
        ↻ Refresh Data
      </button>
    </div>

    <!-- Stats Mini Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <p class="text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">Total Members</p>
            <p class="text-2xl font-black text-white">{{ users.length }}</p>
        </div>
        <div class="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
            <p class="text-[10px] uppercase tracking-widest font-bold text-red-500/50 mb-1">Active Bans</p>
            <p class="text-2xl font-black text-red-500">{{ users.filter(u => u.is_banned).length }}</p>
        </div>
        <div class="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
            <p class="text-[10px] uppercase tracking-widest font-bold text-amber-500/50 mb-1">Suspended</p>
            <p class="text-2xl font-black text-amber-500">{{ users.filter(u => u.is_suspended).length }}</p>
        </div>
        <div class="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
            <p class="text-[10px] uppercase tracking-widest font-bold text-indigo-500/50 mb-1">Admins</p>
            <p class="text-2xl font-black text-indigo-400">{{ users.filter(u => u.is_admin).length }}</p>
        </div>
    </div>

    <!-- Table Container -->
    <div class="bg-[#121214] rounded-[24px] border border-white/5 shadow-2xl overflow-hidden relative">
        <div v-if="loading" class="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <table class="w-full text-left border-collapse text-sm">
            <thead>
                <tr class="bg-black/40 text-zinc-500 border-b border-white/5">
                    <th class="px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Identity</th>
                    <th class="px-6 py-4 font-bold uppercase tracking-tighter text-[11px]">Account Status</th>
                    <th class="px-6 py-4 font-bold uppercase tracking-tighter text-[11px] text-right">Administrative Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.03]">
                <tr v-for="user in users" :key="user.id" class="group hover:bg-white/[0.01] transition-colors">
                    <td class="px-6 py-5">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 font-bold overflow-hidden shadow-inner">
                                <img v-if="user.profile_image_url" :src="user.profile_image_url" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <span v-else>{{ user.name?.[0] }}</span>
                            </div>
                            <div>
                                <div class="font-bold text-zinc-100 flex items-center gap-2">
                                   {{ user.display_name || user.name }}
                                   <span v-if="user.is_admin" class="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black tracking-widest">ADMIN</span>
                                </div>
                                <div class="text-zinc-500 text-xs mt-0.5 opacity-60">{{ user.email }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-5">
                        <div class="flex flex-wrap gap-2">
                            <span v-if="user.is_banned" class="px-2 py-1 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Banned</span>
                            <span v-if="user.is_suspended" class="px-2 py-1 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest" :title="'Until: ' + formatDate(user.suspension_until)">Suspended</span>
                            <span v-if="!user.is_banned && !user.is_suspended" class="px-2 py-1 bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                    </td>
                    <td class="px-6 py-5 text-right relative">
                        <button 
                            v-if="!user.is_admin"
                            @click.stop="toggleDropdown(user.id)"
                            class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer ml-auto"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>

                        <!-- Actions Dropdown -->
                        <div v-if="activeDropdownUserId === user.id" class="absolute right-6 top-14 w-48 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
                            <button @click="warnUser(user.id); activeDropdownUserId = null" class="w-full px-4 py-3 text-[11px] font-bold text-amber-500 hover:bg-white/5 flex items-center gap-3 transition-colors border-b border-white/5">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Send Warning
                            </button>
                            
                            <template v-if="!user.is_banned">
                                <button @click="banUser(user.id); activeDropdownUserId = null" class="w-full px-4 py-3 text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                    Permanently Ban
                                </button>
                            </template>
                            <template v-else>
                                <button @click="unbanUser(user.id); activeDropdownUserId = null" class="w-full px-4 py-3 text-[11px] font-bold text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center gap-3 transition-colors border-b border-white/5">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Lift Permanent Ban
                                </button>
                            </template>

                            <template v-if="!user.is_suspended">
                                <button @click="suspendUser(user.id); activeDropdownUserId = null" class="w-full px-4 py-3 text-[11px] font-bold text-zinc-300 hover:bg-white/5 flex items-center gap-3 transition-colors">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Suspend Account
                                </button>
                            </template>
                            <template v-else>
                                <button @click="unsuspendUser(user.id); activeDropdownUserId = null" class="w-full px-4 py-3 text-[11px] font-bold text-emerald-500 hover:bg-white/5 flex items-center gap-3 transition-colors">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                    Unsuspend
                                </button>
                            </template>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
