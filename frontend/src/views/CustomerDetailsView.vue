<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Customer Details</h1>
          <p class="text-gray-600">Search and view comprehensive customer information</p>
        </div>
        <!-- Quick Actions -->
        <div v-if="customer" class="flex items-center gap-3">
          <button
            @click="exportToExcel"
            class="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <button
            @click="printPage"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      <!-- Step 1: Search -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6 animate-fade-in">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Customer
          </h2>
        </div>
        <div class="p-6">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Customer ID or Meter Number</label>
              <input
                v-model="searchValue"
                type="text"
                placeholder="Enter Customer ID or Meter Number"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all"
                @keyup.enter="searchCustomer"
              />
            </div>
            <div class="flex items-end">
              <button
                @click="searchCustomer"
                :disabled="customerLoading || !searchValue"
                class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                <svg v-if="customerLoading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div>
              <p class="font-semibold text-red-900">Error</p>
              <p class="text-sm text-red-800 mt-1">{{ error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Customer Data Section -->
      <div v-if="customer || customerLoading" class="space-y-6">
        <!-- Customer Info Card -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Information
              <span v-if="customerLoading" class="ml-2">
                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </span>
            </h2>
          </div>

          <!-- Skeleton Loading -->
          <div v-if="customerLoading && !customer" class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div v-for="i in 8" :key="i" class="p-4 bg-gray-100 rounded-lg animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div class="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>

          <div v-else-if="customer" class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <p class="text-sm font-medium text-blue-700">Customer ID</p>
                <p class="text-xl font-bold text-blue-900 mt-1">{{ customer.CUSTOMER_ID }}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 md:col-span-2">
                <p class="text-sm font-medium text-indigo-700">Customer Name</p>
                <p class="text-xl font-bold text-indigo-900 mt-1">{{ customer.CUSTOMER_NAME || 'N/A' }}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <p class="text-sm font-medium text-purple-700">Meter Number</p>
                <p class="text-xl font-bold text-purple-900 mt-1">{{ customer.METER_NO || 'N/A' }}</p>
              </div>
              <div class="p-4 rounded-lg border" :class="getMeterStatusStyle(customer.METER_STATUS)">
                <p class="text-sm font-medium">Meter Status</p>
                <p class="text-xl font-bold mt-1">{{ customer.METER_STATUS || 'Unknown' }}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <p class="text-sm font-medium text-green-700">NOCS</p>
                <p class="text-xl font-bold text-green-900 mt-1">{{ customer.NOCS_NAME || 'N/A' }}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <p class="text-sm font-medium text-orange-700">Last Bill Date</p>
                <p class="text-xl font-bold text-orange-900 mt-1">{{ formatDate(customer.LAST_BILL_DATE) }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm font-medium text-gray-500">Connection Date</p>
                <p class="text-lg font-semibold text-gray-900 mt-1">{{ formatDate(customer.CONNECTION_DATE) }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm font-medium text-gray-500">Account Status</p>
                <p class="text-lg font-semibold mt-1" :class="getStatusColor(customer.ACCOUNT_STATUS)">
                  {{ customer.STATUS_DESCRIPTION }}
                </p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg md:col-span-2">
                <p class="text-sm font-medium text-gray-500">Address</p>
                <p class="text-lg font-semibold text-gray-900 mt-1">{{ customer.ADDRESS || 'N/A' }}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm font-medium text-gray-500">Phone</p>
                <p class="text-lg font-semibold text-gray-900 mt-1">{{ customer.PHONE_NO || 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Balance Card - Loads independently -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
          <!-- Current Balance -->
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Current Balance</p>
              <div v-if="balanceLoading" class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg class="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
              <div v-else class="w-10 h-10 rounded-lg flex items-center justify-center" :class="currentBalance < 0 ? 'bg-red-100' : 'bg-green-100'">
                <svg class="w-6 h-6" :class="currentBalance < 0 ? 'text-red-600' : 'text-green-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <div v-if="balanceLoading" class="animate-pulse">
              <div class="h-8 bg-gray-200 rounded w-2/3 mb-1"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div v-else>
              <p class="text-2xl font-bold" :class="currentBalance < 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatNumber(Math.abs(currentBalance)) }}
              </p>
              <p class="text-xs mt-1 font-semibold" :class="currentBalance < 0 ? 'text-red-600' : 'text-green-600'">
                {{ currentBalance < 0 ? 'Due Amount' : currentBalance > 0 ? 'Credit' : 'Paid' }}
              </p>
            </div>
          </div>

          <!-- Analytics Cards - Loads with billing -->
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Total Consumption</p>
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div v-if="billingLoading" class="animate-pulse">
              <div class="h-8 bg-gray-200 rounded w-2/3 mb-1"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div v-else>
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.totalConsumption) }}</p>
              <p class="text-xs text-gray-500 mt-1">kWh</p>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Total Charges</p>
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div v-if="billingLoading" class="animate-pulse">
              <div class="h-8 bg-gray-200 rounded w-2/3 mb-1"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div v-else>
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.totalCharges) }}</p>
              <p class="text-xs text-gray-500 mt-1">BDT</p>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Avg. Daily Charges</p>
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div v-if="billingLoading" class="animate-pulse">
              <div class="h-8 bg-gray-200 rounded w-2/3 mb-1"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div v-else>
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.averageDailyCharges) }}</p>
              <p class="text-xs text-gray-500 mt-1">BDT/day</p>
            </div>
          </div>
        </div>

        <!-- Month Comparison Cards -->
        <div v-if="monthComparison || billingLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              This Month vs Last Month
            </h3>
            <div v-if="billingLoading" class="animate-pulse">
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-gray-100 rounded-lg">
                  <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div class="p-4 bg-gray-100 rounded-lg">
                  <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div v-else-if="monthComparison">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-gray-600">This Month</p>
                  <p class="text-xl font-bold text-blue-700">{{ formatNumber(monthComparison.thisMonth.consumption) }} kWh</p>
                  <p class="text-lg font-semibold text-blue-600">৳ {{ formatNumber(monthComparison.thisMonth.charges) }}</p>
                </div>
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                  <p class="text-sm text-gray-600">Last Month</p>
                  <p class="text-xl font-bold text-gray-700">{{ formatNumber(monthComparison.lastMonth.consumption) }} kWh</p>
                  <p class="text-lg font-semibold text-gray-600">৳ {{ formatNumber(monthComparison.lastMonth.charges) }}</p>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-center gap-2">
                <span :class="monthComparison.changePercent >= 0 ? 'text-red-600' : 'text-green-600'" class="font-bold text-lg">
                  {{ monthComparison.changePercent >= 0 ? '+' : '' }}{{ monthComparison.changePercent.toFixed(1) }}%
                </span>
                <span class="text-gray-500">consumption change</span>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              Need at least 2 months of data
            </div>
          </div>

          <!-- Usage Pattern -->
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Usage Insights
            </h3>
            <div v-if="billingLoading" class="animate-pulse space-y-3">
              <div v-for="i in 4" :key="i" class="flex justify-between">
                <div class="h-4 bg-gray-200 rounded w-1/3"></div>
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            <div v-else class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Highest Daily Charge</span>
                <span class="font-bold text-red-600">৳ {{ formatNumber(analytics.highestDailyCharge) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Lowest Daily Charge</span>
                <span class="font-bold text-green-600">৳ {{ formatNumber(analytics.lowestDailyCharge) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Avg. Monthly Consumption</span>
                <span class="font-bold text-blue-600">{{ formatNumber(analytics.averageMonthlyConsumption) }} kWh</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Billing Days</span>
                <span class="font-bold text-gray-700">{{ counts.dailyRecords }} days</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Monthly Consumption Trend</h3>
            <div v-if="billingLoading" class="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <span class="text-gray-400">Loading chart...</span>
            </div>
            <canvas v-else ref="consumptionChart"></canvas>
          </div>
          <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Monthly Charges Trend</h3>
            <div v-if="billingLoading" class="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
              <span class="text-gray-400">Loading chart...</span>
            </div>
            <canvas v-else ref="chargesChart"></canvas>
          </div>
        </div>

        <!-- Billing History Tables -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Billing History
                <span v-if="billingLoading" class="ml-2">
                  <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </span>
              </h2>
              <div class="flex flex-wrap items-center gap-3">
                <label class="flex items-center gap-2 text-white cursor-pointer bg-indigo-500 px-3 py-1 rounded-lg">
                  <input type="checkbox" v-model="fetchAllData" @change="toggleFetchAll" class="rounded" :disabled="billingLoading">
                  <span class="text-sm font-semibold">Last 12 Months</span>
                  <svg v-if="billingLoading && fetchAllData" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </label>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-b border-gray-200 px-6">
            <div class="flex gap-4">
              <button
                @click="activeTab = 'daily'"
                class="py-3 px-4 font-semibold transition-all"
                :class="activeTab === 'daily' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
              >
                Daily Billing ({{ counts.dailyRecords }})
              </button>
              <button
                @click="activeTab = 'monthly'"
                class="py-3 px-4 font-semibold transition-all"
                :class="activeTab === 'monthly' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
              >
                Monthly Billing ({{ counts.monthlyRecords }})
              </button>
            </div>
          </div>

          <!-- Daily Billing Table -->
          <div v-show="activeTab === 'daily'" class="p-6 overflow-x-auto">
            <div v-if="billingLoading" class="space-y-3">
              <div v-for="i in 5" :key="i" class="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <table v-else class="w-full">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Meter No</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Start Read</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">End Read</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Consumption (kWh)</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Charges (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in paginatedDailyBilling" :key="index" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">{{ formatDate(row.END_DT) }}</td>
                  <td class="py-3 px-4">{{ row.MSN }}</td>
                  <td class="py-3 px-4 text-right">{{ formatNumber(row.START_READ) }}</td>
                  <td class="py-3 px-4 text-right">{{ formatNumber(row.END_READ) }}</td>
                  <td class="py-3 px-4 text-right font-semibold">{{ formatNumber(row.QUANTITY) }}</td>
                  <td class="py-3 px-4 text-right font-bold text-blue-600">{{ formatNumber(row.DAILY_CHARGES) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="!billingLoading && (!dailyBilling || dailyBilling.length === 0)" class="text-center py-8 text-gray-500">
              No daily billing records found
            </div>

            <!-- Daily Billing Pagination -->
            <div v-if="dailyBilling && dailyBilling.length > dailyPerPage" class="mt-6 flex items-center justify-between">
              <div class="text-sm text-gray-600">
                Showing {{ ((dailyCurrentPage - 1) * dailyPerPage) + 1 }} to {{ Math.min(dailyCurrentPage * dailyPerPage, dailyBilling.length) }} of {{ dailyBilling.length }} records
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="dailyCurrentPage--"
                  :disabled="dailyCurrentPage === 1"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                <span class="px-4 py-2 text-gray-700 font-semibold">
                  Page {{ dailyCurrentPage }} of {{ totalDailyPages }}
                </span>
                <button
                  @click="dailyCurrentPage++"
                  :disabled="dailyCurrentPage === totalDailyPages"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <!-- Monthly Billing Table -->
          <div v-show="activeTab === 'monthly'" class="p-6 overflow-x-auto">
            <div v-if="billingLoading" class="space-y-3">
              <div v-for="i in 5" :key="i" class="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <table v-else class="w-full">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Year</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Days</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Consumption (kWh)</th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">Total Charges (৳)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in monthlyBilling" :key="index" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4 font-semibold">{{ row.MONTH_NAME }}</td>
                  <td class="py-3 px-4 text-right">{{ row.YEAR }}</td>
                  <td class="py-3 px-4 text-right">{{ row.BILLING_DAYS }}</td>
                  <td class="py-3 px-4 text-right font-semibold">{{ formatNumber(row.TOTAL_CONSUMPTION) }}</td>
                  <td class="py-3 px-4 text-right font-bold text-purple-600">{{ formatNumber(row.TOTAL_CHARGES) }}</td>
                </tr>
              </tbody>
              <tfoot v-if="monthlyBilling && monthlyBilling.length > 0">
                <tr class="bg-gradient-to-r from-purple-50 to-indigo-50 border-t-2 border-purple-300">
                  <td class="py-4 px-4 font-bold text-gray-800 text-lg" colspan="3">Total</td>
                  <td class="py-4 px-4 text-right font-bold text-purple-700 text-lg">{{ formatNumber(totalMonthlyConsumption) }} kWh</td>
                  <td class="py-4 px-4 text-right font-bold text-purple-700 text-lg">৳ {{ formatNumber(totalMonthlyCharges) }}</td>
                </tr>
              </tfoot>
            </table>
            <div v-if="!billingLoading && (!monthlyBilling || monthlyBilling.length === 0)" class="text-center py-8 text-gray-500">
              No monthly billing records found
            </div>
          </div>
        </div>

        <!-- Recharge History -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Recharge History ({{ counts.rechargeRecords }} records)
              <span v-if="rechargeLoading" class="ml-2">
                <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </span>
            </h2>
          </div>
          <div class="p-6">
            <div v-if="rechargeLoading" class="space-y-3">
              <div v-for="i in 5" :key="i" class="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Payment Event ID</th>
                    <th class="text-right py-3 px-4 font-semibold text-gray-700">Recharge Amount</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Recharge Date</th>
                    <th class="text-right py-3 px-4 font-semibold text-gray-700">Rebate Amount</th>
                    <th class="text-right py-3 px-4 font-semibold text-gray-700">Energy Cost</th>
                    <th class="text-right py-3 px-4 font-semibold text-gray-700">VAT Amount</th>
                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Recharged By</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in paginatedRechargeHistory" :key="index" class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-4 font-mono text-sm">{{ row.PAYMENT_EVENT_ID || 'N/A' }}</td>
                    <td class="py-3 px-4 text-right font-bold text-green-600">৳ {{ formatNumber(row.RECHARGE_AMOUNT) }}</td>
                    <td class="py-3 px-4">{{ formatDate(row.RECHARGE_DATE) }}</td>
                    <td class="py-3 px-4 text-right font-semibold" :class="row.REBATE_AMOUNT < 0 ? 'text-red-600' : 'text-gray-700'">
                      ৳ {{ formatNumber(row.REBATE_AMOUNT) }}
                    </td>
                    <td class="py-3 px-4 text-right text-gray-700">৳ {{ formatNumber(row.ENERGY_COST) }}</td>
                    <td class="py-3 px-4 text-right text-gray-700">৳ {{ formatNumber(row.VAT_AMOUNT) }}</td>
                    <td class="py-3 px-4 text-sm text-gray-600">{{ row.RECHARGED_BY || 'N/A' }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="rechargeHistory && rechargeHistory.length > 0">
                  <tr class="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-300">
                    <td class="py-4 px-4 font-bold text-gray-800 text-lg">Total Recharge</td>
                    <td class="py-4 px-4 text-right font-bold text-green-700 text-xl">৳ {{ formatNumber(totalPayment) }}</td>
                    <td colspan="5" class="py-4 px-4"></td>
                  </tr>
                </tfoot>
              </table>
              <div v-if="!rechargeHistory || rechargeHistory.length === 0" class="text-center py-8 text-gray-500">
                No recharge history found
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="rechargeHistory && rechargeHistory.length > rechargePerPage" class="mt-6 flex items-center justify-between">
              <div class="text-sm text-gray-600">
                Showing {{ ((rechargeCurrentPage - 1) * rechargePerPage) + 1 }} to {{ Math.min(rechargeCurrentPage * rechargePerPage, rechargeHistory.length) }} of {{ rechargeHistory.length }} records
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="rechargeCurrentPage--"
                  :disabled="rechargeCurrentPage === 1"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                <span class="px-4 py-2 text-gray-700 font-semibold">
                  Page {{ rechargeCurrentPage }} of {{ totalRechargePages }}
                </span>
                <button
                  @click="rechargeCurrentPage++"
                  :disabled="rechargeCurrentPage === totalRechargePages"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const searchValue = ref('');
const error = ref(null);
const activeTab = ref('daily');
const fetchAllData = ref(false);

// Separate loading states for each section
const customerLoading = ref(false);
const balanceLoading = ref(false);
const billingLoading = ref(false);
const rechargeLoading = ref(false);

// Data
const customer = ref(null);
const currentBalance = ref(0);
const dailyBilling = ref([]);
const monthlyBilling = ref([]);
const rechargeHistory = ref([]);
const analytics = ref({
  totalConsumption: 0,
  totalCharges: 0,
  averageDailyCharges: 0,
  highestDailyCharge: 0,
  lowestDailyCharge: 0,
  averageMonthlyConsumption: 0
});
const counts = ref({ dailyRecords: 0, monthlyRecords: 0, rechargeRecords: 0 });

// Pagination
const rechargeCurrentPage = ref(1);
const rechargePerPage = 10;
const dailyCurrentPage = ref(1);
const dailyPerPage = 20;

const consumptionChart = ref(null);
const chargesChart = ref(null);
let consumptionChartInstance = null;
let chargesChartInstance = null;

// Computed properties
const totalRechargePages = computed(() => {
  if (!rechargeHistory.value || rechargeHistory.value.length === 0) return 0;
  return Math.ceil(rechargeHistory.value.length / rechargePerPage);
});

const totalDailyPages = computed(() => {
  if (!dailyBilling.value || dailyBilling.value.length === 0) return 0;
  return Math.ceil(dailyBilling.value.length / dailyPerPage);
});

const paginatedRechargeHistory = computed(() => {
  if (!rechargeHistory.value) return [];
  const start = (rechargeCurrentPage.value - 1) * rechargePerPage;
  const end = start + rechargePerPage;
  return rechargeHistory.value.slice(start, end);
});

const paginatedDailyBilling = computed(() => {
  if (!dailyBilling.value) return [];
  const start = (dailyCurrentPage.value - 1) * dailyPerPage;
  const end = start + dailyPerPage;
  return dailyBilling.value.slice(start, end);
});

const totalPayment = computed(() => {
  if (!rechargeHistory.value || rechargeHistory.value.length === 0) return 0;
  return rechargeHistory.value.reduce((sum, row) => sum + parseFloat(row.RECHARGE_AMOUNT || 0), 0);
});

const totalMonthlyConsumption = computed(() => {
  if (!monthlyBilling.value || monthlyBilling.value.length === 0) return 0;
  return monthlyBilling.value.reduce((sum, row) => sum + parseFloat(row.TOTAL_CONSUMPTION || 0), 0);
});

const totalMonthlyCharges = computed(() => {
  if (!monthlyBilling.value || monthlyBilling.value.length === 0) return 0;
  return monthlyBilling.value.reduce((sum, row) => sum + parseFloat(row.TOTAL_CHARGES || 0), 0);
});

const monthComparison = computed(() => {
  if (!monthlyBilling.value || monthlyBilling.value.length < 2) return null;

  const sorted = [...monthlyBilling.value].sort((a, b) => {
    const dateA = new Date(a.YEAR, getMonthIndex(a.MONTH_NAME));
    const dateB = new Date(b.YEAR, getMonthIndex(b.MONTH_NAME));
    return dateB - dateA;
  });

  const thisMonth = sorted[0] || { TOTAL_CONSUMPTION: 0, TOTAL_CHARGES: 0 };
  const lastMonth = sorted[1] || { TOTAL_CONSUMPTION: 0, TOTAL_CHARGES: 0 };

  const changePercent = lastMonth.TOTAL_CONSUMPTION > 0
    ? ((thisMonth.TOTAL_CONSUMPTION - lastMonth.TOTAL_CONSUMPTION) / lastMonth.TOTAL_CONSUMPTION) * 100
    : 0;

  return {
    thisMonth: { consumption: thisMonth.TOTAL_CONSUMPTION, charges: thisMonth.TOTAL_CHARGES },
    lastMonth: { consumption: lastMonth.TOTAL_CONSUMPTION, charges: lastMonth.TOTAL_CHARGES },
    changePercent
  };
});

const getMonthIndex = (monthName) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months.findIndex(m => m.toLowerCase().startsWith(monthName.toLowerCase().substring(0, 3)));
};

const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    error.value = 'Authentication required. Please login again.';
    window.location.href = '/login';
    return null;
  }
  return token;
};

// Main search function - Progressive loading
const searchCustomer = async () => {
  if (!searchValue.value.trim()) {
    error.value = 'Please enter a Customer ID or Meter Number';
    return;
  }

  error.value = null;

  // Reset all data
  customer.value = null;
  currentBalance.value = 0;
  dailyBilling.value = [];
  monthlyBilling.value = [];
  rechargeHistory.value = [];
  analytics.value = { totalConsumption: 0, totalCharges: 0, averageDailyCharges: 0, highestDailyCharge: 0, lowestDailyCharge: 0, averageMonthlyConsumption: 0 };
  counts.value = { dailyRecords: 0, monthlyRecords: 0, rechargeRecords: 0 };
  dailyCurrentPage.value = 1;
  rechargeCurrentPage.value = 1;

  const token = getToken();
  if (!token) return;

  // Step 1: Fetch customer info first (fast)
  customerLoading.value = true;
  try {
    const customerResponse = await axios.get('/api/reports/customer_info', {
      params: { searchValue: searchValue.value },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (customerResponse.data.success) {
      customer.value = customerResponse.data.customer;

      // Step 2: Fetch balance in parallel with other data
      fetchBalance(customerResponse.data.saId, token);

      // Step 3: Fetch billing data (slower)
      fetchBillingData(customerResponse.data.customer.CUSTOMER_ID, token, false);

      // Step 4: Fetch recharge history in parallel
      fetchRechargeHistory(customerResponse.data.saId, token);
    } else {
      error.value = customerResponse.data.message || 'Customer not found';
    }
  } catch (err) {
    console.error('Error fetching customer info:', err);
    if (err.response?.status === 401) {
      error.value = 'Session expired. Please login again.';
      setTimeout(() => window.location.href = '/login', 2000);
      return;
    }
    error.value = err.response?.data?.message || 'Customer not found';
  } finally {
    customerLoading.value = false;
  }
};

// Fetch balance separately
const fetchBalance = async (saId, token) => {
  if (!saId) return;

  balanceLoading.value = true;
  try {
    const response = await axios.get('/api/reports/customer_balance', {
      params: { saId },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      currentBalance.value = response.data.balance;
    }
  } catch (err) {
    console.error('Error fetching balance:', err);
  } finally {
    balanceLoading.value = false;
  }
};

// Fetch billing data separately
const fetchBillingData = async (custId, token, fetchAll = false) => {
  billingLoading.value = true;

  try {
    const response = await axios.get('/api/reports/customer_billing', {
      params: { custId, fetchAll },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      dailyBilling.value = response.data.dailyBilling || [];
      monthlyBilling.value = response.data.monthlyBilling || [];
      analytics.value = response.data.analytics || analytics.value;
      counts.value.dailyRecords = response.data.counts?.dailyRecords || 0;
      counts.value.monthlyRecords = response.data.counts?.monthlyRecords || 0;

      dailyCurrentPage.value = 1;
    }
  } catch (err) {
    console.error('Error fetching billing data:', err);
  } finally {
    billingLoading.value = false;
    // Render charts AFTER billingLoading is false so canvas is in DOM
    await nextTick();
    renderCharts();
  }
};

// Fetch recharge history separately
const fetchRechargeHistory = async (saId, token) => {
  if (!saId) return;

  rechargeLoading.value = true;
  try {
    const response = await axios.get('/api/reports/customer_recharge', {
      params: { saId },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      rechargeHistory.value = response.data.rechargeHistory || [];
      counts.value.rechargeRecords = response.data.rechargeHistory?.length || 0;
      rechargeCurrentPage.value = 1;
    }
  } catch (err) {
    console.error('Error fetching recharge history:', err);
  } finally {
    rechargeLoading.value = false;
  }
};

// Toggle fetch all data
const toggleFetchAll = () => {
  if (customer.value) {
    const token = getToken();
    if (token) {
      fetchBillingData(customer.value.CUSTOMER_ID, token, fetchAllData.value);
    }
  }
};

const exportToExcel = () => {
  if (!customer.value) return;

  let csv = 'Customer Details Report\n\n';
  csv += `Customer ID,${customer.value.CUSTOMER_ID}\n`;
  csv += `Customer Name,${customer.value.CUSTOMER_NAME || 'N/A'}\n`;
  csv += `Meter Number,${customer.value.METER_NO || 'N/A'}\n`;
  csv += `NOCS,${customer.value.NOCS_NAME || 'N/A'}\n\n`;

  csv += 'Monthly Billing\n';
  csv += 'Month,Year,Days,Consumption (kWh),Total Charges\n';
  monthlyBilling.value.forEach(row => {
    csv += `${row.MONTH_NAME},${row.YEAR},${row.BILLING_DAYS},${row.TOTAL_CONSUMPTION},${row.TOTAL_CHARGES}\n`;
  });

  csv += '\nDaily Billing\n';
  csv += 'Date,Meter No,Start Read,End Read,Consumption,Charges\n';
  dailyBilling.value.forEach(row => {
    csv += `${formatDate(row.END_DT)},${row.MSN},${row.START_READ},${row.END_READ},${row.QUANTITY},${row.DAILY_CHARGES}\n`;
  });

  csv += '\nRecharge History\n';
  csv += 'Payment Event ID,Recharge Amount,Recharge Date,Rebate Amount,Energy Cost,VAT Amount,Recharged By\n';
  rechargeHistory.value.forEach(row => {
    csv += `${row.PAYMENT_EVENT_ID || 'N/A'},${row.RECHARGE_AMOUNT},${formatDate(row.RECHARGE_DATE)},${row.REBATE_AMOUNT},${row.ENERGY_COST},${row.VAT_AMOUNT},${row.RECHARGED_BY || 'N/A'}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Customer_${customer.value.CUSTOMER_ID}_Report.csv`;
  link.click();
};

const printPage = () => window.print();

const renderCharts = () => {
  if (!monthlyBilling.value || monthlyBilling.value.length === 0) return;

  if (consumptionChartInstance) consumptionChartInstance.destroy();
  if (chargesChartInstance) chargesChartInstance.destroy();

  const labels = monthlyBilling.value.map(m => `${m.MONTH_NAME} ${m.YEAR}`);
  const consumptionData = monthlyBilling.value.map(m => m.TOTAL_CONSUMPTION);
  const chargesData = monthlyBilling.value.map(m => m.TOTAL_CHARGES);

  if (consumptionChart.value) {
    consumptionChartInstance = new Chart(consumptionChart.value.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Consumption (kWh)',
          data: consumptionData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'kWh' } } }
      }
    });
  }

  if (chargesChart.value) {
    chargesChartInstance = new Chart(chargesChart.value.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Charges (৳)',
          data: chargesData,
          backgroundColor: 'rgba(147, 51, 234, 0.8)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'BDT' } } }
      }
    });
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getStatusColor = (status) => {
  if (status === '20') return 'text-green-600';
  if (status === '40') return 'text-red-600';
  return 'text-gray-600';
};

const getMeterStatusStyle = (status) => {
  if (status === 'Connected') return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-700';
  if (status === 'Disconnected') return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-700';
  if (status === 'RC In Progress') return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-700';
  if (status === 'DC In Progress') return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 text-orange-700';
  return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 text-gray-700';
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-slide-up { animation: slide-up 0.5s ease-out; }

@media print {
  .no-print { display: none !important; }
}
</style>
