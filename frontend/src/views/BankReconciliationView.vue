<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Bank Reconciliation Data</h1>
        <p class="text-purple-100">Detailed payment transactions for bank matching and reconciliation</p>
      </div>

      <!-- Date Filter -->
      <div class="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              v-model="endDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bank Code (Optional)</label>
            <input
              v-model="bankCode"
              type="text"
              placeholder="Leave empty for all banks"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="fetchData"
              :disabled="loading"
              class="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

      <!-- Summary Stats -->
      <div v-if="data.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-sm text-gray-600 mb-1">Total Transactions</div>
          <div class="text-2xl font-bold text-purple-600">{{ data.length }}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-sm text-gray-600 mb-1">Total Amount</div>
          <div class="text-2xl font-bold text-green-600">৳{{ formatNumber(totalAmount) }}</div>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-sm text-gray-600 mb-1">Unique Banks</div>
          <div class="text-2xl font-bold text-blue-600">{{ uniqueBanks }}</div>
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="data.length > 0" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="row in data" :key="row.PAYMENT_ID" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ row.PAYMENT_ID }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ row.PAYMENT_DATETIME }}</td>
                <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ row.CUSTOMER_ACCOUNT }}</td>
                <td class="px-4 py-3 text-sm text-right font-semibold text-green-600">৳{{ formatNumber(row.PAYMENT_AMOUNT) }}</td>
                <td class="px-4 py-3 text-sm text-gray-700">{{ row.BANK_NAME }}</td>
                <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ row.BANK_REFERENCE || 'N/A' }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {{ row.STATUS_DESCRIPTION }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-4">
          <div v-for="row in data" :key="row.PAYMENT_ID" class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <span class="text-xs font-mono text-gray-500">{{ row.PAYMENT_ID }}</span>
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {{ row.STATUS_DESCRIPTION }}
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Amount:</span>
                <span class="font-semibold text-green-600">৳{{ formatNumber(row.PAYMENT_AMOUNT) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Bank:</span>
                <span class="font-medium">{{ row.BANK_NAME }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Date/Time:</span>
                <span class="font-medium">{{ row.PAYMENT_DATETIME }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Account:</span>
                <span class="font-mono text-xs">{{ row.CUSTOMER_ACCOUNT }}</span>
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
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const startDate = ref('');
const endDate = ref('');
const bankCode = ref('');
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

const totalAmount = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.PAYMENT_AMOUNT) || 0), 0);
});

const uniqueBanks = computed(() => {
  const banks = new Set(data.value.map(row => row.BANK_CODE));
  return banks.size;
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
    const params = {
      startDate: formatDateForAPI(startDate.value),
      endDate: formatDateForAPI(endDate.value)
    };

    if (bankCode.value) {
      params.bankCode = bankCode.value;
    }

    const response = await axios.get('/api/reports/bank_reconciliation_data', { params });
    data.value = response.data.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch data';
    console.error('Error fetching bank reconciliation data:', err);
  } finally {
    loading.value = false;
  }
};
</script>
