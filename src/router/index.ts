import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/timeline'
    },
    {
      path: '/days',
      name: 'days',
      component: () => import('../views/DaysView.vue'),
      meta: {
        title: 'Days',
        icon: '📅'
      }
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('../views/TimelineView.vue'),
      meta: {
        title: 'Timeline',
        icon: '⏱️'
      }
    },
    {
      path: '/grid',
      name: 'grid',
      component: () => import('../views/GridView.vue'),
      meta: {
        title: 'Grid',
        icon: '📊'
      }
    },
    {
      path: '/speakers',
      name: 'speakers',
      component: () => import('../views/SpeakersView.vue'),
      meta: {
        title: 'Speakers',
        icon: '🎤'
      }
    },
    {
      path: '/favourites',
      name: 'favourites',
      component: () => import('../views/FavouritesView.vue'),
      meta: {
        title: 'Favourites',
        icon: '★'
      }
    }
  ]
})

// Update page title
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const title = to.meta?.title || 'Festival Manager'
  document.title = `${title} - Digital Health Festival Manager`
  next()
})

export default router