<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Top Navigation Bar -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 class="text-lg font-bold text-gray-900">CPR-CPC Management</h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Export to Excel Button -->
            <button
              @click="exportToExcel"
              :disabled="loading || exportingExcel"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="!exportingExcel" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ exportingExcel ? 'Exporting...' : 'Export to Excel' }}
            </button>

            <!-- Dashboard Button -->
            <button
              @click="$router.push('/')"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-800">Error Loading Data</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
          <button @click="error = null" class="text-red-600 hover:text-red-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header Section -->
      <div class="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">CPR Customer Management</h2>
            <p class="text-blue-100">Manage CPR customers and their associated CPC connections</p>
          </div>
          <div class="flex flex-col gap-2 items-end">
            <div class="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span class="text-sm text-white font-medium">{{ totalCount }} CPR Customers</span>
            </div>
            <div v-if="batchInfo" class="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-xs text-white/90">Data: {{ formatBatchDate(batchInfo.batchDate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <!-- Search Row -->
        <div class="flex flex-col md:flex-row gap-4 mb-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Search CPR or CPC Customer</label>
            <div class="relative">
              <input
                v-model="searchQuery"
                @input="handleSearch"
                type="text"
                placeholder="Search by CPR Account, CPC Customer ID, or Name..."
                class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="flex flex-col lg:flex-row gap-4 mb-4">
          <!-- Connection Count Filter -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Connection Count</label>
            <select
              v-model="filterConnectionCount"
              @change="applyFilters"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Connections</option>
              <option value="0-10">Less than 10</option>
              <option value="10-50">10 to 50</option>
              <option value="50-100">50 to 100</option>
              <option value="100+">More than 100</option>
            </select>
          </div>

          <!-- Bill Stop Filter -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Bill Stop Status</label>
            <select
              v-model="filterBillStop"
              @change="applyFilters"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="has-issues">Has Bill Stop Issues</option>
              <option value="no-issues">No Bill Stop Issues</option>
            </select>
          </div>

          <!-- Active Billing Filter -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Active Billing</label>
            <select
              v-model="filterActiveBilling"
              @change="applyFilters"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Billing</option>
              <option value="has-active">Has Active Billing</option>
              <option value="no-active">No Active Billing</option>
            </select>
          </div>

          <!-- Sort By Filter -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              v-model="sortBy"
              @change="applyFilters"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="account-asc">Account (A-Z)</option>
              <option value="account-desc">Account (Z-A)</option>
              <option value="connections-asc">Connections (Low to High)</option>
              <option value="connections-desc">Connections (High to Low)</option>
              <option value="billstop-desc">Bill Stop Issues (High to Low)</option>
              <option value="active-desc">Active Billing (High to Low)</option>
            </select>
          </div>
        </div>

        <!-- Active Filters Badge and Action Buttons -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="hasActiveFilters" class="text-sm text-gray-600 font-medium">Active Filters:</span>
            <span v-if="filterConnectionCount" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Connections: {{ filterConnectionCount }}
              <button @click="filterConnectionCount = ''; applyFilters()" class="ml-1.5 hover:text-blue-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </span>
            <span v-if="filterBillStop" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {{ filterBillStop === 'has-issues' ? 'Has Bill Stop Issues' : 'No Bill Stop Issues' }}
              <button @click="filterBillStop = ''; applyFilters()" class="ml-1.5 hover:text-red-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </span>
            <span v-if="filterActiveBilling" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {{ filterActiveBilling === 'has-active' ? 'Has Active Billing' : 'No Active Billing' }}
              <button @click="filterActiveBilling = ''; applyFilters()" class="ml-1.5 hover:text-green-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </span>
            <span v-if="sortBy !== 'account-asc'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Sort: {{ getSortLabel(sortBy) }}
              <button @click="sortBy = 'account-asc'; applyFilters()" class="ml-1.5 hover:text-purple-900">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="hasActiveFilters"
              @click="clearAllFilters"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Clear All Filters
            </button>
            <button
              @click="fetchData"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
            >
              <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <!-- Results Count -->
        <div v-if="totalCount > 0" class="mt-4 pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-600">
            Showing <span class="font-semibold text-gray-900">{{ crpList.length }}</span> of <span class="font-semibold text-gray-900">{{ totalCount }}</span> results
            <span v-if="hasActiveFilters" class="text-blue-600">(filtered from database)</span>
          </p>
        </div>
      </div>

      <!-- CRP List Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPR Account</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total CPC Connections</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Stop</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Billing</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading" class="text-center">
                <td colspan="5" class="px-6 py-8">
                  <div class="flex justify-center items-center">
                    <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="ml-3 text-gray-600">Loading CPR data...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredCRPList.length === 0" class="text-center">
                <td colspan="5" class="px-6 py-8">
                  <div class="text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No CPR customers found</p>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="crp in filteredCRPList" :key="crp.CRP_ID" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ crp.CRP_ACCOUNT_NO }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {{ crp.TOTAL_CPC_COUNT }} connections
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span v-if="crp.BILL_STOP_COUNT !== null && crp.BILL_STOP_COUNT !== undefined" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    {{ crp.BILL_STOP_COUNT }} issues
                  </span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span v-if="crp.ACTIVE_BILLING_COUNT !== null && crp.ACTIVE_BILLING_COUNT !== undefined" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    {{ crp.ACTIVE_BILLING_COUNT }} active
                  </span>
                  <span v-else class="text-gray-400 text-xs">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click="viewCPCDetails(crp)"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span> of
              <span class="font-medium">{{ totalCount }}</span> results
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="goToPage(1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="px-4 py-1 text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                @click="goToPage(totalPages)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CPC Details Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="closeModal"></div>

        <div class="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold text-white">CPC Details for CPR {{ selectedCRP?.CRP_ACCOUNT_NO }}</h3>
                <p class="text-sm text-blue-100 mt-1">Total CPC Connections: {{ selectedCRP?.TOTAL_CPC_COUNT }}</p>
              </div>
              <button @click="closeModal" class="text-white hover:text-gray-200 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <div v-if="loadingCPC" class="flex justify-center items-center py-12">
              <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="ml-3 text-gray-600">Loading CPC details...</span>
            </div>

            <div v-else-if="cpcList.length === 0" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p class="text-gray-500">No CPC connections found for this CPR</p>
            </div>

            <div v-else class="space-y-4">
              <div v-for="cpc in cpcList" :key="cpc.CPC_SA_ID" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Meter No</p>
                    <p class="text-sm font-semibold text-gray-900">{{ cpc.METER_NO }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Customer No</p>
                    <p class="text-sm font-semibold text-gray-900">{{ cpc.CPC_CUSTOMER_NO }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Customer Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ cpc.CUSTOMER_NAME }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Phone</p>
                    <p class="text-sm text-gray-700">{{ cpc.PHONE_NO }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Feeder</p>
                    <p class="text-sm text-gray-700">{{ cpc.FEEDER }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span :class="getStatusClass(cpc.SA_STATUS_DESC)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ cpc.SA_STATUS_DESC }}
                    </span>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Billed This Month</p>
                    <span :class="cpc.BILLED_THIS_MONTH === 'Yes' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{ cpc.BILLED_THIS_MONTH }}
                    </span>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Last Bill Date</p>
                    <p class="text-sm text-gray-700">{{ cpc.LAST_BILL_DATE }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase">Current Balance</p>
                    <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(-cpc.CURRENT_BALANCE) }}</p>
                  </div>
                  <div class="md:col-span-2 lg:col-span-3">
                    <p class="text-xs font-medium text-gray-500 uppercase">Address</p>
                    <p class="text-sm text-gray-700">{{ cpc.ADDRESS }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-600">Total CPC Connections: <span class="font-semibold">{{ cpcList.length }}</span></p>
              <button
                @click="closeModal"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Removed Bill Stop Analysis Modal -->
    <div v-if="false" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeBillStopModal">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="closeBillStopModal"></div>

        <div class="inline-block w-full max-w-7xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold text-white">Bill Stop Analysis Results</h3>
                <p class="text-sm text-orange-100 mt-1">CPC Customers with Billing Issues</p>
              </div>
              <div class="flex items-center gap-3">
                <!-- Export to Excel Button -->
                <button
                  @click="exportToExcel"
                  :disabled="!billStopData?.detailsAvailable && !billStopData?.summary?.length"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="billStopData?.detailsAvailable ? `Export ${filteredBillStopDetails.length} filtered CPC records` : `Export ${filteredBillStopSummary.length} filtered CRP records`"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span v-if="billStopData?.detailsAvailable">
                    Export Details ({{ filteredBillStopDetails.length }})
                  </span>
                  <span v-else>
                    Export Summary ({{ filteredBillStopSummary.length }})
                  </span>
                </button>
                <button @click="closeBillStopModal" class="text-white hover:text-gray-200 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-4 max-h-[75vh] overflow-y-auto">
            <!-- Batch Info -->
            <div v-if="billStopData?.batchInfo" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div class="flex items-start justify-between">
                <div class="flex items-start">
                  <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 class="text-sm font-medium text-blue-800">Data Last Updated</h3>
                    <p class="text-sm text-blue-700 mt-1">
                      {{ new Date(billStopData.batchInfo.lastUpdate).toLocaleString() }}
                    </p>
                    <p class="text-xs text-blue-600 mt-1">
                      Auto-updates daily at 2:00 AM • Click "Refresh Data" button to update manually
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <span :class="billStopData.batchInfo.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ billStopData.batchInfo.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Search and Filters -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div class="flex flex-col lg:flex-row gap-4">
                <!-- Search Box -->
                <div class="flex-1">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Search</label>
                  <div class="relative">
                    <input
                      v-model="billStopSearchQuery"
                      type="text"
                      placeholder="Search CRP, Customer, Meter, or Name..."
                      class="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <!-- Filter by CRP -->
                <div class="lg:w-48">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Filter by CRP</label>
                  <select
                    v-model="billStopFilterCRP"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">All CRP Accounts</option>
                    <option v-for="crp in uniqueCRPAccounts" :key="crp" :value="crp">{{ crp }}</option>
                  </select>
                </div>

                <!-- Sort By -->
                <div class="lg:w-48">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    v-model="billStopSortBy"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="crp">CRP Account (A-Z)</option>
                    <option value="billStopCount">Bill Stop Count (High to Low)</option>
                    <option value="percentage">Issue Percentage (High to Low)</option>
                    <option value="totalCPC">Total CPCs (High to Low)</option>
                  </select>
                </div>

                <!-- Filter by Status (for details) -->
                <div v-if="billStopData?.detailsAvailable" class="lg:w-48">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Billing Status</label>
                  <select
                    v-model="billStopFilterStatus"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Bill Stop Issue">Bill Stop Issue</option>
                    <option value="Active Billing">Active Billing</option>
                  </select>
                </div>

                <!-- Clear Filters Button -->
                <div class="flex items-end">
                  <button
                    @click="clearBillStopFilters"
                    class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm inline-flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </div>
              </div>

              <!-- Active Filters Info -->
              <div v-if="billStopSearchQuery || billStopFilterCRP || billStopFilterStatus" class="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <span class="font-medium">Active filters:</span>
                <span v-if="billStopSearchQuery" class="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                  Search: "{{ billStopSearchQuery }}"
                </span>
                <span v-if="billStopFilterCRP" class="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                  CRP: {{ billStopFilterCRP }}
                </span>
                <span v-if="billStopFilterStatus" class="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                  Status: {{ billStopFilterStatus }}
                </span>
              </div>
            </div>

            <!-- Statistics Summary -->
            <div v-if="billStopData" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm font-medium text-blue-600 uppercase">Total CRPs</p>
                <p class="text-2xl font-bold text-blue-900 mt-1">{{ billStopData.statistics.totalCRPs }}</p>
              </div>
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p class="text-sm font-medium text-purple-600 uppercase">Total CPCs</p>
                <p class="text-2xl font-bold text-purple-900 mt-1">{{ billStopData.statistics.totalCPCs }}</p>
              </div>
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm font-medium text-red-600 uppercase">Bill Stop Issues</p>
                <p class="text-2xl font-bold text-red-900 mt-1">{{ billStopData.statistics.totalBillStopIssues }}</p>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm font-medium text-green-600 uppercase">Active Billing</p>
                <p class="text-2xl font-bold text-green-900 mt-1">{{ billStopData.statistics.totalActiveBilling }}</p>
              </div>
            </div>

            <!-- Summary Table (Grouped by CRP) -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-lg font-bold text-gray-900">Summary by CRP</h4>
                <span class="text-sm text-gray-600">
                  Showing <span class="font-semibold text-orange-600">{{ filteredBillStopSummary.length }}</span> of {{ billStopData.summary.length }} CRPs
                </span>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CRP Account</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total CPCs</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Stop</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Billing</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue %</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="filteredBillStopSummary.length === 0" class="text-center">
                      <td colspan="5" class="px-4 py-8">
                        <div class="text-gray-500">
                          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p>No results found matching your filters</p>
                        </div>
                      </td>
                    </tr>
                    <tr v-else v-for="crp in filteredBillStopSummary" :key="crp.CRP_ID" class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ crp.CRP_ACCOUNT_NO }}</td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ crp.TOTAL_CPC_COUNT }}</td>
                      <td class="px-4 py-3 text-sm">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {{ crp.BILL_STOP_COUNT }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {{ crp.ACTIVE_BILLING_COUNT }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ crp.BILL_STOP_PERCENTAGE }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Detailed Table (All CPC Customers with Bill Stop) -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-lg font-bold text-gray-900">Detailed Bill Stop Issues</h4>
                <span v-if="billStopData?.detailsAvailable" class="text-sm text-gray-600">
                  Showing <span class="font-semibold text-orange-600">{{ filteredBillStopDetails.length }}</span> of {{ billStopData.details.length }} CPC customers
                </span>
              </div>

              <!-- No Details Available Message -->
              <div v-if="!billStopData?.detailsAvailable" class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <svg class="w-12 h-12 mx-auto mb-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-lg font-medium text-blue-900 mb-2">Detailed Data Not Available</h3>
                <p class="text-sm text-blue-700">The detailed query timed out due to large dataset size.</p>
                <p class="text-sm text-blue-700 mt-2">However, the summary statistics above are accurate and show all CRPs with bill stop issues.</p>
                <p class="text-sm text-blue-600 mt-3 font-medium">Use the summary table to identify which CRPs have the most issues.</p>
              </div>

              <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CRP Account</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPC Customer</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meter No</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Bill Date</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="filteredBillStopDetails.length === 0" class="text-center">
                      <td colspan="7" class="px-4 py-8">
                        <div class="text-gray-500">
                          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p>No results found matching your filters</p>
                        </div>
                      </td>
                    </tr>
                    <tr v-else v-for="(cpc, index) in filteredBillStopDetails" :key="index" class="hover:bg-gray-50">
                      <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ cpc.CRP_ACCOUNT_NO }}</td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ cpc.CPC_CUSTOMER_NO }}</td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ cpc.METER_NO }}</td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ cpc.CUSTOMER_NAME }}</td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ cpc.LAST_BILL_DATE }}</td>
                      <td class="px-4 py-3 text-sm">
                        <span :class="cpc.BILLING_STATUS === 'Bill Stop Issue' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {{ cpc.BILLING_STATUS }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ formatCurrency(cpc.CURRENT_BALANCE) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <div class="text-sm text-gray-600">
                <span v-if="billStopData?.detailsAvailable">
                  Showing <span class="font-semibold text-orange-600">{{ filteredBillStopDetails.length }}</span>
                  <span v-if="billStopSearchQuery || billStopFilterCRP || billStopFilterStatus">
                    of {{ billStopData?.details?.length || 0 }}
                  </span>
                  CPC customers
                </span>
                <span v-else>
                  Showing <span class="font-semibold text-orange-600">{{ filteredBillStopSummary.length }}</span>
                  <span v-if="billStopSearchQuery || billStopFilterCRP">
                    of {{ billStopData?.summary?.length || 0 }}
                  </span>
                  CRP accounts
                </span>
              </div>
              <button
                @click="closeBillStopModal"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';

// State
const loading = ref(false);
const loadingCPC = ref(false);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(50); // Reduced from 100 to 50 for faster loading
const totalCount = ref(0);
const totalPages = ref(0);
const exportingExcel = ref(false);

const crpList = ref([]);
const cpcList = ref([]);
const selectedCRP = ref(null);
const showModal = ref(false);
const batchInfo = ref(null);

// Filter States
const filterConnectionCount = ref('');
const filterBillStop = ref('');
const filterActiveBilling = ref('');
const sortBy = ref('account-asc');

// Removed Bill Stop Analysis State (functionality removed per user request)

let searchTimeout = null;

// Fetch CRP-CPC List with Filters
const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || null
    };

    // Add filters to params if they are active
    if (filterConnectionCount.value) {
      params.filterConnectionCount = filterConnectionCount.value;
    }
    if (filterBillStop.value) {
      params.filterBillStop = filterBillStop.value;
    }
    if (filterActiveBilling.value) {
      params.filterActiveBilling = filterActiveBilling.value;
    }
    if (sortBy.value && sortBy.value !== 'account-asc') {
      params.sortBy = sortBy.value;
    }

    console.log('[CRP-CPC] Fetching data with params:', params);

    const response = await api.get('/crp-cpc/list', { params });

    if (response.data.success) {
      crpList.value = response.data.data;
      totalCount.value = response.data.pagination.totalCount;
      totalPages.value = response.data.pagination.totalPages;
      batchInfo.value = response.data.batchInfo || null;
      console.log(`[CRP-CPC] Loaded ${crpList.value.length} CRPs, total: ${totalCount.value}`);
      if (batchInfo.value) {
        console.log(`[CRP-CPC] Batch date: ${batchInfo.value.batchDate}`);
      }
    }
  } catch (err) {
    console.error('Error fetching CRP-CPC data:', err);
    error.value = err.response?.data?.message || 'Failed to load CRP-CPC data';
  } finally {
    loading.value = false;
  }
};

// View CPC Details
const viewCPCDetails = async (crp) => {
  selectedCRP.value = crp;
  showModal.value = true;
  loadingCPC.value = true;
  cpcList.value = [];

  try {
    const response = await api.get(`/crp-cpc/details/${crp.CRP_ID}`);

    if (response.data.success) {
      cpcList.value = response.data.data;
    }
  } catch (err) {
    console.error('Error fetching CPC details:', err);
    error.value = err.response?.data?.message || 'Failed to load CPC details';
  } finally {
    loadingCPC.value = false;
  }
};

// Close Modal
const closeModal = () => {
  showModal.value = false;
  selectedCRP.value = null;
  cpcList.value = [];
};

// Handle Search with Debounce
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 500);
};

// Clear Search
const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
  fetchData();
};

// Computed: Filtered CRP List (now handled by backend, just return the list)
const filteredCRPList = computed(() => {
  // All filtering and sorting is now done on the backend
  return crpList.value;
});

// Computed: Has Active Filters
const hasActiveFilters = computed(() => {
  return filterConnectionCount.value !== '' ||
         filterBillStop.value !== '' ||
         filterActiveBilling.value !== '' ||
         sortBy.value !== 'account-asc';
});

// Get Sort Label
const getSortLabel = (value) => {
  const labels = {
    'account-asc': 'Account (A-Z)',
    'account-desc': 'Account (Z-A)',
    'connections-asc': 'Connections (Low to High)',
    'connections-desc': 'Connections (High to Low)',
    'billstop-desc': 'Bill Stop Issues',
    'active-desc': 'Active Billing'
  };
  return labels[value] || value;
};

// Clear All Filters
const clearAllFilters = () => {
  filterConnectionCount.value = '';
  filterBillStop.value = '';
  filterActiveBilling.value = '';
  sortBy.value = 'account-asc';
  currentPage.value = 1;
  fetchData();
};

// Apply Filters - Fetch data when any filter changes
const applyFilters = () => {
  currentPage.value = 1; // Reset to page 1 when filters change
  fetchData();
};

// Pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchData();
  }
};

// Format Currency
const formatCurrency = (value) => {
  if (!value) return '৳0.00';
  return '৳' + parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Get Status Class
const getStatusClass = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Stopped':
      return 'bg-red-100 text-red-800';
    case 'Pending Start':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pending Stop':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Format Batch Date
const formatBatchDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = date.toISOString().split('T')[0];
  const todayOnly = now.toISOString().split('T')[0];
  const yesterdayOnly = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayOnly) {
    return 'Today';
  } else if (dateOnly === yesterdayOnly) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
};

// Export to Excel
const exportToExcel = async () => {
  try {
    exportingExcel.value = true;

    // Build params same as current filters
    const params = {
      limit: 1000, // Limit to 1000 CRPs max (will get all their CPCs)
      search: searchQuery.value || null
    };

    // Add filters
    if (filterConnectionCount.value) {
      params.filterConnectionCount = filterConnectionCount.value;
    }
    if (filterBillStop.value) {
      params.filterBillStop = filterBillStop.value;
    }
    if (filterActiveBilling.value) {
      params.filterActiveBilling = filterActiveBilling.value;
    }
    if (sortBy.value && sortBy.value !== 'account-asc') {
      params.sortBy = sortBy.value;
    }

    console.log('[CRP-CPC Export] Fetching detailed CPC data with params:', params);

    // Fetch detailed CPC data (not just CRP summary)
    const response = await api.get('/crp-cpc/export/detailed', { params });

    if (!response.data.success || !response.data.data || response.data.data.length === 0) {
      alert('No data to export');
      return;
    }

    const allData = response.data.data;
    console.log('[CRP-CPC Export] Exporting ' + allData.length + ' CPC customer records');

    // Prepare data for Excel with all CPC customer fields
    const excelData = allData.map(cpc => ({
      'CRP Account No': cpc.CRP_ACCOUNT_NO || '',
      'CPC Customer ID': cpc.CPC_CUSTOMER_NO || '',
      'Meter Number': cpc.METER_NO || '',
      'Customer Name': cpc.CUSTOMER_NAME || '',
      'Address': cpc.ADDRESS || '',
      'NOCS Name': cpc.NOCS_NAME || '',
      'Phone Number': cpc.PHONE_NO || '',
      'Feeder': cpc.FEEDER || '',
      'Status': cpc.SA_STATUS_DESC || '',
      'Start Date': cpc.START_DATE || '',
      'Billed This Month': cpc.BILLED_THIS_MONTH || '',
      'Last Bill Date': cpc.LAST_BILL_DATE || '',
      'Current Balance': cpc.CURRENT_BALANCE ? parseFloat(cpc.CURRENT_BALANCE).toFixed(2) : '0.00'
    }));

    // Create worksheet
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for detailed CPC export
    ws['!cols'] = [
      { wch: 18 }, // CRP Account No
      { wch: 18 }, // CPC Customer ID
      { wch: 18 }, // Meter Number
      { wch: 30 }, // Customer Name
      { wch: 40 }, // Address
      { wch: 35 }, // NOCS Name
      { wch: 15 }, // Phone Number
      { wch: 15 }, // Feeder
      { wch: 15 }, // Status
      { wch: 12 }, // Start Date
      { wch: 18 }, // Billed This Month
      { wch: 15 }, // Last Bill Date
      { wch: 15 }  // Current Balance
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CRP-CPC Data');

    // Generate filename with timestamp and filters
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    let filename = 'CRP-CPC-Export-' + timestamp;

    if (hasActiveFilters.value) {
      filename += '-Filtered';
    }
    if (searchQuery.value) {
      filename += '-Search-' + searchQuery.value.substring(0, 20);
    }
    filename += '.xlsx';

    // Download
    XLSX.writeFile(wb, filename);

    console.log('[CRP-CPC Export] Exported ' + allData.length + ' records to ' + filename);

    // Show success message
    const filterInfo = hasActiveFilters.value ? ' (filtered)' : '';
    alert('Successfully exported ' + allData.length + ' CPC customer records' + filterInfo + ' to Excel!');

  } catch (err) {
    console.error('[CRP-CPC Export] Error:', err);
    alert('Failed to export data: ' + (err.response?.data?.message || err.message));
  } finally {
    exportingExcel.value = false;
  }
};

// Removed all Bill Stop Analysis functions (per user request)

// Initialize
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* Add any additional custom styles here if needed */
</style>
