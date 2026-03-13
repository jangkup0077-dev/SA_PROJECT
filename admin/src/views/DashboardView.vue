<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const navigation = [
  {
    name: 'User Management',
    description: 'Bans, suspensions, and account oversight.',
    path: '/users',
    icon: '👤',
    color: 'from-blue-500/20 to-indigo-500/20',
    borderColor: 'border-blue-500/20'
  },
  {
    name: 'Violation Reports',
    description: 'Review and resolve reported user behavior.',
    path: '/reports',
    icon: '🚩',
    color: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/20'
  },
  {
    name: 'Platform Tags',
    description: 'Manage global interest categories.',
    path: '/games',
    icon: '🏷️',
    color: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/20'
  }
]
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-12">
    <!-- Hero / Welcome -->
    <div class="relative overflow-hidden bg-[#121214] border border-white/5 rounded-[40px] p-10 md:p-16">
      <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full"></div>
      <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-emerald-500/5 blur-[80px] rounded-full"></div>
      
      <div class="relative z-10 max-w-2xl">
        <h1 class="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Welcome back, <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-emerald-400">{{ authStore.admin?.name || 'Administrator' }}</span>
        </h1>
        <p class="text-lg text-zinc-500 leading-relaxed font-medium">
          The moderation hub is live. You have full oversight of platform activity, reporting queues, and user compliance.
        </p>
      </div>
    </div>

    <!-- Quick Navigation -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        v-for="item in navigation" 
        :key="item.name"
        @click="router.push(item.path)"
        class="group cursor-pointer bg-[#121214] border border-white/5 p-8 rounded-[32px] hover:border-white/20 transition-all hover:translate-y-[-4px]"
      >
        <div class="text-4xl mb-6">{{ item.icon }}</div>
        <h3 class="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{{ item.name }}</h3>
        <p class="text-sm text-zinc-500 leading-relaxed">{{ item.description }}</p>
        
        <div class="mt-8 flex items-center text-xs font-black uppercase tracking-widest text-indigo-400 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
          Open Management →
        </div>
      </div>
    </div>

    <!-- Quick Stats Placeholder -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2">Platform Health</span>
            <span class="text-xl font-bold text-emerald-400">Stable</span>
        </div>
        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2">Secure Link</span>
            <span class="text-xl font-bold text-indigo-400">Encrypted</span>
        </div>
        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2">Global Access</span>
            <span class="text-xl font-bold text-zinc-300">Enabled</span>
        </div>
        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2">Server Time</span>
            <span class="text-xl font-bold text-zinc-500 font-mono">{{ new Date().getHours() }}:{{ new Date().getMinutes() }}</span>
        </div>
    </div>
  </div>
</template>

<style scoped>
</style>
