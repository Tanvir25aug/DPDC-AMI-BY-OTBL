<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4 md:p-8">
    <div class="max-w-[1600px] mx-auto">
      <!-- Header -->
      <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 md:p-10 mb-8 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div class="absolute top-1/2 right-1/4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-3">
            <div class="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white">NOCS Collection Summary</h1>
          </div>
          <p class="text-emerald-100 text-lg">Comprehensive collection analysis with Principal, VAT (5%), and Total breakdown by NOCS</p>
        </div>
      </div>

      <!-- Date Filter & Actions -->
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Start Date
              </span>
            </label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-white"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                End Date
              </span>
            </label>
            <input
              v-model="endDate"
              type="date"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-white"
            />
          </div>
          <div>
            <button
              @click="fetchData"
              :disabled="loading"
              class="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Generating...' : 'Generate Report' }}
            </button>
          </div>
          <div class="flex gap-2">
            <button
              @click="exportToExcel"
              :disabled="!data.length"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              title="Export to Excel"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            <button
              @click="exportToPdf"
              :disabled="!data.length"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              title="Export to PDF"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Search & Sort Filters -->
      <div v-if="data.length > 0" class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span class="font-semibold text-gray-700">Filter & Sort</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                NOCS Code
              </span>
            </label>
            <select
              v-model="filterNocsCode"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-white cursor-pointer"
            >
              <option value="">All Codes</option>
              <option v-for="code in uniqueNocsCodes" :key="code" :value="code">{{ code }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                NOCS Name
              </span>
            </label>
            <select
              v-model="filterNocsName"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all bg-white cursor-pointer"
            >
              <option value="">All NOCS</option>
              <option v-for="name in uniqueNocsNames" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Sort by Amount
              </span>
            </label>
            <button
              @click="toggleSort"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all bg-white flex items-center justify-between gap-2"
            >
              <span class="font-medium text-gray-700">
                {{ sortOrder === 'high-to-low' ? 'High to Low' : 'Low to High' }}
              </span>
              <svg v-if="sortOrder === 'high-to-low'" class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <svg v-else class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">&nbsp;</label>
            <button
              @click="clearFilters"
              class="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
        <div v-if="filteredAndSortedData.length !== data.length" class="mt-4 text-sm text-gray-600">
          Showing {{ filteredAndSortedData.length }} of {{ data.length }} records
        </div>
      </div>

      <!-- Summary Cards -->
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
            <div class="text-sm text-blue-100 mb-1 font-medium">Total NOCS</div>
            <div class="text-4xl font-bold text-white">{{ data.length }}</div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-sm text-indigo-100 mb-1 font-medium">Principal Amount</div>
            <div class="text-2xl font-bold text-white">৳{{ formatNumber(totalPrincipal) }}</div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div class="text-sm text-orange-100 mb-1 font-medium">VAT (5%)</div>
            <div class="text-2xl font-bold text-white">৳{{ formatNumber(totalVAT) }}</div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-3">
              <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-sm text-green-100 mb-1 font-medium">Grand Total</div>
            <div class="text-2xl font-bold text-white">৳{{ formatNumber(grandTotal) }}</div>
          </div>
        </div>

      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6 shadow-lg">
        <div class="flex items-start gap-4">
          <div class="bg-red-100 p-3 rounded-xl">
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
      <div v-if="loading" class="bg-white rounded-2xl p-12 text-center shadow-lg">
        <div class="relative w-20 h-20 mx-auto mb-6">
          <div class="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
          <div class="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
        <p class="text-xl font-semibold text-gray-700 mb-2">Generating Collection Report...</p>
        <p class="text-sm text-gray-500">Fetching data from {{ startDate }} to {{ endDate }}</p>
      </div>

      <!-- Data Table -->
      <div v-if="!loading && data.length > 0" class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NOCS Code</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NOCS Name</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Principal Amount</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">VAT (5%)</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total Amount</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr v-for="(row, index) in filteredAndSortedData" :key="row.NOCS_CODE" class="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    {{ index + 1 }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    {{ row.NOCS_CODE }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{{ row.NOCS_NAME }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span class="font-bold text-indigo-600">৳{{ formatNumber(row.PRINCIPAL_AMOUNT) }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span class="font-semibold text-orange-600">৳{{ formatNumber(row.VAT_AMOUNT) }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span class="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold">
                    ৳{{ formatNumber(row.TOTAL_AMOUNT) }}
                  </span>
                </td>
              </tr>
            </tbody>
            <!-- Table Footer -->
            <tfoot class="bg-gradient-to-r from-emerald-600 to-teal-600">
              <tr class="font-bold text-white">
                <td class="px-6 py-5" colspan="3">
                  <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span class="text-lg uppercase tracking-wide">Grand Total</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="inline-flex items-center gap-1 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span class="text-lg">৳{{ formatNumber(totalPrincipal) }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="inline-flex items-center gap-1 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <span class="text-lg">৳{{ formatNumber(totalVAT) }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="inline-flex items-center gap-1 bg-white/30 px-4 py-2 rounded-lg backdrop-blur-sm border-2 border-white/50">
                    <span class="text-xl font-extrabold">৳{{ formatNumber(grandTotal) }}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-4 p-4">
          <div v-for="(row, index) in filteredAndSortedData" :key="row.NOCS_CODE" class="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="font-bold text-lg text-gray-900">{{ row.NOCS_NAME }}</div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                {{ row.NOCS_CODE }}
              </span>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center bg-indigo-50 rounded-lg p-3">
                <span class="text-indigo-700 font-medium">Principal</span>
                <span class="font-bold text-indigo-600 text-lg">৳{{ formatNumber(row.PRINCIPAL_AMOUNT) }}</span>
              </div>
              <div class="flex justify-between items-center bg-orange-50 rounded-lg p-3">
                <span class="text-orange-700 font-medium">VAT (5%)</span>
                <span class="font-bold text-orange-600">৳{{ formatNumber(row.VAT_AMOUNT) }}</span>
              </div>
              <div class="flex justify-between items-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-3 border-l-4 border-green-500">
                <span class="text-green-800 font-semibold">Total</span>
                <span class="font-bold text-green-600 text-xl">৳{{ formatNumber(row.TOTAL_AMOUNT) }}</span>
              </div>
            </div>
          </div>

          <!-- Mobile Total Card -->
          <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
            <div class="text-center mb-4">
              <span class="text-emerald-100 text-sm font-medium uppercase tracking-wide">Grand Total</span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-emerald-100 text-xs mb-1">Principal</div>
                <div class="font-bold text-lg">৳{{ formatNumber(totalPrincipal) }}</div>
              </div>
              <div class="text-center">
                <div class="text-emerald-100 text-xs mb-1">VAT</div>
                <div class="font-bold text-lg">৳{{ formatNumber(totalVAT) }}</div>
              </div>
              <div class="text-center col-span-2 pt-3 border-t border-white/30">
                <div class="text-emerald-100 text-xs mb-1">Total Amount</div>
                <div class="font-extrabold text-2xl">৳{{ formatNumber(grandTotal) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!loading && data.length === 0 && !error" class="bg-white rounded-2xl p-12 text-center shadow-lg">
        <div class="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">No Data Available</h3>
        <p class="text-gray-600 max-w-md mx-auto">Select a date range and click "Generate Report" to view the NOCS collection summary.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const startDate = ref('');
const endDate = ref('');
const data = ref([]);
const loading = ref(false);
const error = ref(null);

// Filter and sort state
const filterNocsCode = ref('');
const filterNocsName = ref('');
const sortOrder = ref('high-to-low');

// Summary calculations
const totalPrincipal = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.PRINCIPAL_AMOUNT) || 0), 0);
});

const totalVAT = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.VAT_AMOUNT) || 0), 0);
});

const grandTotal = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.TOTAL_AMOUNT) || 0), 0);
});

// Unique NOCS codes for dropdown
const uniqueNocsCodes = computed(() => {
  const codes = data.value.map(row => row.NOCS_CODE).filter(Boolean);
  return [...new Set(codes)].sort();
});

// Unique NOCS names for dropdown
const uniqueNocsNames = computed(() => {
  const names = data.value.map(row => row.NOCS_NAME).filter(Boolean);
  return [...new Set(names)].sort();
});

// Filtered and sorted data
const filteredAndSortedData = computed(() => {
  let result = [...data.value];

  // Filter by NOCS Code (exact match from dropdown)
  if (filterNocsCode.value) {
    result = result.filter(row => row.NOCS_CODE === filterNocsCode.value);
  }

  // Filter by NOCS Name (exact match from dropdown)
  if (filterNocsName.value) {
    result = result.filter(row => row.NOCS_NAME === filterNocsName.value);
  }

  // Sort by Total Amount
  result.sort((a, b) => {
    const amountA = Number(a.TOTAL_AMOUNT) || 0;
    const amountB = Number(b.TOTAL_AMOUNT) || 0;
    return sortOrder.value === 'high-to-low' ? amountB - amountA : amountA - amountB;
  });

  return result;
});

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'high-to-low' ? 'low-to-high' : 'high-to-low';
};

const clearFilters = () => {
  filterNocsCode.value = '';
  filterNocsName.value = '';
  sortOrder.value = 'high-to-low';
};

const formatNumber = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const fetchData = async () => {
  if (!startDate.value || !endDate.value) {
    error.value = 'Please select both start and end dates';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await api.get('/reports/execute', {
      params: {
        reportName: 'nocs_collection_summary',
        start_date: startDate.value,
        end_date: endDate.value
      }
    });

    data.value = response.data.data || [];
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    console.error('Error fetching NOCS collection summary:', err);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

const exportToExcel = () => {
  if (!filteredAndSortedData.value.length) return;

  // Prepare data for export (uses filtered data)
  const exportData = filteredAndSortedData.value.map((row, index) => ({
    '#': index + 1,
    'NOCS Code': row.NOCS_CODE,
    'NOCS Name': row.NOCS_NAME,
    'Principal Amount': row.PRINCIPAL_AMOUNT,
    'VAT (5%)': row.VAT_AMOUNT,
    'Total Amount': row.TOTAL_AMOUNT
  }));

  // Calculate totals from filtered data
  const filteredPrincipal = filteredAndSortedData.value.reduce((sum, row) => sum + (Number(row.PRINCIPAL_AMOUNT) || 0), 0);
  const filteredVAT = filteredAndSortedData.value.reduce((sum, row) => sum + (Number(row.VAT_AMOUNT) || 0), 0);
  const filteredTotal = filteredAndSortedData.value.reduce((sum, row) => sum + (Number(row.TOTAL_AMOUNT) || 0), 0);

  // Add totals row
  exportData.push({
    '#': '',
    'NOCS Code': '',
    'NOCS Name': 'GRAND TOTAL',
    'Principal Amount': filteredPrincipal,
    'VAT (5%)': filteredVAT,
    'Total Amount': filteredTotal
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'NOCS Collection');

  // Generate filename with date range
  const filename = `NOCS_Collection_Summary_${startDate.value}_to_${endDate.value}.xlsx`;
  XLSX.writeFile(wb, filename);
};

const exportToPdf = () => {
  if (!filteredAndSortedData.value.length) return;

  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

  // Title
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105); // Emerald color
  doc.text('NOCS Collection Summary Report', 14, 20);

  // Date range
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Period: ${startDate.value} to ${endDate.value}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

  // Calculate totals from filtered data
  const filteredPrincipal = filteredAndSortedData.value.reduce((sum, row) => sum + (Number(row.PRINCIPAL_AMOUNT) || 0), 0);
  const filteredVAT = filteredAndSortedData.value.reduce((sum, row) => sum + (Number(row.VAT_AMOUNT) || 0), 0);
  const filteredTotal = filteredAndSortedData.value.reduce((sum, row) => sum + (Number(row.TOTAL_AMOUNT) || 0), 0);

  // Table data (uses filtered data)
  const tableData = filteredAndSortedData.value.map((row, index) => [
    index + 1,
    row.NOCS_CODE,
    row.NOCS_NAME,
    `BDT ${formatNumber(row.PRINCIPAL_AMOUNT)}`,
    `BDT ${formatNumber(row.VAT_AMOUNT)}`,
    `BDT ${formatNumber(row.TOTAL_AMOUNT)}`
  ]);

  // Add totals row
  tableData.push([
    '',
    '',
    'GRAND TOTAL',
    `BDT ${formatNumber(filteredPrincipal)}`,
    `BDT ${formatNumber(filteredVAT)}`,
    `BDT ${formatNumber(filteredTotal)}`
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['#', 'NOCS Code', 'NOCS Name', 'Principal Amount', 'VAT (5%)', 'Total Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244]
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 30 },
      2: { cellWidth: 70 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 40 }
    },
    didParseCell: function(data) {
      // Style the last row (totals)
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = [5, 150, 105];
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Generate filename with date range
  const filename = `NOCS_Collection_Summary_${startDate.value}_to_${endDate.value}.pdf`;
  doc.save(filename);
};

// Set default dates (today)
onMounted(() => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  startDate.value = formattedDate;
  endDate.value = formattedDate;
});
</script>
