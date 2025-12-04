<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Top Navigation Bar -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 class="text-lg font-bold text-gray-900">CRP-CPC Management</h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Dashboard Button -->
            <button
              @click="$router.push('/')"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
          <button @click="error = null" class="text-red-600 hover:text-red-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header Section -->
      <div class="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">CRP Customer Management</h2>
            <p class="text-blue-100">Manage CRP customers and their associated CPC connections</p>
          </div>
          <div class="flex flex-col gap-2 items-end">
            <div class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span class="text-sm text-white font-medium">{{ totalCount }} CRP Customers</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Search CRP or CPC Customer</label>
            <div class="relative">
              <input
                v-model="searchQuery"
                @input="handleSearch"
                type="text"
                placeholder="Search by CRP Account, Customer ID, or Name..."
                class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="clearSearch"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear
            </button>
            <button
              @click="fetchData"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- CRP List Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRP Account</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total CPC Connections</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading" class="text-center">
                <td colspan="3" class="px-6 py-8">
                  <div class="flex justify-center items-center">
                    <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="ml-3 text-gray-600">Loading CRP data...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="crpList.length === 0" class="text-center">
                <td colspan="3" class="px-6 py-8">
                  <div class="text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No CRP customers found</p>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="crp in crpList" :key="crp.CRP_ID" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ crp.CRP_ACCOUNT_NO }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {{ crp.TOTAL_CPC_COUNT }} connections
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click="viewCPCDetails(crp)"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span> of
              <span class="font-medium">{{ totalCount }}</span> results
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="goToPage(1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="px-4 py-1 text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                @click="goToPage(totalPages)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CPC Details Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="closeModal"></div>

        <div class="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold text-white">CPC Details for CRP {{ selectedCRP?.CRP_ACCOUNT_NO }}</h3>
                <p class="text-sm text-blue-100 mt-1">Total CPC Connections: {{ selectedCRP?.TOTAL_CPC_COUNT }}</p>
              </div>
              <button @click="closeModal" class="text-white hover:text-gray-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div v-if="loadingCPC" class="flex justify-center items-center py-12">
              <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-3 text-gray-600">Loading CPC details...</span>
            </div>

            <div v-else-if="cpcList.length === 0" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p class="text-gray-500">No CPC connections found for this CRP</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="cpc in cpcList" :key="cpc.CPC_SA_ID" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Meter No</p>
                    <p class="text-sm font-semibold text-gray-900">{{ cpc.METER_NO }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Customer No</p>
                    <p class="text-sm font-semibold text-gray-900">{{ cpc.CPC_CUSTOMER_NO }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Customer Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ cpc.CUSTOMER_NAME }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Phone</p>
                    <p class="text-sm text-gray-700">{{ cpc.PHONE_NO }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Feeder</p>
                    <p class="text-sm text-gray-700">{{ cpc.FEEDER }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span :class="getStatusClass(cpc.SA_STATUS_DESC)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ cpc.SA_STATUS_DESC }}
                    </span>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Billed This Month</p>
                    <span :class="cpc.BILLED_THIS_MONTH === 'Yes' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ cpc.BILLED_THIS_MONTH }}
                    </span>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Last Bill Date</p>
                    <p class="text-sm text-gray-700">{{ cpc.LAST_BILL_DATE }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Current Balance</p>
                    <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(cpc.CURRENT_BALANCE) }}</p>
                  </div>
                  <div class="md:col-span-2 lg:col-span-3">
                    <p class="text-xs font-medium text-gray-500 uppercase">Address</p>
                    <p class="text-sm text-gray-700">{{ cpc.ADDRESS }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-600">Total CPC Connections: <span class="font-semibold">{{ cpcList.length }}</span></p>
              <button
                @click="closeModal"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';

// State
const loading = ref(false);
const loadingCPC = ref(false);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(50); // Reduced from 100 to 50 for faster loading
const totalCount = ref(0);
const totalPages = ref(0);

const crpList = ref([]);
const cpcList = ref([]);
const selectedCRP = ref(null);
const showModal = ref(false);

let searchTimeout = null;

// Fetch CRP-CPC List
const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await api.get('/crp-cpc/list', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || null
      }
    });

    if (response.data.success) {
      crpList.value = response.data.data;
      totalCount.value = response.data.pagination.totalCount;
      totalPages.value = response.data.pagination.totalPages;
    }
  } catch (err) {
    console.error('Error fetching CRP-CPC data:', err);
    error.value = err.response?.data?.message || 'Failed to load CRP-CPC data';
  } finally {
    loading.value = false;
  }
};

// View CPC Details
const viewCPCDetails = async (crp) => {
  selectedCRP.value = crp;
  showModal.value = true;
  loadingCPC.value = true;
  cpcList.value = [];

  try {
    const response = await api.get(`/crp-cpc/details/${crp.CRP_ID}`);

    if (response.data.success) {
      cpcList.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching CPC details:', err);
    error.value = err.response?.data?.message || 'Failed to load CPC details';
  } finally {
    loadingCPC.value = false;
  }
};

// Close Modal
const closeModal = () => {
  showModal.value = false;
  selectedCRP.value = null;
  cpcList.value = [];
};

// Handle Search with Debounce
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 500);
};

// Clear Search
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchData();
};

// Pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchData();
  }
};

// Format Currency
const formatCurrency = (value) => {
  if (!value) return '৳0.00';
  return '৳' + parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Get Status Class
const getStatusClass = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Stopped':
      return 'bg-red-100 text-red-800';
    case 'Pending Start':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pending Stop':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Initialize
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Add any additional custom styles here if needed */
</style>
