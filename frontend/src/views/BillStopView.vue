<template>
  <div class="bill-stop">
    <div class="page-header">
      <h1>Bill Stop Management</h1>
      <p class="subtitle">Manage customer billing stop requests and history</p>
    </div>

    <!-- Bill Stop Analysis Statistics -->
    <div class="card analysis-section">
      <div class="analysis-header">
        <h3>Billing Status Analysis</h3>
        <button
          class="btn btn-primary"
          @click="runAnalysis"
          :disabled="analysisLoading"
        >
          <span v-if="analysisLoading">Running Analysis...</span>
          <span v-else>Refresh Analysis</span>
        </button>
      </div>

      <div v-if="analysisData" class="analysis-content">
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-value">{{ analysisData.total_customers?.toLocaleString() || 0 }}</div>
            <div class="stat-label">Total Customers</div>
          </div>
          <div class="stat-card active">
            <div class="stat-value">{{ analysisData.active_billing_count?.toLocaleString() || 0 }}</div>
            <div class="stat-label">Active Billing</div>
            <div class="stat-percentage">
              {{ calculatePercentage(analysisData.active_billing_count, analysisData.total_customers) }}%
            </div>
          </div>
          <div class="stat-card stopped">
            <div class="stat-value">{{ analysisData.stopped_billing_count?.toLocaleString() || 0 }}</div>
            <div class="stat-label">Bill Stopped</div>
            <div class="stat-percentage">
              {{ calculatePercentage(analysisData.stopped_billing_count, analysisData.total_customers) }}%
            </div>
          </div>
        </div>

        <div class="analysis-meta">
          <div class="meta-item">
            <span class="meta-label">Analysis Month:</span>
            <span class="meta-value">{{ analysisData.analysis_month }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Last Updated:</span>
            <span class="meta-value">{{ formatDateTime(analysisData.created_at) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Updated By:</span>
            <span class="meta-value">{{ analysisData.performed_by }}</span>
          </div>
          <div v-if="analysisData.query_duration" class="meta-item">
            <span class="meta-label">Query Duration:</span>
            <span class="meta-value">{{ (analysisData.query_duration / 1000).toFixed(2) }}s</span>
          </div>
        </div>
      </div>

      <div v-else-if="!analysisLoading" class="no-analysis">
        <p>No analysis data available. Click "Refresh Analysis" to run the analysis.</p>
      </div>
    </div>

    <!-- Search Section -->
    <div class="card search-section">
      <h3>Search Customer</h3>
      <div class="search-form">
        <div class="form-group">
          <label for="searchValue">Customer ID or Meter Number:</label>
          <input
            id="searchValue"
            v-model="searchValue"
            type="text"
            class="form-control"
            placeholder="Enter Customer ID or Meter Number"
            @keyup.enter="handleSearch"
          />
        </div>
        <button class="btn btn-primary" @click="handleSearch" :disabled="loading">
          <span v-if="loading">Searching...</span>
          <span v-else>Search</span>
        </button>
      </div>
    </div>

    <!-- Customer Info Card (shown after search) -->
    <div v-if="customerData" class="card customer-info">
      <div class="customer-header">
        <h3>Customer Information</h3>
        <span :class="['billing-status-badge', getBillingStatusClass(customerData.BILLING_STATUS)]">
          {{ customerData.BILLING_STATUS || 'Unknown' }}
        </span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <label>Customer ID:</label>
          <span>{{ customerData.CUSTOMER_ID || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <label>Customer Name:</label>
          <span>{{ customerData.CUSTOMER_NAME || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <label>Meter Number:</label>
          <span>{{ customerData.METER_NO || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <label>NOCS:</label>
          <span>{{ customerData.NOCS_NAME || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <label>Address:</label>
          <span>{{ customerData.ADDRESS || 'N/A' }}</span>
        </div>
        <div class="info-item">
          <label>Phone:</label>
          <span>{{ customerData.PHONE_NO || 'N/A' }}</span>
        </div>
      </div>

      <!-- Billing Status Section -->
      <div class="billing-status-section">
        <h4>Billing Status Details</h4>
        <div class="billing-info-grid">
          <div class="billing-info-item">
            <label>SA Status:</label>
            <span :class="['sa-status', customerData.SA_STATUS?.toLowerCase()]">
              {{ customerData.SA_STATUS || 'N/A' }}
            </span>
          </div>
          <div class="billing-info-item">
            <label>Last Bill Date:</label>
            <span>{{ customerData.LAST_BILL_DATE || 'Never Billed' }}</span>
          </div>
          <div class="billing-info-item">
            <label>Current Billing Month:</label>
            <span>{{ customerData.CURRENT_BILLING_MONTH || 'N/A' }}</span>
          </div>
          <div class="billing-info-item">
            <label>Current Balance:</label>
            <span class="balance">৳ {{ formatCurrency(customerData.CURRENT_BALANCE) }}</span>
          </div>
          <div class="billing-info-item full-width">
            <label>Billing Status:</label>
            <span :class="['billing-status-text', getBillingStatusClass(customerData.BILLING_STATUS)]">
              {{ customerData.BILLING_STATUS || 'Unknown' }}
              <span v-if="customerData.BILLING_STATUS === 'Bill Stop Issue'" class="status-hint">
                (Not billed in {{ customerData.CURRENT_BILLING_MONTH }})
              </span>
              <span v-else-if="customerData.BILLING_STATUS === 'Active Billing'" class="status-hint">
                (Billed in {{ customerData.CURRENT_BILLING_MONTH }})
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-success">
          Stop Billing
        </button>
        <button class="btn btn-info">
          Resume Billing
        </button>
        <button class="btn btn-secondary">
          View History
        </button>
      </div>
    </div>

    <!-- Reading Audit Section (shown after customer search) -->
    <div v-if="customerData" class="card audit-section">
      <div class="audit-header">
        <h3>Meter Reading Audit</h3>
        <div class="audit-meta" v-if="auditData">
          <span :class="['meta-badge', auditData.meter_type === 'Residential' ? 'residential' : 'commercial']">
            {{ auditData.tariff_code }} — {{ auditData.meter_type }}
          </span>
          <span class="meta-badge install">
            Installed: {{ auditData.install_date }}
          </span>
          <span class="meta-badge" :class="auditData.bill_status === 'Never Billed' ? 'never-billed' : 'billed'">
            Last Bill: {{ auditData.bill_status === 'Never Billed' ? 'Never Billed (using install date)' : auditData.last_bill_dt }}
          </span>
        </div>
      </div>

      <!-- Audit loading -->
      <div v-if="auditLoading" class="audit-loading">
        <div class="spinner"></div>
        <p>Analysing meter readings from Oracle...</p>
      </div>

      <!-- Audit error -->
      <div v-else-if="auditError" class="audit-error">
        {{ auditError }}
      </div>

      <!-- Audit results -->
      <div v-else-if="auditData">
        <!-- Summary cards -->
        <div class="audit-summary-grid">
          <div class="audit-stat total">
            <div class="audit-stat-value">{{ auditData.summary.total_months }}</div>
            <div class="audit-stat-label">Total Months</div>
          </div>
          <div class="audit-stat ok">
            <div class="audit-stat-value">{{ auditData.summary.ok_months }}</div>
            <div class="audit-stat-label">OK Months</div>
          </div>
          <div class="audit-stat partial" v-if="auditData.summary.partial_months > 0">
            <div class="audit-stat-value">{{ auditData.summary.partial_months }}</div>
            <div class="audit-stat-label">Partial Months</div>
          </div>
          <div class="audit-stat missing">
            <div class="audit-stat-value">{{ auditData.summary.missing_months }}</div>
            <div class="audit-stat-label">Missing Months</div>
            <div class="audit-stat-pct">{{ auditData.summary.missing_percentage }}%</div>
          </div>
        </div>

        <!-- Monthly detail table -->
        <div class="audit-table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th v-for="rt in readingTypes" :key="rt">{{ rt }}</th>
                <th>Month Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="month in auditData.months"
                :key="month.expected_date"
                :class="monthRowClass(month)"
              >
                <td class="date-cell">{{ month.expected_date }}</td>
                <td class="type-cell">
                  <span :class="['type-badge', month.date_type === 'Initial Read' ? 'initial' : 'monthly']">
                    {{ month.date_type }}
                  </span>
                </td>
                <td v-for="rt in readingTypes" :key="rt">
                  <template v-if="getReading(month, rt)">
                    <span :class="['status-pill', getReading(month, rt).status.toLowerCase()]">
                      {{ getReading(month, rt).status }}
                    </span>
                    <div v-if="getReading(month, rt).status === 'OK'" class="reading-val">
                      {{ getReading(month, rt).reading_val }}
                    </div>
                  </template>
                  <span v-else class="status-pill na">N/A</span>
                </td>
                <td>
                  <span :class="['status-pill', monthOverallStatus(month).toLowerCase()]">
                    {{ monthOverallStatus(month) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Bill Stop Records Table -->
    <div class="card table-section">
      <h3>Recent Bill Stop Records</h3>
      <div v-if="loading" class="loading">Loading...</div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="records.length === 0" class="no-data">
        No bill stop records found. Search for a customer to get started.
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Customer Name</th>
            <th>Meter Number</th>
            <th>NOCS</th>
            <th>Stop Date</th>
            <th>Resume Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.customerId }}</td>
            <td>{{ record.customerName }}</td>
            <td>{{ record.meterNumber }}</td>
            <td>{{ record.nocs }}</td>
            <td>{{ formatDate(record.stopDate) }}</td>
            <td>{{ record.resumeDate ? formatDate(record.resumeDate) : 'N/A' }}</td>
            <td>
              <span :class="['status-badge', record.status.toLowerCase()]">
                {{ record.status }}
              </span>
            </td>
            <td>
              <button class="btn-sm btn-info" @click="viewDetails(record)">
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();

// Reactive state
const searchValue = ref('');
const loading = ref(false);
const error = ref('');
const customerData = ref(null);
const records = ref([]);

// Analysis state
const analysisData = ref(null);
const analysisLoading = ref(false);

// Reading audit state
const auditData = ref(null);
const auditLoading = ref(false);
const auditError = ref('');

// Load latest analysis on mount
onMounted(() => {
  loadLatestAnalysis();
});

// Run bill stop analysis
const runAnalysis = async () => {
  analysisLoading.value = true;
  error.value = '';

  try {
    const response = await api.post('/bill-stop/run-analysis', {});

    if (response.data.success) {
      analysisData.value = response.data.data;
      console.log('Analysis completed successfully');
    } else {
      error.value = response.data.message || 'Failed to run analysis';
    }
  } catch (err) {
    error.value = 'Failed to run bill stop analysis. Please try again.';
    console.error('Error running analysis:', err);
  } finally {
    analysisLoading.value = false;
  }
};

// Load latest analysis
const loadLatestAnalysis = async () => {
  try {
    const response = await api.get('/bill-stop/latest-analysis');

    if (response.data.success && response.data.data) {
      analysisData.value = response.data.data;
    }
  } catch (err) {
    console.error('Error loading latest analysis:', err);
  }
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

// Format date and time
const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get billing status CSS class
const getBillingStatusClass = (status) => {
  if (!status) return 'unknown';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('active')) return 'active';
  if (statusLower.includes('stop') || statusLower.includes('issue')) return 'stopped';
  if (statusLower.includes('never')) return 'never-billed';
  return 'unknown';
};

// Format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Search customer then auto-trigger reading audit
const handleSearch = async () => {
  if (!searchValue.value.trim()) {
    error.value = 'Please enter a Customer ID or Meter Number';
    return;
  }

  loading.value = true;
  error.value = '';
  customerData.value = null;
  auditData.value = null;
  auditError.value = '';

  try {
    const response = await api.get('/bill-stop/search', {
      params: { searchValue: searchValue.value }
    });

    if (response.data.success) {
      customerData.value = response.data.data;
      // Auto-load reading audit after customer is found
      fetchReadingAudit(searchValue.value);
    } else {
      error.value = response.data.message || 'Customer not found';
    }
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Customer not found. Please check the Customer ID or Meter Number.';
    } else {
      error.value = 'Failed to fetch customer data. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

// Fetch meter reading audit from backend
const fetchReadingAudit = async (value) => {
  auditLoading.value = true;
  auditError.value = '';
  auditData.value = null;

  try {
    const response = await api.get('/bill-stop/reading-audit', {
      params: { searchValue: value }
    });

    if (response.data.success) {
      auditData.value = response.data.data;
    } else {
      auditError.value = response.data.message || 'No meter data found.';
    }
  } catch (err) {
    auditError.value = 'Failed to load reading audit. Please try again.';
  } finally {
    auditLoading.value = false;
  }
};

// Derive unique reading types from audit months (preserves order)
const readingTypes = computed(() => {
  if (!auditData.value?.months?.length) return [];
  const seen = new Set();
  const types = [];
  auditData.value.months.forEach(m => {
    m.readings.forEach(r => {
      if (!seen.has(r.reading_type)) {
        seen.add(r.reading_type);
        types.push(r.reading_type);
      }
    });
  });
  return types;
});

// Get a specific reading from a month row
const getReading = (month, readingType) => {
  return month.readings.find(r => r.reading_type === readingType) || null;
};

// Overall status for a month row
const monthOverallStatus = (month) => {
  const all = month.readings;
  if (all.every(r => r.status === 'OK'))      return 'OK';
  if (all.every(r => r.status === 'Missing')) return 'Missing';
  return 'Partial';
};

// Row CSS class based on month status
const monthRowClass = (month) => {
  const s = monthOverallStatus(month);
  if (s === 'Missing') return 'row-missing';
  if (s === 'Partial') return 'row-partial';
  return 'row-ok';
};

// Load bill stop records
const loadRecords = async () => {
  loading.value = true;
  error.value = '';

  try {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/bill-stop/records');
    // const data = await response.json();

    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 500));

    records.value = [
      {
        id: 1,
        customerId: '12345678',
        customerName: 'Sample Customer',
        meterNumber: '87654321',
        nocs: 'Banasree',
        stopDate: '2024-01-15',
        resumeDate: null,
        status: 'Stopped'
      }
    ];
  } catch (err) {
    error.value = 'Failed to load records. Please try again.';
    console.error('Error loading records:', err);
  } finally {
    loading.value = false;
  }
};

// View record details
const viewDetails = (record) => {
  console.log('View details:', record);
  // TODO: Implement details modal or navigation
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.bill-stop {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 5px;
}

.page-header .subtitle {
  color: #7f8c8d;
  font-size: 14px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.card h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

/* Analysis Section */
.analysis-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.analysis-section h3 {
  color: white;
  margin: 0;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.analysis-content {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-card.total {
  background: rgba(52, 152, 219, 0.2);
}

.stat-card.active {
  background: rgba(39, 174, 96, 0.2);
}

.stat-card.stopped {
  background: rgba(231, 76, 60, 0.2);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.stat-percentage {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 600;
}

.analysis-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-label {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
}

.no-analysis {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 20px;
}

.no-analysis p {
  margin: 0;
  opacity: 0.9;
}

/* Search Section */
.search-section .search-form {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover {
  background: #229954;
}

.btn-info {
  background: #3498db;
  color: white;
}

.btn-info:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

/* Customer Info */
.customer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-header h3 {
  margin: 0;
}

.billing-status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
}

.billing-status-badge.active {
  background: #d4edda;
  color: #155724;
}

.billing-status-badge.stopped {
  background: #f8d7da;
  color: #721c24;
}

.billing-status-badge.never-billed {
  background: #fff3cd;
  color: #856404;
}

.billing-status-badge.unknown {
  background: #e2e3e5;
  color: #383d41;
}

.customer-info .info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 13px;
}

.info-item span {
  color: #2c3e50;
  font-size: 14px;
}

/* Billing Status Section */
.billing-status-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.billing-status-section h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.billing-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.billing-info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.billing-info-item.full-width {
  grid-column: 1 / -1;
}

.billing-info-item label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 12px;
  text-transform: uppercase;
}

.billing-info-item span {
  color: #2c3e50;
  font-size: 14px;
}

.billing-info-item .balance {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.sa-status {
  font-weight: 600;
}

.sa-status.active {
  color: #27ae60;
}

.sa-status.stopped {
  color: #e74c3c;
}

.sa-status.pending {
  color: #f39c12;
}

.billing-status-text {
  font-weight: 600;
}

.billing-status-text.active {
  color: #27ae60;
}

.billing-status-text.stopped {
  color: #e74c3c;
}

.billing-status-text.never-billed {
  color: #f39c12;
}

.status-hint {
  font-weight: 400;
  color: #7f8c8d;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #ecf0f1;
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f8f9fa;
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
  border-bottom: 2px solid #dee2e6;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
  font-size: 13px;
  color: #2c3e50;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.stopped {
  background: #e74c3c;
  color: white;
}

.status-badge.active {
  background: #27ae60;
  color: white;
}

.status-badge.resumed {
  background: #3498db;
  color: white;
}

/* Loading, Error, No Data */
.loading,
.error-message,
.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.error-message {
  color: #e74c3c;
}

/* ── Reading Audit Section ───────────────────────────────── */
.audit-section h3 {
  color: #2c3e50;
  margin: 0;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.audit-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.meta-badge.install       { background: #e8f4fd; color: #2980b9; }
.meta-badge.billed        { background: #d4edda; color: #155724; }
.meta-badge.never-billed  { background: #fff3cd; color: #856404; }
.meta-badge.residential   { background: #e8f5e9; color: #2e7d32; font-weight: 700; }
.meta-badge.commercial    { background: #fce4ec; color: #880e4f; font-weight: 700; }

/* Loading spinner */
.audit-loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #e0e0e0;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.audit-error {
  padding: 20px;
  background: #fff3cd;
  border-radius: 6px;
  color: #856404;
}

/* Summary grid */
.audit-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.audit-stat {
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.audit-stat.total   { background: #e8f4fd; }
.audit-stat.ok      { background: #d4edda; }
.audit-stat.partial { background: #fff3cd; }
.audit-stat.missing { background: #f8d7da; }

.audit-stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
}

.audit-stat-label {
  font-size: 13px;
  color: #7f8c8d;
  margin-top: 4px;
}

.audit-stat-pct {
  font-size: 12px;
  font-weight: 600;
  color: #e74c3c;
  margin-top: 2px;
}

/* Table */
.audit-table-wrap {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.audit-table thead tr {
  background: #f8f9fa;
}

.audit-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.audit-table td {
  padding: 9px 12px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: middle;
}

.audit-table .date-cell { font-weight: 600; white-space: nowrap; }

.row-missing { background: #fff5f5; }
.row-partial { background: #fffbf0; }
.row-ok      { background: #f0fff4; }

/* Badges */
.type-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.initial  { background: #e8f4fd; color: #2980b9; }
.type-badge.monthly  { background: #f3f4f6; color: #555; }

.status-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pill.ok      { background: #d4edda; color: #155724; }
.status-pill.missing { background: #f8d7da; color: #721c24; }
.status-pill.partial { background: #fff3cd; color: #856404; }
.status-pill.na      { background: #e2e3e5; color: #6c757d; }

.reading-val {
  font-size: 11px;
  color: #7f8c8d;
  margin-top: 2px;
}
</style>
