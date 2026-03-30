<template>
  <!-- Mobile Scrim/Overlay -->
  <Transition
    enter-active-class="scrim-enter-active"
    leave-active-class="scrim-leave-active"
  >
    <div
      v-if="isMobileOpen && isMobile"
      @click="closeMobile"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
    ></div>
  </Transition>

  <!-- Sidebar Drawer -->
  <aside
    :class="[
      'sidebar fixed top-0 left-0 h-full z-50 flex flex-col',
      'bg-surface border-r border-outline-variant/30',
      'transition-all duration-300 ease-md-emphasized',
      // Width based on collapsed state
      isCollapsed ? 'w-20' : 'w-72',
      // Mobile behavior
      isMobile ? (isMobileOpen ? 'translate-x-0 shadow-drawer' : '-translate-x-full') : 'translate-x-0',
      // Desktop always visible with elevation
      !isMobile && 'shadow-elevation-2'
    ]"
  >
    <!-- Logo/Brand Header -->
    <div
      :class="[
        'flex items-center h-16 border-b border-outline-variant/30 flex-shrink-0',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      ]"
    >
      <router-link
        to="/dashboard"
        class="flex items-center gap-3 group"
      >
        <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 group-hover:bg-primary-200 transition-colors duration-200">
          <ChartBarIcon class="w-6 h-6 text-primary-700" />
        </div>
        <Transition
          enter-active-class="transition-all duration-300 ease-md-emphasized-decelerate"
          enter-from-class="opacity-0 -translate-x-2"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200 ease-md-emphasized-accelerate"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-2"
        >
          <span
            v-if="!isCollapsed"
            class="font-bold text-lg text-on-surface tracking-tight"
          >
            DPDC AMI
          </span>
        </Transition>
      </router-link>

      <!-- Collapse Toggle Button (desktop only) -->
      <button
        v-if="!isMobile && !isCollapsed"
        @click="toggleCollapse"
        class="icon-button hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12]"
        title="Collapse sidebar"
      >
        <ChevronLeftIcon class="w-5 h-5 text-on-surface-variant" />
      </button>
    </div>

    <!-- Expand Button (when collapsed) -->
    <div v-if="isCollapsed && !isMobile" class="flex justify-center py-2 border-b border-outline-variant/30">
      <button
        @click="toggleCollapse"
        class="icon-button hover:bg-primary-50"
        title="Expand sidebar"
      >
        <ChevronRightIcon class="w-5 h-5 text-on-surface-variant" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-2">
      <ul :class="[isCollapsed ? 'px-2 space-y-1' : 'px-3 space-y-1']">
        <template v-for="item in visibleNavItems" :key="item.path || item.label">
          <!-- Grouped Menu Items -->
          <li v-if="item.children" class="mb-1">
            <!-- Category Header -->
            <button
              @click="toggleGroup(item.label)"
              :class="[
                'w-full flex items-center gap-3 rounded-xl transition-all duration-200 ease-md-standard ripple',
                isCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3',
                'hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12]',
                'text-on-surface-variant group relative'
              ]"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="item.icon"
                  class="w-6 h-6 flex-shrink-0"
                />
                <span v-if="!isCollapsed" class="font-medium text-sm">{{ item.label }}</span>
              </div>
              <ChevronDownIcon
                v-if="!isCollapsed"
                :class="[
                  'w-5 h-5 transition-transform duration-300 ease-md-standard',
                  expandedGroups[item.label] ? 'rotate-180' : ''
                ]"
              />

              <!-- Tooltip for collapsed state -->
              <div
                v-if="isCollapsed"
                class="absolute left-full ml-3 px-3 py-2 bg-on-surface text-surface text-sm rounded-lg
                       opacity-0 invisible group-hover:opacity-100 group-hover:visible
                       transition-all duration-200 whitespace-nowrap z-50 shadow-elevation-2
                       pointer-events-none"
              >
                {{ item.label }}
                <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-on-surface rotate-45"></div>
              </div>
            </button>

            <!-- Submenu Items -->
            <Transition
              enter-active-class="transition-all duration-300 ease-md-emphasized-decelerate"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-active-class="transition-all duration-200 ease-md-emphasized-accelerate"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <ul
                v-if="!isCollapsed && expandedGroups[item.label]"
                class="ml-4 mt-1 space-y-1 overflow-hidden"
              >
                <li v-for="child in item.children" :key="child.path">
                  <router-link
                    :to="child.path"
                    :class="[
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ease-md-standard ripple',
                      'group relative',
                      isActive(child.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-on-surface-variant hover:bg-on-surface/[0.08]'
                    ]"
                  >
                    <!-- Active Indicator -->
                    <div
                      v-if="isActive(child.path)"
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-700 rounded-full"
                    ></div>
                    <div :class="[
                      'w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200',
                      isActive(child.path) ? 'bg-primary-700' : 'bg-outline group-hover:bg-primary-500'
                    ]"></div>
                    <span class="text-sm font-medium truncate">{{ child.label }}</span>
                  </router-link>
                </li>
              </ul>
            </Transition>
          </li>

          <!-- Regular Menu Items -->
          <li v-else>
            <router-link
              :to="item.path"
              :class="[
                'flex items-center gap-3 rounded-xl transition-all duration-200 ease-md-standard ripple',
                isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
                'group relative',
                isActive(item.path)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-on-surface-variant hover:bg-on-surface/[0.08]'
              ]"
            >
              <!-- Active Indicator Bar -->
              <div
                v-if="isActive(item.path) && !isCollapsed"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-700 rounded-full"
              ></div>

              <component
                :is="item.icon"
                :class="[
                  'w-6 h-6 flex-shrink-0 transition-all duration-200',
                  isActive(item.path) ? 'text-primary-700' : 'text-on-surface-variant group-hover:text-primary-600'
                ]"
              />
              <span v-if="!isCollapsed" class="font-medium text-sm truncate">{{ item.label }}</span>

              <!-- Tooltip for collapsed state -->
              <div
                v-if="isCollapsed"
                class="absolute left-full ml-3 px-3 py-2 bg-on-surface text-surface text-sm rounded-lg
                       opacity-0 invisible group-hover:opacity-100 group-hover:visible
                       transition-all duration-200 whitespace-nowrap z-50 shadow-elevation-2
                       pointer-events-none"
              >
                {{ item.label }}
                <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-on-surface rotate-45"></div>
              </div>
            </router-link>
          </li>
        </template>
      </ul>
    </nav>

    <!-- User Profile Section -->
    <div class="border-t border-outline-variant/30 p-3 flex-shrink-0">
      <router-link
        to="/profile"
        :class="[
          'flex items-center gap-3 rounded-xl transition-all duration-200 ease-md-standard ripple',
          isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
          'hover:bg-on-surface/[0.08] group relative'
        ]"
      >
        <div class="relative">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <UserCircleIcon class="w-6 h-6 text-primary-700" />
          </div>
          <!-- Online indicator -->
          <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface"></div>
        </div>
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-on-surface truncate">{{ authStore.user?.username }}</p>
          <p class="text-xs text-on-surface-variant truncate capitalize">{{ authStore.userRole }}</p>
        </div>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-3 px-3 py-2 bg-on-surface text-surface text-sm rounded-lg
                 opacity-0 invisible group-hover:opacity-100 group-hover:visible
                 transition-all duration-200 whitespace-nowrap z-50 shadow-elevation-2
                 pointer-events-none"
        >
          {{ authStore.user?.username }}
          <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-on-surface rotate-45"></div>
        </div>
      </router-link>

      <!-- Logout button -->
      <button
        @click="handleLogout"
        :class="[
          'w-full flex items-center gap-3 rounded-xl transition-all duration-200 ease-md-standard mt-2 ripple',
          isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
          'text-error hover:bg-error/[0.08] active:bg-error/[0.12] group relative'
        ]"
      >
        <ArrowRightOnRectangleIcon class="w-6 h-6 flex-shrink-0" />
        <span v-if="!isCollapsed" class="font-medium text-sm">Logout</span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-3 px-3 py-2 bg-on-surface text-surface text-sm rounded-lg
                 opacity-0 invisible group-hover:opacity-100 group-hover:visible
                 transition-all duration-200 whitespace-nowrap z-50 shadow-elevation-2
                 pointer-events-none"
        >
          Logout
          <div class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-on-surface rotate-45"></div>
        </div>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BoltIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  StopCircleIcon,
  ShoppingCartIcon,
  CircleStackIcon,
  BookOpenIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'collapse-change']);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isCollapsed = ref(false);
const isMobileOpen = computed(() => props.modelValue);
const isMobile = ref(window.innerWidth < 1024);
const expandedGroups = ref({});

// Navigation items
const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: ChartBarIcon,
  },
  {
    path: '/rc-dc-dashboard',
    label: 'RC/DC Monitor',
    icon: BoltIcon,
  },
  {
    path: '/rc-in-progress',
    label: 'RC In Progress',
    icon: ClockIcon,
  },
  {
    path: '/ami-operational',
    label: 'AMI Operational',
    icon: CpuChipIcon,
  },
  {
    path: '/meter-wise-report',
    label: 'Meter Report',
    icon: TableCellsIcon,
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: DocumentTextIcon,
  },
  {
    path: '/nocs-balance-summary',
    label: 'NOCS Balance',
    icon: CurrencyDollarIcon,
  },
  {
    path: '/customer-billing-details',
    label: 'Customer Billing',
    icon: DocumentTextIcon,
  },
  {
    path: '/customer-details',
    label: 'Customer Details',
    icon: UserGroupIcon,
  },
  {
    path: '/crp-cpc',
    label: 'CPR-CPC',
    icon: UserGroupIcon,
  },
  {
    label: 'Bill Stop',
    icon: StopCircleIcon,
    children: [
      {
        path: '/bill-stop',
        label: 'Bill Stop Analysis',
      },
      {
        path: '/bill-stop-customers',
        label: 'Bill Stop Customers',
      },
    ],
  },
  // Collection & Vending grouped menu
  {
    label: 'Collection & Vending',
    icon: ShoppingCartIcon,
    children: [
      {
        path: '/bank-wise-collection',
        label: 'Bank Wise Collection',
      },
      {
        path: '/bank-reconciliation',
        label: 'Data for Bank Reconciliation',
      },
      {
        path: '/nocs-collection-summary',
        label: 'NOCS Total Collection Summary',
      },
      {
        path: '/nocs-meter-installation',
        label: 'NOCS Wise Meter Installation',
      },
    ],
  },
  // Reference Docs grouped menu
  {
    label: 'Reference Docs',
    icon: BookOpenIcon,
    children: [
      {
        path: '/db-reference',
        label: 'DB Reference (2,942 Tables)',
      },
      {
        path: '/c2m-operations-manual',
        label: 'C2M Operations Manual',
      },
    ],
  },
  {
    path: '/query-history',
    label: 'History',
    icon: ClockIcon,
  },
  {
    path: '/admin',
    label: 'Admin',
    icon: UserGroupIcon,
    requiresPermission: 'can_manage_users',
  },
];

// Filter navigation items based on permissions AND dynamic page access config
const visibleNavItems = computed(() => {
  return navItems
    .map(item => {
      // Group item: filter children, hide group if none accessible
      if (item.children) {
        const visibleChildren = item.children.filter(child => {
          const routeName = child.path.slice(1);
          return authStore.canAccessPage(routeName);
        });
        return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
      }
      return item;
    })
    .filter(item => {
      if (!item) return false;
      if (item.requiresPermission && !authStore.hasPermission(item.requiresPermission)) return false;
      if (item.path) {
        const routeName = item.path.slice(1);
        return authStore.canAccessPage(routeName);
      }
      return true;
    });
});

// Check if route is active
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// Toggle group expansion
const toggleGroup = (groupLabel) => {
  expandedGroups.value[groupLabel] = !expandedGroups.value[groupLabel];
};

// Toggle collapsed state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse-change', isCollapsed.value);
};

// Close mobile sidebar
const closeMobile = () => {
  emit('update:modelValue', false);
  emit('close');
};

// Handle logout
const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Handle window resize
const handleResize = () => {
  isMobile.value = window.innerWidth < 1024;
  if (!isMobile.value) {
    emit('update:modelValue', false);
  }
};

// Auto-expand group if child route is active
const autoExpandActiveGroup = () => {
  navItems.forEach(item => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => isActive(child.path));
      if (hasActiveChild) {
        expandedGroups.value[item.label] = true;
      }
    }
  });
};

// Watch for route changes to auto-expand groups
watch(() => route.path, () => {
  autoExpandActiveGroup();
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  autoExpandActiveGroup();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* Custom scrollbar for navigation */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Smooth max-height transition for submenu */
.max-h-0 {
  max-height: 0;
}

.max-h-96 {
  max-height: 24rem;
}
</style>
