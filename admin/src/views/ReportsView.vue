<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'

const reports = ref<any[]>([])
const loading = ref(false)

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

const updateStatus = async (reportId: number, status: 'RESOLVED' | 'REJECTED') => {
    try {
        await api.patch(`/admin/reports/${reportId}/status`, { status })
        await loadReports()
    } catch (e: any) {
        alert('Failed to update report: ' + (e.response?.data?.message || e.message))
    }
}

onMounted(() => loadReports())
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Reports Queue</h1>
        <p class="text-gray-400 mt-2">Review and manage user-submitted violation reports.</p>
      </div>
      <button @click="loadReports" class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">
        Refresh Queue
      </button>
    </div>

    <div class="grid gap-4">
        <div v-if="loading" class="text-center text-gray-500 py-12 bg-gray-900 rounded-2xl border border-white/5">
            Loading reports database...
        </div>

        <div v-else-if="reports.length === 0" class="text-center text-gray-500 py-12 bg-gray-900 rounded-2xl border border-white/5">
            The reports queue is completely clear.
        </div>

        <div v-for="report in reports" :key="report.id" class="bg-gray-900 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition hover:border-white/10">
            <div class="flex-grow space-y-2">
                <div class="flex items-center gap-3">
                    <span 
                        class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md"
                        :class="report.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : report.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'"
                    >
                        {{ report.status }}
                    </span>
                    <span class="text-sm font-mono text-gray-500">Report #{{ report.id }} • {{ new Date(report.created_at).toLocaleDateString() }}</span>
                </div>
                
                <p class="text-lg font-medium">"<span class="italic">{{ report.reason }}</span>"</p>
                <div class="flex items-center gap-2 text-sm text-gray-400">
                    <span>Accuser: <strong class="text-white">User #{{ report.reporter_id }}</strong></span>
                    <span>→</span>
                    <span>Accused: <strong class="text-red-400">User #{{ report.reported_user_id }}</strong></span>
                </div>
            </div>

            <div v-if="report.status === 'PENDING'" class="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <button @click="updateStatus(report.id, 'RESOLVED')" class="flex-1 md:flex-none px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg font-bold transition">Resolve Valid</button>
                <button @click="updateStatus(report.id, 'REJECTED')" class="flex-1 md:flex-none px-4 py-2 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-lg font-bold transition">Reject False</button>
            </div>
        </div>
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
