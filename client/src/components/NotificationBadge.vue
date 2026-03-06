<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>

<template>
  <span 
    v-if="count > 0"
    class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-[var(--color-dark-bg)]"
  >
    {{ count > 99 ? '99+' : count }}
  </span>
</template>
