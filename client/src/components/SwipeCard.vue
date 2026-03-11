<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{
  profile: any
  isActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'swiped', direction: 'LEFT' | 'RIGHT', profileId: number): void
}>()

const cardRef = ref<HTMLElement | null>(null)

const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const currentY = ref(0)

const windowWidth = ref(window.innerWidth)
const SWIPE_THRESHOLD = 120

const currentImageIndex = ref(0)

const profileImages = computed(() => {
  const imgs = props.profile?.profile_image_url
  if (Array.isArray(imgs) && imgs.length > 0) {
    return imgs
  }
  return ['/placeholder-avatar.png']
})

const avatarSrc = computed(() => {
  return profileImages.value[currentImageIndex.value]
})

const computedAge = computed(() => {
  if (!props.profile?.birth_date) return ''
  const dob = new Date(props.profile.birth_date)
  const ageDifMs = Date.now() - dob.getTime()
  const ageDate = new Date(ageDifMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
})

const transformStyle = computed(() => {
  if (!props.isActive) return {}

  if (!isDragging.value && currentX.value === 0) {
    return { transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }
  }

  const rotate = (currentX.value / windowWidth.value) * 35
  return {
    transform: `translate3d(${currentX.value}px, ${currentY.value}px, 0) rotate(${rotate}deg)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
  }
})

const likeOpacity = computed(() => {
  if (currentX.value <= 0) return 0
  return Math.min(currentX.value / (SWIPE_THRESHOLD * 1.5), 1)
})

const passOpacity = computed(() => {
  if (currentX.value >= 0) return 0
  return Math.min(Math.abs(currentX.value) / (SWIPE_THRESHOLD * 1.5), 1)
})

const onStart = (e: PointerEvent) => {
  if (!props.isActive) return
  isDragging.value = true
  startX.value = e.clientX - currentX.value
  startY.value = e.clientY - currentY.value
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

const onMove = (e: PointerEvent) => {
  if (!isDragging.value || !props.isActive) return
  e.preventDefault()
  currentX.value = e.clientX - startX.value
  currentY.value = e.clientY - startY.value
}

const onEnd = (e: PointerEvent) => {
  if (!isDragging.value || !props.isActive) return
  isDragging.value = false
  
  if (currentX.value > SWIPE_THRESHOLD) {
    triggerSwipe('RIGHT')
  } else if (currentX.value < -SWIPE_THRESHOLD) {
    triggerSwipe('LEFT')
  } else {
    if (Math.abs(currentX.value) < 10 && Math.abs(currentY.value) < 10) {
      if (profileImages.value.length > 1) {
        const clientX = e.clientX
        
        if (clientX > windowWidth.value / 2) {
          currentImageIndex.value = (currentImageIndex.value + 1) % profileImages.value.length
        } else {
          currentImageIndex.value = (currentImageIndex.value - 1 + profileImages.value.length) % profileImages.value.length
        }
      }
    }
    
    currentX.value = 0
    currentY.value = 0
  }
}

const triggerSwipe = (direction: 'LEFT' | 'RIGHT') => {
  const throwDistance = windowWidth.value * 1.5
  currentX.value = direction === 'RIGHT' ? throwDistance : -throwDistance
  setTimeout(() => {
    emit('swiped', direction, props.profile.id)
  }, 150)
}

const handleResize = () => { windowWidth.value = window.innerWidth }

onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div
    ref="cardRef"
    class="absolute inset-0 w-full h-full overflow-hidden shadow-2xl bg-[#1e2330] flex flex-col will-change-transform select-none touch-none"
    :style="transformStyle"
    @pointerdown="onStart"
    @pointermove="onMove"
    @pointerup="onEnd"
    @pointercancel="onEnd"
  >
    <div v-if="profileImages.length > 1" class="absolute top-3 left-2 right-2 flex gap-1 z-30 pointer-events-none px-1">
      <div 
        v-for="(img, idx) in profileImages" 
        :key="idx"
        class="h-1 flex-1 rounded-full bg-white transition-opacity duration-300 shadow-sm"
        :class="idx === currentImageIndex ? 'opacity-100' : 'opacity-30'"
      ></div>
    </div>

    <div class="absolute inset-0 z-0 pointer-events-none">
      <img :src="avatarSrc" alt="Avatar" class="w-full h-full object-cover" draggable="false" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"></div>
    </div>

    <div
      class="absolute top-12 left-6 z-20 pointer-events-none transform -rotate-12 border-[4px] border-emerald-400 text-emerald-400 rounded-xl px-4 py-1 text-3xl font-black uppercase tracking-widest"
      :style="{ opacity: likeOpacity }"
    >
      LIKE
    </div>
    <div
      class="absolute top-12 right-6 z-20 pointer-events-none transform rotate-12 border-[4px] border-rose-500 text-rose-500 rounded-xl px-4 py-1 text-3xl font-black uppercase tracking-widest"
      :style="{ opacity: passOpacity }"
    >
      PASS
    </div>

    <div class="relative z-10 flex flex-col justify-end h-full p-5 pb-24 pointer-events-none text-left">
      <h2 class="text-2xl font-bold flex items-baseline gap-2 text-white">
        {{ profile.name || 'Unknown' }}
        <span v-if="computedAge" class="text-lg font-normal text-gray-300">{{ computedAge }}</span>
      </h2>

      <div v-if="profile.games?.length" class="flex flex-wrap gap-1.5 mt-2">
        <span
          v-for="g in profile.games?.slice(0, 4)"
          :key="g.id"
          class="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-xs font-semibold text-gray-200"
        >
          {{ g.game_name }}
        </span>
        <span v-if="(profile.games?.length || 0) > 4" class="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-400">
          +{{ profile.games.length - 4 }}
        </span>
      </div>

      <p v-if="profile.bio" class="mt-2 text-gray-400 line-clamp-2 text-sm leading-relaxed">
        {{ profile.bio }}
      </p>
    </div>
  </div>
</template>