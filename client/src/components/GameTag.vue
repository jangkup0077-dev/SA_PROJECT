<script setup lang="ts">
defineProps<{
  name: string
  selected?: boolean
}>()

const emit = defineEmits(['toggle'])
</script>

<template>
  <button
    type="button"
    @click="emit('toggle')"
    class="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border whitespace-nowrap"
    :class="[
      selected 
        ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(124,58,237,0.2)]'
        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-purple-600/10 hover:border-purple-500/40'
    ]"
  >
    {{ name }}
  </button>
</template>
