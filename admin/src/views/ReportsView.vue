<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'

const reports = ref<any[]>([])
const loading = ref(false)
const selectedReport = ref<any>(null)
const showingModal = ref(false)

const loadReports = async () => {
    loading.value = true
    try {
        const res = await api.get('/admin/reports')
        reports.value = res.data
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const updateStatus = async (reportId: number, status: string) => {
    try {
        await api.patch(`/admin/reports/${reportId}/status`, { status })
        showingModal.value = false
        selectedReport.value = null
        await loadReports()
    } catch (e: any) {
        alert('Failed to update report: ' + (e.response?.data?.message || e.message))
    }
}

const viewDetails = (report: any) => {
    selectedReport.value = report
    showingModal.value = true
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

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusStyles = (status: string) => {
  const map: Record<string, string> = {
    'PENDING': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'RESOLVED': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'REJECTED': 'bg-red-500/10 text-red-500 border-red-500/20',
    'DISMISSED': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }
  return map[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
}

onMounted(() => loadReports())
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/5 pb-6">
      <div>
        <h1 class="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Reports Queue</h1>
        <p class="text-sm text-zinc-500 mt-1">Review and resolve user-submitted violation reports.</p>
      </div>
      <button @click="loadReports" class="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold text-zinc-300 transition-all cursor-pointer">
        ↻ Refresh Queue
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="flex gap-4 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        <div class="px-5 py-3 bg-[#121214] border border-white/5 rounded-2xl flex items-center gap-4 shrink-0">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pending: <span class="text-white ml-1">{{ reports.filter(r => r.status === 'PENDING').length }}</span></span>
        </div>
        <div class="px-5 py-3 bg-[#121214] border border-white/5 rounded-2xl flex items-center gap-4 shrink-0">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Resolved Today: <span class="text-white ml-1">{{ reports.filter(r => r.status === 'RESOLVED').length }}</span></span>
        </div>
    </div>

    <!-- Grid Layout for Reports -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 bg-[#121214] rounded-[32px] border border-white/5">
        <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-zinc-500 font-medium">Fetching reports database...</p>
    </div>

    <div v-else-if="reports.length === 0" class="text-center py-20 bg-[#121214] rounded-[32px] border border-white/5">
        <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <svg class="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 class="text-lg font-bold text-white">Queue Clear</h3>
        <p class="text-zinc-500 text-sm mt-1">No reports are currently awaiting review.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
            v-for="report in reports" 
            :key="report.id"
            @click="viewDetails(report)"
            class="bg-[#121214] p-6 rounded-[28px] border border-white/5 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
        >
            <div class="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>

            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span :class="getStatusStyles(report.status)" class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border">
                        {{ report.status }}
                    </span>
                    <span class="text-[10px] font-mono text-zinc-600">#{{ report.id }}</span>
                </div>

                <div>
                    <h3 class="text-zinc-100 font-bold leading-tight group-hover:text-white transition-colors">{{ report.report_type || report.reason }}</h3>
                    <p class="text-zinc-500 text-xs mt-1">{{ formatDate(report.created_at) }}</p>
                </div>

                <div class="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                    <div class="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0 overflow-hidden">
                        <img v-if="report.reported_images_target" :src="getAvatarUrl(report.reported_images_target)" class="w-full h-full object-cover" />
                        <span v-else>?</span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-[10px] text-zinc-600 uppercase font-black tracking-tighter mb-0.5">Accused User</p>
                        <p class="text-xs font-bold text-red-400 truncate">{{ report.reported_display_name || report.reported_name || `User #${report.reported_user_id}` }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Detailed Modal -->
    <Transition name="fade">
      <div v-if="showingModal && selectedReport" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" @click.self="showingModal = false">
        <div class="bg-[#121214] border border-white/10 rounded-[40px] w-full max-w-2xl shadow-2xl scale-in overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h2 class="text-xl font-black text-white">Case Review</h2>
                <span class="text-xs text-zinc-500 uppercase tracking-widest font-bold">Report ID: #{{ selectedReport.id }}</span>
              </div>
              <button @click="showingModal = false" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </div>

          <div class="p-8 overflow-y-auto custom-scrollbar space-y-8">
              <!-- Identity Swap -->
              <div class="flex items-center justify-center gap-8 py-4 px-6 bg-black/40 rounded-[32px] border border-white/5">
                  <div class="text-center group">
                      <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 mb-3 mx-auto">
                          <img v-if="selectedReport.reporter_images" :src="getAvatarUrl(selectedReport.reporter_images)" class="w-full h-full object-cover"/>
                      </div>
                      <p class="text-[10px] uppercase font-black text-zinc-600 mb-1">Reporter</p>
                      <p class="text-xs font-bold text-white">{{ selectedReport.reporter_display_name || selectedReport.reporter_name }}</p>
                  </div>

                  <div class="flex flex-col items-center">
                      <div class="w-10 h-[1px] bg-zinc-800"></div>
                      <span class="text-[10px] font-black italic text-zinc-700 my-2">VS</span>
                      <div class="w-10 h-[1px] bg-zinc-800"></div>
                  </div>

                  <div class="text-center group">
                      <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-red-500/30 bg-zinc-800 mb-3 mx-auto shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                          <img v-if="selectedReport.reported_images_target" :src="getAvatarUrl(selectedReport.reported_images_target)" class="w-full h-full object-cover"/>
                      </div>
                      <p class="text-[10px] uppercase font-black text-red-500/50 mb-1">Accused</p>
                      <p class="text-xs font-bold text-red-400">{{ selectedReport.reported_display_name || selectedReport.reported_name }}</p>
                  </div>
              </div>

              <!-- Content Sections -->
              <div class="space-y-6">
                  <div>
                      <h3 class="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Subject</h3>
                      <div class="p-4 bg-black/20 border border-white/5 rounded-2xl text-white font-bold text-base">
                          {{ selectedReport.report_type || selectedReport.reason }}
                      </div>
                  </div>

                  <div v-if="selectedReport.description">
                      <h3 class="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Description</h3>
                      <div class="p-5 bg-black/20 border border-white/5 rounded-2xl text-zinc-400 text-sm leading-relaxed">
                          {{ selectedReport.description }}
                      </div>
                  </div>
                  
                  <div v-if="selectedReport.images && selectedReport.images.length > 0">
                      <h3 class="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Evidence Attachment</h3>
                      <div class="rounded-3xl overflow-hidden border border-white/10 bg-black shadow-inner">
                          <img 
                              v-for="(img, idx) in selectedReport.images" 
                              :key="idx" 
                              :src="getAvatarUrl(img)" 
                              class="w-full object-contain max-h-[400px]"
                          />
                      </div>
                  </div>
              </div>
          </div>

          <div v-if="selectedReport.status === 'PENDING'" class="p-8 border-t border-white/5 bg-black/20 flex gap-4">
              <button @click="updateStatus(selectedReport.id, 'RESOLVED')" class="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer">
                  Mark Valid
              </button>
              <button @click="updateStatus(selectedReport.id, 'REJECTED')" class="flex-1 py-4 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer">
                  Reject Case
              </button>
          </div>
          <div v-else class="p-8 border-t border-white/5 bg-black/20 text-center">
              <span class="text-xs font-black uppercase tracking-widest text-zinc-600">Decision: </span>
              <span :class="getStatusStyles(selectedReport.status)" class="ml-2 px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest">
                {{ selectedReport.status }}
              </span>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.scale-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
</style>
