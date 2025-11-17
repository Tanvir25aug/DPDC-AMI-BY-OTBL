<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="welcome-card card">
      <h2>Welcome, {{ authStore.user?.username }}!</h2>
      <p>Role: <strong>{{ authStore.userRole }}</strong></p>
      <p>Last Login: <strong>{{ formatDate(authStore.user?.last_login) }}</strong></p>
    </div>

    <!-- RC/DC Dashboard Stats -->
    <div class="rcdc-section">
      <h2 class="section-title">
        <svg class="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        DPDC RC/DC Command Statistics
      </h2>

      <div v-if="rcdcLoading" class="loading-state">Loading RC/DC data...</div>

      <div v-else class="rcdc-stats-grid">
        <div class="rcdc-stat-card card success">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>RC Success</h3>
          <p class="stat-value">{{ rcdcAnalytics.rcSuccess }}</p>
        </div>

        <div class="rcdc-stat-card card warning">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>RC In Progress</h3>
          <p class="stat-value">{{ rcdcAnalytics.rcInProgress }}</p>
        </div>

        <div class="rcdc-stat-card card success">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3>DC Success</h3>
          <p class="stat-value">{{ rcdcAnalytics.dcSuccess }}</p>
        </div>

        <div class="rcdc-stat-card card warning">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>DC In Progress</h3>
          <p class="stat-value">{{ rcdcAnalytics.dcInProgress }}</p>
        </div>

        <div class="rcdc-stat-card card danger">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3>DC Failed</h3>
          <p class="stat-value">{{ rcdcAnalytics.dcFailed }}</p>
        </div>

        <div class="rcdc-stat-card card primary">
          <div class="stat-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3>Total Commands</h3>
          <p class="stat-value">{{ rcdcAnalytics.totalCommands }}</p>
        </div>
      </div>
    </div>

    <!-- NOCS-wise Bar Chart -->
    <div class="nocs-chart-section card">
      <h2 class="section-title">
        <svg class="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        NOCS-wise Command Breakdown
      </h2>

      <div v-if="rcdcLoading" class="loading-state">Loading NOCS data...</div>

      <div v-else-if="nocsData.length === 0" class="no-data">
        No NOCS data available
      </div>

      <div v-else class="nocs-chart">
        <div v-for="nocs in nocsData" :key="nocs.nocsName" class="nocs-row">
          <div class="nocs-label">{{ nocs.nocsName }}</div>
          <div class="nocs-bars">
            <div class="bar-group">
              <span class="bar-label">RC Success:</span>
              <div class="bar-container">
                <div class="bar rc-success" :style="{ width: getBarWidth(nocs.rcSuccess) }">
                  <span class="bar-value">{{ nocs.rcSuccess }}</span>
                </div>
              </div>
            </div>
            <div class="bar-group">
              <span class="bar-label">DC Success:</span>
              <div class="bar-container">
                <div class="bar dc-success" :style="{ width: getBarWidth(nocs.dcSuccess) }">
                  <span class="bar-value">{{ nocs.dcSuccess }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useReportsStore } from '@/stores/reports';

const authStore = useAuthStore();
const reportsStore = useReportsStore();

// Get RC/DC data from reports store
const rcdcAnalytics = computed(() => reportsStore.analytics);
const nocsData = computed(() => reportsStore.nocsData);
const rcdcLoading = computed(() => reportsStore.analyticsLoading || reportsStore.nocsDataLoading);

// Calculate max value for bar chart scaling
const maxNocsValue = computed(() => {
  if (!nocsData.value || nocsData.value.length === 0) return 100;
  return Math.max(...nocsData.value.map(nocs =>
    Math.max(nocs.rcSuccess || 0, nocs.dcSuccess || 0)
  ));
});

// Get bar width percentage
const getBarWidth = (value) => {
  if (!maxNocsValue.value || value === 0) return '0%';
  return `${(value / maxNocsValue.value) * 100}%`;
};

// Format date for last login
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

onMounted(async () => {
  // Fetch RC/DC data
  await reportsStore.fetchDashboardStats();
  await reportsStore.fetchNocsData();
});
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

.no-data {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

/* RC/DC Section */
.rcdc-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
}

.rcdc-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.rcdc-stat-card {
  text-align: center;
  padding: 25px 15px;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.rcdc-stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.rcdc-stat-card .stat-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 15px;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rcdc-stat-card.success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid #4caf50;
}

.rcdc-stat-card.success .stat-icon {
  background-color: #4caf50;
  color: white;
}

.rcdc-stat-card.warning {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid #ff9800;
}

.rcdc-stat-card.warning .stat-icon {
  background-color: #ff9800;
  color: white;
}

.rcdc-stat-card.danger {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-left: 4px solid #f44336;
}

.rcdc-stat-card.danger .stat-icon {
  background-color: #f44336;
  color: white;
}

.rcdc-stat-card.primary {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}

.rcdc-stat-card.primary .stat-icon {
  background-color: #2196f3;
  color: white;
}

.rcdc-stat-card h3 {
  color: #555;
  font-size: 13px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rcdc-stat-card .stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

/* NOCS Bar Chart */
.nocs-chart-section {
  margin-bottom: 30px;
  padding: 25px;
}

.nocs-chart {
  margin-top: 20px;
}

.nocs-row {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.nocs-row:last-child {
  border-bottom: none;
}

.nocs-label {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 15px;
  padding-left: 5px;
}

.nocs-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-group {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 15px;
}

.bar-label {
  font-size: 13px;
  color: #666;
  text-align: right;
  font-weight: 500;
}

.bar-container {
  background-color: #f5f5f5;
  border-radius: 8px;
  height: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.bar {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  transition: width 0.6s ease-out;
  min-width: 40px;
  position: relative;
}

.bar.rc-success {
  background: linear-gradient(90deg, #66bb6a 0%, #4caf50 100%);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.bar.dc-success {
  background: linear-gradient(90deg, #42a5f5 0%, #2196f3 100%);
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
}

.bar-value {
  color: white;
  font-weight: bold;
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .rcdc-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bar-group {
    grid-template-columns: 100px 1fr;
    gap: 10px;
  }

  .bar-label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .rcdc-stats-grid {
    grid-template-columns: 1fr;
  }

  .bar-group {
    grid-template-columns: 1fr;
  }

  .bar-label {
    text-align: left;
    margin-bottom: 5px;
  }
}
</style>
