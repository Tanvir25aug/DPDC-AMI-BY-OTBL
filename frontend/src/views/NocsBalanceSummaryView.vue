<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">BALANCE Details by NOCS</h1>
        <p class="text-blue-100">Customer balance summary grouped by NOCS area with positive/negative breakdown</p>
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Real-time balance data from Oracle database</span>
          </div>
          <div class="flex gap-3">
            <button
              @click="fetchData"
              :disabled="loading"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Loading...' : 'Refresh Data' }}
            </button>
            <button
              @click="exportToExcel"
              :disabled="!data.length"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-red-800 font-semibold mb-1">Error Loading Data</h3>
            <p class="text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div v-if="data.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
          <div class="text-sm text-gray-600 mb-1 font-medium">Total NOCS Areas</div>
          <div class="text-3xl font-bold text-blue-600">{{ data.length }}</div>
        </div>
        <div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
          <div class="text-sm text-gray-600 mb-1 font-medium">Total Customers</div>
          <div class="text-3xl font-bold text-purple-600">{{ formatNumber(totalCustomers) }}</div>
        </div>
        <div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
          <div class="text-sm text-gray-600 mb-1 font-medium">Positive Balance</div>
          <div class="text-3xl font-bold text-green-600">৳{{ formatNumber(totalPositiveBalance) }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ formatNumber(totalPositiveQty) }} customers</div>
        </div>
        <div class="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
          <div class="text-sm text-gray-600 mb-1 font-medium">Negative Balance</div>
          <div class="text-3xl font-bold text-red-600">৳{{ formatNumber(Math.abs(totalNegativeBalance)) }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ formatNumber(totalNegativeQty) }} customers</div>
        </div>
      </div>

      <!-- Net Balance Summary Card -->
      <div v-if="data.length > 0" class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-indigo-100 text-sm font-medium mb-2">Net Balance (All NOCS)</div>
            <div class="text-4xl font-bold text-white">৳{{ formatNumber(Math.abs(netBalance)) }}</div>
            <div class="text-indigo-200 text-sm mt-2">
              {{ netBalance >= 0 ? 'Credit Balance' : 'Due Balance' }}
            </div>
          </div>
          <div class="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="data.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOCS Name</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">NOCS Code</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customers</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Qty</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Positive Balance</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Qty</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Negative Balance</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Balance</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="row in data" :key="row.NOCS_CODE" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">{{ row.NOCS_NAME }}</td>
                <td class="px-6 py-4 text-sm text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ row.NOCS_CODE }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-right text-gray-900 font-medium">{{ formatNumber(row.TOTAL_CUSTOMERS) }}</td>
                <td class="px-6 py-4 text-sm text-right text-green-700">{{ formatNumber(row.POSITIVE_QTY) }}</td>
                <td class="px-6 py-4 text-sm text-right font-semibold text-green-600">৳{{ formatNumber(row.POSITIVE_BALANCE_AMT) }}</td>
                <td class="px-6 py-4 text-sm text-right text-red-700">{{ formatNumber(row.NEGATIVE_QTY) }}</td>
                <td class="px-6 py-4 text-sm text-right font-semibold text-red-600">৳{{ formatNumber(Math.abs(row.NEGATIVE_BALANCE_AMT)) }}</td>
                <td class="px-6 py-4 text-sm text-right">
                  <span :class="row.NET_BALANCE >= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
                    ৳{{ formatNumber(Math.abs(row.NET_BALANCE)) }}
                  </span>
                  <span :class="row.NET_BALANCE >= 0 ? 'text-green-500' : 'text-red-500'" class="text-xs ml-1">
                    {{ row.NET_BALANCE >= 0 ? '▲' : '▼' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <!-- Table Footer with Totals -->
            <tfoot class="bg-gray-100 border-t-2 border-gray-300">
              <tr class="font-bold">
                <td class="px-6 py-4 text-sm text-gray-900" colspan="2">TOTAL</td>
                <td class="px-6 py-4 text-sm text-right text-gray-900">{{ formatNumber(totalCustomers) }}</td>
                <td class="px-6 py-4 text-sm text-right text-green-700">{{ formatNumber(totalPositiveQty) }}</td>
                <td class="px-6 py-4 text-sm text-right text-green-600">৳{{ formatNumber(totalPositiveBalance) }}</td>
                <td class="px-6 py-4 text-sm text-right text-red-700">{{ formatNumber(totalNegativeQty) }}</td>
                <td class="px-6 py-4 text-sm text-right text-red-600">৳{{ formatNumber(Math.abs(totalNegativeBalance)) }}</td>
                <td class="px-6 py-4 text-sm text-right">
                  <span :class="netBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                    ৳{{ formatNumber(Math.abs(netBalance)) }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-4">
          <div v-for="row in data" :key="row.NOCS_CODE" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <div class="font-semibold text-lg text-gray-900">{{ row.NOCS_NAME }}</div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ row.NOCS_CODE }}
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total Customers:</span>
                <span class="font-semibold">{{ formatNumber(row.TOTAL_CUSTOMERS) }}</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="text-gray-600">Positive:</span>
                <div class="text-right">
                  <div class="text-green-700">{{ formatNumber(row.POSITIVE_QTY) }} customers</div>
                  <div class="font-semibold text-green-600">৳{{ formatNumber(row.POSITIVE_BALANCE_AMT) }}</div>
                </div>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="text-gray-600">Negative:</span>
                <div class="text-right">
                  <div class="text-red-700">{{ formatNumber(row.NEGATIVE_QTY) }} customers</div>
                  <div class="font-semibold text-red-600">৳{{ formatNumber(Math.abs(row.NEGATIVE_BALANCE_AMT)) }}</div>
                </div>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span class="text-gray-600 font-medium">Net Balance:</span>
                <span :class="row.NET_BALANCE >= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
                  ৳{{ formatNumber(Math.abs(row.NET_BALANCE)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div v-else-if="!loading && !error" class="bg-white rounded-xl p-12 text-center">
        <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 text-lg">No data available. Click "Refresh Data" to load balance information.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !data.length" class="bg-white rounded-xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xl font-semibold text-gray-700 mb-2">Loading NOCS Balance Data...</p>
        <p class="text-sm text-gray-500">This may take 10-30 seconds for large datasets</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import * as XLSX from 'xlsx';

const data = ref([]);
const loading = ref(false);
const error = ref(null);

// Computed totals
const totalCustomers = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.TOTAL_CUSTOMERS) || 0), 0);
});

const totalPositiveQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.POSITIVE_QTY) || 0), 0);
});

const totalPositiveBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.POSITIVE_BALANCE_AMT) || 0), 0);
});

const totalNegativeQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.NEGATIVE_QTY) || 0), 0);
});

const totalNegativeBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.NEGATIVE_BALANCE_AMT) || 0), 0);
});

const netBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.NET_BALANCE) || 0), 0);
});

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/reports/nocs_balance_summary');
    data.value = response.data.data || [];
    console.log('[NOCS Balance] Loaded data:', data.value.length, 'NOCS areas');
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    console.error('Error fetching NOCS balance summary:', err);
  } finally {
    loading.value = false;
  }
};

const exportToExcel = () => {
  if (!data.value.length) return;

  // Prepare data for export
  const exportData = data.value.map(row => ({
    'NOCS Name': row.NOCS_NAME,
    'NOCS Code': row.NOCS_CODE,
    'Total Customers': row.TOTAL_CUSTOMERS,
    'Positive Qty': row.POSITIVE_QTY,
    'Positive Balance': row.POSITIVE_BALANCE_AMT,
    'Negative Qty': row.NEGATIVE_QTY,
    'Negative Balance': Math.abs(row.NEGATIVE_BALANCE_AMT),
    'Net Balance': row.NET_BALANCE
  }));

  // Add totals row
  exportData.push({
    'NOCS Name': 'TOTAL',
    'NOCS Code': '',
    'Total Customers': totalCustomers.value,
    'Positive Qty': totalPositiveQty.value,
    'Positive Balance': totalPositiveBalance.value,
    'Negative Qty': totalNegativeQty.value,
    'Negative Balance': Math.abs(totalNegativeBalance.value),
    'Net Balance': netBalance.value
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // NOCS Name
    { wch: 12 }, // NOCS Code
    { wch: 15 }, // Total Customers
    { wch: 12 }, // Positive Qty
    { wch: 18 }, // Positive Balance
    { wch: 12 }, // Negative Qty
    { wch: 18 }, // Negative Balance
    { wch: 15 }  // Net Balance
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'NOCS Balance Summary');

  // Generate filename
  const filename = `NOCS_Balance_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download
  XLSX.writeFile(wb, filename);
  console.log('[NOCS Balance] Exported to Excel:', filename);
};

// Auto-load data on mount
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Add any custom styles if needed */
</style>
