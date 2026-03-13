import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/register/profile',
      name: 'registerProfile',
      component: () => import('../views/RegisterProfileView.vue')
    },
    {
      path: '/register/tags',
      name: 'registerTags',
      component: () => import('../views/RegisterTagsView.vue')
    },
    {
      path: '/register/photos',
      name: 'registerPhotos',
      component: () => import('../views/RegisterPhotosView.vue')
    },
    {
      path: '/setup-profile',
      name: 'setupProfile',
      component: () => import('../views/SetupProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/discover',
      name: 'discover',
      component: () => import('../views/DiscoverView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/matches',
      name: 'matches',
      component: () => import('../views/MatchesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chat/:matchId',
      name: 'chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:userId?',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Try to re-hydrate state if token exists but user object is missing
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }

  const isAuth = authStore.isAuthenticated && !!authStore.user

  if (to.meta.requiresAuth && !isAuth) {
    return '/login'
  } else if ((to.name === 'login' || to.path.startsWith('/register')) && isAuth) {
    return '/discover'
  }
  // Allow navigation by returning nothing
})

export default router
