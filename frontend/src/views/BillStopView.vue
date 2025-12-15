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
      <h3>Customer Information</h3>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

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

// Load latest analysis on mount
onMounted(() => {
  loadLatestAnalysis();
});

// Run bill stop analysis
const runAnalysis = async () => {
  analysisLoading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('token');

    if (!token) {
      error.value = 'Authentication required. Please log in.';
      analysisLoading.value = false;
      return;
    }

    const response = await axios.post('/api/bill-stop/run-analysis', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      analysisData.value = response.data.data;
      // Show success message
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
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('No token found, skipping analysis load');
      return;
    }

    const response = await axios.get('/api/bill-stop/latest-analysis', {
      headers: { Authorization: `Bearer ${token}` }
    });

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

// Search customer
const handleSearch = async () => {
  if (!searchValue.value.trim()) {
    error.value = 'Please enter a Customer ID or Meter Number';
    return;
  }

  loading.value = true;
  error.value = '';
  customerData.value = null;

  try {
    // TODO: Replace with actual API call
    // const response = await fetch(`/api/bill-stop/search?value=${searchValue.value}`);
    // const data = await response.json();

    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 1000));

    customerData.value = {
      CUSTOMER_ID: searchValue.value,
      CUSTOMER_NAME: 'Sample Customer',
      METER_NO: '12345678',
      NOCS_NAME: 'Banasree',
      ADDRESS: 'Sample Address, Dhaka',
      PHONE_NO: '01712345678'
    };

    // Load records
    loadRecords();
  } catch (err) {
    error.value = 'Failed to fetch customer data. Please try again.';
    console.error('Error searching customer:', err);
  } finally {
    loading.value = false;
  }
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
</style>
