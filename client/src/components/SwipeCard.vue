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
const isTransitioning = ref(false)

const profileImages = computed(() => {
  const imgs = props.profile?.profile_image_url
  if (Array.isArray(imgs) && imgs.length > 0) {
    return imgs
  }
  return ['https://ui-avatars.com/api/?name=User&background=random']
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
    return {
      transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
      transition: isTransitioning.value ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
    }
  }

  const rotate = (currentX.value / windowWidth.value) * 15
  return {
    transform: `translate(${currentX.value}px, ${currentY.value}px) rotate(${rotate}deg)`,
    transition: isTransitioning.value ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
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
        isTransitioning.value = true
        
        if (clientX > windowWidth.value / 2) {
          currentImageIndex.value = (currentImageIndex.value + 1) % profileImages.value.length
        } else {
          currentImageIndex.value = (currentImageIndex.value - 1 + profileImages.value.length) % profileImages.value.length
        }

        setTimeout(() => { isTransitioning.value = false }, 300)
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

const onImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = '/placeholder-avatar.png'
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
    class="absolute inset-0 w-full h-full overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-gm-panel flex flex-col will-change-transform select-none touch-none rounded-[12px] border border-transparent"
    :style="transformStyle"
    @pointerdown="onStart"
    @pointermove="onMove"
    @pointerup="onEnd"
    @pointercancel="onEnd"
  >
    <!-- Photo Dots Indicator -->
    <div v-if="profileImages.length > 1" class="absolute top-4 left-3 right-3 flex gap-1.5 z-30 pointer-events-none px-1">
      <div 
        v-for="(img, idx) in profileImages" 
        :key="idx"
        class="h-[3px] flex-1 rounded-full transition-all duration-300 shadow-sm"
        :class="idx === currentImageIndex ? 'bg-white opacity-100' : 'bg-white/30 opacity-60'"
      ></div>
    </div>

    <!-- Profile Photo -->
    <div class="absolute inset-0 z-0 pointer-events-none">
      <img
        :src="avatarSrc"
        @error="onImgError"
        alt="Avatar"
        class="w-full h-full object-cover"
        :class="{ 'transition-opacity duration-300': isTransitioning }"
        draggable="false"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
    </div>

    <!-- LIKE Stamp -->
    <div
      class="absolute top-14 left-6 z-20 pointer-events-none transform -rotate-12 border-[4px] border-emerald-400 text-emerald-400 rounded-xl px-5 py-1.5 text-3xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(52,211,153,0.3)]"
      :style="{ opacity: likeOpacity }"
    >
      LIKE
    </div>
    <!-- PASS Stamp -->
    <div
      class="absolute top-14 right-6 z-20 pointer-events-none transform rotate-12 border-[4px] border-rose-500 text-rose-500 rounded-xl px-5 py-1.5 text-3xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)]"
      :style="{ opacity: passOpacity }"
    >
      PASS
    </div>

    <!-- Profile Info Overlay -->
    <div class="relative z-10 flex flex-col justify-end h-full p-6 pb-28 pointer-events-none text-left">
      <!-- Name + Age -->
      <h2 class="text-3xl font-bold flex items-baseline gap-2.5 text-white drop-shadow-lg">
        {{ profile.name || 'Unknown' }}
        <span v-if="computedAge" class="text-xl font-normal text-gray-300">{{ computedAge }}</span>
      </h2>

      <!-- Country -->
      <div v-if="profile.country" class="flex items-center gap-1.5 mt-1.5">
        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-sm text-gray-400">{{ profile.country }}</span>
      </div>

      <!-- Game Tags -->
      <div v-if="profile.games?.length" class="flex flex-wrap gap-1.5 mt-3">
        <span
          v-for="g in profile.games?.slice(0, 4)"
          :key="g.id"
          class="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold text-gray-200 shadow-sm"
        >
          🎮 {{ g.game_name }}
        </span>
        <span v-if="(profile.games?.length || 0) > 4" class="px-2.5 py-1 bg-white/5 rounded-full text-xs text-gray-400 font-medium">
          +{{ profile.games.length - 4 }} more
        </span>
      </div>

      <!-- Bio -->
      <p v-if="profile.bio" class="mt-3 text-gray-400 line-clamp-2 text-sm leading-relaxed">
        {{ profile.bio }}
      </p>
    </div>
  </div>
</template>