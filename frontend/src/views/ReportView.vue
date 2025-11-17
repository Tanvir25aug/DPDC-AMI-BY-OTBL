<template>
  <div class="report-view">
    <h1>Oracle Query Reporter</h1>

    <div class="query-section card">
      <h2>Execute Query</h2>

      <div class="form-group">
        <label for="query" class="form-label">SQL Query</label>
        <textarea
          id="query"
          v-model="query"
          class="query-input"
          placeholder="Enter your SELECT query here...

Example:
SELECT * FROM employees WHERE department = 'IT'"
          rows="10"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="maxRows" class="form-label">Max Rows</label>
        <input
          id="maxRows"
          v-model.number="maxRows"
          type="number"
          class="form-input"
          min="1"
          max="10000"
          style="max-width: 200px;"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="button-group">
        <button @click="executeQuery" class="btn btn-primary" :disabled="loading || !query">
          {{ loading ? 'Executing...' : 'Execute Query' }}
        </button>
        <button @click="clearQuery" class="btn btn-secondary" :disabled="loading">
          Clear
        </button>
      </div>
    </div>

    <div v-if="results" class="results-section card">
      <div class="results-header">
        <h2>Query Results</h2>
        <div class="results-info">
          <span>Rows: {{ metadata?.rowCount || 0 }}</span>
          <span>Time: {{ metadata?.executionTime || 0 }}ms</span>
        </div>
      </div>

      <div class="export-buttons">
        <button @click="exportResults('csv')" class="btn btn-success">
          Export CSV
        </button>
        <button @click="exportResults('xlsx')" class="btn btn-success">
          Export Excel
        </button>
        <button @click="exportResults('pdf')" class="btn btn-success">
          Export PDF
        </button>
      </div>

      <div class="table-container">
        <table class="table results-table">
          <thead>
            <tr>
              <th v-for="column in columns" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in results" :key="index">
              <td v-for="column in columns" :key="column">
                {{ formatValue(row[column]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!results && !loading" class="no-results">
      <p>Execute a query to see results</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQueryStore } from '@/stores/query';

const queryStore = useQueryStore();

const query = ref('');
const maxRows = ref(1000);
const loading = ref(false);
const error = ref(null);

const results = computed(() => queryStore.queryResults);
const metadata = computed(() => queryStore.metadata);

const columns = computed(() => {
  if (!results.value || results.value.length === 0) return [];
  return Object.keys(results.value[0]);
});

const executeQuery = async () => {
  if (!query.value.trim()) {
    error.value = 'Please enter a query';
    return;
  }

  loading.value = true;
  error.value = null;

  const result = await queryStore.executeQuery(query.value, maxRows.value);

  loading.value = false;

  if (!result.success) {
    error.value = result.message;
  }
};

const exportResults = async (format) => {
  if (!results.value || results.value.length === 0) {
    error.value = 'No data to export';
    return;
  }

  loading.value = true;
  error.value = null;

  const result = await queryStore.exportData(results.value, format, 'Oracle Query Report');

  loading.value = false;

  if (!result.success) {
    error.value = result.message;
  }
};

const clearQuery = () => {
  query.value = '';
  queryStore.clearResults();
  error.value = null;
};

const formatValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};
</script>

<style scoped>
.report-view {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.query-section h2,
.results-section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.query-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
}

.query-input:focus {
  outline: none;
  border-color: #007bff;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.results-info {
  display: flex;
  gap: 20px;
  color: #7f8c8d;
  font-size: 14px;
}

.export-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
}

.results-table {
  font-size: 13px;
}

.results-table th {
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
  z-index: 1;
}

.results-table td {
  font-family: 'Courier New', monospace;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 18px;
}
</style>
