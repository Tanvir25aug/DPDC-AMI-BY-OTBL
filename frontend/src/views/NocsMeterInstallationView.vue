<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
    <div class="max-w-[1800px] mx-auto">
      <!-- Animated Header -->
      <div class="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl">
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-1/2 -right-1/2 h-full w-full animate-pulse rounded-full bg-white opacity-5"></div>
          <div class="absolute -bottom-1/2 -left-1/2 h-full w-full animate-pulse rounded-full bg-white opacity-5" style="animation-delay: 1s"></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-4">
            <div class="bg-white/20 p-4 rounded-2xl backdrop-blur-xl transform hover:scale-110 transition-transform duration-300">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 class="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">NOCS Meter Installation Analytics</h1>
              <p class="text-blue-100 text-lg font-medium">Comprehensive monthly and yearly meter installation statistics</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg border border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <!-- Report Type -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Report Type
            </label>
            <select v-model="reportType" class="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all bg-white text-gray-900 font-semibold shadow-lg cursor-pointer">
              <option value="monthly">📅 Monthly Report</option>
              <option value="yearly">📊 Yearly Report</option>
            </select>
          </div>

          <!-- Month Picker (for Monthly) -->
          <div v-if="reportType === 'monthly'">
            <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Month
            </label>
            <input
              v-model="selectedMonth"
              type="month"
              class="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all bg-white text-gray-900 font-semibold shadow-lg"
            />
          </div>

          <!-- Year Picker (for Yearly) -->
          <div v-if="reportType === 'yearly'">
            <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select Year
            </label>
            <select v-model="selectedYear" class="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-300 transition-all bg-white text-gray-900 font-semibold shadow-lg cursor-pointer">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>

          <!-- NOCS Filter -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              NOCS Filter
            </label>
            <input
              v-model="nocsFilter"
              type="text"
              placeholder="Search NOCS..."
              class="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all bg-white text-gray-900 font-semibold shadow-lg"
            />
          </div>

          <!-- Actions -->
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-3">&nbsp;</label>
            <div class="flex gap-3">
              <button
                @click="fetchData"
                :disabled="loading"
                class="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
              >
                <svg v-if="!loading" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <svg v-else class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loading ? 'Loading...' : 'Generate Report' }}
              </button>

              <button
                @click="exportToExcel"
                :disabled="!data.length"
                class="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 shadow-2xl hover:shadow-green-500/50 transform hover:scale-105 active:scale-95"
                title="Export to Excel"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              <button
                @click="exportToPdf"
                :disabled="!data.length"
                class="px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2 shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 active:scale-95"
                title="Export to PDF"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-3xl p-6 mb-8 shadow-lg">
        <div class="flex items-start gap-4">
          <div class="bg-red-100 p-3 rounded-2xl">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-red-800 font-bold text-lg mb-1">Error Loading Data</h3>
            <p class="text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading || dashboardLoading" class="bg-white rounded-3xl p-16 text-center shadow-lg">
        <div class="relative w-24 h-24 mx-auto mb-8">
          <div class="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div class="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-purple-600 border-b-pink-600 border-l-blue-600 animate-spin"></div>
        </div>
        <p class="text-2xl font-bold text-gray-700 mb-3">
          {{ dashboardLoading ? 'Loading Dashboard...' : 'Generating Installation Report...' }}
        </p>
        <p class="text-gray-500">
          {{ dashboardLoading ? 'Fetching meter installation statistics and customer data' : `Analyzing meter installation data for ${reportType === 'monthly' ? selectedMonth : selectedYear}` }}
        </p>
      </div>

      <!-- Main Content -->
      <div v-if="!loading && !dashboardLoading && data.length > 0" class="space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-indigo-100 mb-2 font-semibold uppercase tracking-wide">Total NOCS</div>
              <div class="text-3xl font-black text-white mb-2">{{ formatInteger(summary.total_nocs) }}</div>
              <div class="text-indigo-200 text-sm">Active NOCS Centers</div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-green-100 mb-2 font-semibold uppercase tracking-wide">Total Installations</div>
              <div class="text-3xl font-black text-white mb-2">{{ formatInteger(summary.total_installations) }}</div>
              <div class="text-green-200 text-sm">Meters Installed</div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-blue-100 mb-2 font-semibold uppercase tracking-wide">Average per NOCS</div>
              <div class="text-3xl font-black text-white mb-2">{{ formatInteger(summary.avg_per_nocs) }}</div>
              <div class="text-blue-200 text-sm">Installation Rate</div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-700 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-purple-100 mb-2 font-semibold uppercase tracking-wide">Report Period</div>
              <div class="text-3xl font-black text-white mb-2">{{ formatPeriod }}</div>
              <div class="text-purple-200 text-sm">{{ reportType === 'monthly' ? 'Monthly' : 'Yearly' }} Report</div>
            </div>
          </div>

          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-700 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-orange-100 mb-2 font-semibold uppercase tracking-wide">Total Customers</div>
              <div class="text-3xl font-black text-white mb-2">{{ formatInteger(totalCustomers) }}</div>
              <div class="text-orange-200 text-sm">Active AMI Customers</div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Pie Chart: Top 10 NOCS -->
          <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div class="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-2xl">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              Top 10 NOCS by Installations
            </h3>
            <div class="h-80">
              <Pie :data="pieChartData" :options="chartOptions" />
            </div>
          </div>

          <!-- Bar Chart: All NOCS -->
          <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div class="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-2xl">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              All NOCS Installation Count
            </h3>
            <div class="h-80">
              <Bar :data="barChartData" :options="barChartOptions" />
            </div>
          </div>
        </div>

        <!-- Line Chart: Monthly Trend (Yearly view only) -->
        <div v-if="reportType === 'yearly'" class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
          <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div class="bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-2xl">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            Monthly Installation Trend
          </h3>
          <div class="h-96">
            <Line :data="lineChartData" :options="lineChartOptions" />
          </div>
        </div>

        <!-- Heat Map: NOCS vs Month (Yearly view only) -->
        <div v-if="reportType === 'yearly'" class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
          <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div class="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-2xl">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            Installation Heat Map (NOCS vs Month)
          </h3>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50">NOCS</th>
                  <th v-for="month in monthNames" :key="month" class="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">{{ month }}</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-for="row in filteredData.slice(0, 10)" :key="row.NOCS_CODE" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-white">{{ row.NOCS_NAME }}</td>
                  <td v-for="month in monthNames" :key="month" class="px-4 py-3 text-center text-sm"
                      :style="{ backgroundColor: getHeatColor(row[month.toUpperCase()]) }">
                    <span class="font-semibold" :class="row[month.toUpperCase()] > 50 ? 'text-white' : 'text-gray-900'">
                      {{ formatInteger(row[month.toUpperCase()] || 0) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Data Table -->
        <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="p-6 bg-gradient-to-r from-cyan-600 to-blue-600">
            <h2 class="text-2xl font-bold text-white flex items-center gap-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {{ reportType === 'monthly' ? 'Monthly' : 'Yearly' }} Installation Details
            </h2>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NOCS Name</th>
                  <template v-if="reportType === 'monthly'">
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Meters Installed</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">% of Total</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">First Install</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Last Install</th>
                  </template>
                  <template v-else>
                    <th v-for="month in monthNames" :key="month" class="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">{{ month }}</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider bg-blue-50">Total</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Avg/Month</th>
                  </template>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-for="(row, index) in paginatedData" :key="index" class="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full text-sm font-bold">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-bold text-gray-900 text-lg">{{ row.NOCS_NAME }}</div>
                  </td>
                  <template v-if="reportType === 'monthly'">
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg">
                        {{ formatInteger(row.METER_COUNT) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="font-semibold text-gray-700">{{ row.PERCENTAGE_OF_TOTAL }}%</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ row.FIRST_INSTALL_DATE }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-600">{{ row.LAST_INSTALL_DATE }}</td>
                  </template>
                  <template v-else>
                    <td v-for="month in monthNames" :key="month" class="px-4 py-4 text-center">
                      <span class="font-semibold text-gray-700">{{ formatInteger(row[month.toUpperCase()] || 0) }}</span>
                    </td>
                    <td class="px-6 py-4 text-right bg-blue-50">
                      <span class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold">
                        {{ formatInteger(row.TOTAL_YEAR) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="font-semibold text-indigo-600">{{ formatInteger(row.MONTHLY_AVERAGE) }}</span>
                    </td>
                  </template>
                </tr>
              </tbody>
              <tfoot class="bg-gradient-to-r from-blue-600 to-purple-600">
                <tr class="font-bold text-white">
                  <td class="px-6 py-6" colspan="2">
                    <div class="flex items-center gap-3 text-xl">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      TOTAL
                    </div>
                  </td>
                  <template v-if="reportType === 'monthly'">
                    <td class="px-6 py-6 text-right text-2xl font-black">{{ formatInteger(summary.total_installations) }}</td>
                    <td class="px-6 py-6 text-right text-xl">100%</td>
                    <td colspan="2"></td>
                  </template>
                  <template v-else>
                    <td v-for="(total, idx) in monthTotals" :key="idx" class="px-4 py-6 text-center text-xl">{{ formatInteger(total) }}</td>
                    <td class="px-6 py-6 text-right text-2xl font-black bg-blue-700">{{ formatInteger(summary.total_installations) }}</td>
                    <td class="px-6 py-6 text-right text-xl">{{ formatInteger(summary.avg_per_nocs) }}</td>
                  </template>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
            <div class="text-gray-700 font-semibold">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} results
            </div>
            <div class="flex gap-2">
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 hover:bg-gray-50 transition-all"
              >
                Previous
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'px-4 py-2 rounded-xl font-semibold transition-all',
                  currentPage === page
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 hover:bg-gray-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!loading && data.length === 0 && !error" class="bg-white rounded-3xl p-16 text-center shadow-lg">
        <div class="bg-gray-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-3xl font-bold text-gray-900 mb-4">No Data Available</h3>
        <p class="text-gray-600 text-lg max-w-md mx-auto">Select a {{ reportType === 'monthly' ? 'month' : 'year' }} and click "Generate Report" to view meter installation statistics.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'vue-chartjs';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement);

const reportType = ref('yearly');
const selectedMonth = ref('');
const selectedYear = ref('');
const nocsFilter = ref('');
const loading = ref(false);
const error = ref('');
const data = ref([]);
const yearlyData = ref([]);
const monthlyData = ref([]);
const totalCustomers = ref(0);
const dashboardLoading = ref(true);
const currentPage = ref(1);
const pageSize = 50;

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i.toString());
  }
  return years;
});

const summary = computed(() => {
  if (data.value.length === 0) {
    return { total_nocs: 0, total_installations: 0, avg_per_nocs: 0 };
  }

  const total_nocs = data.value.length;
  let total_installations = 0;

  if (reportType.value === 'monthly') {
    total_installations = data.value.reduce((sum, row) => sum + (Number(row.METER_COUNT) || 0), 0);
  } else {
    total_installations = data.value.reduce((sum, row) => sum + (Number(row.TOTAL_YEAR) || 0), 0);
  }

  const avg_per_nocs = total_nocs > 0 ? Math.round(total_installations / total_nocs) : 0;

  return { total_nocs, total_installations, avg_per_nocs };
});

const monthTotals = computed(() => {
  if (reportType.value !== 'yearly' || data.value.length === 0) return [];

  const totals = monthNames.map(month => {
    return data.value.reduce((sum, row) => sum + (Number(row[month.toUpperCase()]) || 0), 0);
  });

  return totals;
});

const filteredData = computed(() => {
  if (!nocsFilter.value) return data.value;
  const filter = nocsFilter.value.toLowerCase();
  return data.value.filter(row =>
    (row.NOCS_NAME || '').toLowerCase().includes(filter)
  );
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
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

const formatPeriod = computed(() => {
  if (reportType.value === 'monthly') {
    if (!selectedMonth.value) return 'N/A';
    const [year, month] = selectedMonth.value.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } else {
    return selectedYear.value || 'N/A';
  }
});

// Chart Data
const pieChartData = computed(() => {
  const top10 = filteredData.value.slice(0, 10);
  const field = reportType.value === 'monthly' ? 'METER_COUNT' : 'TOTAL_YEAR';

  return {
    labels: top10.map(row => row.NOCS_NAME),
    datasets: [{
      data: top10.map(row => Number(row[field]) || 0),
      backgroundColor: [
        '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
        '#EF4444', '#14B8A6', '#6366F1', '#F97316', '#06B6D4'
      ],
      borderWidth: 0
    }]
  };
});

const barChartData = computed(() => {
  const field = reportType.value === 'monthly' ? 'METER_COUNT' : 'TOTAL_YEAR';

  return {
    labels: filteredData.value.map(row => row.NOCS_NAME),
    datasets: [{
      label: 'Installations',
      data: filteredData.value.map(row => Number(row[field]) || 0),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  };
});

const lineChartData = computed(() => {
  if (reportType.value !== 'yearly') return { labels: [], datasets: [] };

  return {
    labels: monthNames,
    datasets: [{
      label: 'Total Installations',
      data: monthTotals.value,
      borderColor: 'rgba(16, 185, 129, 1)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#374151',
        font: { size: 12, weight: 'bold' },
        padding: 15
      }
    }
  }
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      ticks: { color: '#374151' },
      grid: { color: 'rgba(156, 163, 175, 0.2)' }
    },
    x: {
      ticks: { color: '#374151', maxRotation: 45, minRotation: 45 },
      grid: { color: 'rgba(156, 163, 175, 0.2)' }
    }
  }
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#374151',
        font: { size: 12, weight: 'bold' },
        padding: 15
      }
    }
  },
  scales: {
    y: {
      ticks: { color: '#374151' },
      grid: { color: 'rgba(156, 163, 175, 0.2)' }
    },
    x: {
      ticks: { color: '#374151' },
      grid: { color: 'rgba(156, 163, 175, 0.2)' }
    }
  }
};

const fetchData = async () => {
  if (reportType.value === 'monthly' && !selectedMonth.value) {
    error.value = 'Please select a month';
    return;
  }
  if (reportType.value === 'yearly' && !selectedYear.value) {
    error.value = 'Please select a year';
    return;
  }

  loading.value = true;
  error.value = '';
  currentPage.value = 1;

  try {
    const params = {};
    if (reportType.value === 'monthly') {
      params.reportName = 'nocs_meter_installation_monthly';
      params.year_month = selectedMonth.value;
    } else {
      params.reportName = 'nocs_meter_installation_yearly';
      params.year = selectedYear.value;
    }

    const response = await api.get('/reports/execute', { params });
    data.value = response.data.data || [];

    // Update the cached data
    if (reportType.value === 'monthly') {
      monthlyData.value = data.value;
    } else {
      yearlyData.value = data.value;
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    console.error('Error fetching meter installation data:', err);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch report type changes to switch data
watch(reportType, (newType) => {
  // Switch to cached data if available
  if (newType === 'yearly' && yearlyData.value.length > 0) {
    data.value = yearlyData.value;
  } else if (newType === 'monthly' && monthlyData.value.length > 0) {
    data.value = monthlyData.value;
  }
});

const formatInteger = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const getHeatColor = (value) => {
  if (!value || value === 0) return '#f3f4f6';
  const max = Math.max(...filteredData.value.flatMap(row =>
    monthNames.map(m => Number(row[m.toUpperCase()]) || 0)
  ));
  const intensity = value / max;

  if (intensity > 0.8) return '#10b981'; // Green
  if (intensity > 0.6) return '#3b82f6'; // Blue
  if (intensity > 0.4) return '#f59e0b'; // Orange
  if (intensity > 0.2) return '#fbbf24'; // Yellow
  return '#fed7aa'; // Light orange
};

const exportToExcel = () => {
  if (!data.value.length) return;

  const wb = XLSX.utils.book_new();

  if (reportType.value === 'monthly') {
    const monthlyData = data.value.map((row, index) => ({
      '#': index + 1,
      'NOCS Name': row.NOCS_NAME,
      'Meters Installed': row.METER_COUNT,
      '% of Total': row.PERCENTAGE_OF_TOTAL,
      'First Install': row.FIRST_INSTALL_DATE,
      'Last Install': row.LAST_INSTALL_DATE
    }));
    const ws = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
  } else {
    const yearlyData = data.value.map((row, index) => ({
      '#': index + 1,
      'NOCS Name': row.NOCS_NAME,
      'Jan': row.JAN || 0,
      'Feb': row.FEB || 0,
      'Mar': row.MAR || 0,
      'Apr': row.APR || 0,
      'May': row.MAY || 0,
      'Jun': row.JUN || 0,
      'Jul': row.JUL || 0,
      'Aug': row.AUG || 0,
      'Sep': row.SEP || 0,
      'Oct': row.OCT || 0,
      'Nov': row.NOV || 0,
      'Dec': row.DEC || 0,
      'Total': row.TOTAL_YEAR,
      'Avg/Month': row.MONTHLY_AVERAGE
    }));
    const ws = XLSX.utils.json_to_sheet(yearlyData);
    XLSX.utils.book_append_sheet(wb, ws, 'Yearly Report');
  }

  const filename = `DPDC_Meter_Installation_${reportType.value}_${reportType.value === 'monthly' ? selectedMonth.value : selectedYear.value}.xlsx`;
  XLSX.writeFile(wb, filename);
};

const exportToPdf = async () => {
  if (!data.value.length) return;

  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Load DPDC logo
  const logoImg = new Image();
  logoImg.src = '/DPDC_Logo.png';

  await new Promise((resolve) => {
    logoImg.onload = () => {
      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFillColor(109, 40, 217);
      doc.rect(0, 25, pageWidth, 10, 'F');

      try {
        doc.addImage(logoImg, 'PNG', 14, 5, 25, 25);
      } catch (e) {
        console.error('Error adding logo:', e);
      }

      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('DHAKA POWER DISTRIBUTION COMPANY LTD.', 45, 15);

      doc.setFontSize(18);
      doc.setFont(undefined, 'normal');
      doc.text(`NOCS Meter Installation - ${reportType.value === 'monthly' ? 'Monthly' : 'Yearly'} Report`, 45, 25);

      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(2);
      doc.line(14, 38, pageWidth - 14, 38);

      resolve();
    };
    logoImg.onerror = () => {
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('DHAKA POWER DISTRIBUTION COMPANY LTD.', 14, 15);
      resolve();
    };
  });

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont(undefined, 'bold');
  doc.text('Period:', 14, 48);
  doc.setFont(undefined, 'normal');
  doc.text(formatPeriod.value, 35, 48);

  doc.setFont(undefined, 'bold');
  doc.text('Total NOCS:', 14, 54);
  doc.setFont(undefined, 'normal');
  doc.text(formatInteger(summary.value.total_nocs), 40, 54);

  doc.setFont(undefined, 'bold');
  doc.text('Total Installations:', 80, 54);
  doc.setFont(undefined, 'normal');
  doc.text(formatInteger(summary.value.total_installations), 125, 54);

  // Table
  doc.setFillColor(79, 70, 229);
  doc.rect(14, 60, pageWidth - 28, 8, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('METER INSTALLATION SUMMARY', 16, 65);

  let tableData, tableHeaders;

  if (reportType.value === 'monthly') {
    tableHeaders = [['#', 'NOCS Name', 'Meters', '% Total', 'First Install', 'Last Install']];
    tableData = data.value.map((row, index) => [
      index + 1,
      row.NOCS_NAME,
      formatInteger(row.METER_COUNT),
      row.PERCENTAGE_OF_TOTAL + '%',
      row.FIRST_INSTALL_DATE,
      row.LAST_INSTALL_DATE
    ]);
  } else {
    tableHeaders = [['#', 'NOCS', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Total']];
    tableData = data.value.map((row, index) => [
      index + 1,
      row.NOCS_NAME,
      formatInteger(row.JAN || 0),
      formatInteger(row.FEB || 0),
      formatInteger(row.MAR || 0),
      formatInteger(row.APR || 0),
      formatInteger(row.MAY || 0),
      formatInteger(row.JUN || 0),
      formatInteger(row.JUL || 0),
      formatInteger(row.AUG || 0),
      formatInteger(row.SEP || 0),
      formatInteger(row.OCT || 0),
      formatInteger(row.NOV || 0),
      formatInteger(row.DEC || 0),
      formatInteger(row.TOTAL_YEAR)
    ]);
  }

  autoTable(doc, {
    startY: 72,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(79, 70, 229);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('NOCS Meter Installation Report', 14, pageHeight - 8);
    doc.setFont(undefined, 'normal');
    doc.text('| Generated by DPDC AMI System |', pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.setFont(undefined, 'bold');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const filename = `DPDC_Meter_Installation_${reportType.value}_${reportType.value === 'monthly' ? selectedMonth.value : selectedYear.value}.pdf`;
  doc.save(filename);
};

const fetchTotalCustomers = async () => {
  try {
    const response = await api.get('/reports/execute', {
      params: { reportName: 'nocs_total_customers' }
    });
    totalCustomers.value = response.data.data[0]?.TOTAL_CUSTOMERS || 0;
  } catch (err) {
    console.error('Error fetching total customers:', err);
    totalCustomers.value = 0;
  }
};

const fetchDashboardData = async () => {
  dashboardLoading.value = true;
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    // Fetch all three data sources in parallel
    const [yearlyResponse, monthlyResponse, customersResponse] = await Promise.all([
      api.get('/reports/execute', {
        params: { reportName: 'nocs_meter_installation_yearly', year: currentYear }
      }),
      api.get('/reports/execute', {
        params: { reportName: 'nocs_meter_installation_monthly', year_month: currentMonth }
      }),
      api.get('/reports/execute', {
        params: { reportName: 'nocs_total_customers' }
      })
    ]);

    yearlyData.value = yearlyResponse.data.data || [];
    monthlyData.value = monthlyResponse.data.data || [];
    totalCustomers.value = customersResponse.data.data[0]?.TOTAL_CUSTOMERS || 0;

    // Set the data to yearly by default for initial display
    data.value = yearlyData.value;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load dashboard data';
    console.error('Error fetching dashboard data:', err);
  } finally {
    dashboardLoading.value = false;
  }
};

onMounted(() => {
  const now = new Date();
  selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  selectedYear.value = now.getFullYear().toString();

  // Load dashboard data automatically on mount
  fetchDashboardData();
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
