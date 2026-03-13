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
    class="px-4 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 border border-transparent whitespace-nowrap shadow-sm"
    :class="[
      selected 
        ? 'bg-gm-primary text-white'
        : 'bg-white/5 text-gray-300 hover:bg-gm-hover hover:text-black'
    ]"
  >
    {{ name }}
  </button>
</template>
