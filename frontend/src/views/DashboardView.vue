<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="welcome-card card">
      <h2>Welcome, {{ authStore.user?.username }}!</h2>
      <p>Role: <strong>{{ authStore.userRole }}</strong></p>
      <p>Last Login: <strong>{{ formatDate(authStore.user?.last_login) }}</strong></p>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <h3>Total Queries</h3>
        <p class="stat-value">{{ stats?.overall?.total_queries || 0 }}</p>
      </div>

      <div class="stat-card card">
        <h3>Avg Execution Time</h3>
        <p class="stat-value">{{ formatTime(stats?.overall?.avg_execution_time) }}</p>
      </div>

      <div class="stat-card card">
        <h3>Total Rows</h3>
        <p class="stat-value">{{ formatNumber(stats?.overall?.total_rows_returned) }}</p>
      </div>

      <div class="stat-card card">
        <h3>Max Execution Time</h3>
        <p class="stat-value">{{ formatTime(stats?.overall?.max_execution_time) }}</p>
      </div>
    </div>

    <div class="quick-actions card">
      <h2>Quick Actions</h2>
      <div class="action-buttons">
        <router-link to="/reports" class="btn btn-primary">
          Create New Report
        </router-link>
        <router-link to="/query-history" class="btn btn-secondary">
          View Query History
        </router-link>
        <router-link v-if="authStore.hasPermission('can_manage_users')" to="/admin" class="btn btn-success">
          Manage Users
        </router-link>
      </div>
    </div>

    <div class="recent-queries card">
      <h2>Recent Queries</h2>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="recentQueries.length === 0" class="no-data">
        No queries executed yet
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Query</th>
            <th>Status</th>
            <th>Execution Time</th>
            <th>Rows</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="query in recentQueries" :key="query.id">
            <td class="query-text">{{ truncateQuery(query.query_text) }}</td>
            <td>
              <span :class="['status-badge', query.status]">{{ query.status }}</span>
            </td>
            <td>{{ query.execution_time }}ms</td>
            <td>{{ query.rows_returned }}</td>
            <td>{{ formatDate(query.executed_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useQueryStore } from '@/stores/query';

const authStore = useAuthStore();
const queryStore = useQueryStore();

const stats = ref(null);
const recentQueries = ref([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;

  // Fetch statistics
  const statsResult = await queryStore.fetchStatistics();
  if (statsResult.success) {
    stats.value = statsResult.data;
  }

  // Fetch recent queries
  const historyResult = await queryStore.fetchQueryHistory({ limit: 5 });
  if (historyResult.success) {
    recentQueries.value = historyResult.data;
  }

  loading.value = false;
});

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

const formatTime = (time) => {
  if (!time) return '0ms';
  return Math.round(time) + 'ms';
};

const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

const truncateQuery = (query) => {
  if (!query) return '';
  return query.length > 80 ? query.substring(0, 80) + '...' : query;
};
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.welcome-card {
  margin-bottom: 30px;
}

.welcome-card h2 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.welcome-card p {
  margin: 5px 0;
  color: #7f8c8d;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  padding: 30px 20px;
}

.stat-card h3 {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
}

.quick-actions h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.recent-queries h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.query-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-width: 400px;
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

.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}
</style>
