<template>
  <div class="query-history">
    <h1>Query History</h1>

    <div class="filters card">
      <div class="filter-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="filters.status" class="form-input">
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Page Size</label>
          <select v-model.number="filters.limit" class="form-input">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>

        <div class="form-group">
          <button @click="fetchHistory" class="btn btn-primary">
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <div class="history-section card">
      <div v-if="loading" class="loading">Loading query history...</div>

      <div v-else-if="history.length === 0" class="no-data">
        No query history found
      </div>

      <div v-else>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Query</th>
              <th>Status</th>
              <th>Execution Time</th>
              <th>Rows</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in history" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.user?.username || 'N/A' }}</td>
              <td class="query-cell">
                <div class="query-text" :title="item.query_text">
                  {{ truncateQuery(item.query_text) }}
                </div>
              </td>
              <td>
                <span :class="['status-badge', item.status]">{{ item.status }}</span>
              </td>
              <td>{{ item.execution_time }}ms</td>
              <td>{{ item.rows_returned }}</td>
              <td>{{ formatDate(item.executed_at) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page === 1"
            class="btn btn-secondary"
          >
            Previous
          </button>
          <span class="pagination-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }} ({{ pagination.total }} total)
          </span>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQueryStore } from '@/stores/query';

const queryStore = useQueryStore();

const filters = ref({
  status: '',
  limit: 50,
  page: 1
});

const loading = ref(false);

const history = computed(() => queryStore.queryHistory);
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
});

onMounted(() => {
  fetchHistory();
});

const fetchHistory = async () => {
  loading.value = true;

  const result = await queryStore.fetchQueryHistory({
    status: filters.value.status || null,
    limit: filters.value.limit,
    page: filters.value.page
  });

  if (result.success) {
    pagination.value = result.data.pagination;
  }

  loading.value = false;
};

const changePage = (newPage) => {
  filters.value.page = newPage;
  fetchHistory();
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

const truncateQuery = (query) => {
  if (!query) return '';
  return query.length > 100 ? query.substring(0, 100) + '...' : query;
};
</script>

<style scoped>
.query-history {
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.filter-row .form-group {
  flex: 1;
  min-width: 150px;
}

.query-cell {
  max-width: 400px;
}

.query-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: uppercase;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.error {
  background-color: #f8d7da;
  color: #721c24;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.pagination-info {
  color: #7f8c8d;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}
</style>
