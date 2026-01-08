<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8 animate-slide-down">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-4xl font-bold text-gray-900">Oracle Query Reporter</h1>
            <p class="text-gray-600 mt-1">Execute custom SQL queries and visualize results</p>
          </div>
        </div>
      </div>

      <!-- Query Execution Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6 animate-slide-up">
        <!-- Card Header -->
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            SQL Query Editor
          </h2>
        </div>

        <!-- Card Body -->
        <div class="p-6 space-y-6">
          <!-- Query Textarea -->
          <div>
            <label for="query" class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              SQL Query
            </label>
            <div class="relative">
              <textarea
                id="query"
                v-model="query"
                class="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all duration-300 bg-gray-50 focus:bg-white font-mono text-sm resize-vertical"
                placeholder="Enter your SELECT query here...

Example:
SELECT * FROM employees WHERE department = 'IT' ORDER BY hire_date DESC"
                rows="12"
                @focus="focusedField = 'query'"
                @blur="focusedField = null"
              ></textarea>
              <div class="absolute top-3 right-3 flex gap-2">
                <button
                  type="button"
                  @click="formatQuery"
                  class="px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                  title="Format Query"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Format
                </button>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Lines: {{ query.split('\n').length }}</span>
              <span>Characters: {{ query.length }}</span>
            </div>
          </div>

          <!-- Query Options -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="maxRows" class="block text-sm font-semibold text-gray-700 mb-2">
                Max Rows <span class="text-xs font-normal text-gray-500">(0 = unlimited)</span>
              </label>
              <input
                id="maxRows"
                v-model.number="maxRows"
                type="number"
                class="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
                min="0"
                placeholder="0 = unlimited"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Query Status
              </label>
              <div class="flex items-center h-12 px-4 bg-gray-50 rounded-xl">
                <span v-if="!results && !loading" class="text-gray-500 text-sm">Ready to execute</span>
                <span v-else-if="loading" class="text-indigo-600 text-sm flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Executing...
                </span>
                <span v-else class="text-green-600 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  Completed
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Execution Time
              </label>
              <div class="flex items-center h-12 px-4 bg-gray-50 rounded-xl">
                <span class="text-gray-700 font-mono text-sm">{{ metadata?.executionTime || 0 }}ms</span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-shake">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-semibold text-red-900">Error</p>
              <p class="text-sm text-red-800 mt-1">{{ error }}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              @click="executeQuery"
              :disabled="loading || !query"
              class="flex-1 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ loading ? 'Executing Query...' : 'Execute Query' }}
            </button>
            <button
              @click="clearQuery"
              :disabled="loading"
              class="px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="results && results.length > 0" class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
        <!-- Results Header -->
        <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="text-white">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Query Results
              </h2>
              <p class="text-purple-100 text-sm mt-1">
                {{ filteredResults.length }} rows • {{ columns.length }} columns • {{ metadata?.executionTime || 0 }}ms
              </p>
            </div>

            <!-- Export Buttons -->
            <div class="flex gap-2">
              <button
                @click="exportResults('csv')"
                class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-all flex items-center gap-2 border border-white/30"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
              <button
                @click="exportResults('xlsx')"
                class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-all flex items-center gap-2 border border-white/30"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button
                @click="exportResults('pdf')"
                class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-all flex items-center gap-2 border border-white/30"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>
        </div>

        <!-- Table Controls -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search in results..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <!-- Page Size -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-700">Rows:</label>
              <select
                v-model.number="pageSize"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="filteredResults.length">All</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto">
          <div class="max-h-[600px] overflow-y-auto">
            <table class="w-full">
              <thead class="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th
                    v-for="column in columns"
                    :key="column"
                    class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                    @click="sortBy(column)"
                  >
                    <div class="flex items-center gap-2">
                      <span>{{ column }}</span>
                      <svg v-if="sortColumn === column" class="w-4 h-4" :class="sortDirection === 'asc' ? 'transform rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="(row, index) in paginatedResults"
                  :key="index"
                  class="hover:bg-indigo-50 transition-colors"
                >
                  <td
                    v-for="column in columns"
                    :key="column"
                    class="px-4 py-3 text-sm text-gray-900 font-mono"
                  >
                    <div class="max-w-xs truncate" :title="formatValue(row[column])">
                      {{ formatValue(row[column]) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredResults.length) }} of {{ filteredResults.length }} results
            </div>
            <div class="flex gap-2">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">Page {{ currentPage }} of {{ totalPages }}</span>
              </div>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results State -->
      <div v-else-if="!loading && !results" class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Results Yet</h3>
        <p class="text-gray-600">Execute a query above to see results here</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQueryStore } from '@/stores/query';

const queryStore = useQueryStore();

const query = ref('');
const maxRows = ref(0); // FIXED: Default to 0 (unlimited) instead of 1000
const loading = ref(false);
const error = ref(null);
const focusedField = ref(null);

// Table controls
const searchQuery = ref('');
const pageSize = ref(25);
const currentPage = ref(1);
const sortColumn = ref(null);
const sortDirection = ref('asc');

const results = computed(() => queryStore.queryResults);
const metadata = computed(() => queryStore.metadata);

const columns = computed(() => {
  if (!results.value || results.value.length === 0) return [];
  return Object.keys(results.value[0]);
});

// Filtering
const filteredResults = computed(() => {
  if (!results.value) return [];

  let filtered = results.value;

  // Apply search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    filtered = filtered.filter(row => {
      return Object.values(row).some(value => {
        return String(value).toLowerCase().includes(search);
      });
    });
  }

  // Apply sorting
  if (sortColumn.value) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortColumn.value];
      const bVal = b[sortColumn.value];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }

  return filtered;
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / pageSize.value) || 1;
});

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredResults.value.slice(start, end);
});

// Reset to page 1 when search/filter changes
watch([searchQuery, pageSize], () => {
  currentPage.value = 1;
});

const executeQuery = async () => {
  if (!query.value.trim()) {
    error.value = 'Please enter a query';
    return;
  }

  loading.value = true;
  error.value = null;
  currentPage.value = 1;

  const result = await queryStore.executeQuery(query.value, maxRows.value);

  loading.value = false;

  if (!result.success) {
    error.value = result.message;
  }
};

const exportResults = async (format) => {
  if (!results.value || results.value.length === 0) {
    error.value = 'No data to export';
    return;
  }

  loading.value = true;
  error.value = null;

  const result = await queryStore.exportData(results.value, format, 'Oracle Query Report');

  loading.value = false;

  if (!result.success) {
    error.value = result.message;
  }
};

const clearQuery = () => {
  query.value = '';
  queryStore.clearResults();
  error.value = null;
  searchQuery.value = '';
  sortColumn.value = null;
  currentPage.value = 1;
};

const formatQuery = () => {
  // Basic SQL formatting
  if (!query.value) return;

  query.value = query.value
    .replace(/\s+/g, ' ')
    .replace(/,/g, ',\n  ')
    .replace(/FROM/gi, '\nFROM')
    .replace(/WHERE/gi, '\nWHERE')
    .replace(/ORDER BY/gi, '\nORDER BY')
    .replace(/GROUP BY/gi, '\nGROUP BY')
    .trim();
};

const sortBy = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

const formatValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-slide-down {
  animation: slide-down 0.5s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
