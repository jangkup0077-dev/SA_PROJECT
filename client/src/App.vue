<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div class="h-screen flex flex-col w-full overflow-hidden bg-[var(--color-dark-bg)]">
    <!-- Render Navbar globally if desired, although we might want to hide it on auth pages -->
    <Navbar />
    <main class="flex-1 flex flex-col relative overflow-y-auto min-h-0">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
