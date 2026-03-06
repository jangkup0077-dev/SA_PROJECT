<script setup lang="ts">
import { ref } from 'vue'
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  initialImage?: string
  size?: 'sm' | 'lg'
}>()

const emit = defineEmits<{
  (e: 'change', file: File | null): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const preview = ref(props.initialImage || '')

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const oldPreview = preview.value
  if (oldPreview && oldPreview.startsWith('blob:')) {
    URL.revokeObjectURL(oldPreview)
  }

  preview.value = URL.createObjectURL(file)
  emit('change', file)
  target.value = '' // Reset
}

const removeImage = (e: Event) => {
  e.stopPropagation()
  if (preview.value.startsWith('blob:')) {
    URL.revokeObjectURL(preview.value)
  }
  preview.value = ''
  emit('change', null)
}
</script>

<template>
  <div 
    @click="triggerUpload"
    class="relative flex items-center justify-center rounded-2xl cursor-pointer overflow-hidden border-2 border-dashed transition-colors"
    :class="[
      preview ? 'border-transparent' : 'border-white/15 bg-white/5 hover:border-purple-500/50',
      size === 'lg' ? 'aspect-square w-full' : 'aspect-square w-full'
    ]"
  >
    <input 
      type="file" 
      ref="fileInput" 
      class="hidden" 
      accept="image/*" 
      @change="handleFileChange" 
    />

    <img 
      v-if="preview" 
      :src="preview" 
      class="w-full h-full object-cover" 
    />
    
    <div v-else class="text-white/30 flex flex-col items-center">
      <PhotoIcon class="w-8 h-8" />
    </div>

    <!-- Remove Button -->
    <button 
      v-if="preview"
      @click="removeImage"
      class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      :class="{'opacity-100': true}" 
    >
      <XMarkIcon class="w-4 h-4" />
    </button>
  </div>
</template>
