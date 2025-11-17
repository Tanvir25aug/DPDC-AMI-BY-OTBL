<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-elevation-3">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Title Section -->
          <div class="flex items-center gap-4">
            <div class="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-extrabold">DPDC RC/DC Dashboard</h1>
              <p class="text-white/90 mt-1">Real-time Remote Connect/Disconnect Monitoring</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <!-- Real-time Toggle -->
            <div class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl">
              <div class="flex items-center gap-2">
                <!-- Status Indicator -->
                <div class="flex items-center gap-2">
                  <div
                    class="w-2 h-2 rounded-full transition-all"
                    :class="isRealtimeConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'"
                  ></div>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium text-white">
                      {{ isRealtimeConnected ? 'Live' : 'Paused' }}
                    </span>
                    <span v-if="isRealtimeEnabled" class="text-xs text-white/70">
                      Updates every 5 min
                    </span>
                  </div>
                </div>

                <!-- Toggle Switch -->
                <button
                  @click="toggleRealtimeUpdates"
                  :class="isRealtimeEnabled ? 'bg-green-500' : 'bg-gray-400'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                >
                  <span
                    :class="isRealtimeEnabled ? 'translate-x-6' : 'translate-x-1'"
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  />
                </button>
              </div>
            </div>

            <!-- Manual Refresh Button -->
            <button
              @click="fetchData"
              :disabled="analyticsLoading"
              class="btn bg-white text-primary-700 hover:bg-white/90 px-6 py-3 font-semibold shadow-md"
            >
              <svg v-if="!analyticsLoading" class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5 inline-block mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ analyticsLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <!-- Last Updated -->
        <div v-if="analytics.lastUpdated" class="mt-4 flex items-center gap-2 text-white/80 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last updated: {{ formatDateTime(analytics.lastUpdated) }}
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="analyticsError" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <app-alert variant="error" :dismissible="true" @dismiss="reportsStore.analyticsError = null">
        <template #title>Database Connection Error</template>
        <p>Unable to connect to the Oracle database. Please check:</p>
        <ul class="list-disc ml-5 mt-2">
          <li>VPN connection is active</li>
          <li>Network connectivity to database server</li>
          <li>Database credentials are correct</li>
        </ul>
        <p class="text-sm mt-2 font-mono">{{ analyticsError }}</p>
      </app-alert>
    </div>

    <!-- Loading State - Only for Dashboard Stats -->
    <div v-if="analyticsLoading && !analytics.lastUpdated" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col items-center justify-center py-20">
        <svg class="w-16 h-16 text-primary-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xl font-semibold text-gray-700">Loading dashboard statistics...</p>
        <p class="text-sm text-gray-500 mt-2">Please wait a moment...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Overview Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Commands -->
        <app-card hoverable class="bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">Total Commands</p>
              <p class="text-4xl font-extrabold text-gray-900">{{ analytics.totalCommands }}</p>
            </div>
            <div class="bg-purple-500 p-4 rounded-xl">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </app-card>

        <!-- RC Success Rate -->
        <app-card hoverable class="bg-gradient-to-br from-green-50 to-white border-l-4 border-success">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">RC Success Rate</p>
              <p class="text-4xl font-extrabold text-success">
                {{ calculateSuccessRate(analytics.rcSuccess, analytics.rcSuccess + analytics.rcInProgress) }}%
              </p>
            </div>
            <div class="bg-success p-4 rounded-xl">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="bg-green-200 rounded-full h-2">
              <div class="bg-success rounded-full h-2 transition-all duration-500" :style="{ width: `${calculateSuccessRate(reportsStore.analytics.rcSuccess, reportsStore.analytics.rcSuccess + reportsStore.analytics.rcInProgress)}%` }"></div>
            </div>
          </div>
        </app-card>

        <!-- DC Success Rate -->
        <app-card hoverable class="bg-gradient-to-br from-blue-50 to-white border-l-4 border-info">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">DC Success Rate</p>
              <p class="text-4xl font-extrabold text-info">
                {{ calculateSuccessRate(analytics.dcSuccess, analytics.dcSuccess + analytics.dcInProgress + analytics.dcFailed) }}%
              </p>
            </div>
            <div class="bg-info p-4 rounded-xl">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="bg-blue-200 rounded-full h-2">
              <div class="bg-info rounded-full h-2 transition-all duration-500" :style="{ width: `${calculateSuccessRate(reportsStore.analytics.dcSuccess, reportsStore.analytics.dcSuccess + reportsStore.analytics.dcInProgress + reportsStore.analytics.dcFailed)}%` }"></div>
            </div>
          </div>
        </app-card>

        <!-- Overall Success -->
        <app-card hoverable class="bg-gradient-to-br from-orange-50 to-white border-l-4 border-warning">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium mb-1">Overall Success</p>
              <p class="text-4xl font-extrabold text-warning">
                {{ calculateSuccessRate(analytics.rcSuccess + analytics.dcSuccess, analytics.totalCommands) }}%
              </p>
            </div>
            <div class="bg-warning p-4 rounded-xl">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-3">
            <div class="bg-orange-200 rounded-full h-2">
              <div class="bg-warning rounded-full h-2 transition-all duration-500" :style="{ width: `${calculateSuccessRate(reportsStore.analytics.rcSuccess + reportsStore.analytics.dcSuccess, reportsStore.analytics.totalCommands)}%` }"></div>
            </div>
          </div>
        </app-card>
      </div>

      <!-- Remote Connect Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Remote Connect Commands
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- RC Success -->
          <app-card class="bg-white">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs font-bold text-gray-600 uppercase tracking-wide">Completed</span>
                </div>
                <p class="text-5xl font-extrabold text-success">{{ analytics.rcSuccess }}</p>
                <p class="text-sm text-gray-500 mt-1">Successfully connected</p>
              </div>
              <div class="bg-green-100 p-6 rounded-2xl">
                <svg class="w-12 h-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div class="border-t border-gray-200 pt-3">
              <p class="text-sm text-gray-600">
                {{ analytics.rcSuccess }} of {{ analytics.rcSuccess + analytics.rcInProgress }} total
              </p>
            </div>
          </app-card>

          <!-- RC In Progress -->
          <app-card class="bg-white">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs font-bold text-gray-600 uppercase tracking-wide">In Progress</span>
                </div>
                <p class="text-5xl font-extrabold text-warning">{{ analytics.rcInProgress }}</p>
                <p class="text-sm text-gray-500 mt-1">Currently processing</p>
              </div>
              <div class="bg-orange-100 p-6 rounded-2xl">
                <svg class="w-12 h-12 text-warning animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div class="border-t border-gray-200 pt-3">
              <p class="text-sm text-gray-600">Pending completion</p>
            </div>
          </app-card>
        </div>
      </div>

      <!-- Remote Disconnect Section -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Remote Disconnect Commands
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- DC Success -->
          <app-card class="bg-white">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-xs font-bold text-gray-600 uppercase">Completed</span>
                </div>
                <p class="text-4xl font-extrabold text-success">{{ analytics.dcSuccess }}</p>
              </div>
              <div class="bg-green-100 p-4 rounded-xl">
                <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </app-card>

          <!-- DC In Progress -->
          <app-card class="bg-white">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs font-bold text-gray-600 uppercase">In Progress</span>
                </div>
                <p class="text-4xl font-extrabold text-warning">{{ analytics.dcInProgress }}</p>
              </div>
              <div class="bg-orange-100 p-4 rounded-xl">
                <svg class="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </app-card>

          <!-- DC Failed -->
          <app-card class="bg-white">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span class="text-xs font-bold text-gray-600 uppercase">Failed</span>
                </div>
                <p class="text-4xl font-extrabold text-error">{{ analytics.dcFailed }}</p>
              </div>
              <div class="bg-red-100 p-4 rounded-xl">
                <svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </app-card>
        </div>
      </div>

      <!-- NOCS-wise Report Table -->
      <div class="mb-8">
        <app-card>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="bg-primary-100 p-3 rounded-xl">
                  <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">NOCS-wise Breakdown</h2>
                  <p class="text-sm text-gray-500">Detailed statistics by location ({{ nocsTableData.length }} NOCS)</p>
                </div>
              </div>
            </div>
          </template>

          <!-- Loading State for NOCS Data -->
          <div v-if="nocsDataLoading && !hasNocsData" class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-primary-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-lg font-semibold text-gray-700">Loading NOCS breakdown...</p>
            <p class="text-sm text-gray-500 mt-2">This may take 20-60 seconds for large datasets</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!hasNocsData && !nocsDataLoading" class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-lg font-semibold text-gray-700">No NOCS Data Available</p>
            <p class="text-sm text-gray-500 mt-2">Click the refresh button to load data</p>
          </div>

          <!-- Data Table -->
          <div v-else>
            <app-table
              :columns="tableHeaders"
              :data="nocsTableData"
              :striped="true"
            >
              <template #cell-nocsName="{ row }">
                <div class="py-1">
                  <p class="font-semibold text-gray-900">{{ row.nocsName }}</p>
                  <p class="text-xs text-gray-500">Total: {{ row.total }}</p>
                </div>
              </template>
              <template #cell-rcSuccess="{ row }">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">
                  {{ row.rcSuccess }}
                </span>
              </template>
              <template #cell-rcInProgress="{ row }">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-warning/10 text-warning">
                  {{ row.rcInProgress }}
                </span>
              </template>
              <template #cell-dcSuccess="{ row }">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">
                  {{ row.dcSuccess }}
                </span>
              </template>
              <template #cell-dcInProgress="{ row }">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-warning/10 text-warning">
                  {{ row.dcInProgress }}
                </span>
              </template>
              <template #cell-dcFailed="{ row }">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-error/10 text-error">
                  {{ row.dcFailed }}
                </span>
              </template>
              <template #cell-actions="{ row }">
                <div class="flex items-center gap-2">
                  <!-- View Button -->
                  <button
                    @click="viewNocsMeterData(row)"
                    class="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                    title="View meter-wise details"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>

                  <!-- Download Button -->
                  <button
                    @click="downloadNocsReport(row)"
                    class="inline-flex items-center px-3 py-1.5 bg-success text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 transition-colors"
                    title="Download PDF report"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                </div>
              </template>
            </app-table>

            <!-- Summary Footer -->
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div class="text-center">
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total NOCS</p>
                  <p class="text-2xl font-bold text-gray-900">{{ nocsTableData.length }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">RC Success</p>
                  <p class="text-2xl font-bold text-success">{{ calculateTotal('rcSuccess') }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">RC In Prog</p>
                  <p class="text-2xl font-bold text-warning">{{ calculateTotal('rcInProgress') }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">DC Success</p>
                  <p class="text-2xl font-bold text-success">{{ calculateTotal('dcSuccess') }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">DC In Prog</p>
                  <p class="text-2xl font-bold text-warning">{{ calculateTotal('dcInProgress') }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">DC Failed</p>
                  <p class="text-2xl font-bold text-error">{{ calculateTotal('dcFailed') }}</p>
                </div>
              </div>
            </div>
          </div>
        </app-card>
      </div>

    </div>

    <!-- Meter Data Modal -->
    <div
      v-if="showMeterModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="closeMeterModal"
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div
          class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          @click="closeMeterModal"
        ></div>

        <!-- Modal panel -->
        <div class="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-2xl">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="bg-white/20 p-3 rounded-xl">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-white">{{ selectedNocs?.nocsName }}</h3>
                  <p class="text-white/80 text-sm mt-1">Meter-wise Command Details</p>
                </div>
              </div>
              <button
                @click="closeMeterModal"
                class="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Summary Stats -->
            <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
              <div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <p class="text-white/70 text-xs">Total</p>
                <p class="text-white text-lg font-bold">{{ selectedNocs?.total || 0 }}</p>
              </div>
              <div class="bg-green-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p class="text-white/70 text-xs">RC Success</p>
                <p class="text-white text-lg font-bold">{{ selectedNocs?.rcSuccess || 0 }}</p>
              </div>
              <div class="bg-yellow-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p class="text-white/70 text-xs">RC In Progress</p>
                <p class="text-white text-lg font-bold">{{ selectedNocs?.rcInProgress || 0 }}</p>
              </div>
              <div class="bg-green-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p class="text-white/70 text-xs">DC Success</p>
                <p class="text-white text-lg font-bold">{{ selectedNocs?.dcSuccess || 0 }}</p>
              </div>
              <div class="bg-yellow-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p class="text-white/70 text-xs">DC In Progress</p>
                <p class="text-white text-lg font-bold">{{ selectedNocs?.dcInProgress || 0 }}</p>
              </div>
              <div class="bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <p class="text-white/70 text-xs">DC Failed</p>
                <p class="text-white text-lg font-bold">{{ selectedNocs?.dcFailed || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-4 max-h-[600px] overflow-y-auto">
            <!-- Loading State -->
            <div v-if="meterDataLoading" class="flex flex-col items-center justify-center py-12">
              <svg class="w-12 h-12 text-primary-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-lg font-semibold text-gray-700">Loading meter data...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="meterDataError" class="py-12">
              <app-alert variant="error">
                <template #title>Error Loading Data</template>
                {{ meterDataError }}
              </app-alert>
            </div>

            <!-- Empty State -->
            <div v-else-if="meterData.length === 0" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p class="text-lg font-semibold text-gray-700">No Meters Found</p>
              <p class="text-sm text-gray-500 mt-2">No meter data available for this NOCS</p>
            </div>

            <!-- Data Table -->
            <div v-else class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Meter Number</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Consumer ID</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Command Type</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Command Status</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Meter Status</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Trigger Date</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Payoff Balance</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(meter, index) in meterData" :key="index" class="hover:bg-blue-50 transition-colors">
                    <!-- Meter Number -->
                    <td class="px-4 py-3 text-sm">
                      <span class="font-mono font-semibold text-gray-900">{{ meter.MSN }}</span>
                    </td>

                    <!-- Consumer ID -->
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ meter.OLD_CONSUMER_ID }}
                    </td>

                    <!-- Command Type -->
                    <td class="px-4 py-3 text-sm">
                      <span v-if="meter.COMMAND_TYPE === 'D1-RemoteConnect'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
                        RC
                      </span>
                      <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-info/10 text-info border border-info/20">
                        DC
                      </span>
                    </td>

                    <!-- Command Status -->
                    <td class="px-4 py-3 text-sm">
                      <span v-if="meter.COMMAND_STATUS === 'COMPLETED'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
                        Completed
                      </span>
                      <span v-else-if="meter.COMMAND_STATUS === 'COMINPROG'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning border border-warning/20">
                        In Progress
                      </span>
                      <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-error/10 text-error border border-error/20">
                        Discarded
                      </span>
                    </td>

                    <!-- Meter Status (Calculated) -->
                    <td class="px-4 py-3 text-sm">
                      <span
                        :class="getMeterStatusColorForModal(getMeterStatusForModal(meter.COMMAND_TYPE, meter.COMMAND_STATUS))"
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                      >
                        {{ getMeterStatusForModal(meter.COMMAND_TYPE, meter.COMMAND_STATUS) }}
                      </span>
                    </td>

                    <!-- Trigger Date -->
                    <td class="px-4 py-3 text-sm text-gray-600">
                      {{ meter.DATE_OF_COMMAND_TRIGGER }}
                    </td>

                    <!-- Payoff Balance -->
                    <td class="px-4 py-3 text-sm text-right">
                      <span class="font-semibold text-gray-900">
                        {{ formatCurrencyForModal(meter.PAYOFF_BALNCE) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <p class="text-sm text-gray-600">
              Showing <span class="font-semibold">{{ meterData.length }}</span> meters
            </p>
            <div class="flex gap-3">
              <button
                @click="downloadNocsReport(selectedNocs)"
                class="inline-flex items-center px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button
                @click="closeMeterModal"
                class="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
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
import { onMounted, onUnmounted, computed, watch, ref } from 'vue';
import { useReportsStore } from '@/stores/reports';
import { reportsAPI } from '@/services/reports.api';
import AppCard from '@/components/common/AppCard.vue';
import AppTable from '@/components/common/AppTable.vue';
import AppAlert from '@/components/common/AppAlert.vue';

const reportsStore = useReportsStore();

// Modal state for meter-wise data
const showMeterModal = ref(false);
const selectedNocs = ref(null);
const meterData = ref([]);
const meterDataLoading = ref(false);
const meterDataError = ref(null);

// Direct store access - bypass storeToRefs
// Computed properties that reactively access the store
const nocsTableData = computed(() => {
  const data = reportsStore.nocsData || [];
  console.log('[Dashboard] nocsTableData computed - length:', data.length);
  return data;
});

const hasNocsData = computed(() => nocsTableData.value.length > 0);

const analytics = computed(() => reportsStore.analytics || {
  rcSuccess: 0,
  rcInProgress: 0,
  dcSuccess: 0,
  dcInProgress: 0,
  dcFailed: 0,
  totalCommands: 0,
  lastUpdated: null
});

const analyticsLoading = computed(() => reportsStore.analyticsLoading || false);
const analyticsError = computed(() => reportsStore.analyticsError || null);
const nocsDataLoading = computed(() => reportsStore.nocsDataLoading || false);
const nocsDataError = computed(() => reportsStore.nocsDataError || null);

// Real-time state
const isRealtimeEnabled = computed(() => reportsStore.isRealtimeEnabled);
const isRealtimeConnected = computed(() => reportsStore.isRealtimeConnected);

// Debug watcher
watch(() => reportsStore.nocsData, (newVal, oldVal) => {
  console.log('[Dashboard] nocsData changed!', {
    oldLength: oldVal?.length,
    newLength: newVal?.length,
    newValue: newVal
  });
}, { deep: true });

const tableHeaders = [
  { key: 'nocsName', label: 'NOCS Name', sortable: true },
  { key: 'rcSuccess', label: 'RC Success', sortable: true },
  { key: 'rcInProgress', label: 'RC In Progress', sortable: true },
  { key: 'dcSuccess', label: 'DC Success', sortable: true },
  { key: 'dcInProgress', label: 'DC In Progress', sortable: true },
  { key: 'dcFailed', label: 'DC Failed', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

const fetchData = async () => {
  console.log('[Dashboard] Starting progressive data fetch...');

  // First: Load dashboard stats (fast - 1-2 seconds)
  await reportsStore.fetchDashboardStats();
  console.log('[Dashboard] Dashboard stats loaded');

  // Second: Load NOCS data in background (slow - 20-60 seconds)
  await reportsStore.fetchNocsData();
  console.log('[Dashboard] NOCS data loaded - length:', reportsStore.nocsData?.length);
};

const calculateSuccessRate = (success, total) => {
  if (total === 0) return '0.0';
  return ((success / total) * 100).toFixed(1);
};

const calculateTotal = (field) => {
  return nocsTableData.value.reduce((sum, nocs) => sum + (nocs[field] || 0), 0);
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString();
};

const toggleRealtimeUpdates = async () => {
  const result = await reportsStore.toggleRealtime();
  if (!result.success) {
    console.error('[Dashboard] Failed to toggle real-time:', result.message);
  }
};

/**
 * View meter-wise data for a specific NOCS
 */
const viewNocsMeterData = async (nocsRow) => {
  selectedNocs.value = nocsRow;
  showMeterModal.value = true;
  meterDataLoading.value = true;
  meterDataError.value = null;
  meterData.value = [];

  try {
    console.log('[Dashboard] Loading meter data for NOCS:', nocsRow.nocsName);
    const response = await reportsAPI.getMeterWiseCommandsByNocs(nocsRow.nocsName);

    meterData.value = response.data.data || [];
    console.log('[Dashboard] Loaded meter data:', meterData.value.length, 'meters');
  } catch (error) {
    console.error('[Dashboard] Error loading meter data:', error);
    meterDataError.value = error.response?.data?.message || error.message || 'Failed to load meter data';
  } finally {
    meterDataLoading.value = false;
  }
};

/**
 * Close meter modal
 */
const closeMeterModal = () => {
  showMeterModal.value = false;
  selectedNocs.value = null;
  meterData.value = [];
  meterDataError.value = null;
};

/**
 * Download PDF report for a specific NOCS
 */
const downloadNocsReport = async (nocsRow) => {
  try {
    console.log('[Dashboard] Downloading PDF report for NOCS:', nocsRow.nocsName);

    // Call API to download PDF
    const response = await reportsAPI.downloadNocsReportPDF(nocsRow.nocsName);

    // Create blob from response
    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename
    const filename = `NOCS_Report_${nocsRow.nocsName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.setAttribute('download', filename);

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('[Dashboard] PDF downloaded successfully');
  } catch (error) {
    console.error('[Dashboard] Error downloading report:', error);
    alert('Failed to download PDF report: ' + (error.response?.data?.message || error.message));
  }
};

/**
 * Helper function to calculate meter status for modal display
 */
const getMeterStatusForModal = (commandType, commandStatus) => {
  const type = commandType?.trim();
  const status = commandStatus?.trim();

  if (type === 'D1-RemoteConnect' && status === 'COMPLETED') {
    return 'Connected';
  } else if (type === 'D1-RemoteDisconnect' && status === 'COMPLETED') {
    return 'Disconnected';
  } else if (type === 'D1-RemoteConnect' && status === 'COMINPROG') {
    return 'RC In Progress';
  } else if (type === 'D1-RemoteDisconnect' && status === 'COMINPROG') {
    return 'DC In Progress';
  } else if (status === 'DISCARDED') {
    return 'Discarded';
  }

  return 'Unknown';
};

/**
 * Helper function to get badge color classes for meter status
 */
const getMeterStatusColorForModal = (status) => {
  const statusMap = {
    'Connected': 'bg-success/10 text-success border border-success/20',
    'Disconnected': 'bg-danger/10 text-danger border border-danger/20',
    'RC In Progress': 'bg-warning/10 text-warning border border-warning/20',
    'DC In Progress': 'bg-warning/10 text-warning border border-warning/20',
    'Discarded': 'bg-gray-100 text-gray-700 border border-gray-300',
    'Unknown': 'bg-gray-100 text-gray-500 border border-gray-300'
  };

  return statusMap[status] || statusMap['Unknown'];
};

/**
 * Helper function to format currency values for modal
 */
const formatCurrencyForModal = (value) => {
  if (value === null || value === undefined) return '৳0.00';

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '৳0.00';

  return `৳${numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

onMounted(async () => {
  console.log('[Dashboard] Component mounted - starting progressive loading');

  // STEP 1: Load dashboard stats FIRST (fast - shows immediately)
  await reportsStore.fetchDashboardStats();
  console.log('[Dashboard] Dashboard stats displayed');

  // STEP 2: Load NOCS data in background (slow - loads while user views stats)
  reportsStore.fetchNocsData().then(() => {
    console.log('[Dashboard] NOCS data loaded in background');
  });

  // Initialize real-time if it was previously enabled
  if (reportsStore.isRealtimeEnabled) {
    await reportsStore.enableRealtime();
  }
});

onUnmounted(() => {
  // Clean up socket connection when component is destroyed
  reportsStore.disconnectSocket();
});
</script>

<style scoped>
.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
