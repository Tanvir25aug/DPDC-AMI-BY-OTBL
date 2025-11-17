<template>
  <aside
    :class="[
      'sidebar fixed top-0 left-0 h-full bg-white shadow-sidebar transition-smooth duration-400 z-50',
      isCollapsed ? 'w-16' : 'w-72',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Logo/Brand -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
      <router-link
        to="/dashboard"
        class="flex items-center gap-3 font-bold text-lg text-primary-700 hover:text-primary-800 transition-colors"
      >
        <ChartBarIcon class="w-8 h-8 text-primary-500" />
        <span v-if="!isCollapsed" class="truncate">DPDC AMI</span>
      </router-link>

      <!-- Collapse button (desktop only) -->
      <button
        v-if="!isMobile"
        @click="toggleCollapse"
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:block hidden"
      >
        <ChevronLeftIcon v-if="!isCollapsed" class="w-5 h-5 text-gray-600" />
        <ChevronRightIcon v-else class="w-5 h-5 text-gray-600" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
      <ul class="space-y-1">
        <li v-for="item in visibleNavItems" :key="item.path">
          <router-link
            :to="item.path"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth duration-300',
              'hover:bg-primary-50 group relative transform hover:translate-x-1',
              isActive(item.path)
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md'
                : 'text-gray-700 hover:text-primary-700'
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'w-6 h-6 flex-shrink-0 transition-smooth duration-300 transform group-hover:scale-110',
                isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-primary-500'
              ]"
            />
            <span v-if="!isCollapsed" class="font-medium truncate">{{ item.label }}</span>

            <!-- Tooltip for collapsed state -->
            <div
              v-if="isCollapsed"
              class="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
            >
              {{ item.label }}
            </div>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- User Profile Section -->
    <div class="border-t border-gray-200 p-4">
      <router-link
        to="/profile"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
          'hover:bg-gray-100 group relative'
        ]"
      >
        <UserCircleIcon class="w-8 h-8 text-gray-600 group-hover:text-primary-500 flex-shrink-0" />
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.username }}</p>
          <p class="text-xs text-gray-500 truncate capitalize">{{ authStore.userRole }}</p>
        </div>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
        >
          {{ authStore.user?.username }}
        </div>
      </router-link>

      <!-- Logout button -->
      <button
        @click="handleLogout"
        :class="[
          'w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg transition-all duration-200',
          'text-red-600 hover:bg-red-50 group relative'
        ]"
      >
        <ArrowRightOnRectangleIcon class="w-6 h-6 flex-shrink-0" />
        <span v-if="!isCollapsed" class="font-medium">Logout</span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
        >
          Logout
        </div>
      </button>
    </div>
  </aside>

  <!-- Mobile overlay -->
  <div
    v-if="isMobileOpen && isMobile"
    @click="closeMobile"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade-in"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
  BoltIcon,
  TableCellsIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isCollapsed = ref(false);
const isMobileOpen = computed(() => props.modelValue);
const isMobile = ref(window.innerWidth < 1024);

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

// Filter navigation items based on permissions
const visibleNavItems = computed(() => {
  return navItems.filter(item => {
    if (item.requiresPermission) {
      return authStore.hasPermission(item.requiresPermission);
    }
    return true;
  });
});

// Check if route is active
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// Toggle collapsed state
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
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

onMounted(() => {
  window.addEventListener('resize', handleResize);
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
  background: #d1d5db;
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
