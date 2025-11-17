<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-5xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p class="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <!-- Profile Card with Tabs -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Profile Header Banner -->
        <div class="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div class="absolute -bottom-16 left-8">
            <div class="w-32 h-32 bg-white rounded-2xl shadow-xl p-1">
              <div class="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- User Info Section -->
        <div class="pt-20 px-8 pb-6 border-b border-gray-200">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">{{ authStore.user?.username }}</h2>
              <p class="text-gray-600 mt-1">{{ authStore.user?.email }}</p>
            </div>
            <div class="mt-4 md:mt-0 flex gap-3">
              <span :class="[
                'px-4 py-2 rounded-xl font-semibold text-sm',
                authStore.user?.is_active
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              ]">
                {{ authStore.user?.is_active ? 'Active' : 'Inactive' }}
              </span>
              <span class="px-4 py-2 rounded-xl font-semibold text-sm bg-indigo-100 text-indigo-700 border border-indigo-200 capitalize">
                {{ authStore.userRole }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="px-8 pt-6">
          <div class="flex gap-2 border-b border-gray-200">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="p-8">
          <!-- Account Information Tab -->
          <div v-show="activeTab === 'info'" class="animate-fade-in">
            <h3 class="text-lg font-bold text-gray-900 mb-6">Account Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Username -->
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-600 mb-1">Username</p>
                    <p class="text-lg font-semibold text-gray-900">{{ authStore.user?.username }}</p>
                  </div>
                </div>
              </div>

              <!-- Email -->
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-600 mb-1">Email Address</p>
                    <p class="text-lg font-semibold text-gray-900">{{ authStore.user?.email || 'Not set' }}</p>
                  </div>
                </div>
              </div>

              <!-- Role -->
              <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-600 mb-1">User Role</p>
                    <p class="text-lg font-semibold text-gray-900 capitalize">{{ authStore.userRole }}</p>
                  </div>
                </div>
              </div>

              <!-- Last Login -->
              <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-600 mb-1">Last Login</p>
                    <p class="text-lg font-semibold text-gray-900">{{ formatDate(authStore.user?.last_login) }}</p>
                  </div>
                </div>
              </div>

              <!-- Member Since -->
              <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100 md:col-span-2">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-600 mb-1">Member Since</p>
                    <p class="text-lg font-semibold text-gray-900">{{ formatDate(authStore.user?.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Change Password Tab -->
          <div v-show="activeTab === 'password'" class="animate-fade-in">
            <h3 class="text-lg font-bold text-gray-900 mb-6">Change Password</h3>
            <div class="max-w-2xl">
              <form @submit.prevent="handleChangePassword" class="space-y-6">
                <!-- Current Password -->
                <div>
                  <label for="currentPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div class="relative">
                    <input
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      class="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      @click="showCurrentPassword = !showCurrentPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg v-if="!showCurrentPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- New Password -->
                <div>
                  <label for="newPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div class="relative">
                    <input
                      id="newPassword"
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      class="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg v-if="!showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                  <p class="mt-2 text-sm text-gray-600">
                    At least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <!-- Confirm Password -->
                <div>
                  <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div class="relative">
                    <input
                      id="confirmPassword"
                      v-model="passwordForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg v-if="!showConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <p class="text-sm font-medium text-red-800">{{ error }}</p>
                </div>

                <!-- Success Message -->
                <div v-if="success" class="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <p class="text-sm font-medium text-green-800">{{ success }}</p>
                </div>

                <!-- Submit Button -->
                <div class="flex gap-3">
                  <button
                    type="submit"
                    :disabled="loading"
                    class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ loading ? 'Changing...' : 'Change Password' }}</span>
                  </button>
                  <button
                    type="button"
                    @click="resetPasswordForm"
                    class="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Permissions Tab -->
          <div v-show="activeTab === 'permissions'" class="animate-fade-in">
            <h3 class="text-lg font-bold text-gray-900 mb-6">Your Permissions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(value, key) in authStore.userPermissions"
                :key="key"
                :class="[
                  'p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md',
                  value
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                ]"
              >
                <div class="flex items-center gap-3">
                  <div :class="[
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    value ? 'bg-green-500' : 'bg-gray-400'
                  ]">
                    <svg v-if="value" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p :class="['font-semibold text-sm', value ? 'text-green-900' : 'text-gray-600']">
                      {{ formatPermission(key) }}
                    </p>
                    <p :class="['text-xs', value ? 'text-green-600' : 'text-gray-500']">
                      {{ value ? 'Granted' : 'Not granted' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Tab state
const activeTab = ref('info');

// Tab icons (as components)
const UserIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
]);

const LockIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' })
]);

const ShieldIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
]);

const tabs = [
  { id: 'info', label: 'Profile Info', icon: UserIcon },
  { id: 'password', label: 'Change Password', icon: LockIcon },
  { id: 'permissions', label: 'Permissions', icon: ShieldIcon }
];

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const loading = ref(false);
const error = ref(null);
const success = ref(null);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const handleChangePassword = async () => {
  error.value = null;
  success.value = null;

  // Validate passwords match
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error.value = 'New passwords do not match';
    return;
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(passwordForm.value.newPassword)) {
    error.value = 'Password does not meet requirements';
    return;
  }

  loading.value = true;

  const result = await authStore.changePassword({
    currentPassword: passwordForm.value.currentPassword,
    newPassword: passwordForm.value.newPassword
  });

  loading.value = false;

  if (result.success) {
    success.value = 'Password changed successfully';
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } else {
    error.value = result.message;
  }
};

const resetPasswordForm = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  error.value = null;
  success.value = null;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

const formatPermission = (key) => {
  return key
    .replace(/can_/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
