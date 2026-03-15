<template>
  <header
    :class="[
      'sticky top-0 z-30 bg-surface transition-all duration-300 ease-md-standard',
      isScrolled ? 'shadow-app-bar-elevated' : 'shadow-app-bar',
      'border-b border-outline-variant/20'
    ]"
  >
    <div class="flex items-center justify-between h-16 px-4 lg:px-6">
      <!-- Left: Mobile menu toggle + Breadcrumbs -->
      <div class="flex items-center gap-3">
        <!-- Mobile menu toggle -->
        <button
          @click="emit('toggle-sidebar')"
          class="lg:hidden icon-button hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] ripple"
          aria-label="Toggle menu"
        >
          <Bars3Icon class="w-6 h-6 text-on-surface-variant" />
        </button>

        <!-- Breadcrumbs (desktop) -->
        <nav class="hidden md:flex items-center">
          <ol class="flex items-center">
            <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
              <router-link
                v-if="index < breadcrumbs.length - 1"
                :to="crumb.path"
                class="text-sm font-medium text-on-surface-variant hover:text-primary-700 transition-colors duration-200"
              >
                {{ crumb.label }}
              </router-link>
              <span
                v-else
                class="text-sm font-semibold text-on-surface"
              >
                {{ crumb.label }}
              </span>
              <ChevronRightIcon
                v-if="index < breadcrumbs.length - 1"
                class="w-4 h-4 text-outline mx-2"
              />
            </li>
          </ol>
        </nav>

        <!-- Page title (mobile) -->
        <h1 class="md:hidden text-lg font-semibold text-on-surface tracking-tight">
          {{ currentPageTitle }}
        </h1>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2">
        <!-- Search button (optional) -->
        <!-- <button
          class="icon-button hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] ripple hidden sm:flex"
          aria-label="Search"
        >
          <MagnifyingGlassIcon class="w-5 h-5 text-on-surface-variant" />
        </button> -->

        <!-- Notifications (optional) -->
        <!-- <button
          class="icon-button hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12] ripple relative"
          aria-label="Notifications"
        >
          <BellIcon class="w-5 h-5 text-on-surface-variant" />
          <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
        </button> -->

        <!-- Divider -->
        <div class="hidden sm:block w-px h-8 bg-outline-variant/40 mx-1"></div>

        <!-- User profile dropdown -->
        <div class="relative" v-click-outside="closeUserMenu">
          <button
            @click="toggleUserMenu"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ease-md-standard ripple',
              'hover:bg-on-surface/[0.08] active:bg-on-surface/[0.12]',
              isUserMenuOpen && 'bg-on-surface/[0.08]'
            ]"
          >
            <!-- User Avatar -->
            <div class="relative">
              <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-sm font-bold text-primary-700">
                  {{ userInitials }}
                </span>
              </div>
              <!-- Online status indicator -->
              <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface"></div>
            </div>

            <!-- User info (desktop) -->
            <div class="hidden sm:block text-left">
              <p class="text-sm font-semibold text-on-surface leading-tight">{{ authStore.user?.username }}</p>
              <p class="text-xs text-on-surface-variant capitalize leading-tight">{{ authStore.userRole }}</p>
            </div>

            <!-- Dropdown arrow -->
            <ChevronDownIcon
              :class="[
                'w-4 h-4 text-on-surface-variant transition-transform duration-200 ease-md-standard hidden sm:block',
                isUserMenuOpen && 'rotate-180'
              ]"
            />
          </button>

          <!-- Dropdown menu -->
          <Transition
            enter-active-class="transition-all duration-200 ease-md-emphasized-decelerate"
            enter-from-class="opacity-0 scale-95 -translate-y-2"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-md-emphasized-accelerate"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-2"
          >
            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 mt-2 w-64 bg-surface rounded-2xl shadow-elevation-3 border border-outline-variant/30 overflow-hidden"
            >
              <!-- User info header -->
              <div class="px-4 py-4 bg-surface-container-low border-b border-outline-variant/30">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-lg font-bold text-primary-700">
                      {{ userInitials }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-on-surface truncate">{{ authStore.user?.username }}</p>
                    <p class="text-xs text-on-surface-variant truncate capitalize">{{ authStore.userRole }}</p>
                  </div>
                </div>
              </div>

              <!-- Menu items -->
              <div class="py-2">
                <router-link
                  to="/profile"
                  @click="closeUserMenu"
                  class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface
                         hover:bg-on-surface/[0.08] transition-colors duration-200 ripple"
                >
                  <UserCircleIcon class="w-5 h-5 text-on-surface-variant" />
                  Profile Settings
                </router-link>

                <!-- <router-link
                  to="/settings"
                  @click="closeUserMenu"
                  class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface
                         hover:bg-on-surface/[0.08] transition-colors duration-200 ripple"
                >
                  <Cog6ToothIcon class="w-5 h-5 text-on-surface-variant" />
                  Settings
                </router-link> -->
              </div>

              <!-- Logout section -->
              <div class="border-t border-outline-variant/30 py-2">
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-error
                         hover:bg-error/[0.08] transition-colors duration-200 ripple"
                >
                  <ArrowRightOnRectangleIcon class="w-5 h-5" />
                  Sign out
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  Bars3Icon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  // MagnifyingGlassIcon,
  // BellIcon,
  // Cog6ToothIcon,
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['toggle-sidebar']);

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isUserMenuOpen = ref(false);
const isScrolled = ref(false);

// Page titles mapping
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/rc-dc-dashboard': 'RC/DC Monitor',
  '/rc-in-progress': 'RC In Progress',
  '/ami-operational': 'AMI Operational',
  '/meter-wise-report': 'Meter Report',
  '/reports': 'Reports',
  '/nocs-balance-summary': 'NOCS Balance',
  '/customer-billing-details': 'Customer Billing',
  '/customer-details': 'Customer Details',
  '/crp-cpc': 'CPR-CPC',
  '/bill-stop': 'Bill Stop',
  '/bank-wise-collection': 'Bank Wise Collection',
  '/bank-reconciliation': 'Bank Reconciliation',
  '/nocs-collection-summary': 'NOCS Collection Summary',
  '/nocs-meter-installation': 'NOCS Meter Installation',
  '/query-history': 'Query History',
  '/admin': 'User Management',
  '/profile': 'Profile Settings',
};

// Current page title
const currentPageTitle = computed(() => {
  return pageTitles[route.path] || 'DPDC AMI';
});

// User initials
const userInitials = computed(() => {
  const username = authStore.user?.username || 'U';
  return username.slice(0, 2).toUpperCase();
});

// Generate breadcrumbs
const breadcrumbs = computed(() => {
  const crumbs = [];
  const pathArray = route.path.split('/').filter(p => p);

  // Always add home
  crumbs.push({ label: 'Home', path: '/dashboard' });

  // Add intermediate crumbs
  let currentPath = '';
  pathArray.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = pageTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
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

// Handle scroll for elevation change
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10;
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

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
