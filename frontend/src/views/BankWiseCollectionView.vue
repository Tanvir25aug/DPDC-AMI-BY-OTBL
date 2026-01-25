<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
    <div class="max-w-[1800px] mx-auto">
      <!-- Animated Header -->
      <div class="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl">
        <!-- Animated Background Elements -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute -top-1/2 -right-1/2 h-full w-full animate-pulse rounded-full bg-white opacity-5"></div>
          <div class="absolute -bottom-1/2 -left-1/2 h-full w-full animate-pulse rounded-full bg-white opacity-5" style="animation-delay: 1s"></div>
          <div class="absolute top-1/4 left-1/4 h-64 w-64 animate-bounce rounded-full bg-white opacity-5" style="animation-duration: 3s"></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-4">
            <div class="bg-white/20 p-4 rounded-2xl backdrop-blur-xl transform hover:scale-110 transition-transform duration-300">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">Bank Collection Analytics</h1>
              <p class="text-blue-100 text-lg font-medium">Comprehensive NOCS & Bank-wise collection dashboard with real-time insights</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Filter & Actions Card -->
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-8 shadow-lg border border-gray-100">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Start Date
            </label>
            <input
              v-model="startDate"
              type="date"
              class="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all bg-white text-gray-900 font-semibold shadow-lg"
            />
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              End Date
            </label>
            <input
              v-model="endDate"
              type="date"
              class="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all bg-white text-gray-900 font-semibold shadow-lg"
            />
          </div>

          <div class="md:col-span-3">
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
                {{ loading ? 'Generating Analytics...' : 'Generate Analytics' }}
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

      <!-- Tab Navigation -->
      <div v-if="data.length > 0" class="bg-white/80 backdrop-blur-sm rounded-3xl p-2 mb-8 shadow-lg border border-gray-100">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 flex-1 md:flex-none justify-center',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            ]"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            <span>{{ tab.label }}</span>
          </button>
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
      <div v-if="loading" class="bg-white rounded-3xl p-16 text-center shadow-lg">
        <div class="relative w-24 h-24 mx-auto mb-8">
          <div class="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div class="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-purple-600 border-b-pink-600 border-l-blue-600 animate-spin"></div>
        </div>
        <p class="text-2xl font-bold text-gray-700 mb-3">Generating Analytics Dashboard...</p>
        <p class="text-gray-500">Analyzing collection data from {{ startDate }} to {{ endDate }}</p>
      </div>

      <!-- Dashboard Tab -->
      <div v-if="!loading && data.length > 0 && activeTab === 'dashboard'" class="space-y-8 animate-fade-in">
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Principal Amount Card -->
          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-blue-100 mb-2 font-semibold uppercase tracking-wide">Principal Amount</div>
              <div class="text-3xl font-black text-white mb-2">৳{{ formatNumber(totalPrincipal) }}</div>
              <div class="text-blue-200 text-sm">Base Collection</div>
            </div>
          </div>

          <!-- VAT Amount Card -->
          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-orange-100 mb-2 font-semibold uppercase tracking-wide">VAT (5%)</div>
              <div class="text-3xl font-black text-white mb-2">৳{{ formatNumber(totalVAT) }}</div>
              <div class="text-orange-200 text-sm">Tax Component</div>
            </div>
          </div>

          <!-- Grand Total Card -->
          <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div class="text-sm text-emerald-100 mb-2 font-semibold uppercase tracking-wide">Grand Total</div>
              <div class="text-3xl font-black text-white mb-2">৳{{ formatNumber(grandTotal) }}</div>
              <div class="text-emerald-200 text-sm">Total Collection</div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Bank Distribution Pie Chart -->
          <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div class="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-2xl">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              Bank-wise Collection Distribution
            </h3>
            <div class="h-80">
              <Pie :data="bankChartData" :options="chartOptions" />
            </div>
          </div>

          <!-- All Banks by Transactions Chart -->
          <div class="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div class="bg-gradient-to-r from-blue-500 to-cyan-600 p-3 rounded-2xl">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              All Banks by Transaction Count
            </h3>
            <div class="h-80">
              <Bar :data="topBanksChartData" :options="barChartOptions" />
            </div>
          </div>
        </div>
      </div>

      <!-- Bank-wise Summary Tab -->
      <div v-if="!loading && data.length > 0 && activeTab === 'bank-summary'" class="animate-fade-in">
        <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 class="text-2xl font-bold text-white flex items-center gap-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Bank-wise Collection Summary (All NOCS Combined)
            </h2>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Bank Name</th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">NOCS Count</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Principal Amount</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">VAT (5%)</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total Amount</th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Transactions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-for="(row, index) in bankSummary" :key="row.bank" class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold">
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-bold text-gray-900 text-lg">{{ row.bank }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-purple-100 text-purple-700 border border-purple-300">
                      {{ row.nocsCount }} NOCS
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="font-bold text-indigo-600 text-lg">৳{{ formatNumber(row.principal) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="font-semibold text-orange-600">৳{{ formatNumber(row.vat) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg">
                      ৳{{ formatNumber(row.total) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-gray-700 font-semibold">{{ formatInteger(row.transactions) }}</span>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gradient-to-r from-blue-600 to-purple-600">
                <tr class="font-bold text-white">
                  <td class="px-6 py-6" colspan="3">
                    <div class="flex items-center gap-3 text-xl">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      GRAND TOTAL
                    </div>
                  </td>
                  <td class="px-6 py-6 text-right text-xl">৳{{ formatNumber(totalPrincipal) }}</td>
                  <td class="px-6 py-6 text-right text-xl">৳{{ formatNumber(totalVAT) }}</td>
                  <td class="px-6 py-6 text-right text-2xl font-black">৳{{ formatNumber(grandTotal) }}</td>
                  <td class="px-6 py-6 text-center text-xl">{{ formatInteger(totalTransactions) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Detailed Report Tab -->
      <div v-if="!loading && data.length > 0 && activeTab === 'detailed'" class="space-y-6 animate-fade-in">
        <!-- Filters -->
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-100">
          <div class="flex items-center gap-3 mb-6">
            <div class="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-2xl">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-700">Advanced Filters</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">NOCS Name</label>
              <select v-model="filterNocsName" class="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-300 cursor-pointer">
                <option value="">All NOCS</option>
                <option v-for="name in uniqueNocsNames" :key="name" :value="name">{{ name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Bank Name</label>
              <select v-model="filterBankName" class="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-300 cursor-pointer">
                <option value="">All Banks</option>
                <option v-for="bank in uniqueBankNames" :key="bank" :value="bank">{{ bank }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Sort Order</label>
              <button @click="toggleSort" class="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center justify-between">
                <span>{{ sortOrder === 'high-to-low' ? 'High to Low' : 'Low to High' }}</span>
                <svg v-if="sortOrder === 'high-to-low'" class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <svg v-else class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">&nbsp;</label>
              <button @click="clearFilters" class="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-md flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>

          <div v-if="filteredAndSortedData.length !== data.length" class="mt-4 text-gray-600 font-semibold">
            Showing {{ filteredAndSortedData.length }} of {{ data.length }} records
          </div>
        </div>

        <!-- Detailed Table -->
        <div class="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div class="p-6 bg-gradient-to-r from-cyan-600 to-blue-600">
            <h2 class="text-2xl font-bold text-white flex items-center gap-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Detailed Bank-Wise Collection Report
            </h2>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Bank Name</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NOCS Code</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">NOCS Name</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Principal</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">VAT (5%)</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr v-for="(row, index) in paginatedData" :key="`${row.NOCS_CODE}-${row.BANK_NAME}`" class="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full text-sm font-bold">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-semibold text-gray-700">{{ row.BANK_NAME }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {{ row.NOCS_CODE }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-bold text-gray-900">{{ row.NOCS_NAME }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="font-bold text-indigo-600">৳{{ formatNumber(row.PRINCIPAL_AMOUNT) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="font-semibold text-orange-600">৳{{ formatNumber(row.VAT_AMOUNT) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold">
                      ৳{{ formatNumber(row.TOTAL_AMOUNT) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
            <div class="text-gray-700 font-semibold">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredAndSortedData.length) }} of {{ filteredAndSortedData.length }} results
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
        <p class="text-gray-600 text-lg max-w-md mx-auto">Select a date range and click "Generate Analytics" to view the comprehensive bank-wise collection dashboard.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'vue-chartjs';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const startDate = ref('');
const endDate = ref('');
const data = ref([]);
const loading = ref(false);
const error = ref(null);

// Filter and sort state
const filterNocsName = ref('');
const filterBankName = ref('');
const sortOrder = ref('high-to-low');

// Pagination
const currentPage = ref(1);
const pageSize = 50;

// Active tab
const activeTab = ref('dashboard');

// Tab definitions
const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ])
  },
  {
    id: 'bank-summary',
    label: 'Bank Summary',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' })
    ])
  },
  {
    id: 'detailed',
    label: 'Detailed Report',
    icon: h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
    ])
  }
];

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

const totalTransactions = computed(() => {
  return data.value.reduce((sum, row) => sum + (Number(row.TRANSACTION_COUNT) || 0), 0);
});

// Bank-wise summary (all NOCS grouped by bank)
const bankSummary = computed(() => {
  const bankMap = new Map();

  data.value.forEach(row => {
    const bank = row.BANK_NAME;
    if (!bankMap.has(bank)) {
      bankMap.set(bank, {
        bank,
        nocsCount: new Set(),
        principal: 0,
        vat: 0,
        total: 0,
        transactions: 0
      });
    }

    const summary = bankMap.get(bank);
    summary.nocsCount.add(row.NOCS_CODE);
    summary.principal += Number(row.PRINCIPAL_AMOUNT) || 0;
    summary.vat += Number(row.VAT_AMOUNT) || 0;
    summary.total += Number(row.TOTAL_AMOUNT) || 0;
    summary.transactions += Number(row.TRANSACTION_COUNT) || 0;
  });

  return Array.from(bankMap.values())
    .map(item => ({ ...item, nocsCount: item.nocsCount.size }))
    .sort((a, b) => b.total - a.total);
});


// Unique values for dropdowns
const uniqueNocsNames = computed(() => {
  const names = data.value.map(row => row.NOCS_NAME).filter(Boolean);
  return [...new Set(names)].sort();
});

const uniqueBankNames = computed(() => {
  const banks = data.value.map(row => row.BANK_NAME).filter(Boolean);
  return [...new Set(banks)].sort();
});

// Filtered and sorted data
const filteredAndSortedData = computed(() => {
  let result = [...data.value];

  if (filterNocsName.value) {
    result = result.filter(row => row.NOCS_NAME === filterNocsName.value);
  }

  if (filterBankName.value) {
    result = result.filter(row => row.BANK_NAME === filterBankName.value);
  }

  result.sort((a, b) => {
    const amountA = Number(a.TOTAL_AMOUNT) || 0;
    const amountB = Number(b.TOTAL_AMOUNT) || 0;
    return sortOrder.value === 'high-to-low' ? amountB - amountA : amountA - amountB;
  });

  return result;
});

// Pagination
const totalPages = computed(() => Math.ceil(filteredAndSortedData.value.length / pageSize));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredAndSortedData.value.slice(start, end);
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

// Chart data
const bankChartData = computed(() => {
  const topBanks = bankSummary.value.slice(0, 10);
  return {
    labels: topBanks.map(b => b.bank),
    datasets: [{
      data: topBanks.map(b => b.total),
      backgroundColor: [
        '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
        '#EF4444', '#14B8A6', '#6366F1', '#F97316', '#06B6D4'
      ],
      borderWidth: 0
    }]
  };
});

const topBanksChartData = computed(() => {
  // Sort all banks by transaction count (descending)
  const allBanksByTransactions = [...bankSummary.value].sort((a, b) => b.transactions - a.transactions);

  return {
    labels: allBanksByTransactions.map(b => b.bank),
    datasets: [{
      label: 'Total Transactions',
      data: allBanksByTransactions.map(b => b.transactions),
      backgroundColor: allBanksByTransactions.map((_, index) => {
        const colors = [
          '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
          '#EF4444', '#14B8A6', '#6366F1', '#F97316', '#06B6D4',
          '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
          '#3B82F6', '#10B981', '#EF4444', '#06B6D4', '#F97316'
        ];
        return colors[index % colors.length];
      }),
      borderColor: allBanksByTransactions.map((_, index) => {
        const colors = [
          '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
          '#EF4444', '#14B8A6', '#6366F1', '#F97316', '#06B6D4',
          '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
          '#3B82F6', '#10B981', '#EF4444', '#06B6D4', '#F97316'
        ];
        return colors[index % colors.length];
      }),
      borderWidth: 2
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
    legend: { display: false },
    title: { display: false }
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


const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'high-to-low' ? 'low-to-high' : 'high-to-low';
};

const clearFilters = () => {
  filterNocsName.value = '';
  filterBankName.value = '';
  sortOrder.value = 'high-to-low';
  currentPage.value = 1;
};

const formatNumber = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatInteger = (num) => {
  if (!num) return '0';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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
        reportName: 'bank_wise_collection',
        start_date: startDate.value,
        end_date: endDate.value
      }
    });

    data.value = response.data.data || [];
    activeTab.value = 'dashboard';
    currentPage.value = 1;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch data';
    console.error('Error fetching bank-wise collection:', err);
    data.value = [];
  } finally {
    loading.value = false;
  }
};

const exportToExcel = () => {
  if (!data.value.length) return;

  const wb = XLSX.utils.book_new();

  // Bank Summary Sheet
  const bankData = bankSummary.value.map((row, index) => ({
    '#': index + 1,
    'Bank Name': row.bank,
    'NOCS Count': row.nocsCount,
    'Principal Amount': row.principal,
    'VAT (5%)': row.vat,
    'Total Amount': row.total,
    'Transactions': Math.round(row.transactions)
  }));
  const wsBank = XLSX.utils.json_to_sheet(bankData);
  XLSX.utils.book_append_sheet(wb, wsBank, 'Bank Summary');

  // Detailed Report Sheet
  const detailedData = data.value.map((row, index) => ({
    '#': index + 1,
    'Bank Name': row.BANK_NAME,
    'NOCS Code': row.NOCS_CODE,
    'NOCS Name': row.NOCS_NAME,
    'Principal Amount': row.PRINCIPAL_AMOUNT,
    'VAT (5%)': row.VAT_AMOUNT,
    'Total Amount': row.TOTAL_AMOUNT,
    'Transactions': Math.round(row.TRANSACTION_COUNT)
  }));
  const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Report');

  const filename = `Bank_Collection_Analytics_${startDate.value}_to_${endDate.value}.xlsx`;
  XLSX.writeFile(wb, filename);
};

const exportToPdf = async () => {
  if (!data.value.length) return;

  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Load and add DPDC logo
  const logoImg = new Image();
  logoImg.src = '/DPDC_Logo.png';

  await new Promise((resolve) => {
    logoImg.onload = () => {
      // Add decorative header background
      doc.setFillColor(37, 99, 235); // Blue
      doc.rect(0, 0, pageWidth, 35, 'F');

      // Add gradient effect with lighter blue
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 25, pageWidth, 10, 'F');

      // Add logo
      try {
        doc.addImage(logoImg, 'PNG', 14, 5, 25, 25);
      } catch (e) {
        console.error('Error adding logo:', e);
      }

      // Company name and title
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('DHAKA POWER DISTRIBUTION COMPANY LTD.', 45, 15);

      doc.setFontSize(18);
      doc.setFont(undefined, 'normal');
      doc.text('Bank Collection Analytics Report', 45, 25);

      // Add decorative line
      doc.setDrawColor(249, 115, 22); // Orange
      doc.setLineWidth(2);
      doc.line(14, 38, pageWidth - 14, 38);

      resolve();
    };
    logoImg.onerror = () => {
      // Fallback if logo fails to load
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('DHAKA POWER DISTRIBUTION COMPANY LTD.', 14, 15);

      doc.setFontSize(18);
      doc.setFont(undefined, 'normal');
      doc.text('Bank Collection Analytics Report', 14, 25);

      resolve();
    };
  });

  // Report metadata section
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont(undefined, 'bold');
  doc.text('Report Period:', 14, 48);
  doc.setFont(undefined, 'normal');
  doc.text(`${startDate.value} to ${endDate.value}`, 45, 48);

  doc.setFont(undefined, 'bold');
  doc.text('Generated On:', 14, 54);
  doc.setFont(undefined, 'normal');
  doc.text(new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), 45, 54);

  // Summary cards section with borders
  doc.setFillColor(239, 246, 255); // Light blue background
  doc.roundedRect(14, 60, 85, 24, 2, 2, 'F');
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 60, 85, 24, 2, 2, 'S');

  doc.setFillColor(255, 247, 237); // Light orange background
  doc.roundedRect(104, 60, 85, 24, 2, 2, 'F');
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.roundedRect(104, 60, 85, 24, 2, 2, 'S');

  doc.setFillColor(236, 253, 245); // Light green background
  doc.roundedRect(194, 60, 85, 24, 2, 2, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(194, 60, 85, 24, 2, 2, 'S');

  // Principal Amount
  doc.setFontSize(8);
  doc.setTextColor(59, 130, 246);
  doc.setFont(undefined, 'bold');
  doc.text('PRINCIPAL AMOUNT', 16, 66);
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.setFont(undefined, 'bold');
  doc.text(`BDT ${formatNumber(totalPrincipal.value)}`, 16, 77);

  // VAT Amount
  doc.setFontSize(8);
  doc.setTextColor(249, 115, 22);
  doc.setFont(undefined, 'bold');
  doc.text('VAT (5%)', 106, 66);
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.setFont(undefined, 'bold');
  doc.text(`BDT ${formatNumber(totalVAT.value)}`, 106, 77);

  // Grand Total
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.setFont(undefined, 'bold');
  doc.text('GRAND TOTAL', 196, 66);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.setFont(undefined, 'bold');
  doc.text(`BDT ${formatNumber(grandTotal.value)}`, 196, 77);

  // Bank Summary Table Section
  doc.setFillColor(37, 99, 235);
  doc.rect(14, 88, pageWidth - 28, 8, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('BANK-WISE COLLECTION SUMMARY', 16, 93);

  const bankTableData = bankSummary.value.map((row, index) => [
    index + 1,
    row.bank,
    row.nocsCount,
    `BDT ${formatNumber(row.principal)}`,
    `BDT ${formatNumber(row.vat)}`,
    `BDT ${formatNumber(row.total)}`,
    formatInteger(row.transactions)
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['#', 'Bank Name', 'NOCS', 'Principal Amount', 'VAT (5%)', 'Total Amount', 'Trans.']],
    body: bankTableData,
    foot: [[
      '',
      'TOTAL',
      '',
      `BDT ${formatNumber(totalPrincipal.value)}`,
      `BDT ${formatNumber(totalVAT.value)}`,
      `BDT ${formatNumber(grandTotal.value)}`,
      formatInteger(totalTransactions.value)
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.5,
      lineColor: [255, 255, 255],
      cellPadding: 4
    },
    footStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'right',
      lineWidth: 0.5,
      lineColor: [255, 255, 255],
      cellPadding: 4
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'left',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 55, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 45, fontStyle: 'normal' },
      4: { halign: 'right', cellWidth: 38, fontStyle: 'normal' },
      5: { halign: 'right', cellWidth: 48, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 22 }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    margin: { left: 14, right: 14 }
  });

  // Add footer with page number and branding
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

    // Footer text - left side
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(
      'Bank Collection Analytics Report',
      14,
      pageHeight - 8
    );

    // Footer text - center
    doc.setFont(undefined, 'normal');
    doc.text(
      '| Generated by DPDC AMI System |',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    // Footer text - right side (page number)
    doc.setFont(undefined, 'bold');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  const filename = `DPDC_Bank_Collection_Report_${startDate.value}_to_${endDate.value}.pdf`;
  doc.save(filename);
};

// Set default dates
onMounted(() => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  startDate.value = formattedDate;
  endDate.value = formattedDate;
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
