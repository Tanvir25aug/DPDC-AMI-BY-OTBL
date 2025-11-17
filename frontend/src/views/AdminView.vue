<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8 animate-slide-down">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-4xl font-bold text-gray-900">User Management</h1>
            <p class="text-gray-600 mt-1">Manage users, roles, and permissions</p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-slide-up" style="animation-delay: 0ms">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">Total Users</p>
              <p class="text-3xl font-bold text-gray-900">{{ pagination.total || 0 }}</p>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-slide-up" style="animation-delay: 100ms">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">Active Users</p>
              <p class="text-3xl font-bold text-green-600">{{ users.filter(u => u.is_active).length }}</p>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-slide-up" style="animation-delay: 200ms">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">Inactive Users</p>
              <p class="text-3xl font-bold text-red-600">{{ users.filter(u => !u.is_active).length }}</p>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 animate-slide-up" style="animation-delay: 300ms">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 mb-1">Total Roles</p>
              <p class="text-3xl font-bold text-purple-600">{{ roles.length }}</p>
            </div>
            <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Actions Bar -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6 animate-slide-up">
        <div class="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search & Filter
          </h2>
        </div>

        <div class="p-6">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by username or email..."
                  class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-gray-50 focus:bg-white"
                  @input="debouncedSearch"
                />
              </div>
            </div>
            <button
              @click="openCreateModal"
              class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New User
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="userStore.loading" class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center animate-slide-up">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full mb-4">
          <svg class="animate-spin h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Loading Users</h3>
        <p class="text-gray-600">Please wait while we fetch user data...</p>
      </div>

      <!-- No Users State -->
      <div v-else-if="users.length === 0" class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center animate-slide-up">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
        <p class="text-gray-600">No users match your search criteria.</p>
      </div>

      <!-- Users Grid -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div
          v-for="(user, index) in users"
          :key="user.id"
          class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 animate-slide-up"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- User Card Header -->
          <div class="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-emerald-100">
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span class="text-white text-xl font-bold">
                  {{ getInitials(user.username) }}
                </span>
              </div>

              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-gray-900 truncate">{{ user.username }}</h3>
                <p class="text-sm text-gray-600 truncate">{{ user.email }}</p>
              </div>

              <!-- Status Badge -->
              <div>
                <span :class="[
                  'px-3 py-1 rounded-lg font-semibold text-xs',
                  user.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                ]">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>

          <!-- User Card Body -->
          <div class="p-6 space-y-4">
            <!-- Role -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-gray-600">Role</p>
                <p class="text-sm font-semibold text-gray-900 capitalize">{{ user.role?.name || 'N/A' }}</p>
              </div>
            </div>

            <!-- Created Date -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-gray-600">Created</p>
                <p class="text-sm font-semibold text-gray-900">{{ formatDate(user.created_at) }}</p>
              </div>
            </div>

            <!-- User ID -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-gray-600">User ID</p>
                <p class="text-sm font-semibold text-gray-900">#{{ user.id }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2">
            <button
              @click="editUser(user)"
              class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              @click="toggleUserStatus(user)"
              :class="[
                'flex-1 px-4 py-2 font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2',
                user.is_active ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="user.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ user.is_active ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!userStore.loading && users.length > 0" class="bg-white rounded-2xl shadow-xl border border-gray-200 px-6 py-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-sm text-gray-600">
            Showing page <span class="font-bold text-gray-900">{{ pagination.page }}</span> of
            <span class="font-bold text-gray-900">{{ pagination.totalPages }}</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Next
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-in Panel for Create/Edit User -->
    <transition name="slide-panel">
      <div v-if="showCreateModal || editingUser" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          @click="closeModal"
        ></div>

        <!-- Panel -->
        <div class="absolute right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-white shadow-2xl transform transition-transform">
          <!-- Panel Header -->
          <div class="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-6">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold text-white flex items-center gap-3">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ editingUser ? 'Edit User' : 'Create New User' }}
              </h2>
              <button
                @click="closeModal"
                class="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center"
              >
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Panel Content -->
          <div class="p-6 overflow-y-auto h-[calc(100vh-120px)]">
            <form @submit.prevent="saveUser" class="space-y-6">
              <!-- Username -->
              <div>
                <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="username"
                    v-model="userForm.username"
                    type="text"
                    class="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-gray-50 focus:bg-white"
                    :class="{ 'opacity-50 cursor-not-allowed': editingUser }"
                    placeholder="Enter username"
                    required
                    :disabled="editingUser"
                  />
                </div>
                <p v-if="editingUser" class="mt-2 text-xs text-gray-500">Username cannot be changed</p>
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    v-model="userForm.email"
                    type="email"
                    class="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-gray-50 focus:bg-white"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <!-- Password (only for new users) -->
              <div v-if="!editingUser">
                <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    v-model="userForm.password"
                    type="password"
                    class="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-gray-50 focus:bg-white"
                    placeholder="Enter password"
                    minlength="8"
                    required
                  />
                </div>
                <p class="text-xs text-gray-600 mt-2">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
                </p>
              </div>

              <!-- Role -->
              <div>
                <label for="role" class="block text-sm font-semibold text-gray-700 mb-2">
                  User Role
                </label>
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <select
                    id="role"
                    v-model.number="userForm.role_id"
                    class="block w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-gray-50 focus:bg-white appearance-none"
                    required
                  >
                    <option value="">Select a role</option>
                    <option v-for="role in roles" :key="role.id" :value="role.id">
                      {{ role.name }} - {{ role.description }}
                    </option>
                  </select>
                  <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Active Status (only for editing) -->
              <div v-if="editingUser" class="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="userForm.is_active"
                    class="w-6 h-6 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all"
                  />
                  <div class="flex-1">
                    <span class="text-sm font-semibold text-gray-900">Active Status</span>
                    <p class="text-xs text-gray-600 mt-1">
                      {{ userForm.is_active ? 'User can log in and access the system' : 'User is disabled and cannot log in' }}
                    </p>
                  </div>
                </label>
              </div>

              <!-- Error Message -->
              <div v-if="formError" class="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="font-semibold text-red-900">Error</p>
                  <p class="text-sm text-red-800 mt-1">{{ formError }}</p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="submit"
                  :disabled="saving"
                  class="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  <svg v-if="saving" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ saving ? 'Saving...' : (editingUser ? 'Update User' : 'Create User') }}</span>
                </button>
                <button
                  type="button"
                  @click="closeModal"
                  :disabled="saving"
                  class="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const showCreateModal = ref(false);
const editingUser = ref(null);
const searchQuery = ref('');
const formError = ref(null);
const saving = ref(false);

const userForm = ref({
  username: '',
  email: '',
  password: '',
  role_id: '',
  is_active: true
});

const users = computed(() => userStore.users);
const roles = computed(() => userStore.roles);
const pagination = computed(() => userStore.pagination);

let searchTimeout = null;

onMounted(async () => {
  await userStore.fetchUsers();
  await userStore.fetchRoles();
});

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    userStore.fetchUsers({ search: searchQuery.value });
  }, 500);
};

const changePage = (page) => {
  userStore.fetchUsers({ page, search: searchQuery.value });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openCreateModal = () => {
  showCreateModal.value = true;
  formError.value = null;
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.value = {
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    is_active: user.is_active
  };
  formError.value = null;
};

const toggleUserStatus = async (user) => {
  const action = user.is_active ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
    return;
  }

  const result = await userStore.updateUser(user.id, {
    email: user.email,
    role_id: user.role_id,
    is_active: !user.is_active
  });

  if (!result.success) {
    alert(result.message);
  }
};

const saveUser = async () => {
  saving.value = true;
  formError.value = null;

  // Validate password for new users
  if (!editingUser.value) {
    const password = userForm.value.password;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!password || password.length < 8) {
      formError.value = 'Password must be at least 8 characters long';
      saving.value = false;
      return;
    }

    if (!passwordRegex.test(password)) {
      formError.value = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
      saving.value = false;
      return;
    }
  }

  // Prepare user data - remove empty strings
  const userData = {};
  if (userForm.value.username) userData.username = userForm.value.username;
  if (userForm.value.email) userData.email = userForm.value.email;
  if (userForm.value.password) userData.password = userForm.value.password;
  if (userForm.value.role_id !== '' && userForm.value.role_id !== null) {
    userData.role_id = parseInt(userForm.value.role_id);
  }
  if (editingUser.value) {
    userData.is_active = userForm.value.is_active;
  }

  let result;
  if (editingUser.value) {
    result = await userStore.updateUser(editingUser.value.id, userData);
  } else {
    result = await userStore.createUser(userData);
  }

  saving.value = false;

  if (result.success) {
    closeModal();
  } else {
    formError.value = result.message;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingUser.value = null;
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role_id: '',
    is_active: true
  };
  formError.value = null;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
</script>

<style scoped>
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.5s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}

/* Slide panel transitions */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-panel-enter-active .absolute.right-0,
.slide-panel-leave-active .absolute.right-0 {
  transition: transform 0.3s ease-in-out;
}

.slide-panel-enter-from .absolute.right-0 {
  transform: translateX(100%);
}

.slide-panel-leave-to .absolute.right-0 {
  transform: translateX(100%);
}

.slide-panel-enter-from .absolute.inset-0,
.slide-panel-leave-to .absolute.inset-0 {
  opacity: 0;
}
</style>
