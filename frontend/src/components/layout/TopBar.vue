<template>
  <header class="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
    <div class="flex items-center justify-between h-16 px-4 lg:px-6">
      <!-- Left: Mobile menu toggle + Breadcrumbs -->
      <div class="flex items-center gap-4">
        <!-- Mobile menu toggle -->
        <button
          @click="emit('toggle-sidebar')"
          class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon class="w-6 h-6 text-gray-600" />
        </button>

        <!-- Breadcrumbs -->
        <nav class="hidden md:flex items-center text-sm">
          <ol class="flex items-center space-x-2">
            <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
              <router-link
                v-if="index < breadcrumbs.length - 1"
                :to="crumb.path"
                class="text-gray-500 hover:text-primary-600 transition-colors"
              >
                {{ crumb.label }}
              </router-link>
              <span v-else class="text-gray-900 font-medium">{{ crumb.label }}</span>
              <ChevronRightIcon
                v-if="index < breadcrumbs.length - 1"
                class="w-4 h-4 text-gray-400 mx-2"
              />
            </li>
          </ol>
        </nav>

        <!-- Page title (mobile) -->
        <h1 class="md:hidden text-lg font-semibold text-gray-900">
          {{ currentPageTitle }}
        </h1>
      </div>

      <!-- Right: User menu -->
      <div class="flex items-center gap-4">
        <!-- Notifications (optional) -->
        <!-- <button
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
        >
          <BellIcon class="w-6 h-6 text-gray-600" />
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> -->

        <!-- User profile dropdown -->
        <div class="relative" v-click-outside="closeUserMenu">
          <button
            @click="toggleUserMenu"
            class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserCircleIcon class="w-8 h-8 text-gray-600" />
            <div class="hidden sm:block text-left">
              <p class="text-sm font-medium text-gray-900">{{ authStore.user?.username }}</p>
              <p class="text-xs text-gray-500 capitalize">{{ authStore.userRole }}</p>
            </div>
            <ChevronDownIcon
              :class="['w-4 h-4 text-gray-500 transition-transform', isUserMenuOpen && 'rotate-180']"
            />
          </button>

          <!-- Dropdown menu -->
          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-elevated border border-gray-200 py-1"
            >
              <router-link
                to="/profile"
                @click="closeUserMenu"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircleIcon class="w-5 h-5 text-gray-500" />
                Profile Settings
              </router-link>

              <div class="border-t border-gray-200 my-1"></div>

              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon class="w-5 h-5" />
                Logout
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  Bars3Icon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  // BellIcon,
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['toggle-sidebar']);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isUserMenuOpen = ref(false);

// Page titles mapping
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/query-history': 'Query History',
  '/admin': 'User Management',
  '/profile': 'Profile Settings',
};

// Current page title
const currentPageTitle = computed(() => {
  return pageTitles[route.path] || 'DPDC AMI';
});

// Generate breadcrumbs
const breadcrumbs = computed(() => {
  const crumbs = [];
  const pathArray = route.path.split('/').filter(p => p);

  // Always add home
  crumbs.push({ label: 'Home', path: '/dashboard' });

  // Add intermediate crumbs
  let currentPath = '';
  pathArray.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = pageTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path: currentPath });
  });

  return crumbs;
});

// Toggle user menu
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

// Close user menu
const closeUserMenu = () => {
  isUserMenuOpen.value = false;
};

// Handle logout
const handleLogout = async () => {
  closeUserMenu();
  await authStore.logout();
  router.push('/login');
};

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};
</script>
