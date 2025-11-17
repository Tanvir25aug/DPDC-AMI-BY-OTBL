<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Top Navigation Bar -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 class="text-lg font-bold text-gray-900">Meter-wise Command Report</h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Live Status -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-green-700">Live</span>
            </div>

            <!-- Dashboard Button -->
            <button
              @click="$router.push('/')"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="meterDataError" class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <app-alert variant="error" :dismissible="true" @dismiss="reportsStore.meterDataError = null">
        <template #title>Database Connection Error</template>
        <p>Unable to connect to the Oracle database. Please check:</p>
        <ul class="list-disc ml-5 mt-2">
          <li>VPN connection is active</li>
          <li>Network connectivity to database server</li>
          <li>Database credentials are correct</li>
        </ul>
        <p class="text-sm mt-2 font-mono">{{ meterDataError }}</p>
      </app-alert>
    </div>

    <!-- Main Content -->
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header Section -->
      <div class="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-8 mb-8 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">Meter Command Analytics</h2>
            <p class="text-purple-100">Real-time monitoring of meter connection and disconnection commands</p>
          </div>
          <div class="flex flex-col gap-2 items-end">
            <div class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-white font-medium">Today's Data</span>
            </div>
            <div v-if="meterDataLastUpdated" class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm text-white">{{ formatTime(meterDataLastUpdated) }}</span>
            </div>
            <div class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span class="text-sm text-white font-medium">{{ filteredData.length }} Records</span>
            </div>
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="mt-6">
          <button
            @click="fetchData"
            :disabled="meterDataLoading"
            class="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <svg v-if="!meterDataLoading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ meterDataLoading ? 'Refreshing...' : 'Refresh Data' }}
          </button>
        </div>
      </div>

      <!-- Summary Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <app-card hoverable class="bg-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">Total Records</p>
              <p class="text-3xl font-bold text-purple-600">{{ meterData.length }}</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-xl">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </app-card>

        <app-card hoverable class="bg-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">Filtered Results</p>
              <p class="text-3xl font-bold text-blue-600">{{ filteredData.length }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-xl">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </app-card>

        <app-card hoverable class="bg-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">Active Filters</p>
              <p class="text-3xl font-bold text-green-600">{{ activeFilterCount }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-xl">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
        </app-card>

        <app-card hoverable class="bg-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">Last Updated</p>
              <p class="text-lg font-semibold text-orange-600">{{ formatTime(meterDataLastUpdated) }}</p>
            </div>
            <div class="bg-orange-100 p-3 rounded-xl">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Advanced Filters Card -->
      <app-card class="mb-8">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-purple-100 p-2 rounded-lg">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">Advanced Filters</h3>
              <span v-if="activeFilterCount > 0" class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                {{ activeFilterCount }} Active
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="clearAllFilters"
                :disabled="!hasActiveFilters"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear All
              </button>
              <button
                @click="exportToExcel"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- NOCS Name Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">NOCS Name</label>
            <select
              v-model="filters.nocsName"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All NOCS</option>
              <option v-for="nocs in uniqueNocsNames" :key="nocs" :value="nocs">
                {{ nocs }}
              </option>
            </select>
          </div>

          <!-- Meter Number Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Meter Number</label>
            <input
              v-model="filters.meterNumber"
              type="text"
              placeholder="Search meter number..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <!-- Customer ID Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Customer ID</label>
            <input
              v-model="filters.customerId"
              type="text"
              placeholder="Search customer ID..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <!-- Command Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Command Type</label>
            <select
              v-model="filters.commandType"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="D1-RemoteConnect">Remote Connect</option>
              <option value="D1-RemoteDisconnect">Remote Disconnect</option>
            </select>
          </div>

          <!-- Command Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Command Status</label>
            <select
              v-model="filters.commandStatus"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="COMINPROG">In Progress</option>
              <option value="DISCARDED">Discarded</option>
            </select>
          </div>

          <!-- Meter Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Meter Status</label>
            <select
              v-model="filters.meterStatus"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Connected">Connected</option>
              <option value="Disconnected">Disconnected</option>
              <option value="RC In Progress">RC In Progress</option>
              <option value="DC In Progress">DC In Progress</option>
              <option value="Discarded">Discarded</option>
            </select>
          </div>
        </div>
      </app-card>

      <!-- Data Table -->
      <app-card>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Meter Commands Data</h3>
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {{ filteredData.length }} Records
            </span>
          </div>
        </template>

        <!-- Loading State -->
        <div v-if="meterDataLoading" class="flex flex-col items-center justify-center py-20">
          <svg class="w-12 h-12 text-purple-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-lg font-semibold text-gray-700">Loading meter data...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredData.length === 0" class="text-center py-20">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p class="text-lg font-semibold text-gray-700">No meter data available</p>
          <p class="text-sm text-gray-500 mt-2">Try adjusting your filters or refresh the data</p>
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto">
          <app-table
            :columns="tableHeaders"
            :data="paginatedData"
            :striped="true"
          >
            <template #cell-NOCS_NAME="{ row }">
              <span class="font-medium text-gray-900">{{ row.NOCS_NAME }}</span>
            </template>

            <template #cell-MSN="{ row }">
              <span class="font-mono text-sm text-gray-700">{{ row.MSN }}</span>
            </template>

            <template #cell-OLD_CONSUMER_ID="{ row }">
              <span class="text-gray-700">{{ row.OLD_CONSUMER_ID }}</span>
            </template>

            <template #cell-COMMAND_TYPE="{ row }">
              <span
                v-if="row.COMMAND_TYPE?.toUpperCase() === 'RC' || row.COMMAND_TYPE?.toUpperCase() === 'D1-REMOTECONNECT'"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success"
              >
                RC
              </span>
              <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-info/10 text-info">
                DC
              </span>
            </template>

            <template #cell-COMMAND_STATUS="{ row }">
              <span
                :class="getCommandStatusColor(row.COMMAND_STATUS)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
              >
                {{ row.COMMAND_STATUS }}
              </span>
            </template>

            <template #cell-METER_STATUS="{ row }">
              <span
                :class="getMeterStatusColor(getMeterStatus(row.COMMAND_TYPE, row.COMMAND_STATUS))"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
              >
                {{ getMeterStatus(row.COMMAND_TYPE, row.COMMAND_STATUS) }}
              </span>
            </template>

            <template #cell-DATE_OF_COMMAND_TRIGGER="{ row }">
              <span class="text-sm text-gray-600">{{ row.DATE_OF_COMMAND_TRIGGER }}</span>
            </template>

            <template #cell-PAYOFF_BALNCE="{ row }">
              <span class="font-medium text-gray-900">{{ formatCurrency(row.PAYOFF_BALNCE) }}</span>
            </template>
          </app-table>

          <!-- Pagination -->
          <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <div class="text-sm text-gray-600">
              Showing <span class="font-semibold">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> to
              <span class="font-semibold">{{ Math.min(currentPage * itemsPerPage, filteredData.length) }}</span> of
              <span class="font-semibold">{{ filteredData.length }}</span> results
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div class="flex items-center gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  :class="page === currentPage ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
                  class="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg transition-colors"
                >
                  {{ page }}
                </button>
              </div>

              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </app-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useReportsStore } from '@/stores/reports';
import AppCard from '@/components/common/AppCard.vue';
import AppTable from '@/components/common/AppTable.vue';
import AppAlert from '@/components/common/AppAlert.vue';
import * as XLSX from 'xlsx';

const reportsStore = useReportsStore();

// Data
const filters = ref({
  nocsName: '',
  meterNumber: '',
  customerId: '',
  commandType: '',
  commandStatus: '',
  meterStatus: ''
});

const currentPage = ref(1);
const itemsPerPage = 25;

// Computed from store
const meterData = computed(() => reportsStore.meterData || []);
const meterDataLoading = computed(() => reportsStore.meterDataLoading || false);
const meterDataError = computed(() => reportsStore.meterDataError || null);
const meterDataLastUpdated = computed(() => reportsStore.meterDataLastUpdated);

// Table headers
const tableHeaders = [
  { key: 'NOCS_NAME', label: 'NOCS Name', sortable: true },
  { key: 'MSN', label: 'Meter Number', sortable: true },
  { key: 'OLD_CONSUMER_ID', label: 'Customer ID', sortable: true },
  { key: 'COMMAND_TYPE', label: 'Command Type', sortable: true },
  { key: 'COMMAND_STATUS', label: 'Command Status', sortable: true },
  { key: 'METER_STATUS', label: 'Meter Status', sortable: false },
  { key: 'DATE_OF_COMMAND_TRIGGER', label: 'Trigger Date', sortable: true },
  { key: 'PAYOFF_BALNCE', label: 'Payoff Balance', sortable: true },
];

// Computed properties
const uniqueNocsNames = computed(() => {
  const names = [...new Set(meterData.value.map(item => item.NOCS_NAME).filter(Boolean))];
  return names.sort();
});

const filteredData = computed(() => {
  let data = [...meterData.value];

  // NOCS Name filter
  if (filters.value.nocsName) {
    data = data.filter(item => item.NOCS_NAME === filters.value.nocsName);
  }

  // Meter Number filter
  if (filters.value.meterNumber) {
    const search = filters.value.meterNumber.toLowerCase();
    data = data.filter(item => item.MSN?.toLowerCase().includes(search));
  }

  // Customer ID filter
  if (filters.value.customerId) {
    const search = filters.value.customerId.toLowerCase();
    data = data.filter(item => item.OLD_CONSUMER_ID?.toLowerCase().includes(search));
  }

  // Command Type filter
  if (filters.value.commandType) {
    data = data.filter(item => item.COMMAND_TYPE?.trim() === filters.value.commandType);
  }

  // Command Status filter
  if (filters.value.commandStatus) {
    data = data.filter(item => item.COMMAND_STATUS?.trim() === filters.value.commandStatus);
  }

  // Meter Status filter
  if (filters.value.meterStatus) {
    data = data.filter(item => {
      const meterStatus = getMeterStatus(item.COMMAND_TYPE, item.COMMAND_STATUS);
      return meterStatus === filters.value.meterStatus;
    });
  }

  return data;
});

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(val => val !== '');
});

const activeFilterCount = computed(() => {
  return Object.values(filters.value).filter(val => val !== '').length;
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredData.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Methods
const fetchData = async () => {
  await reportsStore.fetchMeterData();
  currentPage.value = 1;
};

const clearAllFilters = () => {
  filters.value = {
    nocsName: '',
    meterNumber: '',
    customerId: '',
    commandType: '',
    commandStatus: '',
    meterStatus: ''
  };
  currentPage.value = 1;
};

const getMeterStatus = (commandType, commandStatus) => {
  const type = commandType?.trim().toUpperCase();
  const status = commandStatus?.trim().toUpperCase();

  // Debug logging
  console.log('getMeterStatus:', { original: commandType, type, status });

  // Handle RC/RemoteConnect commands - COMPLETED
  if ((type === 'RC' || type === 'D1-REMOTECONNECT') && status === 'COMPLETED') {
    console.log('→ Returning: Connected');
    return 'Connected';
  }
  // Handle DC/RemoteDisconnect commands - COMPLETED
  if ((type === 'DC' || type === 'D1-REMOTEDISCONNECT') && status === 'COMPLETED') {
    console.log('→ Returning: Disconnected');
    return 'Disconnected';
  }
  // Handle RC in progress
  if ((type === 'RC' || type === 'D1-REMOTECONNECT') && status === 'COMINPROG') {
    console.log('→ Returning: RC In Progress');
    return 'RC In Progress';
  }
  // Handle DC in progress
  if ((type === 'DC' || type === 'D1-REMOTEDISCONNECT') && status === 'COMINPROG') {
    console.log('→ Returning: DC In Progress');
    return 'DC In Progress';
  }
  // Handle discarded
  if (status === 'DISCARDED') {
    console.log('→ Returning: Discarded');
    return 'Discarded';
  }

  console.log('→ Returning: Unknown');
  return 'Unknown';
};

const getCommandStatusColor = (status) => {
  switch (status?.trim()) {
    case 'COMPLETED':
      return 'bg-success/10 text-success';
    case 'COMINPROG':
      return 'bg-warning/10 text-warning';
    case 'DISCARDED':
      return 'bg-error/10 text-error';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getMeterStatusColor = (status) => {
  switch (status) {
    case 'Connected':
      return 'bg-success/10 text-success';
    case 'Disconnected':
      return 'bg-info/10 text-info';
    case 'RC In Progress':
    case 'DC In Progress':
      return 'bg-warning/10 text-warning';
    case 'Discarded':
      return 'bg-error/10 text-error';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatTime = (date) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const exportToExcel = () => {
  try {
    // Prepare data for export
    const exportData = filteredData.value.map(item => {
      const type = item.COMMAND_TYPE?.toUpperCase();
      const displayType = (type === 'RC' || type === 'D1-REMOTECONNECT') ? 'RC' : 'DC';

      return {
        'NOCS Name': item.NOCS_NAME,
        'Meter Number': item.MSN,
        'Customer ID': item.OLD_CONSUMER_ID,
        'Command Type': displayType,
        'Command Status': item.COMMAND_STATUS,
        'Meter Status': getMeterStatus(item.COMMAND_TYPE, item.COMMAND_STATUS),
        'Trigger Date': item.DATE_OF_COMMAND_TRIGGER,
        'Payoff Balance': item.PAYOFF_BALNCE
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Meter Commands');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // NOCS Name
      { wch: 15 }, // Meter Number
      { wch: 15 }, // Customer ID
      { wch: 15 }, // Command Type
      { wch: 15 }, // Command Status
      { wch: 15 }, // Meter Status
      { wch: 20 }, // Trigger Date
      { wch: 15 }  // Payoff Balance
    ];

    // Generate filename
    const filename = `Meter_Commands_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    console.log('[Export] Excel file exported successfully');
  } catch (error) {
    console.error('[Export] Error exporting to Excel:', error);
    alert('Failed to export data to Excel: ' + error.message);
  }
};

// Lifecycle
onMounted(() => {
  if (meterData.value.length === 0) {
    fetchData();
  }
});
</script>

<style scoped>
/* Add any custom styles here if needed */
</style>
