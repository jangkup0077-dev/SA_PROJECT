<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterStore } from '@/stores/register'
import GameTag from '@/components/GameTag.vue'
import api from '@/services/api'

const router = useRouter()
const registerStore = useRegisterStore()

const searchQuery = ref('')

const allTags = ref<string[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/profile/all-games')
    allTags.value = res.data.map((game: any) => game.game_name)
  } catch (error) {
    console.error('Failed to load games from DB', error)
    allTags.value = ['ROV', 'Hayday', 'PubG', 'Valorant', 'CS2', 'League of Legends']
  } finally {
    loading.value = false
  }
})

const filteredTags = computed(() => {
  if (!searchQuery.value.trim()) return allTags.value
  const q = searchQuery.value.toLowerCase()
  return allTags.value.filter(tag => tag.toLowerCase().includes(q))
})

const isSelected = (tag: string) => registerStore.selectedTags.includes(tag)

const toggleTag = (tag: string) => {
  registerStore.toggleTag(tag)
}

const goBack = () => {
  router.push('/register/profile')
}

const handleNext = () => {
  router.push('/register/photos')
}
</script>

<template>
  <div class="min-h-screen flex flex-col p-4">
    <button
      @click="goBack"
      id="tags-back-button"
      class="w-10 h-10 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mt-2 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>

    <div class="flex-1 flex items-center justify-center">
      <div class="w-full max-w-sm flex flex-col items-center">

        <div class="w-20 h-20 rounded-full bg-[var(--color-input-bg)] flex items-center justify-center mb-8 shadow-lg shadow-purple-500/10">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.566 3.176 1.127 4.674C8.157 12.96 9.632 14.7 12 14.7c2.368 0 3.843-1.74 4.493-3.646a24.226 24.226 0 001.127-4.674 48.39 48.39 0 01-4.163.3.64.64 0 01-.657-.643zM12 14.7v3.55m0 0h2.25m-2.25 0H9.75m6-6.75h.008v.008h-.008V11.7zm-6 0h.008v.008H9.75V11.7z" />
          </svg>
        </div>

        <div class="w-full mb-6">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              v-model="searchQuery"
              id="tags-search"
              type="text"
              class="w-full pl-11 pr-4 py-3.5 bg-[var(--color-input-bg)] border border-white/5 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 text-sm"
              placeholder="Search games..."
            />
          </div>
        </div>

        <div class="w-full flex flex-wrap gap-3 mb-8">
          <div v-if="loading" class="text-gray-500 text-sm w-full text-center mt-4">กำลังโหลดรายชื่อเกม...</div>
          
          <GameTag
            v-else
            v-for="tag in filteredTags"
            :key="tag"
            :name="tag"
            :selected="isSelected(tag)"
            @toggle="toggleTag(tag)"
          />
        </div>

        <button
          @click="handleNext"
          id="tags-next-button"
          class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-sm"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>