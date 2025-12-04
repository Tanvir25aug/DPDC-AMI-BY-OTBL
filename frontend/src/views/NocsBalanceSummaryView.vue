<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
    <div class="max-w-[1600px] mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 mb-8 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-3">
            <div class="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white">NOCS Balance Dashboard</h1>
          </div>
          <p class="text-blue-100 text-lg">Comprehensive customer balance analysis with credit/due breakdown across all NOCS areas</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
        <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="flex items-center gap-3 text-sm">
            <div class="bg-blue-50 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div class="font-semibold text-gray-800">Live Data</div>
              <div class="text-gray-500">Cached from Oracle database</div>
            </div>
          </div>
          <div class="flex gap-3">
            <button
              @click="fetchData"
              :disabled="loading"
              class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Loading...' : 'Refresh Data' }}
            </button>
            <button
              @click="exportToExcel"
              :disabled="!data.length"
              class="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-red-800 font-semibold mb-1">Error Loading Data</h3>
            <p class="text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div v-if="data.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div class="text-sm text-blue-100 mb-1 font-medium">Total NOCS Areas</div>
            <div class="text-4xl font-bold text-white">{{ data.length }}</div>
          </div>
        </div>

        <div @click="sortBy('TOTAL_CUSTOMERS')" class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span v-if="sortColumn === 'TOTAL_CUSTOMERS'" class="text-white text-xl font-bold">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </div>
            <div class="text-sm text-purple-100 mb-1 font-medium">Total Customers</div>
            <div class="text-4xl font-bold text-white">{{ formatNumber(totalCustomers) }}</div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div @click="sortBy('DUE_BALANCE_AMT')" class="cursor-pointer">
              <div class="flex items-center justify-between mb-3">
                <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span v-if="sortColumn === 'DUE_BALANCE_AMT'" class="text-white text-xl font-bold">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
              </div>
              <div class="text-sm text-green-100 mb-1 font-medium">Credit Balance</div>
              <div class="text-3xl font-bold text-white">৳{{ formatNumber(totalCreditBalance) }}</div>
            </div>
            <div @click="sortBy('DUE_QTY')" class="text-xs text-green-100 mt-2 flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
              </svg>
              {{ formatNumber(totalCreditQty) }} customers
              <span v-if="sortColumn === 'DUE_QTY'" class="text-white font-bold ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div @click="sortBy('CREDIT_BALANCE_AMT')" class="cursor-pointer">
              <div class="flex items-center justify-between mb-3">
                <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span v-if="sortColumn === 'CREDIT_BALANCE_AMT'" class="text-white text-xl font-bold">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
              </div>
              <div class="text-sm text-red-100 mb-1 font-medium">Due Balance</div>
              <div class="text-3xl font-bold text-white">৳{{ formatNumber(totalDueBalance) }}</div>
            </div>
            <div @click="sortBy('CREDIT_QTY')" class="text-xs text-red-100 mt-2 flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
              </svg>
              {{ formatNumber(totalDueQty) }} customers
              <span v-if="sortColumn === 'CREDIT_QTY'" class="text-white font-bold ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Net Balance Summary Card -->
      <div v-if="data.length > 0" class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div class="absolute inset-0 bg-grid-white/10"></div>
        <div class="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div class="relative z-10 flex items-center justify-between">
          <div>
            <div class="text-indigo-100 text-sm font-semibold mb-2 uppercase tracking-wider">Net Balance (All NOCS)</div>
            <div class="text-5xl font-bold text-white mb-2">{{ netBalance >= 0 ? '-' : '' }}৳{{ formatNumber(Math.abs(netBalance)) }}</div>
            <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <span :class="netBalance >= 0 ? 'text-red-200' : 'text-green-200'" class="text-sm font-medium">
                {{ netBalance >= 0 ? '▼ Overall Due' : '▲ Overall Credit' }}
              </span>
            </div>
          </div>
          <!-- <div class="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <svg class="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div> -->
        </div>
      </div>

      <!-- Bar Chart Section -->
      <div v-if="data.length > 0" class="bg-white rounded-3xl p-8 mb-8 shadow-xl border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">NOCS-wise Balance Analysis</h2>
            <p class="text-gray-500">Credit and Due balance comparison across all NOCS areas</p>
          </div>
          <div class="flex gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <span class="text-gray-600 font-medium">Credit Balance</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-rose-600"></div>
              <span class="text-gray-600 font-medium">Due Balance</span>
            </div>
          </div>
        </div>
        <div class="relative h-[500px]">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Data Table -->
      <div v-if="data.length > 0" class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-800">Detailed NOCS Breakdown</h2>
          <p class="text-gray-500 mt-1">Complete balance information for all NOCS areas</p>
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-gray-50 to-slate-50">
              <tr>
                <th @click="sortBy('NOCS_NAME')" class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center gap-1">
                    NOCS Name
                    <span v-if="sortColumn === 'NOCS_NAME'" class="text-indigo-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('NOCS_CODE')" class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-center gap-1">
                    Code
                    <span v-if="sortColumn === 'NOCS_CODE'" class="text-indigo-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('TOTAL_CUSTOMERS')" class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    Customers
                    <span v-if="sortColumn === 'TOTAL_CUSTOMERS'" class="text-indigo-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('DUE_QTY')" class="px-6 py-4 text-right text-xs font-bold text-green-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    Credit Qty
                    <span v-if="sortColumn === 'DUE_QTY'" class="text-green-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('DUE_BALANCE_AMT')" class="px-6 py-4 text-right text-xs font-bold text-green-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    Credit Balance
                    <span v-if="sortColumn === 'DUE_BALANCE_AMT'" class="text-green-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('CREDIT_QTY')" class="px-6 py-4 text-right text-xs font-bold text-red-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    Due Qty
                    <span v-if="sortColumn === 'CREDIT_QTY'" class="text-red-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('CREDIT_BALANCE_AMT')" class="px-6 py-4 text-right text-xs font-bold text-red-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    Due Balance
                    <span v-if="sortColumn === 'CREDIT_BALANCE_AMT'" class="text-red-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
                <th @click="sortBy('NET_BALANCE')" class="px-6 py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                  <div class="flex items-center justify-end gap-1">
                    Net Balance
                    <span v-if="sortColumn === 'NET_BALANCE'" class="text-indigo-600">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr v-for="row in sortedData" :key="row.NOCS_CODE" class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-l-4 border-transparent hover:border-indigo-400">
                <td class="px-6 py-5 text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span class="font-bold text-gray-900">{{ row.NOCS_NAME }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-sm text-center">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
                    {{ row.NOCS_CODE }}
                  </span>
                </td>
                <td class="px-6 py-5 text-sm text-right">
                  <span class="font-bold text-gray-900">{{ formatNumber(row.TOTAL_CUSTOMERS) }}</span>
                </td>
                <td class="px-6 py-5 text-sm text-right">
                  <span class="font-semibold text-green-700">{{ formatNumber(row.DUE_QTY) }}</span>
                </td>
                <td class="px-6 py-5 text-sm text-right">
                  <div class="inline-flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                    <span class="font-bold text-green-600">৳{{ formatNumber(row.DUE_BALANCE_AMT) }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-sm text-right">
                  <span class="font-semibold text-red-700">{{ formatNumber(row.CREDIT_QTY) }}</span>
                </td>
                <td class="px-6 py-5 text-sm text-right">
                  <div class="inline-flex items-center gap-1 bg-red-50 px-3 py-1 rounded-lg">
                    <span class="font-bold text-red-600">-৳{{ formatNumber(row.CREDIT_BALANCE_AMT) }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-sm text-right">
                  <div class="inline-flex items-center gap-2">
                    <span :class="row.NET_BALANCE >= 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'" class="font-bold px-3 py-1 rounded-lg border">
                      {{ row.NET_BALANCE >= 0 ? '-' : '' }}৳{{ formatNumber(Math.abs(row.NET_BALANCE)) }}
                    </span>
                    <span :class="row.NET_BALANCE >= 0 ? 'text-red-500' : 'text-green-500'" class="text-sm">
                      {{ row.NET_BALANCE >= 0 ? '▼' : '▲' }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
            <!-- Table Footer with Totals -->
            <tfoot class="bg-gradient-to-r from-indigo-600 to-purple-600 border-t-4 border-indigo-700">
              <tr class="font-bold text-base text-white">
                <td class="px-6 py-6 uppercase tracking-wide" colspan="2">
                  <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span class="text-lg">GRAND TOTAL</span>
                  </div>
                </td>
                <td class="px-6 py-6 text-right">
                  <span class="text-lg">{{ formatNumber(totalCustomers) }}</span>
                </td>
                <td class="px-6 py-6 text-right">
                  <span class="text-indigo-100">{{ formatNumber(totalCreditQty) }}</span>
                </td>
                <td class="px-6 py-6 text-right">
                  <div class="inline-flex items-center gap-1 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span class="text-lg text-white">৳{{ formatNumber(totalCreditBalance) }}</span>
                  </div>
                </td>
                <td class="px-6 py-6 text-right">
                  <span class="text-indigo-100">{{ formatNumber(totalDueQty) }}</span>
                </td>
                <td class="px-6 py-6 text-right">
                  <div class="inline-flex items-center gap-1 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span class="text-lg text-white">-৳{{ formatNumber(totalDueBalance) }}</span>
                  </div>
                </td>
                <td class="px-6 py-6 text-right">
                  <div class="inline-flex items-center gap-2 bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm border-2 border-white/50">
                    <span class="text-lg text-white font-extrabold">
                      {{ netBalance >= 0 ? '-' : '' }}৳{{ formatNumber(Math.abs(netBalance)) }}
                    </span>
                    <span :class="netBalance >= 0 ? 'text-red-200' : 'text-green-200'" class="text-sm font-bold">
                      {{ netBalance >= 0 ? '▼' : '▲' }}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-6">
          <div v-for="row in sortedData" :key="row.NOCS_CODE" class="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="font-bold text-lg text-gray-900">{{ row.NOCS_NAME }}</div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                {{ row.NOCS_CODE }}
              </span>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                <span class="text-gray-600 font-medium">Total Customers</span>
                <span class="font-bold text-gray-900 text-lg">{{ formatNumber(row.TOTAL_CUSTOMERS) }}</span>
              </div>

              <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border-l-4 border-green-500">
                <div class="flex justify-between items-start">
                  <span class="text-green-800 font-semibold">Credit</span>
                  <div class="text-right">
                    <div class="text-xs text-green-700 mb-1">{{ formatNumber(row.DUE_QTY) }} customers</div>
                    <div class="font-bold text-green-600 text-lg">৳{{ formatNumber(row.DUE_BALANCE_AMT) }}</div>
                  </div>
                </div>
              </div>

              <div class="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-3 border-l-4 border-red-500">
                <div class="flex justify-between items-start">
                  <span class="text-red-800 font-semibold">Due</span>
                  <div class="text-right">
                    <div class="text-xs text-red-700 mb-1">{{ formatNumber(row.CREDIT_QTY) }} customers</div>
                    <div class="font-bold text-red-600 text-lg">-৳{{ formatNumber(row.CREDIT_BALANCE_AMT) }}</div>
                  </div>
                </div>
              </div>

              <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border-l-4 border-indigo-500">
                <div class="flex justify-between items-center">
                  <span class="text-indigo-800 font-semibold">Net Balance</span>
                  <span :class="row.NET_BALANCE >= 0 ? 'text-red-600' : 'text-green-600'" class="font-bold text-lg">
                    {{ row.NET_BALANCE >= 0 ? '-' : '' }}৳{{ formatNumber(Math.abs(row.NET_BALANCE)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div v-else-if="!loading && !error" class="bg-white rounded-xl p-12 text-center">
        <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 text-lg">No data available. Click "Refresh Data" to load balance information.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !data.length" class="bg-white rounded-xl p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xl font-semibold text-gray-700 mb-2">Loading NOCS Balance Data...</p>
        <p class="text-sm text-gray-500">This may take 10-30 seconds for large datasets</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const data = ref([]);
const loading = ref(false);
const error = ref(null);
const sortColumn = ref('NET_BALANCE');
const sortDirection = ref('desc');

// Sorted data
const sortedData = computed(() => {
  if (!data.value.length) return [];

  const sorted = [...data.value].sort((a, b) => {
    let aVal = a[sortColumn.value];
    let bVal = b[sortColumn.value];

    // Convert to numbers for numeric columns
    if (sortColumn.value !== 'NOCS_NAME' && sortColumn.value !== 'NOCS_CODE') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  return sorted;
});

// Sort function
const sortBy = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'desc';
  }
};

// Computed totals
const totalCustomers = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.TOTAL_CUSTOMERS) || 0), 0);
});

const totalCreditQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.DUE_QTY) || 0), 0);
});

const totalCreditBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.DUE_BALANCE_AMT) || 0), 0);
});

const totalDueQty = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.CREDIT_QTY) || 0), 0);
});

const totalDueBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.CREDIT_BALANCE_AMT) || 0), 0);
});

const netBalance = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.NET_BALANCE) || 0), 0);
});

// Chart Data
const chartData = computed(() => {
  if (!data.value.length) return { labels: [], datasets: [] };

  return {
    labels: data.value.map(row => row.NOCS_NAME),
    datasets: [
      {
        label: 'Credit Balance',
        data: data.value.map(row => Number(row.DUE_BALANCE_AMT) || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 10,
        barThickness: 35
      },
      {
        label: 'Due Balance',
        data: data.value.map(row => Number(row.CREDIT_BALANCE_AMT) || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        borderRadius: 10,
        barThickness: 35
      }
    ]
  };
});

// Chart Options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        padding: 20,
        font: {
          size: 13,
          weight: '600'
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += '৳' + context.parsed.y.toLocaleString('en-IN');
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11,
          weight: '500'
        },
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 12
        },
        callback: function(value) {
          return '৳' + (value / 1000000).toFixed(1) + 'M';
        }
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
}));

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('en-IN');
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/reports/nocs_balance_summary');
    data.value = response.data.data || [];
    console.log('[NOCS Balance] Loaded data:', data.value.length, 'NOCS areas');
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    console.error('Error fetching NOCS balance summary:', err);
  } finally {
    loading.value = false;
  }
};

const exportToExcel = () => {
  if (!data.value.length) return;

  // Prepare data for export
  const exportData = data.value.map(row => ({
    'NOCS Name': row.NOCS_NAME,
    'NOCS Code': row.NOCS_CODE,
    'Total Customers': row.TOTAL_CUSTOMERS,
    'Credit Qty': row.DUE_QTY,
    'Credit Balance': row.DUE_BALANCE_AMT,
    'Due Qty': row.CREDIT_QTY,
    'Due Balance': `-${row.CREDIT_BALANCE_AMT}`,
    'Net Balance': row.NET_BALANCE
  }));

  // Add totals row
  exportData.push({
    'NOCS Name': 'TOTAL',
    'NOCS Code': '',
    'Total Customers': totalCustomers.value,
    'Credit Qty': totalCreditQty.value,
    'Credit Balance': totalCreditBalance.value,
    'Due Qty': totalDueQty.value,
    'Due Balance': `-${totalDueBalance.value}`,
    'Net Balance': netBalance.value
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // NOCS Name
    { wch: 12 }, // NOCS Code
    { wch: 15 }, // Total Customers
    { wch: 12 }, // Positive Qty
    { wch: 18 }, // Positive Balance
    { wch: 12 }, // Negative Qty
    { wch: 18 }, // Negative Balance
    { wch: 15 }  // Net Balance
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'NOCS Balance Summary');

  // Generate filename
  const filename = `NOCS_Balance_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Download
  XLSX.writeFile(wb, filename);
  console.log('[NOCS Balance] Exported to Excel:', filename);
};

// Auto-load data on mount
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Add any custom styles if needed */
</style>
