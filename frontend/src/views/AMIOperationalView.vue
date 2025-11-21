<template>
  <div class="ami-operational-view p-3 sm:p-4 md:p-6">
    <!-- Page Header -->
    <div class="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-white">AMI Operational</h1>
          <p class="text-teal-100 mt-1 text-sm md:text-base">Advanced Metering Infrastructure Operations</p>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <!-- Refresh Button -->
          <button
            @click="refreshAllData"
            :disabled="isLoadingAny"
            class="btn bg-white/20 hover:bg-white/30 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm md:text-base flex-1 sm:flex-initial justify-center"
          >
            <ArrowPathIcon :class="['w-4 h-4 md:w-5 md:h-5', isLoadingAny ? 'animate-spin' : '']" />
            <span class="font-medium">Refresh All</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Pending IMD Card -->
      <div class="bg-white rounded-xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-500">Pending IMD</p>
          <button
            @click="loadPendingIMD"
            :disabled="loadingStates.pendingIMD"
            class="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon :class="['w-4 h-4 text-gray-500', loadingStates.pendingIMD ? 'animate-spin' : '']" />
          </button>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p v-if="loadingStates.pendingIMD" class="text-2xl font-bold text-gray-400">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else class="text-2xl font-bold text-orange-600">
              {{ pendingIMDCount.toLocaleString() }}
            </p>
            <p v-if="lastUpdates.pendingIMD" class="text-xs text-gray-400 mt-1">
              Updated: {{ formatTime(lastUpdates.pendingIMD) }}
            </p>
          </div>
          <div class="p-3 bg-orange-100 rounded-lg">
            <ClockIcon class="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
      </div>

      <!-- Bill Count Card -->
      <div class="bg-white rounded-xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-500">Bills</p>
          <div class="flex items-center gap-1">
            <input
              type="date"
              v-model="billDateFilter"
              class="text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
            />
            <button
              @click="loadBillCount"
              :disabled="loadingStates.billCount"
              class="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
            >
              <PlayIcon v-if="!loadingStates.billCount" class="w-3 h-3" />
              <ArrowPathIcon v-else class="w-3 h-3 animate-spin" />
              {{ loadingStates.billCount ? '' : 'Check' }}
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p v-if="loadingStates.billCount" class="text-2xl font-bold text-gray-400">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else-if="billCount === null" class="text-lg font-medium text-gray-400">
              Click Check
            </p>
            <p v-else class="text-2xl font-bold text-blue-600">
              {{ billCount.toLocaleString() }}
            </p>
            <p v-if="lastUpdates.billCount" class="text-xs text-gray-400 mt-1">
              {{ formatDate(billDateFilter) }}
            </p>
          </div>
          <div class="p-3 bg-blue-100 rounded-lg">
            <DocumentTextIcon class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
      </div>

      <!-- Running Batches Card -->
      <div class="bg-white rounded-xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Running Batches</p>
            <p v-if="loadingStates.runningBatches" class="text-2xl font-bold text-gray-400 mt-1">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else class="text-2xl font-bold text-green-600 mt-1">
              {{ runningBatchesCount }}
            </p>
          </div>
          <div class="p-3 bg-green-100 rounded-lg">
            <PlayIcon class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
      </div>

      <!-- Total Batches Card -->
      <div class="bg-white rounded-xl shadow-md border border-gray-100 p-5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">Total Batches (Range)</p>
            <p v-if="loadingStates.batchPerformance" class="text-2xl font-bold text-gray-400 mt-1">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else class="text-2xl font-bold text-purple-600 mt-1">
              {{ filteredBatchPerformance.length.toLocaleString() }}
            </p>
          </div>
          <div class="p-3 bg-purple-100 rounded-lg">
            <CpuChipIcon class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
      </div>
    </div>

    <!-- Running Batches List -->
    <div class="bg-white rounded-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
      <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <PlayIcon class="w-5 h-5" />
            Currently Running Batches
          </h2>
          <button
            @click="loadRunningBatches"
            :disabled="loadingStates.runningBatches"
            class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <ArrowPathIcon :class="['w-4 h-4', loadingStates.runningBatches ? 'animate-spin' : '']" />
            Refresh
          </button>
        </div>
      </div>
      <div class="p-4">
        <div v-if="loadingStates.runningBatches" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span class="ml-3 text-gray-600">Loading running batches...</span>
        </div>
        <div v-else-if="runningBatches.length === 0" class="text-center py-8">
          <PlayIcon class="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p class="text-gray-500">No batches currently running</p>
        </div>
        <!-- Desktop Table View -->
        <div class="hidden md:block table-responsive">
          <table class="table-modern">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Start Time</th>
                <th>Threads</th>
                <th>Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="batch in runningBatches" :key="batch.batchCode">
                <td class="font-semibold">{{ batch.batchCode }}</td>
                <td class="text-gray-600">{{ formatDateTime(batch.startTime) }}</td>
                <td class="text-gray-600">{{ batch.threadCount }}</td>
                <td class="text-gray-600">{{ (batch.totalRecords || 0).toLocaleString() }}</td>
                <td>
                  <span class="status-badge status-running">
                    <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Running
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-3">
          <div v-for="batch in runningBatches" :key="batch.batchCode" class="mobile-card">
            <div class="mobile-card-row">
              <span class="mobile-card-label">Batch Code</span>
              <span class="mobile-card-value font-semibold">{{ batch.batchCode }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Start Time</span>
              <span class="mobile-card-value text-xs">{{ formatDateTime(batch.startTime) }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Threads</span>
              <span class="mobile-card-value">{{ batch.threadCount }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Records</span>
              <span class="mobile-card-value">{{ (batch.totalRecords || 0).toLocaleString() }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Status</span>
              <span class="status-badge status-running text-xs">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Running
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Performance Section -->
    <div class="bg-white rounded-xl shadow-md border border-gray-100 mb-6 overflow-hidden">
      <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <ChartBarIcon class="w-5 h-5" />
            Batch Job Performance
          </h2>
          <!-- Date Filters -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div class="flex items-center gap-2">
              <label class="text-white text-xs sm:text-sm whitespace-nowrap">From:</label>
              <input
                type="date"
                v-model="dateFilters.startDate"
                class="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm border-0 focus:ring-2 focus:ring-white/50 flex-1 sm:flex-initial"
              />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-white text-xs sm:text-sm whitespace-nowrap">To:</label>
              <input
                type="date"
                v-model="dateFilters.endDate"
                class="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm border-0 focus:ring-2 focus:ring-white/50 flex-1 sm:flex-initial"
              />
            </div>
            <button
              @click="loadBatchPerformance"
              :disabled="loadingStates.batchPerformance"
              class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 justify-center transition-colors text-xs sm:text-sm"
            >
              <PlayIcon v-if="!loadingStates.batchPerformance" class="w-3 h-3 sm:w-4 sm:h-4" />
              <ArrowPathIcon v-else class="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              {{ loadingStates.batchPerformance ? 'Loading...' : 'Load Data' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="p-4 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Batch:</label>
          <select v-model="tableFilters.batchCode" class="text-sm px-2 py-1 border rounded focus:ring-1 focus:ring-indigo-500">
            <option value="">All</option>
            <option v-for="code in uniqueBatchCodes" :key="code" :value="code">{{ code }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Status:</label>
          <select v-model="tableFilters.status" class="text-sm px-2 py-1 border rounded focus:ring-1 focus:ring-indigo-500">
            <option value="">All</option>
            <option value="Running">Running</option>
            <option value="Complete">Complete</option>
            <option value="Ended">Ended</option>
            <option value="Error">Error</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Business Date:</label>
          <input
            type="date"
            v-model="tableFilters.businessDate"
            class="text-sm px-2 py-1 border rounded focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Sort RPS:</label>
          <select v-model="tableFilters.rpsSort" class="text-sm px-2 py-1 border rounded focus:ring-1 focus:ring-indigo-500">
            <option value="">Default</option>
            <option value="high">High to Low</option>
            <option value="low">Low to High</option>
          </select>
        </div>
        <button
          @click="clearFilters"
          class="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <!-- Performance Table -->
      <div class="p-4">
        <div v-if="loadingStates.batchPerformance" class="flex items-center justify-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span class="ml-3 text-gray-600">Loading batch performance...</span>
        </div>

        <div v-else-if="batchPerformance.length === 0" class="text-center py-10">
          <CpuChipIcon class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">Select date range and click "Load Data" to view batch performance</p>
        </div>

        <div v-else-if="filteredBatchPerformance.length === 0" class="text-center py-10">
          <CpuChipIcon class="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p class="text-gray-500">No batch data found for the selected filters</p>
        </div>

        <!-- Desktop Table View -->
        <div class="hidden md:block table-responsive">
          <table class="table-modern">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Status</th>
                <th>Business Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Threads</th>
                <th>Records</th>
                <th>RPS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(batch, index) in filteredBatchPerformance" :key="index">
                <td class="font-semibold">{{ batch.batchCode }}</td>
                <td>
                  <span :class="getStatusClass(batch.statusCode)" class="status-badge">
                    {{ batch.status }}
                  </span>
                </td>
                <td class="text-gray-600">{{ formatDate(batch.businessDate) }}</td>
                <td class="text-gray-600 text-xs">{{ formatDateTime(batch.startTime) }}</td>
                <td class="text-gray-600 text-xs">{{ formatDateTime(batch.endTime) }}</td>
                <td class="text-gray-600">
                  <div class="font-semibold">{{ batch.totalDuration.toLocaleString() }}s</div>
                  <div class="text-xs text-gray-400">{{ formatDurationHours(batch.totalDuration) }}</div>
                </td>
                <td class="text-gray-600">{{ batch.threadCount }}</td>
                <td class="text-gray-600">{{ batch.totalRecords.toLocaleString() }}</td>
                <td>
                  <span :class="getRpsClass(batch.rps)" class="font-semibold">
                    {{ batch.rps.toFixed(2) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="md:hidden space-y-3">
          <div v-for="(batch, index) in filteredBatchPerformance" :key="index" class="mobile-card">
            <div class="mobile-card-row">
              <span class="mobile-card-label">Batch Code</span>
              <span class="mobile-card-value font-semibold">{{ batch.batchCode }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Status</span>
              <span :class="getStatusClass(batch.statusCode)" class="status-badge text-xs">
                {{ batch.status }}
              </span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Business Date</span>
              <span class="mobile-card-value">{{ formatDate(batch.businessDate) }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Duration</span>
              <span class="mobile-card-value">
                <div class="font-semibold">{{ batch.totalDuration.toLocaleString() }}s</div>
                <div class="text-xs text-gray-400">{{ formatDurationHours(batch.totalDuration) }}</div>
              </span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Threads</span>
              <span class="mobile-card-value">{{ batch.threadCount }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">Records</span>
              <span class="mobile-card-value">{{ batch.totalRecords.toLocaleString() }}</span>
            </div>
            <div class="mobile-card-row">
              <span class="mobile-card-label">RPS</span>
              <span :class="getRpsClass(batch.rps)" class="font-semibold">
                {{ batch.rps.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- RPS Chart -->
      <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-cyan-600 p-4">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <ChartBarIcon class="w-5 h-5" />
            Records Per Second by Batch
          </h2>
        </div>
        <div class="p-4">
          <div v-if="loadingStates.batchPerformance" class="h-64 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <div v-else-if="batchPerformance.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-500">
            <ChartBarIcon class="w-12 h-12 text-gray-300 mb-2" />
            <p>Load batch performance data to view chart</p>
          </div>
          <canvas v-else ref="rpsChartRef" class="w-full h-64"></canvas>
        </div>
      </div>

      <!-- Duration Chart -->
      <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
          <h2 class="text-lg font-semibold text-white flex items-center gap-2">
            <ClockIcon class="w-5 h-5" />
            Duration by Batch (seconds)
          </h2>
        </div>
        <div class="p-4">
          <div v-if="loadingStates.batchPerformance" class="h-64 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
          <div v-else-if="batchPerformance.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-500">
            <ClockIcon class="w-12 h-12 text-gray-300 mb-2" />
            <p>Load batch performance data to view chart</p>
          </div>
          <canvas v-else ref="durationChartRef" class="w-full h-64"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import {
  ArrowPathIcon,
  CpuChipIcon,
  ClockIcon,
  DocumentTextIcon,
  PlayIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline';
import {
  getPendingIMDCount,
  getBillCount,
  getRunningBatches,
  getBatchPerformance
} from '@/services/ami-operational.api';
import Chart from 'chart.js/auto';

// State - Individual loading states for progressive loading
const loadingStates = ref({
  pendingIMD: false,
  billCount: false,
  runningBatches: false,
  batchPerformance: false
});

// Last update times
const lastUpdates = ref({
  pendingIMD: null,
  billCount: null
});

// Data
const pendingIMDCount = ref(0);
const billCount = ref(null);
const runningBatches = ref([]);
const batchPerformance = ref([]);

// Bill date filter
const billDateFilter = ref(new Date().toISOString().split('T')[0]);

// Date filters for batch performance
const dateFilters = ref({
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
});

// Table filters
const tableFilters = ref({
  batchCode: '',
  status: '',
  businessDate: '',
  rpsSort: ''
});

// Chart refs
const rpsChartRef = ref(null);
const durationChartRef = ref(null);
let rpsChart = null;
let durationChart = null;

// Computed
const isLoadingAny = computed(() => {
  return Object.values(loadingStates.value).some(state => state);
});

const runningBatchesCount = computed(() => runningBatches.value.length);

// Get unique batch codes for filter dropdown
const uniqueBatchCodes = computed(() => {
  const codes = [...new Set(batchPerformance.value.map(b => b.batchCode))];
  return codes.sort();
});

// Filtered batch performance data
const filteredBatchPerformance = computed(() => {
  let data = [...batchPerformance.value];

  // Filter by batch code
  if (tableFilters.value.batchCode) {
    data = data.filter(b => b.batchCode === tableFilters.value.batchCode);
  }

  // Filter by status
  if (tableFilters.value.status) {
    data = data.filter(b => b.status === tableFilters.value.status);
  }

  // Filter by business date
  if (tableFilters.value.businessDate) {
    data = data.filter(b => {
      if (!b.businessDate) return false;
      const bDate = new Date(b.businessDate).toISOString().split('T')[0];
      return bDate === tableFilters.value.businessDate;
    });
  }

  // Sort by RPS
  if (tableFilters.value.rpsSort === 'high') {
    data.sort((a, b) => b.rps - a.rps);
  } else if (tableFilters.value.rpsSort === 'low') {
    data.sort((a, b) => a.rps - b.rps);
  }

  return data;
});

// Methods
const loadPendingIMD = async () => {
  loadingStates.value.pendingIMD = true;
  try {
    const response = await getPendingIMDCount();
    pendingIMDCount.value = response.data.data?.count || 0;
    lastUpdates.value.pendingIMD = new Date();
    console.log('[AMI Operational] Pending IMD loaded:', pendingIMDCount.value);
  } catch (error) {
    console.error('[AMI Operational] Error loading pending IMD:', error);
    pendingIMDCount.value = 0;
  } finally {
    loadingStates.value.pendingIMD = false;
  }
};

const loadBillCount = async () => {
  loadingStates.value.billCount = true;
  try {
    const response = await getBillCount(billDateFilter.value);
    billCount.value = response.data.data?.count || 0;
    lastUpdates.value.billCount = new Date();
    console.log('[AMI Operational] Bill count loaded:', billCount.value);
  } catch (error) {
    console.error('[AMI Operational] Error loading bill count:', error);
    billCount.value = 0;
  } finally {
    loadingStates.value.billCount = false;
  }
};

const loadRunningBatches = async () => {
  loadingStates.value.runningBatches = true;
  try {
    const response = await getRunningBatches();
    runningBatches.value = response.data.data?.batches || [];
    console.log('[AMI Operational] Running batches loaded:', runningBatches.value.length);
  } catch (error) {
    console.error('[AMI Operational] Error loading running batches:', error);
    runningBatches.value = [];
  } finally {
    loadingStates.value.runningBatches = false;
  }
};

const loadBatchPerformance = async () => {
  loadingStates.value.batchPerformance = true;
  try {
    const response = await getBatchPerformance(
      dateFilters.value.startDate,
      dateFilters.value.endDate
    );
    batchPerformance.value = response.data.data?.performance || [];
    console.log('[AMI Operational] Batch performance loaded:', batchPerformance.value.length);

    // Update charts after data is loaded
    await nextTick();
    updateCharts();
  } catch (error) {
    console.error('[AMI Operational] Error loading batch performance:', error);
    batchPerformance.value = [];
  } finally {
    loadingStates.value.batchPerformance = false;
  }
};

// Clear filters
const clearFilters = () => {
  tableFilters.value = {
    batchCode: '',
    status: '',
    businessDate: '',
    rpsSort: ''
  };
};

// Refresh all data - each query runs independently
const refreshAllData = () => {
  // Start all queries in parallel - results will show as they come in
  loadPendingIMD();
  loadRunningBatches();
  // Bill count and batch performance require user to click button
};

// Load initial data on mount (only auto-load pendingIMD and runningBatches)
const loadInitialData = () => {
  loadPendingIMD();
  loadRunningBatches();
};

// Format helpers
const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  const date = new Date(dateTime);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (dateTime) => {
  if (!dateTime) return '-';
  const date = new Date(dateTime);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDurationHours = (seconds) => {
  if (!seconds || seconds === 0) return '0h 0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getStatusClass = (statusCode) => {
  const classes = {
    'ST': 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
    'ED': 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
    'CM': 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
    'ER': 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    'PD': 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full'
  };
  return classes[statusCode] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full';
};

const getRpsClass = (rps) => {
  if (rps >= 100) return 'font-medium text-green-600';
  if (rps >= 50) return 'font-medium text-blue-600';
  if (rps >= 20) return 'font-medium text-yellow-600';
  return 'font-medium text-red-600';
};

// Chart functions
const updateCharts = () => {
  if (batchPerformance.value.length === 0) return;

  // Get unique batch codes and aggregate data
  const batchData = {};
  batchPerformance.value.forEach(batch => {
    if (!batchData[batch.batchCode]) {
      batchData[batch.batchCode] = {
        totalRps: 0,
        totalDuration: 0,
        count: 0
      };
    }
    batchData[batch.batchCode].totalRps += batch.rps;
    batchData[batch.batchCode].totalDuration += batch.totalDuration;
    batchData[batch.batchCode].count++;
  });

  // Get top 10 batches by RPS
  const sortedByRps = Object.entries(batchData)
    .map(([code, data]) => ({
      code,
      avgRps: data.totalRps / data.count,
      avgDuration: data.totalDuration / data.count
    }))
    .sort((a, b) => b.avgRps - a.avgRps)
    .slice(0, 10);

  const labels = sortedByRps.map(b => b.code);
  const rpsData = sortedByRps.map(b => Math.round(b.avgRps * 100) / 100);
  const durationData = sortedByRps.map(b => Math.round(b.avgDuration));

  // RPS Chart
  if (rpsChartRef.value) {
    if (rpsChart) rpsChart.destroy();
    rpsChart = new Chart(rpsChartRef.value, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avg RPS',
          data: rpsData,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Records/Second' }
          },
          x: {
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  }

  // Duration Chart
  if (durationChartRef.value) {
    if (durationChart) durationChart.destroy();
    durationChart = new Chart(durationChartRef.value, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avg Duration',
          data: durationData,
          backgroundColor: 'rgba(147, 51, 234, 0.7)',
          borderColor: 'rgba(147, 51, 234, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Seconds' }
          },
          x: {
            ticks: { maxRotation: 45, minRotation: 45 }
          }
        }
      }
    });
  }
};

// Lifecycle
onMounted(() => {
  console.log('[AMI Operational] View mounted');
  loadInitialData();
});

onUnmounted(() => {
  if (rpsChart) rpsChart.destroy();
  if (durationChart) durationChart.destroy();
});
</script>

<style scoped>
.ami-operational-view {
  min-height: calc(100vh - 4rem);
}
</style>
