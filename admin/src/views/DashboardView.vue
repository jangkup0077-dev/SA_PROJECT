<script setup lang="ts">
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 animate-fade-in">
    <div>
      <h1 class="text-3xl font-bold">Welcome back, {{ authStore.admin?.name }}</h1>
      <p class="text-gray-400 mt-2">Manage the GameMatch ecosystem from this central command center.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gray-900 p-6 rounded-2xl border border-white/5">
        <h3 class="text-lg font-medium text-gray-400">System Status</h3>
        <p class="text-3xl font-bold mt-2 text-green-400">Operational</p>
      </div>
      <div class="bg-gray-900 p-6 rounded-2xl border border-white/5">
        <h3 class="text-lg font-medium text-gray-400">Active Admins</h3>
        <p class="text-3xl font-bold mt-2 text-white">1</p>
      </div>
      <div class="bg-gray-900 p-6 rounded-2xl border border-white/5">
        <h3 class="text-lg font-medium text-gray-400">Subsystems</h3>
        <p class="text-3xl font-bold mt-2 text-white">Fully Linked</p>
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
