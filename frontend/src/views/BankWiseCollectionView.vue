<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Bank Wise Collection Report</h1>
        <p class="text-blue-100">Summary of collections grouped by bank/payment method</p>
      </div>

      <!-- Date Filter -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              v-model="endDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="fetchData"
              :disabled="loading"
              class="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {{ loading ? 'Loading...' : 'Generate Report' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- Data Table -->
      <div v-if="data.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collection</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Payment</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="row in data" :key="row.BANK_CODE" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ row.BANK_CODE }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ row.BANK_NAME }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{{ formatNumber(row.TRANSACTION_COUNT) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">৳{{ formatNumber(row.TOTAL_COLLECTION) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">৳{{ formatNumber(row.AVG_TRANSACTION_AMOUNT) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ row.FIRST_PAYMENT_TIME }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ row.LAST_PAYMENT_TIME }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-4">
          <div v-for="row in data" :key="row.BANK_CODE" class="bg-gray-50 rounded-lg p-4">
            <div class="font-semibold text-lg text-gray-900 mb-3">{{ row.BANK_NAME }}</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Bank Code:</span>
                <span class="font-medium">{{ row.BANK_CODE }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Transactions:</span>
                <span class="font-medium">{{ formatNumber(row.TRANSACTION_COUNT) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Collection:</span>
                <span class="font-semibold text-green-600">৳{{ formatNumber(row.TOTAL_COLLECTION) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Avg Amount:</span>
                <span class="font-medium">৳{{ formatNumber(row.AVG_TRANSACTION_AMOUNT) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div v-else-if="!loading && !error" class="bg-white rounded-xl p-12 text-center">
        <p class="text-gray-500">No data available. Please select dates and generate report.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const startDate = ref('');
const endDate = ref('');
const data = ref([]);
const loading = ref(false);
const error = ref(null);

// Set default dates (today)
onMounted(() => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  startDate.value = formattedDate;
  endDate.value = formattedDate;
});

const formatNumber = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN');
};

const formatDateForAPI = (dateStr) => {
  const date = new Date(dateStr);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const fetchData = async () => {
  if (!startDate.value || !endDate.value) {
    error.value = 'Please select both start and end dates';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get('/api/reports/bank_wise_collection', {
      params: {
        startDate: formatDateForAPI(startDate.value),
        endDate: formatDateForAPI(endDate.value)
      }
    });

    data.value = response.data.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch data';
    console.error('Error fetching bank wise collection:', err);
  } finally {
    loading.value = false;
  }
};
</script>
