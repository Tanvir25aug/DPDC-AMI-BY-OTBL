<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
    <!-- Page Header with Gradient -->
    <div class="mb-8">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-3">
              <div class="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ClockIcon class="w-10 h-10" />
              </div>
              <div>
                <h1 class="text-4xl font-extrabold tracking-tight">
                  RC In Progress Monitor
                </h1>
                <p class="mt-2 text-blue-100 text-lg">
                  Real-time tracking of Remote Connect commands with intelligent analytics
                </p>
              </div>
            </div>

            <!-- Last Updated Badge -->
            <div v-if="lastUpdated" class="flex items-center gap-4 mt-4">
              <div class="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Last updated: {{ formatTimestamp(lastUpdated) }}
              </div>
              <div v-if="autoRefresh" class="bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <ArrowPathIcon class="w-4 h-4 animate-spin" />
                Auto-refresh: 10 min
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-3">
            <button
              @click="exportData('excel')"
              :disabled="isExporting"
              class="group relative px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowDownTrayIcon class="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span class="font-semibold text-sm">{{ isExporting ? 'Exporting...' : 'Excel' }}</span>
            </button>
            <button
              @click="exportData('csv')"
              :disabled="isExporting"
              class="group relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <DocumentTextIcon class="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span class="font-semibold text-sm">{{ isExporting ? 'Exporting...' : 'CSV' }}</span>
            </button>
            <button
              @click="exportByNOCS"
              :disabled="isExporting"
              class="group relative px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowDownTrayIcon class="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span class="font-semibold text-sm">{{ isExporting ? 'Exporting...' : 'By NOCS' }}</span>
            </button>
            <button
              @click="exportFilteredData"
              :disabled="isExporting"
              class="group relative px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowDownTrayIcon class="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span class="font-semibold text-sm">{{ isExporting ? 'Exporting...' : 'Filtered' }}</span>
            </button>
            <button
              @click="loadAllData"
              :disabled="isLoading"
              class="group relative px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 border border-white/20"
            >
              <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': isLoading }" />
              <span class="font-semibold text-sm">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !summaryData" class="flex items-center justify-center py-20">
      <div class="text-center bg-white rounded-2xl shadow-xl p-12">
        <ArrowPathIcon class="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <p class="text-gray-600 text-lg font-medium">Loading RC In Progress data...</p>
        <p class="text-gray-400 text-sm mt-2">Please wait while we fetch the latest information</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
      <div class="flex items-center gap-4">
        <div class="bg-red-100 p-4 rounded-xl">
          <ExclamationCircleIcon class="w-8 h-8 text-red-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-red-900">Error Loading Data</h3>
          <p class="text-red-700 mt-2">{{ error }}</p>
        </div>
        <button
          @click="loadAllData"
          class="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 font-semibold shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-8">
      <!-- Summary Cards with Gradient Backgrounds -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <!-- Total In Progress -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <ClockIcon class="w-12 h-12 opacity-80" />
              <div class="text-right">
                <div class="text-5xl font-black">
                  {{ summaryData?.total || 0 }}
                </div>
              </div>
            </div>
            <div class="border-t border-white/20 pt-3">
              <p class="font-semibold text-sm uppercase tracking-wide">Total In Progress</p>
              <p class="text-xs text-blue-100 mt-1">Active commands</p>
            </div>
          </div>
        </div>

        <!-- Normal -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <CheckCircleIcon class="w-12 h-12 opacity-80" />
              <div class="text-right">
                <div class="text-5xl font-black">
                  {{ summaryData?.byDuration?.normal || 0 }}
                </div>
              </div>
            </div>
            <div class="border-t border-white/20 pt-3">
              <p class="font-semibold text-sm uppercase tracking-wide">Normal</p>
              <p class="text-xs text-green-100 mt-1">&lt; 30 minutes</p>
            </div>
          </div>
        </div>

        <!-- Warning -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <ExclamationTriangleIcon class="w-12 h-12 opacity-80" />
              <div class="text-right">
                <div class="text-5xl font-black">
                  {{ summaryData?.byDuration?.warning || 0 }}
                </div>
              </div>
            </div>
            <div class="border-t border-white/20 pt-3">
              <p class="font-semibold text-sm uppercase tracking-wide">Warning</p>
              <p class="text-xs text-yellow-100 mt-1">30-60 minutes</p>
            </div>
          </div>
        </div>

        <!-- Alert -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <ExclamationCircleIcon class="w-12 h-12 opacity-80" />
              <div class="text-right">
                <div class="text-5xl font-black">
                  {{ summaryData?.byDuration?.alert || 0 }}
                </div>
              </div>
            </div>
            <div class="border-t border-white/20 pt-3">
              <p class="font-semibold text-sm uppercase tracking-wide">Alert</p>
              <p class="text-xs text-orange-100 mt-1">1-2 hours</p>
            </div>
          </div>
        </div>

        <!-- Stuck -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer animate-pulse-slow">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <XCircleIcon class="w-12 h-12 opacity-80" />
              <div class="text-right">
                <div class="text-5xl font-black">
                  {{ summaryData?.byDuration?.stuck || 0 }}
                </div>
              </div>
            </div>
            <div class="border-t border-white/20 pt-3">
              <p class="font-semibold text-sm uppercase tracking-wide">Stuck</p>
              <p class="text-xs text-red-100 mt-1">&gt; 2 hours ⚠️</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <h3 class="text-2xl font-bold flex items-center gap-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Performance Metrics
          </h3>
        </div>
        <div class="p-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
              <div class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Average Duration</div>
              <div class="text-4xl font-black text-blue-600 mb-1">
                {{ formatMinutes(summaryData?.metrics?.avgMinutes) }}
              </div>
              <div class="text-xs text-gray-500">Typical processing time</div>
            </div>
            <div class="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
              <div class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Fastest Command</div>
              <div class="text-4xl font-black text-green-600 mb-1">
                {{ formatMinutes(summaryData?.metrics?.minMinutes) }}
              </div>
              <div class="text-xs text-gray-500">Best performance</div>
            </div>
            <div class="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-100">
              <div class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Slowest Command</div>
              <div class="text-4xl font-black text-red-600 mb-1">
                {{ formatMinutes(summaryData?.metrics?.maxMinutes) }}
              </div>
              <div class="text-xs text-gray-500">Needs attention</div>
            </div>
          </div>
        </div>
      </div>

      <!-- NOCS Breakdown Chart -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
          <h3 class="text-2xl font-bold flex items-center gap-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            NOCS Breakdown
          </h3>
        </div>
        <div class="p-8">
          <div v-if="nocsData && nocsData.length > 0" class="space-y-4">
            <div
              v-for="(nocs, index) in nocsData"
              :key="nocs.nocs"
              class="group p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border-2 border-transparent hover:border-blue-200 hover:shadow-lg"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                    {{ index + 1 }}
                  </div>
                  <div>
                    <span class="font-bold text-gray-900 text-lg">{{ nocs.nocs }}</span>
                    <div class="text-sm text-gray-600 mt-1">
                      <span class="font-semibold">{{ nocs.count }}</span> commands
                      <span v-if="nocs.stuckCount > 0" class="ml-2 text-red-600 font-semibold">
                        ({{ nocs.stuckCount }} stuck 🚨)
                      </span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-gray-500">Avg Duration</div>
                  <div class="text-xl font-bold text-blue-600">
                    {{ formatMinutes(nocs.avgMinutes) }}
                  </div>
                </div>
              </div>
              <div class="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-md"
                  :style="{ width: getPercentage(nocs.count) + '%' }"
                >
                  <div class="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
                <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {{ getPercentage(nocs.count) }}%
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <div class="text-gray-400 text-lg">No NOCS data available</div>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <h3 class="text-2xl font-bold flex items-center gap-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters & Search
          </h3>
        </div>
        <div class="p-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- NOCS Filter -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Filter by NOCS
              </label>
              <select
                v-model="filters.nocs"
                @change="applyFilters"
                class="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 font-medium text-gray-700"
              >
                <option value="">All NOCS Locations</option>
                <option v-for="nocs in nocsData" :key="nocs.nocs" :value="nocs.nocs">
                  {{ nocs.nocs }} ({{ nocs.count }})
                </option>
              </select>
            </div>

            <!-- Duration Status Filter -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Filter by Status
              </label>
              <select
                v-model="filters.durationStatus"
                @change="applyFilters"
                class="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 font-medium text-gray-700"
              >
                <option value="">All Status Types</option>
                <option value="NORMAL">✓ Normal (&lt; 30 min)</option>
                <option value="WARNING">⚠️ Warning (30-60 min)</option>
                <option value="ALERT">🚨 Alert (1-2 hours)</option>
                <option value="STUCK">🔴 Stuck (&gt; 2 hours)</option>
              </select>
            </div>

            <!-- Search by Meter -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Search Meter/Customer
              </label>
              <input
                v-model="searchQuery"
                @input="filterDetailedData"
                type="text"
                placeholder="Enter meter or customer ID..."
                class="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 font-medium text-gray-700"
              />
            </div>
          </div>

          <div class="mt-6">
            <button
              @click="clearFilters"
              class="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 font-semibold shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Detailed Table -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
          <h3 class="text-2xl font-bold flex items-center justify-between">
            <span class="flex items-center gap-3">
              <div class="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Detailed Command List
            </span>
            <span class="bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full text-sm font-bold shadow-lg">
              {{ filteredDetailedData.length }} records
            </span>
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-gray-100 to-blue-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Meter Number
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Customer ID
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  NOCS
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Trigger Time
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Duration
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payoff Balance
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="(record, index) in paginatedDetailedData"
                :key="record.COMMAND_ID"
                class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                :class="{ 'bg-gray-50': index % 2 === 0 }"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">{{ record.METER_NUMBER }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-700">{{ record.CUSTOMER_ID }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-700">{{ record.NOCS_NAME }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-600">{{ record.TRIGGER_TIME }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">
                    {{ formatMinutes(record.MINUTES_ELAPSED) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    ({{ record.HOURS_ELAPSED }}h elapsed)
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-4 py-2 inline-flex text-xs leading-5 font-bold rounded-full shadow-md"
                    :class="getDurationStatusClass(record.DURATION_STATUS)"
                  >
                    {{ record.DURATION_STATUS }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">৳{{ formatNumber(record.PAYOFF_BALANCE) }}</div>
                </td>
              </tr>

              <tr v-if="filteredDetailedData.length === 0">
                <td colspan="7" class="px-6 py-16 text-center">
                  <div class="text-gray-400 text-lg font-medium">
                    No records found matching the current filters
                  </div>
                  <button
                    @click="clearFilters"
                    class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="filteredDetailedData.length > 0"
          class="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-5 border-t-2 border-gray-200"
        >
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700 font-medium">
              Showing
              <span class="font-bold text-blue-600">{{ (currentPage - 1) * pageSize + 1 }}</span>
              to
              <span class="font-bold text-blue-600">{{ Math.min(currentPage * pageSize, filteredDetailedData.length) }}</span>
              of
              <span class="font-bold text-blue-600">{{ filteredDetailedData.length }}</span>
              results
            </div>

            <div class="flex gap-3">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
              >
                ← Previous
              </button>
              <div class="flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md">
                Page {{ currentPage }} of {{ totalPages }}
              </div>
              <button
                @click="currentPage++"
                :disabled="currentPage >= totalPages"
                class="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';
import {
  getRCInProgressDetailed,
  getRCInProgressSummary,
  getRCInProgressByNOCS,
  exportRCInProgress,
  exportRCInProgressByNOCS,
  exportFilteredRCInProgress
} from '@/services/rc-progress.api';

// State
const isLoading = ref(false);
const isExporting = ref(false);
const error = ref(null);
const lastUpdated = ref(null);
const autoRefresh = ref(true);
const refreshInterval = ref(null);

// Data
const summaryData = ref(null);
const nocsData = ref([]);
const detailedData = ref([]);
const filteredDetailedData = ref([]);

// Filters
const filters = ref({
  nocs: '',
  durationStatus: ''
});
const searchQuery = ref('');

// Pagination
const currentPage = ref(1);
const pageSize = ref(50);

// Computed
const totalPages = computed(() => {
  return Math.ceil(filteredDetailedData.value.length / pageSize.value);
});

const paginatedDetailedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredDetailedData.value.slice(start, end);
});

// Methods
const loadAllData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const [summaryResponse, nocsResponse, detailedResponse] = await Promise.all([
      getRCInProgressSummary(),
      getRCInProgressByNOCS(),
      getRCInProgressDetailed(1, 10000)
    ]);

    summaryData.value = summaryResponse.data.data;
    nocsData.value = nocsResponse.data.data;
    detailedData.value = detailedResponse.data.data;
    filteredDetailedData.value = detailedData.value;

    lastUpdated.value = new Date();
  } catch (err) {
    console.error('Error loading RC In Progress data:', err);
    error.value = err.response?.data?.message || 'Failed to load data. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  filterDetailedData();
};

const filterDetailedData = () => {
  let filtered = [...detailedData.value];

  if (filters.value.nocs) {
    filtered = filtered.filter(record => record.NOCS_NAME === filters.value.nocs);
  }

  if (filters.value.durationStatus) {
    filtered = filtered.filter(record => record.DURATION_STATUS === filters.value.durationStatus);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(record =>
      record.METER_NUMBER?.toLowerCase().includes(query) ||
      record.CUSTOMER_ID?.toLowerCase().includes(query)
    );
  }

  filteredDetailedData.value = filtered;
};

const clearFilters = () => {
  filters.value = {
    nocs: '',
    durationStatus: ''
  };
  searchQuery.value = '';
  currentPage.value = 1;
  filteredDetailedData.value = detailedData.value;
};

const exportData = async (format) => {
  isExporting.value = true;

  try {
    const response = await exportRCInProgress(format);

    const blob = new Blob([response.data], {
      type: format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RC_In_Progress_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting data:', err);
    error.value = 'Failed to export data. Please try again.';
  } finally {
    isExporting.value = false;
  }
};

const exportByNOCS = async () => {
  isExporting.value = true;

  try {
    const response = await exportRCInProgressByNOCS();

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RC_In_Progress_By_NOCS_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting by NOCS:', err);
    error.value = 'Failed to export by NOCS. Please try again.';
  } finally {
    isExporting.value = false;
  }
};

const exportFilteredData = async () => {
  isExporting.value = true;

  try {
    // Get all meter numbers from currently filtered data
    const meterNumbers = filteredDetailedData.value.map(record => record.METER_NUMBER);

    if (meterNumbers.length === 0) {
      error.value = 'No data to export. Please adjust your filters.';
      isExporting.value = false;
      return;
    }

    const response = await exportFilteredRCInProgress(meterNumbers);

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RC_In_Progress_Filtered_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting filtered data:', err);
    error.value = 'Failed to export filtered data. Please try again.';
  } finally {
    isExporting.value = false;
  }
};

const getPercentage = (count) => {
  const total = summaryData.value?.total || 1;
  return Math.round((count / total) * 100);
};

const getDurationStatusClass = (status) => {
  switch (status) {
    case 'NORMAL':
      return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
    case 'WARNING':
      return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white';
    case 'ALERT':
      return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
    case 'STUCK':
      return 'bg-gradient-to-r from-red-600 to-pink-600 text-white animate-pulse';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatMinutes = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

const formatNumber = (num) => {
  if (!num) return '0.00';
  return parseFloat(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const startAutoRefresh = () => {
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(() => {
      loadAllData();
    }, 10 * 60 * 1000); // 10 minutes
  }
};

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

onMounted(() => {
  loadAllData();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
