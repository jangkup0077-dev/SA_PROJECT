<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'reports' | 'users' | 'tags'>('reports')
const loading = ref(false)

// Action Dropdown State
const activeDropdownUserId = ref<number | null>(null)

// Data
const reports = ref<any[]>([])
const users = ref<any[]>([])
const games = ref<any[]>([])

// Report Detail Modal
const selectedReport = ref<any>(null)
const showReportDetail = ref(false)
const updatingReportId = ref<number | null>(null)

// Filters
const reportStatusFilter = ref('')

// Stats
const stats = computed(() => ({
  totalUsers: users.value.length,
  totalReports: reports.value.length,
  pendingReports: reports.value.filter(r => r.status === 'PENDING').length,
  resolvedReports: reports.value.filter(r => r.status === 'RESOLVED').length,
  totalGames: games.value.length,
  bannedUsers: users.value.filter((u: any) => u.is_suspended).length
}))

const filteredReports = computed(() => {
  if (!reportStatusFilter.value) return reports.value
  return reports.value.filter(r => r.status === reportStatusFilter.value)
})

onMounted(async () => {
  // Guard: only admins
  if (!authStore.user?.is_admin) {
    router.push('/discover')
    return
  }
  await fetchAll()
})

const fetchAll = async () => {
  loading.value = true
  try {
    const [reportsRes, usersRes, gamesRes] = await Promise.all([
      api.get('/admin/reports'),
      api.get('/admin/users'),
      api.get('/profile/all-games')
    ])
    reports.value = reportsRes.data || []
    users.value = usersRes.data || []
    games.value = gamesRes.data || []
  } catch (err) {
    console.error('Admin fetch error', err)
  } finally {
    loading.value = false
  }
}

const openReportDetail = (report: any) => {
  selectedReport.value = report
  showReportDetail.value = true
}

const updateReportStatus = async (reportId: number, status: string) => {
  updatingReportId.value = reportId
  try {
    await api.patch(`/admin/reports/${reportId}/status`, { status })
    // Update local data
    const idx = reports.value.findIndex(r => r.id === reportId)
    if (idx !== -1) {
      reports.value[idx].status = status
      if (status === 'RESOLVED' || status === 'REJECTED') {
        reports.value[idx].resolved_at = new Date().toISOString()
      }
    }
    if (selectedReport.value?.id === reportId) {
      selectedReport.value.status = status
    }
  } catch (err) {
    alert('Failed to update report status')
  } finally {
    updatingReportId.value = null
  }
}

const suspendUser = async (userId: number) => {
  const reason = prompt('Reason for suspension:')
  if (!reason) return
  try {
    await api.post(`/admin/suspend/${userId}`, { reason, duration_hours: 72 })
    await fetchAll()
    alert('User suspended successfully')
  } catch (err) {
    alert('Failed to suspend user')
  }
}

const banUser = async (userId: number) => {
  const reason = prompt('Reason for permanent ban:')
  if (!reason) return
  if (!confirm('Are you sure you want to PERMANENTLY ban this user?')) return
  try {
    await api.post(`/admin/ban/${userId}`, { reason })
    await fetchAll()
    alert('User banned successfully')
  } catch (err) {
    alert('Failed to ban user')
  }
}

const unbanUser = async (userId: number) => {
  if (!confirm('Are you sure you want to lift the ban for this user?')) return
  try {
    await api.post(`/admin/unban/${userId}`)
    await fetchAll()
    alert('User unbanned successfully')
  } catch (err) {
    alert('Failed to unban user')
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

const unsuspendUser = async (userId: number) => {
  if (!confirm('Are you sure you want to lift this user\'s suspension?')) return
  try {
    await api.post(`/admin/unsuspend/${userId}`)
    await fetchAll()
    alert('User unsuspended successfully')
  } catch (err) {
    alert('Failed to unsuspend user')
  }
}

const updateSuspension = async (user: any) => {
  const hours = prompt('New suspension duration (hours desde right now):', '24')
  if (!hours) return
  const reason = prompt('New/Updated reason (optional):', user.suspension_reason || '')
  try {
    await api.patch(`/suspend/${user.id}`, { hours: Number(hours), reason })
    await fetchAll()
    alert('Suspension updated')
  } catch (err) {
    alert('Failed to update suspension')
  }
}

const toggleActionDropdown = (userId: number) => {
  if (activeDropdownUserId.value === userId) {
    activeDropdownUserId.value = null
  } else {
    activeDropdownUserId.value = userId
  }
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'REVIEWING': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'RESOLVED': 'bg-green-500/10 text-green-400 border-green-500/20',
    'REJECTED': 'bg-red-500/10 text-red-400 border-red-500/20',
    'DISMISSED': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }
  return map[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

const getAvatarUrl = (images: any) => {
  if (!images) return ''
  if (typeof images === 'string') {
    const cleaned = images.replace(/^\{|\}$/g, '').split(',').filter(Boolean)
    return cleaned[0] || ''
  }
  if (Array.isArray(images)) return images[0] || ''
  return ''
}

const openExternal = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="min-h-screen bg-[#0A0D14] text-white">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-indigo-300">Admin Dashboard</h1>
          <p class="text-gray-500 text-sm mt-1">Manage users, reports, and platform tags</p>
        </div>
        <button @click="fetchAll" class="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          ↻ Refresh
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Users</p>
          <p class="text-3xl font-black text-white">{{ stats.totalUsers }}</p>
        </div>
        <div class="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pending Reports</p>
          <p class="text-3xl font-black text-amber-400">{{ stats.pendingReports }}</p>
        </div>
        <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Resolved</p>
          <p class="text-3xl font-black text-green-400">{{ stats.resolvedReports }}</p>
        </div>
        <div class="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-2xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Suspended</p>
          <p class="text-3xl font-black text-red-400">{{ stats.bannedUsers }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 mb-8">
        <button
          v-for="tab in (['reports', 'users', 'tags'] as const)"
          :key="tab"
          @click="activeTab = tab"
          class="flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize"
          :class="activeTab === tab
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
            : 'text-gray-500 hover:text-white hover:bg-white/5'"
        >
          {{ tab === 'tags' ? 'Platform Tags' : tab }}
        </button>
      </div>

      <!-- REPORTS TAB -->
      <div v-if="activeTab === 'reports'">
        <!-- Filter Bar -->
        <div class="flex items-center gap-3 mb-6">
          <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Filter:</span>
          <button
            v-for="s in ['', 'PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED']"
            :key="s"
            @click="reportStatusFilter = s"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
            :class="reportStatusFilter === s
              ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
              : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'"
          >
            {{ s || 'All' }}
          </button>
        </div>

        <!-- Reports List -->
        <div v-if="filteredReports.length === 0" class="text-center py-16">
          <p class="text-gray-500 text-lg font-medium">No reports found</p>
        </div>
        <div class="space-y-3">
          <div
            v-for="report in filteredReports"
            :key="report.id"
            @click="openReportDetail(report)"
            class="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all cursor-pointer group"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-white text-sm">{{ report.reporter_display_name || report.reporter_name || 'User #' + report.reporter_id }}</span>
                    <span class="text-gray-500 text-xs">reported</span>
                    <span class="font-bold text-red-400 text-sm">{{ report.reported_display_name || report.reported_name || 'User #' + report.reported_user_id }}</span>
                  </div>
                  <p class="text-gray-400 text-xs mt-1 truncate">{{ report.reason }} · {{ formatDate(report.created_at) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <span v-if="report.media_url" class="text-xs text-purple-400 font-medium">📎 Media</span>
                <span :class="getStatusColor(report.status)" class="px-3 py-1 rounded-lg text-xs font-bold border">{{ report.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- USERS TAB -->
      <div v-if="activeTab === 'users'">
        <div v-if="users.length === 0" class="text-center py-16">
          <p class="text-gray-500 text-lg font-medium">No users found</p>
        </div>
        <div class="grid gap-3">
          <div
            v-for="user in users"
            :key="user.id"
            class="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border-2 border-white/10">
                <img v-if="user.profile_image_url" :src="getAvatarUrl(user.profile_image_url)" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-white font-bold text-sm">{{ user.display_name || user.name }}</p>
                  <span v-if="user.is_admin" class="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-lg uppercase tracking-tighter">Admin</span>
                </div>
                <p class="text-gray-500 text-xs">{{ user.email }}</p>
                <div v-if="user.is_suspended || user.is_banned" class="mt-1 flex gap-1 items-center">
                  <span v-if="user.is_banned" class="text-[10px] text-white bg-red-600 px-1.5 py-0.5 rounded border border-red-700 font-bold uppercase">
                    Banned
                  </span>
                  <span v-if="user.is_suspended" class="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    Suspended until {{ formatDate(user.suspension_until) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 relative">
              <button
                v-if="!user.is_admin"
                @click.stop="toggleActionDropdown(user.id)"
                class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>

              <!-- Action Dropdown -->
              <div v-if="activeDropdownUserId === user.id" class="absolute right-0 top-12 w-48 bg-[#161B26] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                <button @click="warnUser(user.id); activeDropdownUserId = null" class="w-full text-left px-4 py-3 text-xs font-bold text-amber-400 hover:bg-white/5 transition-colors border-b border-white/5">
                  Send Warning
                </button>
                <template v-if="!user.is_banned">
                  <button @click="banUser(user.id); activeDropdownUserId = null" class="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-white/5 transition-colors border-b border-white/5">
                    Ban Permanently
                  </button>
                </template>
                <template v-else>
                  <button @click="unbanUser(user.id); activeDropdownUserId = null" class="w-full text-left px-4 py-3 text-xs font-bold text-green-500 hover:bg-white/5 transition-colors border-b border-white/5">
                    Lift Permanent Ban
                  </button>
                </template>
                
                <template v-if="!user.is_suspended">
                  <button @click="suspendUser(user.id); activeDropdownUserId = null" class="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-white/5 transition-colors">
                    Suspend Account
                  </button>
                </template>
                <template v-else>
                  <button @click="updateSuspension(user); activeDropdownUserId = null" class="w-full text-left px-4 py-3 text-xs font-bold text-blue-400 hover:bg-white/5 transition-colors border-b border-white/5">
                    Update Duration
                  </button>
                  <button @click="unsuspendUser(user.id); activeDropdownUserId = null" class="w-full text-left px-4 py-3 text-xs font-bold text-green-400 hover:bg-white/5 transition-colors">
                    Lifting Suspension
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAGS TAB -->
      <div v-if="activeTab === 'tags'">
        <div v-if="games.length === 0" class="text-center py-16">
          <p class="text-gray-500 text-lg font-medium">No tags found</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="game in games"
            :key="game.id"
            class="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4"
          >
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-purple-400 font-bold text-lg shrink-0">
              #
            </div>
            <div>
              <p class="text-white font-bold text-sm">{{ game.game_name }}</p>
              <p class="text-gray-500 text-xs">ID: {{ game.id }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Detail Modal -->
      <Transition name="fade">
        <div v-if="showReportDetail && selectedReport" class="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md" @click.self="showReportDetail = false">
          <div class="bg-[#121620] border border-white/10 p-8 rounded-[32px] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-black text-white">Report #{{ selectedReport.id }}</h3>
              <button @click="showReportDetail = false" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Status Badge -->
            <div class="mb-6">
              <span :class="getStatusColor(selectedReport.status)" class="px-4 py-2 rounded-xl text-sm font-bold border">{{ selectedReport.status }}</span>
            </div>

            <!-- Reporter & Reported -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Reporter</p>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                    <img v-if="selectedReport.reporter_images" :src="getAvatarUrl(selectedReport.reporter_images)" class="w-full h-full object-cover" />
                  </div>
                  <p class="text-white font-bold text-sm">{{ selectedReport.reporter_display_name || selectedReport.reporter_name }}</p>
                </div>
              </div>
              <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Reported User</p>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                    <img v-if="selectedReport.reported_images_target" :src="getAvatarUrl(selectedReport.reported_images_target)" class="w-full h-full object-cover" />
                  </div>
                  <p class="text-red-400 font-bold text-sm">{{ selectedReport.reported_display_name || selectedReport.reported_name }}</p>
                </div>
              </div>
            </div>

            <!-- Reason -->
            <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-4">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Reason</p>
              <p class="text-white font-bold">{{ selectedReport.reason }}</p>
            </div>

            <!-- Description -->
            <div v-if="selectedReport.description" class="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-4">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</p>
              <p class="text-gray-300 text-sm leading-relaxed">{{ selectedReport.description }}</p>
            </div>

            <!-- Media Evidence -->
            <div v-if="selectedReport.media_url" class="mb-6">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Evidence Attachment</p>
              <div class="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                <img
                  v-if="selectedReport.media_url.match(/\.(jpg|jpeg|png|gif|webp)/i)"
                  :src="selectedReport.media_url"
                  class="w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  @click="openExternal(selectedReport.media_url)"
                />
                <video
                  v-else
                  :src="selectedReport.media_url"
                  controls
                  class="w-full max-h-64"
                ></video>
              </div>
            </div>

            <!-- Timestamps -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created</p>
                <p class="text-gray-300 text-sm font-medium">{{ formatDate(selectedReport.created_at) }}</p>
              </div>
              <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Resolved</p>
                <p class="text-gray-300 text-sm font-medium">{{ selectedReport.resolved_at ? formatDate(selectedReport.resolved_at) : '—' }}</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div v-if="selectedReport.status === 'PENDING' || selectedReport.status === 'REVIEWING'" class="flex gap-3">
              <button
                @click="updateReportStatus(selectedReport.id, 'REVIEWING')"
                v-if="selectedReport.status === 'PENDING'"
                :disabled="updatingReportId === selectedReport.id"
                class="flex-1 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm hover:bg-blue-500/20 transition-all disabled:opacity-30"
              >
                Mark Reviewing
              </button>
              <button
                @click="updateReportStatus(selectedReport.id, 'RESOLVED')"
                :disabled="updatingReportId === selectedReport.id"
                class="flex-1 py-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm hover:bg-green-500/20 transition-all disabled:opacity-30"
              >
                ✓ Resolve
              </button>
              <button
                @click="updateReportStatus(selectedReport.id, 'REJECTED')"
                :disabled="updatingReportId === selectedReport.id"
                class="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all disabled:opacity-30"
              >
                ✗ Reject
              </button>
            </div>
            <div v-else class="text-center text-gray-500 text-sm font-medium py-3">
              This report has been {{ selectedReport.status.toLowerCase() }}.
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active { transition: all 0.3s ease-out; }
.fade-leave-active { transition: all 0.2s ease-in; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
