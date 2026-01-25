<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-3 sm:p-4 md:p-6">
    <div class="max-w-[1800px] mx-auto">
      <!-- Animated Page Header -->
      <div class="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 md:p-8 shadow-2xl">
        <!-- Animated Background Elements -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-1/2 -right-1/2 h-full w-full animate-pulse rounded-full bg-white opacity-5"></div>
          <div class="absolute -bottom-1/2 -left-1/2 h-full w-full animate-pulse rounded-full bg-white opacity-5" style="animation-delay: 1s"></div>
        </div>

        <div class="relative z-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="bg-white/20 p-4 rounded-2xl backdrop-blur-xl transform hover:scale-110 transition-transform duration-300">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight">AMI Operational Dashboard</h1>
                <p class="text-cyan-100 mt-1 text-sm md:text-base font-medium">Advanced Metering Infrastructure Operations & Monitoring</p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <!-- Auto-refresh Countdown -->
              <div v-if="autoRefreshCountdown > 0" class="text-white text-xs sm:text-sm bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm font-semibold">
                Next refresh: {{ formatCountdown(autoRefreshCountdown) }}
              </div>
              <!-- Refresh Button -->
              <button
                @click="refreshAllData"
                :disabled="isLoadingAny"
                class="bg-white/20 hover:bg-white/30 text-white px-4 md:px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm md:text-base font-bold shadow-lg hover:shadow-white/20 transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <ArrowPathIcon :class="['w-5 h-5', isLoadingAny ? 'animate-spin' : '']" />
                <span>Refresh All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Batch Monitoring Alerts -->
      <BatchAlertsComponent ref="batchAlertsRef" />

      <!-- Summary Cards Row - Original 4 Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <!-- Pending IMD Card -->
        <div class="group relative overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div class="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-orange-100 p-3 rounded-2xl">
                <ClockIcon class="w-8 h-8 text-orange-600" />
              </div>
              <button
                @click="loadPendingIMD"
                :disabled="loadingStates.pendingIMD"
                class="p-2 hover:bg-orange-50 rounded-xl transition-colors"
                title="Refresh"
              >
                <ArrowPathIcon :class="['w-5 h-5 text-orange-500', loadingStates.pendingIMD ? 'animate-spin' : '']" />
              </button>
            </div>
            <p class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Pending IMD</p>
            <p v-if="loadingStates.pendingIMD" class="text-3xl font-black text-gray-400 mb-2">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else class="text-4xl font-black text-orange-600 mb-2">
              {{ pendingIMDCount.toLocaleString() }}
            </p>
            <div v-if="d1ImdRps !== null" class="mt-2 pt-2 border-t border-orange-100">
              <p class="text-xs font-semibold text-gray-500 mb-1">D1-IMD Running</p>
              <p :class="getRpsClass(d1ImdRps)" class="text-sm font-bold">
                RPS: {{ d1ImdRps.toFixed(2) }}
              </p>
            </div>
            <p v-else-if="lastUpdates.pendingIMD" class="text-xs text-gray-400 mt-2">
              Updated: {{ formatTime(lastUpdates.pendingIMD) }}
            </p>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
        </div>

        <!-- Bill Count Card -->
        <div class="group relative overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-blue-100 p-3 rounded-2xl">
                <DocumentTextIcon class="w-8 h-8 text-blue-600" />
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="date"
                  v-model="billDateFilter"
                  class="text-xs px-2 py-1.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300 font-semibold"
                />
                <button
                  @click="loadBillCount"
                  :disabled="loadingStates.billCount"
                  class="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all flex items-center gap-1 font-bold shadow-lg"
                >
                  <PlayIcon v-if="!loadingStates.billCount" class="w-3.5 h-3.5" />
                  <ArrowPathIcon v-else class="w-3.5 h-3.5 animate-spin" />
                  {{ loadingStates.billCount ? '' : 'Check' }}
                </button>
              </div>
            </div>
            <p class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Bills Generated</p>
            <p v-if="loadingStates.billCount" class="text-3xl font-black text-gray-400 mb-2">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else-if="billCount === null" class="text-2xl font-bold text-gray-400 mb-2">
              Click Check
            </p>
            <p v-else class="text-4xl font-black text-blue-600 mb-2">
              {{ billCount.toLocaleString() }}
            </p>
            <p v-if="lastUpdates.billCount" class="text-xs text-gray-500 font-semibold mt-2">
              {{ formatDate(billDateFilter) }}
            </p>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        </div>

        <!-- Running Batches Card -->
        <div class="group relative overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div class="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-green-100 p-3 rounded-2xl">
                <PlayIcon class="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Running Batches</p>
            <p v-if="loadingStates.runningBatches" class="text-3xl font-black text-gray-400 mb-2">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else class="text-4xl font-black text-green-600 mb-2">
              {{ runningBatchesCount }}
            </p>
            <p class="text-xs text-gray-500 font-semibold">Currently Active</p>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-green-600"></div>
        </div>

        <!-- Total Batches Card -->
        <div class="group relative overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
          <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-purple-100 p-3 rounded-2xl">
                <CpuChipIcon class="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <p class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Total Batches</p>
            <p v-if="loadingStates.batchPerformance" class="text-3xl font-black text-gray-400 mb-2">
              <span class="animate-pulse">Loading...</span>
            </p>
            <p v-else class="text-4xl font-black text-purple-600 mb-2">
              {{ filteredBatchPerformance.length.toLocaleString() }}
            </p>
            <p class="text-xs text-gray-500 font-semibold">In Date Range</p>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-400 to-purple-600"></div>
        </div>
      </div>

      <!-- Running Batches List -->
      <div class="bg-white rounded-3xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
        <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-white flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <PlayIcon class="w-6 h-6" />
              </div>
              Currently Running Batches
            </h2>
            <button
              @click="loadRunningBatches"
              :disabled="loadingStates.runningBatches"
              class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg"
            >
              <ArrowPathIcon :class="['w-5 h-5', loadingStates.runningBatches ? 'animate-spin' : '']" />
              Refresh
            </button>
          </div>
        </div>
        <div class="p-6">
          <div v-if="loadingStates.runningBatches" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <span class="ml-4 text-gray-600 font-semibold text-lg">Loading running batches...</span>
          </div>
          <div v-else-if="runningBatches.length === 0" class="text-center py-12">
            <div class="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayIcon class="w-10 h-10 text-gray-400" />
            </div>
            <p class="text-gray-500 font-semibold text-lg">No batches currently running</p>
            <p class="text-gray-400 text-sm mt-1">All batch jobs are completed or pending</p>
          </div>
          <template v-else>
            <!-- Desktop Table View -->
            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Batch Code</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Start Time</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Duration</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Records</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">RPS (Live)</th>
                    <th class="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                  <tr v-for="batch in runningBatches" :key="batch.batchCode" class="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        {{ batch.batchCode }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{{ formatDateTime(batch.startTime) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="font-bold text-green-600">{{ getRunningDuration(batch.startTime) }}</span>
                      <span class="text-xs text-gray-500 ml-1">(Live)</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-gray-700 font-semibold">{{ (batch.totalRecords || 0).toLocaleString() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span :class="getRpsClass(calculateRunningRPS(batch.startTime, batch.totalRecords))" class="font-bold text-lg">
                        {{ calculateRunningRPS(batch.startTime, batch.totalRecords).toFixed(2) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 gap-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Running
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Card View -->
            <div class="md:hidden space-y-4">
            <div v-for="batch in runningBatches" :key="batch.batchCode" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Batch Code</span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                    {{ batch.batchCode }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Start Time</span>
                  <span class="text-sm text-gray-900 font-medium">{{ formatDateTime(batch.startTime) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Duration</span>
                  <span class="font-bold text-green-600">{{ getRunningDuration(batch.startTime) }} <span class="text-xs">(Live)</span></span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Records</span>
                  <span class="text-sm text-gray-900 font-semibold">{{ (batch.totalRecords || 0).toLocaleString() }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">RPS (Live)</span>
                  <span :class="getRpsClass(calculateRunningRPS(batch.startTime, batch.totalRecords))" class="font-bold">
                    {{ calculateRunningRPS(batch.startTime, batch.totalRecords).toFixed(2) }}
                  </span>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-green-200">
                  <span class="text-sm text-gray-600 font-semibold">Status</span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300 gap-2">
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Running
                  </span>
                </div>
              </div>
            </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Batch Performance Section -->
      <div class="bg-white rounded-3xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <ChartBarIcon class="w-6 h-6" />
              </div>
              Batch Job Performance Analytics
            </h2>
            <!-- Date Filters -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div class="flex items-center gap-2">
                <label class="text-white text-sm font-bold whitespace-nowrap">From:</label>
                <input
                  type="date"
                  v-model="dateFilters.startDate"
                  class="px-3 py-2 rounded-xl text-sm border-0 focus:ring-2 focus:ring-white/50 font-semibold shadow-lg"
                />
              </div>
              <div class="flex items-center gap-2">
                <label class="text-white text-sm font-bold whitespace-nowrap">To:</label>
                <input
                  type="date"
                  v-model="dateFilters.endDate"
                  class="px-3 py-2 rounded-xl text-sm border-0 focus:ring-2 focus:ring-white/50 font-semibold shadow-lg"
                />
              </div>
              <button
                @click="loadBatchPerformance"
                :disabled="loadingStates.batchPerformance"
                class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center gap-2 justify-center transition-all font-bold shadow-lg"
              >
                <PlayIcon v-if="!loadingStates.batchPerformance" class="w-4 h-4" />
                <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
                {{ loadingStates.batchPerformance ? 'Loading...' : 'Load Data' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="p-6 bg-white border-b border-gray-200">
          <div class="flex flex-wrap gap-4 items-end">
            <!-- Batch Filter -->
            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                <svg class="w-4 h-4 inline-block mr-1 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Batch Code
              </label>
              <select
                v-model="tableFilters.batchCode"
                class="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 font-semibold text-gray-700 transition-all hover:border-indigo-300 cursor-pointer"
              >
                <option value="">All Batches</option>
                <option v-for="code in uniqueBatchCodes" :key="code" :value="code">{{ code }}</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="flex-1 min-w-[180px]">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                <svg class="w-4 h-4 inline-block mr-1 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </label>
              <select
                v-model="tableFilters.status"
                class="w-full px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-400 font-semibold text-gray-700 transition-all hover:border-green-300 cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="Running">🟢 Running</option>
                <option value="Complete">🔵 Complete</option>
                <option value="Ended">🔵 Ended</option>
                <option value="Error">🔴 Error</option>
                <option value="Pending">🟡 Pending</option>
              </select>
            </div>

            <!-- Business Date Filter -->
            <div class="flex-1 min-w-[180px]">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                <svg class="w-4 h-4 inline-block mr-1 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Business Date
              </label>
              <input
                type="date"
                v-model="tableFilters.businessDate"
                class="w-full px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 font-semibold text-gray-700 transition-all hover:border-blue-300 cursor-pointer"
              />
            </div>

            <!-- Sort RPS Filter -->
            <div class="flex-1 min-w-[180px]">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                <svg class="w-4 h-4 inline-block mr-1 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                Sort by RPS
              </label>
              <select
                v-model="tableFilters.rpsSort"
                class="w-full px-4 py-2.5 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-400 font-semibold text-gray-700 transition-all hover:border-orange-300 cursor-pointer"
              >
                <option value="">Default Order</option>
                <option value="high">⬆️ High to Low</option>
                <option value="low">⬇️ Low to High</option>
              </select>
            </div>

            <!-- Clear Filters Button -->
            <div class="flex-shrink-0">
              <button
                @click="clearFilters"
                class="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
            </div>
          </div>

          <!-- Active Filters Display -->
          <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap gap-2">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Filters:</span>
            <span v-if="tableFilters.batchCode" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-300">
              Batch: {{ tableFilters.batchCode }}
              <button @click="tableFilters.batchCode = ''" class="ml-2 hover:text-indigo-900">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
            <span v-if="tableFilters.status" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
              Status: {{ tableFilters.status }}
              <button @click="tableFilters.status = ''" class="ml-2 hover:text-green-900">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
            <span v-if="tableFilters.businessDate" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
              Date: {{ formatDate(tableFilters.businessDate) }}
              <button @click="tableFilters.businessDate = ''" class="ml-2 hover:text-blue-900">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
            <span v-if="tableFilters.rpsSort" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">
              Sort: {{ tableFilters.rpsSort === 'high' ? 'High to Low' : 'Low to High' }}
              <button @click="tableFilters.rpsSort = ''" class="ml-2 hover:text-orange-900">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        </div>

        <!-- Performance Table -->
        <div class="p-6">
          <div v-if="loadingStates.batchPerformance" class="flex items-center justify-center py-16">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            <span class="ml-4 text-gray-600 font-semibold text-lg">Loading batch performance...</span>
          </div>

          <div v-else-if="batchPerformance.length === 0" class="text-center py-16">
            <div class="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CpuChipIcon class="w-10 h-10 text-gray-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No Performance Data</h3>
            <p class="text-gray-500 font-medium">Select date range and click "Load Data" to view batch performance</p>
          </div>

          <div v-else-if="filteredBatchPerformance.length === 0" class="text-center py-16">
            <div class="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CpuChipIcon class="w-10 h-10 text-gray-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No Matches Found</h3>
            <p class="text-gray-500 font-medium">No batch data found for the selected filters</p>
          </div>

          <template v-else>
            <!-- Desktop Table View -->
            <div class="hidden md:block overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Batch Code</th>
                    <th class="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Business Date</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Start Time</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">End Time</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Duration</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Records</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">RPS</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-100">
                  <tr v-for="(batch, index) in filteredBatchPerformance" :key="index" class="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        {{ batch.batchCode }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                      <span :class="getStatusClass(batch.statusCode)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold">
                        {{ getStatusText(batch.statusCode, batch.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">{{ formatDate(batch.businessDate) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{{ formatDateTime(batch.startTime) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {{ batch.statusCode === 'ST' ? '---' : formatDateTime(batch.endTime) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div v-if="batch.statusCode === 'ST'" class="font-bold text-green-600">
                        {{ getRunningDuration(batch.startTime) }} <span class="text-xs">(Live)</span>
                      </div>
                      <div v-else>
                        <div class="font-bold text-gray-900">{{ batch.totalDuration.toLocaleString() }}s</div>
                        <div class="text-xs text-gray-500">{{ formatDurationHours(batch.totalDuration) }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-gray-700 font-semibold">{{ batch.totalRecords.toLocaleString() }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span v-if="batch.statusCode === 'ST'" :class="getRpsClass(calculateRunningRPS(batch.startTime, batch.totalRecords))" class="font-bold text-lg">
                        {{ calculateRunningRPS(batch.startTime, batch.totalRecords).toFixed(2) }}
                        <span class="text-xs text-green-600">LIVE</span>
                      </span>
                      <span v-else :class="getRpsClass(batch.rps)" class="font-bold text-lg">
                        {{ batch.rps.toFixed(2) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Card View -->
            <div class="md:hidden space-y-4">
            <div v-for="(batch, index) in filteredBatchPerformance" :key="index" class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Batch Code</span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    {{ batch.batchCode }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Status</span>
                  <span :class="getStatusClass(batch.statusCode)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold">
                    {{ getStatusText(batch.statusCode, batch.status) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Business Date</span>
                  <span class="text-sm text-gray-900 font-medium">{{ formatDate(batch.businessDate) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Duration</span>
                  <span v-if="batch.statusCode === 'ST'" class="font-bold text-green-600">
                    {{ getRunningDuration(batch.startTime) }} <span class="text-xs">(Live)</span>
                  </span>
                  <span v-else>
                    <div class="font-bold text-gray-900 text-sm">{{ batch.totalDuration.toLocaleString() }}s</div>
                    <div class="text-xs text-gray-500">{{ formatDurationHours(batch.totalDuration) }}</div>
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600 font-semibold">Records</span>
                  <span class="text-sm text-gray-900 font-semibold">{{ batch.totalRecords.toLocaleString() }}</span>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-indigo-200">
                  <span class="text-sm text-gray-600 font-semibold">RPS</span>
                  <span v-if="batch.statusCode === 'ST'" :class="getRpsClass(calculateRunningRPS(batch.startTime, batch.totalRecords))" class="font-bold">
                    {{ calculateRunningRPS(batch.startTime, batch.totalRecords).toFixed(2) }}
                    <span class="text-xs text-green-600">LIVE</span>
                  </span>
                  <span v-else :class="getRpsClass(batch.rps)" class="font-bold">
                    {{ batch.rps.toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ArrowPathIcon,
  CpuChipIcon,
  ClockIcon,
  DocumentTextIcon,
  PlayIcon
} from '@heroicons/vue/24/outline';
import {
  getPendingIMDCount,
  getBillCount,
  getRunningBatches,
  getBatchPerformance
} from '@/services/ami-operational.api';
import BatchAlertsComponent from '@/components/BatchAlertsComponent.vue';

// Component refs
const batchAlertsRef = ref(null);

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

// Auto-refresh
const autoRefreshInterval = 30 * 60; // 30 minutes in seconds
const autoRefreshCountdown = ref(autoRefreshInterval);
let autoRefreshTimer = null;
let countdownTimer = null;

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

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(
    tableFilters.value.batchCode ||
    tableFilters.value.status ||
    tableFilters.value.businessDate ||
    tableFilters.value.rpsSort
  );
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

// Refresh all data
const refreshAllData = async () => {
  // Start independent queries in parallel (NOT batch performance - user controls that)
  loadPendingIMD();
  loadRunningBatches();

  // Optionally refresh batch performance if it was already loaded
  if (batchPerformance.value.length > 0) {
    loadBatchPerformance();
  }

  // Refresh child components
  if (batchAlertsRef.value) {
    batchAlertsRef.value.refreshAlerts();
  }

  // Reset auto-refresh countdown
  resetAutoRefreshCountdown();
};

// Load initial data on mount
const loadInitialData = async () => {
  // Load only essential data (NOT batch performance - user must click "Load Data")
  loadPendingIMD();
  loadRunningBatches();
};

// Auto-refresh functionality
const startAutoRefresh = () => {
  // Reset countdown
  autoRefreshCountdown.value = autoRefreshInterval;

  // Start countdown timer (updates every second)
  countdownTimer = setInterval(() => {
    if (autoRefreshCountdown.value > 0) {
      autoRefreshCountdown.value--;
    }
  }, 1000);

  // Start auto-refresh timer (runs every 30 minutes)
  autoRefreshTimer = setInterval(() => {
    console.log('[AMI Operational] Auto-refresh triggered');
    refreshAllData();
  }, autoRefreshInterval * 1000);
};

const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const resetAutoRefreshCountdown = () => {
  autoRefreshCountdown.value = autoRefreshInterval;
};

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  // Treat null or empty status as Error
  if (!statusCode || statusCode === null || statusCode === '') {
    return 'bg-red-100 text-red-800 border border-red-300';
  }

  const classes = {
    'ST': 'bg-green-100 text-green-800 border border-green-300',
    'ED': 'bg-blue-100 text-blue-800 border border-blue-300',
    'CM': 'bg-blue-100 text-blue-800 border border-blue-300',
    'ER': 'bg-red-100 text-red-800 border border-red-300',
    'PD': 'bg-yellow-100 text-yellow-800 border border-yellow-300'
  };
  return classes[statusCode] || 'bg-red-100 text-red-800 border border-red-300';
};

// Get status text (handle null as Error)
const getStatusText = (statusCode, statusText) => {
  if (!statusCode || statusCode === null || statusCode === '') {
    return 'Error';
  }
  return statusText || statusCode;
};

const getRpsClass = (rps) => {
  if (rps >= 100) return 'text-green-600';
  if (rps >= 50) return 'text-blue-600';
  if (rps >= 20) return 'text-yellow-600';
  return 'text-red-600';
};

// Calculate real-time RPS for running batches: RPS = Records / Duration
const calculateRunningRPS = (startTime, recordsProcessed) => {
  if (!startTime || !recordsProcessed) return 0;

  const start = new Date(startTime).getTime();
  const now = Date.now();
  const durationSeconds = Math.floor((now - start) / 1000);

  if (durationSeconds <= 0) return 0;

  const rps = recordsProcessed / durationSeconds;
  return Math.round(rps * 100) / 100;
};

// Get running duration in human-readable format
const getRunningDuration = (startTime) => {
  if (!startTime) return '0m';

  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours > 0) {
    return `${diffHours}h ${remainingMinutes}m`;
  }
  return `${diffMinutes}m`;
};

// Get D1-IMD batch RPS if it's running
const d1ImdRps = computed(() => {
  const d1ImdBatch = runningBatches.value.find(b => b.batchCode === 'D1-IMD');
  if (!d1ImdBatch) return null;
  return calculateRunningRPS(d1ImdBatch.startTime, d1ImdBatch.totalRecords);
});

// Lifecycle
onMounted(() => {
  console.log('[AMI Operational] View mounted');
  loadInitialData();
  startAutoRefresh();
  console.log('[AMI Operational] Auto-refresh enabled (every 30 minutes)');
});

onUnmounted(() => {
  stopAutoRefresh();
  console.log('[AMI Operational] Auto-refresh stopped');
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
