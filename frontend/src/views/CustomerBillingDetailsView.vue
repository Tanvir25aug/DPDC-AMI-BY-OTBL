<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div class="mb-8 animate-slide-down">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-4xl font-bold text-gray-900">Customer Billing Details</h1>
            <p class="text-gray-600 mt-1">View comprehensive billing history and analytics</p>
          </div>
        </div>
      </div>

      <!-- Search Section -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6 animate-slide-up">
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Customer
          </h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div class="md:col-span-4">
              <label for="custId" class="block text-sm font-semibold text-gray-700 mb-2">
                Customer ID *
              </label>
              <input
                id="custId"
                v-model="custId"
                type="text"
                placeholder="Enter Customer ID"
                class="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all"
                @keyup.enter="fetchBillingData"
              />
            </div>
            <div class="md:col-span-3">
              <label for="startDate" class="block text-sm font-semibold text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                id="startDate"
                v-model="startDate"
                type="date"
                class="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all"
              />
            </div>
            <div class="md:col-span-3">
              <label for="endDate" class="block text-sm font-semibold text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                id="endDate"
                v-model="endDate"
                type="date"
                class="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all"
              />
            </div>
            <div class="md:col-span-2 flex items-end">
              <button
                @click="fetchBillingData"
                :disabled="loading || !custId"
                class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {{ loading ? 'Searching...' : 'Search' }}
              </button>
            </div>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            * Leave dates empty to fetch all billing history
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

      <!-- Customer Info Card -->
      <div v-if="customerInfo" class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6 animate-slide-up">
        <div class="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Customer Information
          </h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-500">Customer No</p>
              <p class="text-lg font-semibold text-gray-900">{{ customerInfo.CUSTOMER_NO }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-500">Meter No</p>
              <p class="text-lg font-semibold text-gray-900">{{ customerInfo.METER_NO || 'N/A' }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-500">NOCS</p>
              <p class="text-lg font-semibold text-gray-900">{{ customerInfo.NOCS_NAME || 'N/A' }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-500">Connection Date</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatDate(customerInfo.CONNECTION_DATE) }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-500">Account Status</p>
              <p class="text-lg font-semibold" :class="getStatusColor(customerInfo.ACCOUNT_STATUS)">
                {{ customerInfo.STATUS_DESCRIPTION }}
              </p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg md:col-span-2">
              <p class="text-sm font-medium text-gray-500">Address</p>
              <p class="text-lg font-semibold text-gray-900">{{ customerInfo.ADDRESS || 'N/A' }}</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm font-medium text-gray-500">Phone</p>
              <p class="text-lg font-semibold text-gray-900">{{ customerInfo.PHONE_NO || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics Cards -->
      <div v-if="analytics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-slide-up">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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

        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-500">Total Charges</p>
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.totalCharges) }}</p>
          <p class="text-xs text-gray-500 mt-1">BDT</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-500">Avg Monthly Charge</p>
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ formatNumber(analytics.averageMonthlyCharges) }}</p>
          <p class="text-xs text-gray-500 mt-1">BDT/month</p>
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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
          <p class="text-xs mt-1" :class="analytics.currentBalance < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'">
            {{ analytics.currentBalance < 0 ? 'Due Amount' : analytics.currentBalance > 0 ? 'Credit Balance' : 'Paid' }}
          </p>
        </div>
      </div>

      <!-- Tabs for Daily/Monthly View -->
      <div v-if="dailyBilling && dailyBilling.length > 0" class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Billing Records
            </h2>
            <div class="flex gap-2">
              <button
                @click="activeTab = 'daily'"
                :class="activeTab === 'daily' ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'"
                class="px-4 py-2 font-medium rounded-lg transition-all"
              >
                Daily View
              </button>
              <button
                @click="activeTab = 'monthly'"
                :class="activeTab === 'monthly' ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'"
                class="px-4 py-2 font-medium rounded-lg transition-all"
              >
                Monthly View
              </button>
            </div>
          </div>
        </div>

        <!-- Daily View -->
        <div v-show="activeTab === 'daily'" class="p-6">
          <div class="mb-4 flex gap-4">
            <div class="flex-1">
              <input
                v-model="dailySearchQuery"
                type="text"
                placeholder="Search daily records..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              @click="exportData('daily', 'csv')"
              class="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
          <div class="overflow-x-auto">
            <div class="max-h-[600px] overflow-y-auto">
              <table class="w-full">
                <thead class="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Meter</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Start Read</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">End Read</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Consumption (kWh)</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Daily Charge (BDT)</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="(row, index) in filteredDailyBilling"
                    :key="index"
                    class="hover:bg-indigo-50 transition-colors"
                  >
                    <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(row.END_DT) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 font-mono">{{ row.MSN }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.START_READ) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.END_READ) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.QUANTITY) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.DAILY_CHARGES) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mt-4 text-sm text-gray-600">
            Showing {{ filteredDailyBilling.length }} of {{ dailyBilling.length }} records
          </div>
        </div>

        <!-- Monthly View -->
        <div v-show="activeTab === 'monthly'" class="p-6">
          <div class="mb-4 flex gap-4">
            <div class="flex-1">
              <input
                v-model="monthlySearchQuery"
                type="text"
                placeholder="Search monthly records..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              @click="exportData('monthly', 'csv')"
              class="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
          <div class="overflow-x-auto">
            <div class="max-h-[600px] overflow-y-auto">
              <table class="w-full">
                <thead class="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Month</th>
                    <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Billing Days</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total Consumption (kWh)</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total Charges (BDT)</th>
                    <th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Avg Daily Charge</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="(row, index) in filteredMonthlyBilling"
                    :key="index"
                    class="hover:bg-indigo-50 transition-colors"
                  >
                    <td class="px-4 py-3 text-sm text-gray-900 font-semibold">{{ row.MONTH_NAME }} {{ row.YEAR }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-center">{{ row.BILLING_DAYS }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.TOTAL_CONSUMPTION) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.TOTAL_CHARGES) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumber(row.TOTAL_CHARGES / row.BILLING_DAYS) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mt-4 text-sm text-gray-600">
            Showing {{ filteredMonthlyBilling.length }} of {{ monthlyBilling.length }} records
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-else-if="!loading && custId && !dailyBilling" class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Billing Data Found</h3>
        <p class="text-gray-600">No billing records found for this customer ID</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';

const custId = ref('');
const startDate = ref('');
const endDate = ref('');
const loading = ref(false);
const error = ref(null);
const activeTab = ref('daily');

const customerInfo = ref(null);
const dailyBilling = ref(null);
const monthlyBilling = ref(null);
const analytics = ref(null);

const dailySearchQuery = ref('');
const monthlySearchQuery = ref('');

const filteredDailyBilling = computed(() => {
  if (!dailyBilling.value) return [];
  if (!dailySearchQuery.value) return dailyBilling.value;

  const search = dailySearchQuery.value.toLowerCase();
  return dailyBilling.value.filter(row => {
    return Object.values(row).some(value => {
      return String(value).toLowerCase().includes(search);
    });
  });
});

const filteredMonthlyBilling = computed(() => {
  if (!monthlyBilling.value) return [];
  if (!monthlySearchQuery.value) return monthlyBilling.value;

  const search = monthlySearchQuery.value.toLowerCase();
  return monthlyBilling.value.filter(row => {
    return Object.values(row).some(value => {
      return String(value).toLowerCase().includes(search);
    });
  });
});

const fetchBillingData = async () => {
  if (!custId.value.trim()) {
    error.value = 'Please enter a Customer ID';
    return;
  }

  loading.value = true;
  error.value = null;
  customerInfo.value = null;
  dailyBilling.value = null;
  monthlyBilling.value = null;
  analytics.value = null;

  try {
    const token = localStorage.getItem('token');

    // Format dates for Oracle (DD-MON-YYYY)
    const formatDateForOracle = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const params = {
      custId: custId.value
    };

    if (startDate.value) {
      params.startDate = formatDateForOracle(startDate.value);
    }
    if (endDate.value) {
      params.endDate = formatDateForOracle(endDate.value);
    }

    const response = await axios.get('/api/reports/customer_billing_details', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      customerInfo.value = response.data.customerInfo;
      dailyBilling.value = response.data.dailyBilling;
      monthlyBilling.value = response.data.monthlyBilling;
      analytics.value = response.data.analytics;
    } else {
      error.value = response.data.message || 'Failed to fetch billing data';
    }
  } catch (err) {
    console.error('Error fetching billing data:', err);

    // Show detailed error information
    if (err.response?.data?.error) {
      error.value = `${err.response.data.message}\n\nOracle Error: ${err.response.data.error}`;
      if (err.response.data.errorCode) {
        error.value += `\nError Code: ${err.response.data.errorCode}`;
      }
    } else {
      error.value = err.response?.data?.message || 'An error occurred while fetching data';
    }
  } finally {
    loading.value = false;
  }
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
  return 'text-gray-900';
};

const exportData = (type, format) => {
  const data = type === 'daily' ? filteredDailyBilling.value : filteredMonthlyBilling.value;

  if (!data || data.length === 0) {
    error.value = 'No data to export';
    return;
  }

  // Create CSV
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `billing_${type}_${custId.value}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.animate-slide-down {
  animation: slide-down 0.5s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
