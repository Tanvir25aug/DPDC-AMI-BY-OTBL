<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

    <!-- Top Navigation Bar -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-bold text-gray-900">Bill Stop Customers</h1>
              <p v-if="batchDate" class="text-xs text-gray-500">Data: {{ batchDate }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="exportExcel"
              :disabled="exporting || !customers.length"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <svg v-if="!exporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ exporting ? 'Exporting...' : 'Export Excel' }}
            </button>
            <button @click="$router.push('/bill-stop')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
              Bill Stop
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <svg class="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Bill Stopped</p>
              <p class="mt-1 text-2xl font-bold text-red-600">{{ nocsSummary.total?.toLocaleString() ?? '—' }}</p>
              <p class="text-xs text-gray-400 mt-1">customers affected</p>
            </div>
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Balance</p>
              <p class="mt-1 text-2xl font-bold text-orange-600">{{ formatBalance(totalBalance) }}</p>
              <p class="text-xs text-gray-400 mt-1">outstanding amount</p>
            </div>
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Balance</p>
              <p class="mt-1 text-2xl font-bold text-yellow-600">{{ formatBalance(avgBalance) }}</p>
              <p class="text-xs text-gray-400 mt-1">per customer</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">NOCS Affected</p>
              <p class="mt-1 text-2xl font-bold text-purple-600">{{ nocsSummary.nocs?.length ?? '—' }}</p>
              <p class="text-xs text-gray-400 mt-1">NOCS areas</p>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- NOCS Breakdown -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-pointer select-none"
          @click="nocsExpanded = !nocsExpanded"
        >
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <h2 class="text-base font-semibold text-gray-800">NOCS-wise Breakdown</h2>
            <span v-if="nocsSummary.nocs?.length" class="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {{ nocsSummary.nocs.length }} NOCS
            </span>
          </div>
          <svg
            :class="['w-5 h-5 text-gray-400 transition-transform', nocsExpanded ? 'rotate-180' : '']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>

        <div v-if="nocsExpanded">
          <div v-if="nocsLoading" class="flex items-center justify-center py-10">
            <svg class="w-6 h-6 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <div v-else-if="nocsSummary.nocs?.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600">NOCS Name</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-600">Customers</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-600">% of Total</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600 min-w-[160px]">Distribution</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-600">Total Balance</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-600">Avg Balance</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-600">Oldest Bill</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in nocsSummary.nocs"
                  :key="row.nocs_name"
                  class="border-b border-gray-50 hover:bg-red-50/50 cursor-pointer transition-colors"
                  @click="filterByNocs(row.nocs_name)"
                >
                  <td class="px-4 py-3 text-gray-400 text-xs">{{ idx + 1 }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ row.nocs_name || '—' }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600">{{ row.customer_count.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-right text-gray-600">{{ row.percentage }}%</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          class="bg-red-500 h-2 rounded-full transition-all"
                          :style="{ width: row.percentage + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ formatBalance(row.total_balance) }}</td>
                  <td class="px-4 py-3 text-right text-gray-600">{{ formatBalance(row.avg_balance) }}</td>
                  <td class="px-4 py-3 text-right text-gray-500 text-xs">{{ row.oldest_bill_date || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p class="px-4 py-2 text-xs text-gray-400">Click a row to filter customer list by that NOCS.</p>
          </div>
          <div v-else class="py-10 text-center text-gray-400 text-sm">No NOCS data available.</div>
        </div>
      </div>

      <!-- Customer Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Table Header / Filters -->
        <div class="px-6 py-4 border-b border-gray-100">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <h2 class="text-base font-semibold text-gray-800">Customer List</h2>
              <span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {{ total.toLocaleString() }} customers
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <!-- Search -->
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  v-model="searchInput"
                  @input="onSearchInput"
                  type="text"
                  placeholder="Name, Customer No, Meter No..."
                  class="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none"
                />
              </div>

              <!-- NOCS Filter -->
              <select
                v-model="filters.nocs"
                @change="applyFilters"
                class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none bg-white"
              >
                <option value="">All NOCS</option>
                <option v-for="n in nocsSummary.nocs" :key="n.nocs_name" :value="n.nocs_name">
                  {{ n.nocs_name }} ({{ n.customer_count }})
                </option>
              </select>

              <!-- Sort -->
              <select
                v-model="filters.sort_by"
                @change="applyFilters"
                class="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none bg-white"
              >
                <option value="current_balance">Sort: Balance ↑↓</option>
                <option value="customer_name">Sort: Name</option>
                <option value="nocs_name">Sort: NOCS</option>
                <option value="last_bill_date">Sort: Last Bill</option>
                <option value="sa_status_desc">Sort: SA Status</option>
              </select>

              <button
                @click="toggleSortDir"
                class="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                :title="filters.sort_dir === 'DESC' ? 'Descending' : 'Ascending'"
              >
                {{ filters.sort_dir === 'DESC' ? '↓ DESC' : '↑ ASC' }}
              </button>

              <!-- Clear Filters -->
              <button
                v-if="filters.search || filters.nocs"
                @click="clearFilters"
                class="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="text-center">
            <svg class="w-8 h-8 animate-spin text-red-500 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p class="mt-2 text-sm text-gray-500">Loading customers...</p>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="customers.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">CPC Customer No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Meter No</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Name</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">NOCS</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SA Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Bill Date</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="(row, idx) in customers"
                :key="row.cpc_customer_no"
                class="hover:bg-red-50/40 transition-colors"
              >
                <td class="px-4 py-3 text-gray-400 text-xs">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td class="px-4 py-3 font-mono text-xs font-medium text-gray-800">{{ row.cpc_customer_no }}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-600">{{ row.meter_no || '—' }}</td>
                <td class="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate" :title="row.customer_name">{{ row.customer_name || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
                    {{ row.nocs_name || '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate" :title="row.address">{{ row.address || '—' }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{{ row.phone_no || '—' }}</td>
                <td class="px-4 py-3">
                  <span :class="getSaStatusClass(row.sa_status_desc)" class="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap">
                    {{ row.sa_status_desc || '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{{ row.last_bill_date || '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <span :class="getBalanceClass(row.current_balance)" class="font-semibold text-xs">
                    {{ formatBalanceRaw(row.current_balance) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center">
          <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-gray-500 font-medium">No customers found</p>
          <p class="text-gray-400 text-sm mt-1">Try adjusting the search or filter</p>
        </div>

        <!-- Pagination -->
        <div v-if="total > pageSize" class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p class="text-sm text-gray-500">
            Showing {{ ((currentPage - 1) * pageSize + 1).toLocaleString() }}–{{ Math.min(currentPage * pageSize, total).toLocaleString() }} of {{ total.toLocaleString() }}
          </p>
          <div class="flex items-center gap-1">
            <button
              @click="goToPage(1)"
              :disabled="currentPage === 1"
              class="px-2 py-1.5 text-xs border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >«</button>
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Prev</button>

            <template v-for="p in visiblePages" :key="p">
              <span v-if="p === '...'" class="px-2 py-1.5 text-xs text-gray-400">…</span>
              <button
                v-else
                @click="goToPage(p)"
                :class="[
                  'px-3 py-1.5 text-xs border rounded transition-colors',
                  p === currentPage
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-200 hover:bg-white'
                ]"
              >{{ p }}</button>
            </template>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next</button>
            <button
              @click="goToPage(totalPages)"
              :disabled="currentPage === totalPages"
              class="px-2 py-1.5 text-xs border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >»</button>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-500">Per page:</label>
            <select
              v-model="pageSize"
              @change="onPageSizeChange"
              class="text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-300"
            >
              <option :value="50">50</option>
              <option :value="100">100</option>
              <option :value="200">200</option>
            </select>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api.js'

// ─── State ──────────────────────────────────────────────────────────────────
const loading = ref(false)
const nocsLoading = ref(false)
const exporting = ref(false)
const error = ref(null)

const customers = ref([])
const total = ref(0)
const batchDate = ref(null)
const currentPage = ref(1)
const pageSize = ref(50)
const nocsExpanded = ref(true)

const nocsSummary = reactive({ nocs: [], total: 0, batch_date: null })

const filters = reactive({
  search: '',
  nocs: '',
  sort_by: 'current_balance',
  sort_dir: 'DESC'
})
const searchInput = ref('')
let searchTimer = null

// ─── Computed ────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const totalBalance = computed(() =>
  nocsSummary.nocs.reduce((sum, n) => sum + (n.total_balance || 0), 0)
)

const avgBalance = computed(() => {
  if (!nocsSummary.total) return 0
  return totalBalance.value / nocsSummary.total
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

// ─── Methods ─────────────────────────────────────────────────────────────────
async function fetchCustomers() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/bill-stop/customers', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        search: filters.search,
        nocs: filters.nocs,
        sort_by: filters.sort_by,
        sort_dir: filters.sort_dir
      }
    })
    if (data.success) {
      customers.value = data.customers
      total.value = data.total
      if (data.batch_date) batchDate.value = data.batch_date
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

async function fetchNocsSummary() {
  nocsLoading.value = true
  try {
    const { data } = await api.get('/bill-stop/customers/nocs-summary')
    if (data.success) {
      nocsSummary.nocs = data.nocs
      nocsSummary.total = data.total
      nocsSummary.batch_date = data.batch_date
      if (data.batch_date) batchDate.value = data.batch_date
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load NOCS summary'
  } finally {
    nocsLoading.value = false
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.search = searchInput.value
    applyFilters()
  }, 400)
}

function applyFilters() {
  currentPage.value = 1
  fetchCustomers()
}

function clearFilters() {
  filters.search = ''
  filters.nocs = ''
  searchInput.value = ''
  applyFilters()
}

function filterByNocs(nocsName) {
  filters.nocs = nocsName
  searchInput.value = ''
  filters.search = ''
  applyFilters()
}

function toggleSortDir() {
  filters.sort_dir = filters.sort_dir === 'DESC' ? 'ASC' : 'DESC'
  applyFilters()
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchCustomers()
}

function onPageSizeChange() {
  currentPage.value = 1
  fetchCustomers()
}

async function exportExcel() {
  exporting.value = true
  try {
    const response = await api.get('/bill-stop/customers/export', {
      params: { search: filters.search, nocs: filters.nocs, sort_by: filters.sort_by, sort_dir: filters.sort_dir },
      responseType: 'blob'
    })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bill_Stop_Customers_${batchDate.value || 'export'}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = 'Export failed. Please try again.'
  } finally {
    exporting.value = false
  }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
function formatBalance(val) {
  if (val == null || isNaN(val)) return '—'
  const n = parseFloat(val)
  if (Math.abs(n) >= 1e7) return (n / 1e7).toFixed(2) + ' Cr'
  if (Math.abs(n) >= 1e5) return (n / 1e5).toFixed(2) + ' L'
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function formatBalanceRaw(val) {
  if (val == null || isNaN(val)) return '—'
  return parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function getBalanceClass(val) {
  const n = parseFloat(val)
  if (isNaN(n)) return 'text-gray-400'
  if (n > 0) return 'text-red-600'
  if (n < 0) return 'text-green-600'
  return 'text-gray-500'
}

function getSaStatusClass(status) {
  if (!status) return 'bg-gray-100 text-gray-500'
  const s = status.toLowerCase()
  if (s.includes('active')) return 'bg-green-100 text-green-700'
  if (s.includes('inactive') || s.includes('stopped')) return 'bg-red-100 text-red-700'
  if (s.includes('pending')) return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

// ─── Init ────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchNocsSummary()
  fetchCustomers()
})
</script>
