<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">NOCS Wise Meter Installation (Monthly)</h1>
        <p class="text-indigo-100">Monthly meter installation statistics by NOCS</p>
      </div>

      <!-- Month Filter -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
            <input
              v-model="selectedMonth"
              type="month"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">NOCS Filter</label>
            <input
              v-model="nocsFilter"
              type="text"
              placeholder="Search NOCS..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="fetchData"
              :disabled="loading"
              class="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ loading ? 'Loading...' : 'Generate Report' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div v-if="summary.total_nocs > 0" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total NOCS</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(summary.total_nocs) }}</p>
            </div>
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Installations</p>
              <p class="text-2xl font-bold text-green-600 mt-1">{{ formatNumber(summary.total_installations) }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Average per NOCS</p>
              <p class="text-2xl font-bold text-blue-600 mt-1">{{ formatNumber(summary.avg_per_nocs) }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Selected Month</p>
              <p class="text-2xl font-bold text-purple-600 mt-1">{{ formatMonth(selectedMonth) }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p class="mt-4 text-gray-600">Loading meter installation data...</p>
      </div>

      <!-- Data Table -->
      <div v-if="!loading && data.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOCS Name</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Meters Installed</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Install Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Install Date</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(row, index) in filteredData" :key="index" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ index + 1 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ row.NOCS_NAME || 'N/A' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">{{ formatNumber(row.METER_COUNT) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{{ calculatePercentage(row.METER_COUNT) }}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ formatDate(row.FIRST_INSTALL_DATE) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ formatDate(row.LAST_INSTALL_DATE) }}</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 font-semibold">
              <tr>
                <td colspan="2" class="px-6 py-4 text-sm text-gray-900">Total</td>
                <td class="px-6 py-4 text-sm text-right text-indigo-700">{{ formatNumber(summary.total_installations) }}</td>
                <td class="px-6 py-4 text-sm text-right text-gray-700">100%</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-4">
          <div v-for="(row, index) in filteredData" :key="index" class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="font-semibold text-lg text-gray-900">{{ row.NOCS_NAME || 'N/A' }}</span>
              <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                #{{ index + 1 }}
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Meters Installed:</span>
                <span class="font-semibold text-indigo-600">{{ formatNumber(row.METER_COUNT) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">% of Total:</span>
                <span class="font-medium">{{ calculatePercentage(row.METER_COUNT) }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">First Install:</span>
                <span class="font-medium">{{ formatDate(row.FIRST_INSTALL_DATE) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Last Install:</span>
                <span class="font-medium">{{ formatDate(row.LAST_INSTALL_DATE) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!loading && data.length === 0 && !error" class="bg-white rounded-xl p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p class="text-gray-600">Select a month and click "Generate Report" to view meter installation statistics.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const selectedMonth = ref('');
const nocsFilter = ref('');
const loading = ref(false);
const error = ref('');
const data = ref([]);

const summary = computed(() => {
  if (data.value.length === 0) {
    return { total_nocs: 0, total_installations: 0, avg_per_nocs: 0 };
  }

  const total_nocs = data.value.length;
  const total_installations = data.value.reduce((sum, row) => sum + (row.METER_COUNT || 0), 0);
  const avg_per_nocs = total_nocs > 0 ? Math.round(total_installations / total_nocs) : 0;

  return { total_nocs, total_installations, avg_per_nocs };
});

const filteredData = computed(() => {
  if (!nocsFilter.value) return data.value;
  const filter = nocsFilter.value.toLowerCase();
  return data.value.filter(row =>
    (row.NOCS_NAME || '').toLowerCase().includes(filter)
  );
});

const fetchData = async () => {
  if (!selectedMonth.value) {
    error.value = 'Please select a month';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // TODO: Replace with actual API endpoint when backend is ready
    // For now, using placeholder data
    // const response = await api.get('/reports/nocs-meter-installation', {
    //   params: { month: selectedMonth.value }
    // });

    // Placeholder data for demonstration
    await new Promise(resolve => setTimeout(resolve, 1000));
    data.value = [
      {
        NOCS_NAME: 'Mirpur NOCS',
        METER_COUNT: 450,
        FIRST_INSTALL_DATE: '2026-01-02',
        LAST_INSTALL_DATE: '2026-01-30'
      },
      {
        NOCS_NAME: 'Dhanmondi NOCS',
        METER_COUNT: 380,
        FIRST_INSTALL_DATE: '2026-01-03',
        LAST_INSTALL_DATE: '2026-01-29'
      },
      {
        NOCS_NAME: 'Gulshan NOCS',
        METER_COUNT: 320,
        FIRST_INSTALL_DATE: '2026-01-05',
        LAST_INSTALL_DATE: '2026-01-28'
      },
      {
        NOCS_NAME: 'Uttara NOCS',
        METER_COUNT: 295,
        FIRST_INSTALL_DATE: '2026-01-04',
        LAST_INSTALL_DATE: '2026-01-27'
      },
      {
        NOCS_NAME: 'Mohammadpur NOCS',
        METER_COUNT: 255,
        FIRST_INSTALL_DATE: '2026-01-06',
        LAST_INSTALL_DATE: '2026-01-26'
      }
    ];
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    data.value = [];
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num || 0);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatMonth = (monthStr) => {
  if (!monthStr) return 'N/A';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
};

const calculatePercentage = (count) => {
  if (summary.value.total_installations === 0) return '0.00';
  return ((count / summary.value.total_installations) * 100).toFixed(2);
};

onMounted(() => {
  // Set default to current month
  const now = new Date();
  selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});
</script>
