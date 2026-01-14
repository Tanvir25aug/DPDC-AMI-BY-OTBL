<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">NOCS Total Collection Summary</h1>
        <p class="text-emerald-100">Collection summary by NOCS with Principal, VAT (5%), and Total breakdown</p>
      </div>

      <!-- Date Filter -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              v-model="endDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="fetchData"
              :disabled="loading"
              class="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ loading ? 'Loading...' : 'Generate Report' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div v-if="data.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total NOCS</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ data.length }}</p>
            </div>
            <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Principal</p>
              <p class="text-2xl font-bold text-blue-600 mt-1">৳{{ formatNumber(totalPrincipal) }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total VAT (5%)</p>
              <p class="text-2xl font-bold text-orange-600 mt-1">৳{{ formatNumber(totalVAT) }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Grand Total</p>
              <p class="text-2xl font-bold text-green-600 mt-1">৳{{ formatNumber(grandTotal) }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p class="mt-4 text-gray-600">Loading collection data...</p>
      </div>

      <!-- Data Table -->
      <div v-if="!loading && data.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOCS Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOCS Name</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Amount</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">VAT (5%)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(row, index) in data" :key="row.NOCS_CODE" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ index + 1 }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ row.NOCS_CODE }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{{ row.NOCS_NAME }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">৳{{ formatNumber(row.PRINCIPAL_AMOUNT) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-orange-600">৳{{ formatNumber(row.VAT_AMOUNT) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">৳{{ formatNumber(row.TOTAL_AMOUNT) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{{ formatNumber(row.TRANSACTION_COUNT) }}</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 font-semibold">
              <tr>
                <td colspan="3" class="px-6 py-4 text-sm text-gray-900">Total</td>
                <td class="px-6 py-4 text-sm text-right text-blue-700">৳{{ formatNumber(totalPrincipal) }}</td>
                <td class="px-6 py-4 text-sm text-right text-orange-700">৳{{ formatNumber(totalVAT) }}</td>
                <td class="px-6 py-4 text-sm text-right text-green-700">৳{{ formatNumber(grandTotal) }}</td>
                <td class="px-6 py-4 text-sm text-right text-gray-700">{{ formatNumber(totalTransactions) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-4">
          <div v-for="(row, index) in data" :key="row.NOCS_CODE" class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="font-semibold text-lg text-gray-900">{{ row.NOCS_NAME }}</span>
              <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                #{{ index + 1 }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mb-3">Code: {{ row.NOCS_CODE }}</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Principal Amount:</span>
                <span class="font-semibold text-blue-600">৳{{ formatNumber(row.PRINCIPAL_AMOUNT) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">VAT (5%):</span>
                <span class="font-medium text-orange-600">৳{{ formatNumber(row.VAT_AMOUNT) }}</span>
              </div>
              <div class="flex justify-between py-2 border-t border-gray-200">
                <span class="text-gray-900 font-semibold">Total Amount:</span>
                <span class="font-bold text-green-600">৳{{ formatNumber(row.TOTAL_AMOUNT) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Transactions:</span>
                <span class="font-medium">{{ formatNumber(row.TRANSACTION_COUNT) }}</span>
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
        <p class="text-gray-600">Select date range and click "Generate Report" to view collection summary.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const startDate = ref('');
const endDate = ref('');
const data = ref([]);
const loading = ref(false);
const error = ref(null);

// Summary calculations
const totalPrincipal = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.PRINCIPAL_AMOUNT) || 0), 0);
});

const totalVAT = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.VAT_AMOUNT) || 0), 0);
});

const grandTotal = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.TOTAL_AMOUNT) || 0), 0);
});

const totalTransactions = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.TRANSACTION_COUNT) || 0), 0);
});

const formatNumber = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const fetchData = async () => {
  if (!startDate.value || !endDate.value) {
    error.value = 'Please select both start and end dates';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/reports/execute', {
      params: {
        reportName: 'nocs_collection_summary',
        start_date: startDate.value,
        end_date: endDate.value
      }
    });

    data.value = response.data.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    console.error('Error fetching NOCS collection summary:', err);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

// Set default dates (today)
onMounted(() => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  startDate.value = formattedDate;
  endDate.value = formattedDate;
});
</script>
