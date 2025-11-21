import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, hideNavbar: true }
    },
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rc-dc-dashboard',
      name: 'rc-dc-dashboard',
      component: () => import('@/views/RCDCDashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/meter-wise-report',
      name: 'meter-wise-report',
      component: () => import('@/views/MeterWiseReportView.vue'),
      meta: { requiresAuth: true }
    },
    // Temporarily disabled - will be updated later
    // {
    //   path: '/nocs-due-summary',
    //   name: 'nocs-due-summary',
    //   component: () => import('@/views/NocsDueSummaryView.vue'),
    //   meta: { requiresAuth: true }
    // },
    {
      path: '/rc-in-progress',
      name: 'rc-in-progress',
      component: () => import('@/views/RCInProgressDetailedView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ami-operational',
      name: 'ami-operational',
      component: () => import('@/views/AMIOperationalView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/query-history',
      name: 'query-history',
      component: () => import('@/views/QueryHistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: {
        requiresAuth: true,
        requiresPermission: 'can_manage_users'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Initialize auth from localStorage
  if (!authStore.isAuthenticated) {
    authStore.initializeAuth();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresPermission = to.meta.requiresPermission;

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Redirect to dashboard if already logged in
    next({ name: 'dashboard' });
  } else if (requiresPermission && !authStore.hasPermission(requiresPermission)) {
    // Redirect to dashboard if no permission
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
