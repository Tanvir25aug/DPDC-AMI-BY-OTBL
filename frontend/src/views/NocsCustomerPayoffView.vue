<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Customer Payoff Balance</h1>
            <p class="text-gray-600 mt-1">NOCS: {{ nocsName || nocsCode }}</p>
          </div>
        </div>
        <button
          @click="exportToExcel"
          :disabled="loading || !data.length"
          class="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to Excel
        </button>
      </div>

      <!-- Summary Cards -->
      <div v-if="!loading && data.length" class="space-y-6 mb-6">
        <!-- Top Row: Total Customers -->
        <div class="grid grid-cols-1 gap-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Customers</p>
                <p class="text-3xl font-bold mt-2">{{ formatNumber(summary.totalCustomers) }}</p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-3">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Row: Credit/Due Breakdown -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Balance Breakdown</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p class="text-sm font-medium text-green-700 mb-1">Credit Qty</p>
              <p class="text-2xl font-bold text-green-600">{{ formatNumber(summary.creditQty) }}</p>
            </div>
            <div class="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p class="text-sm font-medium text-green-700 mb-1">Credit Balance</p>
              <p class="text-xl font-bold text-green-600">{{ formatCurrency(summary.creditBalance) }}</p>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p class="text-sm font-medium text-red-700 mb-1">Due Qty</p>
              <p class="text-2xl font-bold text-red-600">{{ formatNumber(summary.dueQty) }}</p>
            </div>
            <div class="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p class="text-sm font-medium text-red-700 mb-1">Due Balance</p>
              <p class="text-xl font-bold text-red-600">{{ formatCurrency(summary.dueBalance) }}</p>
            </div>
            <div class="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p class="text-sm font-medium text-blue-700 mb-1">Net Balance</p>
              <p class="text-xl font-bold" :class="summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(summary.netBalance) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- Table Header with Search -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Customer Details</h2>
              <p class="text-sm text-gray-600 mt-1">Ordered by payoff balance (highest to lowest)</p>
            </div>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search customers..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600 font-medium">Loading customer data...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8">
          <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div class="flex items-start">
              <svg class="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 class="text-red-800 font-semibold">Error Loading Data</h3>
                <p class="text-red-700 mt-1">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!filteredData.length" class="p-8">
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
            <p class="text-gray-600">{{ searchQuery ? 'No customers match your search criteria.' : 'No customer data available for this NOCS.' }}</p>
          </div>
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Customer ID
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Customer Name
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Address
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Customer Type
                </th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payoff Balance
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(customer, index) in paginatedData"
                :key="customer.CUSTOMER_ID"
                class="hover:bg-blue-50 transition-colors duration-150"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-blue-600">{{ customer.CUSTOMER_ID }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-medium text-gray-900">{{ customer.CUSTOMER_NAME || 'N/A' }}</span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-600">{{ customer.ADDRESS || 'N/A' }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="getCustomerTypeClass(customer.CUSTOMER_TYPE)"
                  >
                    {{ customer.CUSTOMER_TYPE || 'Unknown' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <span
                    class="text-sm font-bold"
                    :class="customer.PAYOFF_BALANCE <= 0 ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ formatCurrency(customer.PAYOFF_BALANCE * -1) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="flex flex-col gap-4">
            <!-- Current page info -->
            <div v-if="filteredData.length > pageSize" class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} customers
                <span v-if="data.length < totalCustomers" class="text-gray-500">
                  ({{ data.length }} loaded / {{ totalCustomers.toLocaleString() }} total)
                </span>
              </div>
              <div class="flex gap-2">
                <button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  @click="currentPage++"
                  :disabled="currentPage >= totalPages"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            <!-- Load More button (when more data available from server) -->
            <div v-if="hasMoreData && !loading" class="flex justify-center">
              <button
                @click="loadMore"
                :disabled="loadingMore"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg v-if="loadingMore" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m0 0l-4-4m4 4l4-4" />
                </svg>
                {{ loadingMore ? 'Loading...' : `Load More Customers (${(totalCustomers - data.length).toLocaleString()} remaining)` }}
              </button>
            </div>

            <!-- All data loaded message -->
            <div v-if="!hasMoreData && data.length > 0" class="text-center text-sm text-gray-600">
              All {{ totalCustomers.toLocaleString() }} customers loaded
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import * as XLSX from 'xlsx';

const route = useRoute();
const router = useRouter();

// Get NOCS code and name from URL params
const nocsCode = ref(route.query.nocs || '');
const nocsName = ref(route.query.name || '');

// Data management
const data = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref(null);

// API Pagination (backend)
const currentApiPage = ref(1);
const apiPageSize = ref(500); // Load 500 at a time from backend
const totalCustomers = ref(0);
const hasMoreData = ref(true);

// Search and UI pagination
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(50);

// Computed: Filtered data based on search
const filteredData = computed(() => {
  if (!searchQuery.value) return data.value;

  const query = searchQuery.value.toLowerCase();
  return data.value.filter(customer =>
    customer.CUSTOMER_ID?.toLowerCase().includes(query) ||
    customer.CUSTOMER_NAME?.toLowerCase().includes(query) ||
    customer.ADDRESS?.toLowerCase().includes(query) ||
    customer.CUSTOMER_TYPE?.toLowerCase().includes(query)
  );
});

// Computed: Paginated data
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize.value);
});

// Summary data from API
const summaryData = ref({
  totalCustomers: 0,
  creditQty: 0,
  creditBalance: 0,
  dueQty: 0,
  dueBalance: 0,
  netBalance: 0
});

// Computed: Summary statistics (from API)
const summary = computed(() => summaryData.value);

// Fetch summary statistics (fast, separate API call)
const fetchSummary = async () => {
  try {
    const response = await api.get(`/reports/nocs-customer-payoff/${nocsCode.value}/summary`);
    if (response.data.success) {
      summaryData.value = response.data.summary;
      totalCustomers.value = response.data.summary.totalCustomers;
    }
  } catch (err) {
    console.error('Error fetching summary:', err);
    // Don't show error for summary - it's not critical
  }
};

// Fetch paginated customer data
const fetchData = async (pageNum = 1) => {
  if (!nocsCode.value) {
    error.value = 'NOCS code is required';
    return;
  }

  if (pageNum === 1) {
    loading.value = true;
    data.value = [];
    currentApiPage.value = 1;
    hasMoreData.value = true;
  } else {
    loadingMore.value = true;
  }

  error.value = null;

  try {
    const response = await api.get(`/reports/nocs-customer-payoff/${nocsCode.value}/paginated`, {
      params: {
        page: pageNum,
        limit: apiPageSize.value
      }
    });

    if (response.data.success) {
      const newData = response.data.data || [];

      if (pageNum === 1) {
        data.value = newData;
      } else {
        data.value = [...data.value, ...newData];
      }

      hasMoreData.value = response.data.pagination.hasMore;
      currentApiPage.value = pageNum;

      console.log(`Loaded page ${pageNum}: ${newData.length} customers (Total: ${data.value.length}/${response.data.pagination.totalCount})`);
    }
  } catch (err) {
    console.error('Error fetching customer payoff data:', err);
    console.error('Error response:', err.response?.data);
    error.value = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load customer data';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// Load more data (for infinite scroll)
const loadMore = async () => {
  if (!hasMoreData.value || loadingMore.value) return;
  await fetchData(currentApiPage.value + 1);
};

// Format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '৳0.00';
  const num = parseFloat(value);
  return '৳' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format number
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('en-IN');
};

// Get customer type badge class
const getCustomerTypeClass = (type) => {
  const typeMap = {
    'Residential': 'bg-blue-100 text-blue-800',
    'Commercial': 'bg-purple-100 text-purple-800',
    'Industrial': 'bg-orange-100 text-orange-800',
    'Government': 'bg-green-100 text-green-800',
  };
  return typeMap[type] || 'bg-gray-100 text-gray-800';
};

// Export to Excel
const exportToExcel = () => {
  const exportData = filteredData.value.map((customer, index) => ({
    'Serial': index + 1,
    'Customer ID': customer.CUSTOMER_ID,
    'Customer Name': customer.CUSTOMER_NAME || 'N/A',
    'Address': customer.ADDRESS || 'N/A',
    'Customer Type': customer.CUSTOMER_TYPE || 'Unknown',
    'Payoff Balance': (parseFloat(customer.PAYOFF_BALANCE) || 0) * -1
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customer Payoff');

  const fileName = `Customer_Payoff_${nocsCode.value}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Go back to NOCS Balance Summary
const goBack = () => {
  router.push('/nocs-balance-summary');
};

// Fetch data on mount
onMounted(() => {
  fetchSummary(); // Fetch summary first (fast)
  fetchData(1);   // Then fetch first page of customer data
});
</script>

<style scoped>
/* Add any custom styles if needed */
</style>
