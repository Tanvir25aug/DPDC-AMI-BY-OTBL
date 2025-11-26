<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Customer Details</h1>
        <p class="text-gray-600">Search and view comprehensive customer information</p>
      </div>

      <!-- Wizard Progress Indicator -->
      <div v-if="currentStep > 0" class="mb-8">
        <div class="flex items-center justify-between max-w-4xl mx-auto">
          <div v-for="(step, index) in steps" :key="index" class="flex items-center flex-1">
            <div class="flex flex-col items-center flex-1">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                :class="currentStep > index ? 'bg-green-500 text-white' : currentStep === index ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'"
              >
                <svg v-if="currentStep > index" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span v-else class="text-sm font-semibold">{{ index + 1 }}</span>
              </div>
              <span class="text-xs mt-2 text-center hidden md:block" :class="currentStep >= index ? 'text-gray-900 font-semibold' : 'text-gray-500'">
                {{ step }}
              </span>
            </div>
            <div v-if="index < steps.length - 1" class="w-full h-1 mx-2" :class="currentStep > index ? 'bg-green-500' : 'bg-gray-300'"></div>
          </div>
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
                :disabled="loading || !searchValue"
                class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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

      <!-- Step 2: Customer Information (only show after search) -->
      <div v-if="customer" class="space-y-6">
        <!-- Customer Info Card -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Information
            </h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <p class="text-sm font-medium text-blue-700">Customer ID</p>
                <p class="text-xl font-bold text-blue-900 mt-1">{{ customer.CUSTOMER_ID }}</p>
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

        <!-- Step 3: Analytics Cards -->
        <div v-if="analytics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Total Consumption</p>
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.totalConsumption) }}</p>
            <p class="text-xs text-gray-500 mt-1">kWh</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Total Charges</p>
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.totalCharges) }}</p>
            <p class="text-xs text-gray-500 mt-1">BDT</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Avg. Daily Charges</p>
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.averageDailyCharges) }}</p>
            <p class="text-xs text-gray-500 mt-1">BDT/day</p>
          </div>

          <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-medium text-gray-500">Current Balance</p>
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="analytics.currentBalance < 0 ? 'bg-red-100' : 'bg-green-100'">
                <svg class="w-6 h-6" :class="analytics.currentBalance < 0 ? 'text-red-600' : 'text-green-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p class="text-2xl font-bold" :class="analytics.currentBalance < 0 ? 'text-red-600' : 'text-green-600'">
              {{ formatNumber(Math.abs(analytics.currentBalance)) }}
            </p>
            <p class="text-xs mt-1 font-semibold" :class="analytics.currentBalance < 0 ? 'text-red-600' : 'text-green-600'">
              {{ analytics.currentBalance < 0 ? 'Due Amount' : analytics.currentBalance > 0 ? 'Credit' : 'Paid' }}
            </p>
          </div>
        </div>

        <!-- Step 4: Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Monthly Consumption Trend</h3>
            <canvas ref="consumptionChart"></canvas>
          </div>
          <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Monthly Charges Trend</h3>
            <canvas ref="chargesChart"></canvas>
          </div>
        </div>

        <!-- Step 5: Billing History Tables -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Billing History
              </h2>
              <label class="flex items-center gap-2 text-white cursor-pointer">
                <input type="checkbox" v-model="fetchAllData" @change="toggleFetchAll" class="rounded">
                <span class="text-sm">Show All Data</span>
              </label>
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
            <table class="w-full">
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
                <tr v-for="(row, index) in dailyBilling" :key="index" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">{{ formatDate(row.END_DT) }}</td>
                  <td class="py-3 px-4">{{ row.MSN }}</td>
                  <td class="py-3 px-4 text-right">{{ formatNumber(row.START_READ) }}</td>
                  <td class="py-3 px-4 text-right">{{ formatNumber(row.END_READ) }}</td>
                  <td class="py-3 px-4 text-right font-semibold">{{ formatNumber(row.QUANTITY) }}</td>
                  <td class="py-3 px-4 text-right font-bold text-blue-600">{{ formatNumber(row.DAILY_CHARGES) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="!dailyBilling || dailyBilling.length === 0" class="text-center py-8 text-gray-500">
              No daily billing records found
            </div>
          </div>

          <!-- Monthly Billing Table -->
          <div v-show="activeTab === 'monthly'" class="p-6 overflow-x-auto">
            <table class="w-full">
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
            </table>
            <div v-if="!monthlyBilling || monthlyBilling.length === 0" class="text-center py-8 text-gray-500">
              No monthly billing records found
            </div>
          </div>
        </div>

        <!-- Step 6: Recharge History with Pagination -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
          <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Recharge History ({{ counts.rechargeRecords }} records)
            </h2>
          </div>
          <div class="p-6">
            <div class="overflow-x-auto">
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
            <div v-if="rechargeHistory && rechargeHistory.length > 0" class="mt-6 flex items-center justify-between">
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
                <div class="flex items-center gap-1">
                  <button
                    v-for="page in totalRechargePages"
                    :key="page"
                    @click="rechargeCurrentPage = page"
                    class="w-10 h-10 rounded-lg font-semibold transition-colors"
                    :class="rechargeCurrentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
                  >
                    {{ page }}
                  </button>
                </div>
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
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const searchValue = ref('');
const loading = ref(false);
const error = ref(null);
const currentStep = ref(0);
const activeTab = ref('daily');
const fetchAllData = ref(false);

const customer = ref(null);
const dailyBilling = ref(null);
const monthlyBilling = ref(null);
const rechargeHistory = ref(null);
const analytics = ref(null);
const counts = ref({ dailyRecords: 0, monthlyRecords: 0, rechargeRecords: 0 });

const rechargeCurrentPage = ref(1);
const rechargePerPage = 10;

const consumptionChart = ref(null);
const chargesChart = ref(null);
let consumptionChartInstance = null;
let chargesChartInstance = null;

const steps = ['Search', 'Customer Info', 'Analytics', 'Charts', 'Billing History', 'Recharge History'];

const totalRechargePages = computed(() => {
  if (!rechargeHistory.value) return 0;
  return Math.ceil(rechargeHistory.value.length / rechargePerPage);
});

const paginatedRechargeHistory = computed(() => {
  if (!rechargeHistory.value) return [];
  const start = (rechargeCurrentPage.value - 1) * rechargePerPage;
  const end = start + rechargePerPage;
  return rechargeHistory.value.slice(start, end);
});

const totalPayment = computed(() => {
  if (!rechargeHistory.value || rechargeHistory.value.length === 0) return 0;
  return rechargeHistory.value.reduce((sum, row) => sum + parseFloat(row.RECHARGE_AMOUNT || 0), 0);
});

const searchCustomer = async () => {
  if (!searchValue.value.trim()) {
    error.value = 'Please enter a Customer ID or Meter Number';
    return;
  }

  loading.value = true;
  error.value = null;
  customer.value = null;
  currentStep.value = 0;

  try {
    const token = localStorage.getItem('token');

    if (!token) {
      error.value = 'Authentication required. Please login again.';
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    const params = {
      searchValue: searchValue.value,
      fetchAll: fetchAllData.value
    };

    const response = await axios.get('/api/reports/customer_details', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      customer.value = response.data.customer;
      dailyBilling.value = response.data.dailyBilling;
      monthlyBilling.value = response.data.monthlyBilling;
      rechargeHistory.value = response.data.rechargeHistory;
      analytics.value = response.data.analytics;
      counts.value = response.data.counts;

      currentStep.value = 6;

      await nextTick();
      renderCharts();
    } else {
      error.value = response.data.message || 'Failed to fetch customer details';
    }
  } catch (err) {
    console.error('Error fetching customer details:', err);

    // Handle 401 Unauthorized
    if (err.response?.status === 401) {
      error.value = 'Session expired. Please login again.';
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    error.value = err.response?.data?.message || err.message || 'An error occurred while fetching data';
  } finally {
    loading.value = false;
  }
};

const toggleFetchAll = () => {
  if (customer.value) {
    searchCustomer();
  }
};

const renderCharts = () => {
  if (!monthlyBilling.value || monthlyBilling.value.length === 0) return;

  // Destroy existing charts
  if (consumptionChartInstance) consumptionChartInstance.destroy();
  if (chargesChartInstance) chargesChartInstance.destroy();

  const labels = monthlyBilling.value.map(m => `${m.MONTH_NAME} ${m.YEAR}`);
  const consumptionData = monthlyBilling.value.map(m => m.TOTAL_CONSUMPTION);
  const chargesData = monthlyBilling.value.map(m => m.TOTAL_CHARGES);

  // Consumption Chart
  const consumptionCtx = consumptionChart.value.getContext('2d');
  consumptionChartInstance = new Chart(consumptionCtx, {
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
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'kWh' } }
      }
    }
  });

  // Charges Chart
  const chargesCtx = chargesChart.value.getContext('2d');
  chargesChartInstance = new Chart(chargesCtx, {
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
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'BDT' } }
      }
    }
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
  if (status === 'Connected') {
    return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-700';
  } else if (status === 'Disconnected') {
    return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 text-red-700';
  } else if (status === 'RC In Progress') {
    return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 text-yellow-700';
  } else if (status === 'DC In Progress') {
    return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 text-orange-700';
  }
  return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 text-gray-700';
};

const getPaymentStatusStyle = (status) => {
  if (status === 'Completed') {
    return 'bg-green-100 text-green-700';
  } else if (status === 'Frozen') {
    return 'bg-blue-100 text-blue-700';
  } else if (status === 'Matched') {
    return 'bg-purple-100 text-purple-700';
  } else if (status === 'Pending') {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-700';
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}
</style>
