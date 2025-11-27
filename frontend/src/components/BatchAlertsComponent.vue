<template>
  <div class="batch-alerts-component">
    <!-- Alerts Banner -->
    <div
      v-if="alerts.length > 0"
      class="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-xl p-4 mb-4 cursor-pointer hover:shadow-lg transition-all"
      @click="toggleAlertsExpanded"
    >
      <div class="flex items-center justify-between text-white">
        <div class="flex items-center gap-3">
          <BellAlertIcon class="w-6 h-6 animate-pulse" />
          <div>
            <h3 class="font-bold text-lg">{{ alerts.length }} Active Alert{{ alerts.length > 1 ? 's' : '' }}</h3>
            <div class="flex items-center gap-4 text-sm mt-1">
              <span v-if="counts.CRITICAL > 0" class="flex items-center gap-1">
                <XCircleIcon class="w-4 h-4" />
                {{ counts.CRITICAL }} Critical
              </span>
              <span v-if="counts.WARNING > 0" class="flex items-center gap-1">
                <ExclamationTriangleIcon class="w-4 h-4" />
                {{ counts.WARNING }} Warning
              </span>
              <span v-if="counts.INFO > 0" class="flex items-center gap-1">
                <InformationCircleIcon class="w-4 h-4" />
                {{ counts.INFO }} Info
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click.stop="refreshAlerts"
            :disabled="loading"
            class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <ArrowPathIcon :class="['w-5 h-5', loading ? 'animate-spin' : '']" />
          </button>
          <ChevronDownIcon :class="['w-6 h-6 transition-transform', alertsExpanded ? 'rotate-180' : '']" />
        </div>
      </div>
    </div>

    <!-- Alerts List (Expandable) -->
    <div
      v-if="alertsExpanded && alerts.length > 0"
      class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-4"
    >
      <div class="bg-gradient-to-r from-red-600 to-orange-600 p-4">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <BellAlertIcon class="w-5 h-5" />
          Active Alerts
        </h2>
      </div>

      <!-- Alerts List -->
      <div class="divide-y divide-gray-200">
        <div
          v-for="alert in sortedAlerts"
          :key="alert.id"
          class="p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Severity Icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              :class="getSeverityCircleClass(alert.alert_severity)"
            >
              <component :is="getSeverityIcon(alert.alert_severity)" class="w-5 h-5" />
            </div>

            <!-- Alert Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 mb-1">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-bold uppercase"
                      :class="getSeverityBadgeClass(alert.alert_severity)"
                    >
                      {{ alert.alert_severity }}
                    </span>
                    <span class="text-xs text-gray-500">{{ formatTime(alert.created_at) }}</span>
                  </div>
                  <h4 class="font-semibold text-gray-900 text-sm">{{ alert.alert_type }}: {{ alert.batch_code }}</h4>
                  <p class="text-sm text-gray-700 mt-1">{{ alert.alert_message }}</p>
                  <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Business Date: {{ formatDate(alert.business_date) }}</span>
                    <span v-if="alert.email_sent" class="text-green-600 flex items-center gap-1">
                      <CheckCircleIcon class="w-3 h-3" />
                      Email Sent
                    </span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-3 flex items-center gap-2">
                <button
                  @click="handleAcknowledge(alert.id)"
                  :disabled="acknowledging === alert.id"
                  class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCircleIcon class="w-3 h-3" />
                  {{ acknowledging === alert.id ? 'Acknowledging...' : 'Acknowledge' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && alerts.length === 0"
      class="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p class="text-gray-600">Loading alerts...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  BellAlertIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline';
import { getActiveAlerts, acknowledgeAlert } from '@/services/ami-operational.api';

// State
const loading = ref(false);
const alerts = ref([]);
const counts = ref({
  CRITICAL: 0,
  WARNING: 0,
  INFO: 0
});
const alertsExpanded = ref(false);
const acknowledging = ref(null);

// Computed
const sortedAlerts = computed(() => {
  // Sort by severity (CRITICAL first) then by created_at (newest first)
  return [...alerts.value].sort((a, b) => {
    const severityOrder = { CRITICAL: 1, WARNING: 2, INFO: 3 };
    const severityCompare = severityOrder[a.alert_severity] - severityOrder[b.alert_severity];
    if (severityCompare !== 0) return severityCompare;
    return new Date(b.created_at) - new Date(a.created_at);
  });
});

// Methods
const refreshAlerts = async () => {
  loading.value = true;
  try {
    const response = await getActiveAlerts();
    alerts.value = response.data.data?.alerts || [];
    counts.value = response.data.data?.counts || { CRITICAL: 0, WARNING: 0, INFO: 0 };
    console.log('[BatchAlerts] Alerts loaded:', alerts.value.length);

    // Auto-expand if there are CRITICAL alerts
    if (counts.value.CRITICAL > 0 && !alertsExpanded.value) {
      alertsExpanded.value = true;
    }
  } catch (error) {
    console.error('[BatchAlerts] Error loading alerts:', error);
    alerts.value = [];
    counts.value = { CRITICAL: 0, WARNING: 0, INFO: 0 };
  } finally {
    loading.value = false;
  }
};

const toggleAlertsExpanded = () => {
  alertsExpanded.value = !alertsExpanded.value;
};

const handleAcknowledge = async (alertId) => {
  acknowledging.value = alertId;
  try {
    await acknowledgeAlert(alertId);
    console.log('[BatchAlerts] Alert acknowledged:', alertId);

    // Remove from local state
    const index = alerts.value.findIndex(a => a.id === alertId);
    if (index !== -1) {
      const severity = alerts.value[index].alert_severity;
      alerts.value.splice(index, 1);
      counts.value[severity] = Math.max(0, counts.value[severity] - 1);
    }

    // Collapse if no more alerts
    if (alerts.value.length === 0) {
      alertsExpanded.value = false;
    }
  } catch (error) {
    console.error('[BatchAlerts] Error acknowledging alert:', error);
    alert('Failed to acknowledge alert. Please try again.');
  } finally {
    acknowledging.value = null;
  }
};

// Severity helpers
const getSeverityIcon = (severity) => {
  const iconMap = {
    CRITICAL: XCircleIcon,
    WARNING: ExclamationTriangleIcon,
    INFO: InformationCircleIcon
  };
  return iconMap[severity] || InformationCircleIcon;
};

const getSeverityBadgeClass = (severity) => {
  const classMap = {
    CRITICAL: 'bg-red-600 text-white',
    WARNING: 'bg-orange-500 text-white',
    INFO: 'bg-blue-500 text-white'
  };
  return classMap[severity] || 'bg-gray-500 text-white';
};

const getSeverityCircleClass = (severity) => {
  const classMap = {
    CRITICAL: 'bg-red-100 text-red-600',
    WARNING: 'bg-orange-100 text-orange-600',
    INFO: 'bg-blue-100 text-blue-600'
  };
  return classMap[severity] || 'bg-gray-100 text-gray-600';
};

// Format helpers
const formatTime = (datetime) => {
  if (!datetime) return '-';
  return new Date(datetime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Lifecycle
onMounted(() => {
  refreshAlerts();
});

// Expose refresh method to parent
defineExpose({
  refreshAlerts
});
</script>

<style scoped>
.batch-alerts-component {
  /* Component-specific styles if needed */
}
</style>
