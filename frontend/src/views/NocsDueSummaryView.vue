<template>
  <div class="nocs-due-summary">
    <div class="header-section">
      <h1>
        <svg class="inline-block w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        NOCS Due Summary
      </h1>
      <p class="subtitle">Financial summary across all NOCS locations</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="error-text">{{ error }}</p>
      <button @click="loadData" class="retry-button">Retry</button>
    </div>

    <!-- Summary Cards -->
    <div v-else-if="summaries.length > 0" class="summaries-container">
      <!-- Overall Statistics -->
      <div class="overall-stats">
        <h2>Overall Summary</h2>
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Total NOCS</p>
              <p class="stat-value">{{ summaries.length }}</p>
            </div>
          </div>
          <div class="stat-card accounts">
            <div class="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Total Accounts</p>
              <p class="stat-value">{{ formatNumber(totalAccounts) }}</p>
            </div>
          </div>
          <div class="stat-card due">
            <div class="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Total Due</p>
              <p class="stat-value">৳{{ formatCurrency(totalDue) }}</p>
            </div>
          </div>
          <div class="stat-card credit">
            <div class="stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div class="stat-content">
              <p class="stat-label">Total Credit</p>
              <p class="stat-value">৳{{ formatCurrency(Math.abs(totalCredit)) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- NOCS Summary Cards -->
      <div class="nocs-summaries">
        <h2>NOCS-wise Due Summary</h2>
        <div class="nocs-grid">
          <div v-for="summary in summaries" :key="summary.NOCS_NAME" class="nocs-card">
            <div class="nocs-header">
              <h3>{{ summary.NOCS_NAME }}</h3>
              <span class="nocs-badge">{{ formatNumber(summary.TOTAL_ACCOUNTS) }} accounts</span>
            </div>

            <div class="nocs-body">
              <!-- Account Breakdown -->
              <div class="account-breakdown">
                <div class="breakdown-item due-item">
                  <svg class="breakdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div class="breakdown-content">
                    <span class="breakdown-label">Accounts with Due</span>
                    <span class="breakdown-value">{{ formatNumber(summary.ACCOUNTS_WITH_DUE) }}</span>
                  </div>
                </div>
                <div class="breakdown-item credit-item">
                  <svg class="breakdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="breakdown-content">
                    <span class="breakdown-label">Accounts with Credit</span>
                    <span class="breakdown-value">{{ formatNumber(summary.ACCOUNTS_WITH_CREDIT) }}</span>
                  </div>
                </div>
                <div class="breakdown-item zero-item">
                  <svg class="breakdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="breakdown-content">
                    <span class="breakdown-label">Zero Balance</span>
                    <span class="breakdown-value">{{ formatNumber(summary.ACCOUNTS_ZERO_BALANCE) }}</span>
                  </div>
                </div>
              </div>

              <!-- Financial Summary -->
              <div class="financial-summary">
                <div class="financial-row due-row">
                  <span class="financial-label">Total Due:</span>
                  <span class="financial-value">৳{{ formatCurrency(summary.TOTAL_DUE) }}</span>
                </div>
                <div class="financial-row credit-row">
                  <span class="financial-label">Total Credit:</span>
                  <span class="financial-value">৳{{ formatCurrency(Math.abs(summary.TOTAL_CREDIT)) }}</span>
                </div>
                <div class="financial-row net-row">
                  <span class="financial-label">Net Balance:</span>
                  <span class="financial-value" :class="{ 'positive': summary.NET_BALANCE > 0, 'negative': summary.NET_BALANCE < 0 }">
                    ৳{{ formatCurrency(summary.NET_BALANCE) }}
                  </span>
                </div>
              </div>

              <!-- Additional Stats -->
              <div class="additional-stats">
                <div class="stat-item">
                  <span class="stat-item-label">Avg Due/Account:</span>
                  <span class="stat-item-value">৳{{ formatCurrency(summary.AVG_DUE_PER_ACCOUNT || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">Max Due:</span>
                  <span class="stat-item-value">৳{{ formatCurrency(summary.MAX_DUE || 0) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-item-label">Max Credit:</span>
                  <span class="stat-item-value">৳{{ formatCurrency(Math.abs(summary.MAX_CREDIT || 0)) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p>No NOCS data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const loading = ref(false);
const loadingMessage = ref('');
const error = ref(null);
const nocsList = ref([]);
const summaries = ref([]);

// Computed properties for overall statistics
const totalAccounts = computed(() => {
  return summaries.value.reduce((sum, s) => sum + (s.TOTAL_ACCOUNTS || 0), 0);
});

const totalDue = computed(() => {
  return summaries.value.reduce((sum, s) => sum + (s.TOTAL_DUE || 0), 0);
});

const totalCredit = computed(() => {
  return summaries.value.reduce((sum, s) => sum + (s.TOTAL_CREDIT || 0), 0);
});

// Format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Format number
const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return parseInt(value).toLocaleString('en-US');
};

// Load data progressively
const loadData = async () => {
  loading.value = true;
  error.value = null;
  summaries.value = [];

  try {
    // Step 1: Fetch NOCS list
    loadingMessage.value = 'Fetching NOCS list...';
    const nocsResponse = await axios.get('/api/queries/nocs-list');
    nocsList.value = nocsResponse.data.data;

    if (!nocsList.value || nocsList.value.length === 0) {
      loading.value = false;
      return;
    }

    // Step 2: Fetch summary for each NOCS one by one
    const totalNocs = nocsList.value.length;
    for (let i = 0; i < nocsList.value.length; i++) {
      const nocs = nocsList.value[i];
      loadingMessage.value = `Loading ${nocs.NOCS_NAME} (${i + 1}/${totalNocs})...`;

      try {
        const summaryResponse = await axios.get(`/api/queries/nocs-due-summary/${encodeURIComponent(nocs.NOCS_NAME)}`);
        summaries.value.push(summaryResponse.data.data);
      } catch (err) {
        console.error(`Error fetching summary for ${nocs.NOCS_NAME}:`, err);
        // Continue with next NOCS even if one fails
      }
    }

    loading.value = false;
  } catch (err) {
    console.error('Error loading NOCS data:', err);
    error.value = err.response?.data?.message || 'Failed to load NOCS data. Please try again.';
    loading.value = false;
  }
};

// Load data on mount
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.nocs-due-summary {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Header Section */
.header-section {
  margin-bottom: 30px;
}

.header-section h1 {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 16px;
  margin-left: 44px;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e0e0e0;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #7f8c8d;
  font-weight: 500;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-radius: 12px;
  border-left: 4px solid #f44336;
}

.error-icon {
  width: 60px;
  height: 60px;
  color: #f44336;
  margin-bottom: 15px;
}

.error-text {
  color: #c62828;
  font-size: 16px;
  margin-bottom: 20px;
}

.retry-button {
  padding: 10px 30px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #d32f2f;
}

/* Overall Stats */
.overall-stats {
  margin-bottom: 40px;
}

.overall-stats h2 {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.stat-card.total {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}

.stat-card.accounts {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border-left: 4px solid #9c27b0;
}

.stat-card.due {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #ff9800;
}

.stat-card.credit {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid #4caf50;
}

.stat-icon {
  width: 60px;
  height: 60px;
  padding: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card.total .stat-icon {
  background-color: #2196f3;
  color: white;
}

.stat-card.accounts .stat-icon {
  background-color: #9c27b0;
  color: white;
}

.stat-card.due .stat-icon {
  background-color: #ff9800;
  color: white;
}

.stat-card.credit .stat-icon {
  background-color: #4caf50;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
}

/* NOCS Summaries */
.nocs-summaries {
  margin-bottom: 40px;
}

.nocs-summaries h2 {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
}

.nocs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 25px;
}

.nocs-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.nocs-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.nocs-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nocs-header h3 {
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.nocs-badge {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.nocs-body {
  padding: 20px;
}

/* Account Breakdown */
.account-breakdown {
  margin-bottom: 20px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.breakdown-item.due-item {
  background-color: #fff3e0;
}

.breakdown-item.credit-item {
  background-color: #e8f5e9;
}

.breakdown-item.zero-item {
  background-color: #f5f5f5;
}

.breakdown-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.breakdown-item.due-item .breakdown-icon {
  color: #ff9800;
}

.breakdown-item.credit-item .breakdown-icon {
  color: #4caf50;
}

.breakdown-item.zero-item .breakdown-icon {
  color: #9e9e9e;
}

.breakdown-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.breakdown-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.breakdown-value {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

/* Financial Summary */
.financial-summary {
  border-top: 2px solid #e0e0e0;
  padding-top: 15px;
  margin-bottom: 15px;
}

.financial-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.financial-label {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.financial-value {
  font-size: 18px;
  font-weight: bold;
}

.financial-row.due-row .financial-value {
  color: #ff9800;
}

.financial-row.credit-row .financial-value {
  color: #4caf50;
}

.financial-row.net-row {
  border-top: 2px solid #e0e0e0;
  margin-top: 5px;
  padding-top: 15px;
}

.financial-row.net-row .financial-value {
  font-size: 20px;
}

.financial-row.net-row .financial-value.positive {
  color: #ff9800;
}

.financial-row.net-row .financial-value.negative {
  color: #4caf50;
}

/* Additional Stats */
.additional-stats {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.stat-item-label {
  font-size: 13px;
  color: #666;
}

.stat-item-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  border-radius: 12px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #9e9e9e;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 18px;
  color: #757575;
}

/* Responsive */
@media (max-width: 1200px) {
  .nocs-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .nocs-grid {
    grid-template-columns: 1fr;
  }

  .header-section h1 {
    font-size: 24px;
  }

  .subtitle {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .nocs-card {
    min-width: 100%;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
