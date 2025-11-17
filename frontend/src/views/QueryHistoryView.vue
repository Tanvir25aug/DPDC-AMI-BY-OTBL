<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8 animate-slide-down">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 class="text-4xl font-bold text-gray-900">Query History</h1>
            <p class="text-gray-600 mt-1">View and manage your SQL query execution history</p>
          </div>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6 animate-slide-up">
        <div class="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter & Search
          </h2>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search Input -->
            <div class="md:col-span-2">
              <label for="search" class="block text-sm font-semibold text-gray-700 mb-2">
                Search Queries
              </label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="search"
                  v-model="searchQuery"
                  type="text"
                  class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-300 transition-all bg-gray-50 focus:bg-white"
                  placeholder="Search by query text or user..."
                  @input="debouncedSearch"
                />
              </div>
            </div>

            <!-- Status Filter -->
            <div>
              <label for="status" class="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <div class="relative">
                <select
                  id="status"
                  v-model="filters.status"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-300 transition-all bg-gray-50 focus:bg-white appearance-none"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
                <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- Page Size Filter -->
            <div>
              <label for="pageSize" class="block text-sm font-semibold text-gray-700 mb-2">
                Page Size
              </label>
              <div class="relative">
                <select
                  id="pageSize"
                  v-model.number="filters.limit"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-300 transition-all bg-gray-50 focus:bg-white appearance-none"
                >
                  <option :value="20">20 per page</option>
                  <option :value="50">50 per page</option>
                  <option :value="100">100 per page</option>
                </select>
                <svg class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div class="mt-4 flex gap-3">
            <button
              @click="applyFilters"
              class="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Apply Filters
            </button>
            <button
              @click="resetFilters"
              class="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center animate-slide-up">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full mb-4">
          <svg class="animate-spin h-10 w-10 text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Loading Query History</h3>
        <p class="text-gray-600">Please wait while we fetch your queries...</p>
      </div>

      <!-- No Results State -->
      <div v-else-if="history.length === 0" class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center animate-slide-up">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Query History Found</h3>
        <p class="text-gray-600">Your query history is empty or no results match your filters.</p>
      </div>

      <!-- Query History Timeline -->
      <div v-else class="space-y-4">
        <div
          v-for="(item, index) in history"
          :key="item.id"
          class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 animate-slide-up"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <!-- Card Header -->
          <div
            class="px-6 py-4 cursor-pointer select-none"
            :class="item.status === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100' : 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100'"
            @click="toggleExpand(item.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 flex-1">
                <!-- Status Icon -->
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md',
                  item.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                ]">
                  <svg v-if="item.status === 'success'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>

                <!-- Query Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <span :class="[
                      'px-3 py-1 rounded-lg font-semibold text-xs uppercase tracking-wide',
                      item.status === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    ]">
                      {{ item.status }}
                    </span>
                    <span class="text-sm font-medium text-gray-600">
                      Query #{{ item.id }}
                    </span>
                    <span class="text-sm text-gray-500">
                      by {{ item.user?.username || 'N/A' }}
                    </span>
                  </div>
                  <p class="text-sm font-mono text-gray-700 truncate">
                    {{ truncateQuery(item.query_text) }}
                  </p>
                </div>

                <!-- Metrics -->
                <div class="hidden md:flex items-center gap-6">
                  <div class="text-center">
                    <div class="text-xs font-medium text-gray-600 mb-1">Execution Time</div>
                    <div class="text-lg font-bold text-gray-900">{{ item.execution_time }}ms</div>
                  </div>
                  <div class="text-center">
                    <div class="text-xs font-medium text-gray-600 mb-1">Rows</div>
                    <div class="text-lg font-bold text-gray-900">{{ item.rows_returned || 0 }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-xs font-medium text-gray-600 mb-1">Date</div>
                    <div class="text-sm font-semibold text-gray-900">{{ formatDateShort(item.executed_at) }}</div>
                  </div>
                </div>
              </div>

              <!-- Expand Icon -->
              <div class="ml-4">
                <svg
                  class="w-6 h-6 text-gray-400 transition-transform duration-300"
                  :class="{ 'transform rotate-180': expandedItems.has(item.id) }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Expandable Details -->
          <transition name="expand">
            <div v-if="expandedItems.has(item.id)" class="px-6 py-6 bg-gray-50 border-t border-gray-200">
              <!-- Mobile Metrics -->
              <div class="md:hidden grid grid-cols-3 gap-4 mb-6">
                <div class="bg-white rounded-xl p-4 text-center border border-gray-200">
                  <div class="text-xs font-medium text-gray-600 mb-1">Execution Time</div>
                  <div class="text-lg font-bold text-gray-900">{{ item.execution_time }}ms</div>
                </div>
                <div class="bg-white rounded-xl p-4 text-center border border-gray-200">
                  <div class="text-xs font-medium text-gray-600 mb-1">Rows</div>
                  <div class="text-lg font-bold text-gray-900">{{ item.rows_returned || 0 }}</div>
                </div>
                <div class="bg-white rounded-xl p-4 text-center border border-gray-200">
                  <div class="text-xs font-medium text-gray-600 mb-1">Date</div>
                  <div class="text-sm font-semibold text-gray-900">{{ formatDateShort(item.executed_at) }}</div>
                </div>
              </div>

              <!-- Full Query -->
              <div class="mb-4">
                <h4 class="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Full Query
                </h4>
                <div class="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                  <pre class="text-sm text-green-400 font-mono">{{ item.query_text }}</pre>
                </div>
              </div>

              <!-- Error Message (if applicable) -->
              <div v-if="item.status === 'error' && item.error_message" class="mb-4">
                <h4 class="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Error Message
                </h4>
                <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p class="text-sm text-red-800 font-mono">{{ item.error_message }}</p>
                </div>
              </div>

              <!-- Additional Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white rounded-xl p-4 border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-600">Executed By</p>
                      <p class="text-sm font-semibold text-gray-900">{{ item.user?.username || 'N/A' }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl p-4 border border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-600">Executed At</p>
                      <p class="text-sm font-semibold text-gray-900">{{ formatDate(item.executed_at) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && history.length > 0" class="mt-6 bg-white rounded-2xl shadow-xl border border-gray-200 px-6 py-4">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-sm text-gray-600">
            Showing page <span class="font-bold text-gray-900">{{ pagination.page }}</span> of
            <span class="font-bold text-gray-900">{{ pagination.totalPages }}</span>
            (<span class="font-bold text-gray-900">{{ pagination.total }}</span> total queries)
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQueryStore } from '@/stores/query';

const queryStore = useQueryStore();

const filters = ref({
  status: '',
  limit: 50,
  page: 1
});

const searchQuery = ref('');
const loading = ref(false);
const expandedItems = ref(new Set());

let searchTimeout = null;

const history = computed(() => queryStore.queryHistory);
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
});

onMounted(() => {
  fetchHistory();
});

const fetchHistory = async () => {
  loading.value = true;

  const result = await queryStore.fetchQueryHistory({
    status: filters.value.status || null,
    limit: filters.value.limit,
    page: filters.value.page,
    search: searchQuery.value || null
  });

  if (result.success) {
    pagination.value = result.data.pagination;
  }

  loading.value = false;
};

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filters.value.page = 1;
    fetchHistory();
  }, 500);
};

const applyFilters = () => {
  filters.value.page = 1;
  fetchHistory();
};

const resetFilters = () => {
  filters.value = {
    status: '',
    limit: 50,
    page: 1
  };
  searchQuery.value = '';
  fetchHistory();
};

const changePage = (newPage) => {
  filters.value.page = newPage;
  fetchHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleExpand = (id) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

const formatDateShort = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const truncateQuery = (query) => {
  if (!query) return '';
  return query.length > 100 ? query.substring(0, 100) + '...' : query;
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

/* Expand transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Custom scrollbar */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
