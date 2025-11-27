<template>
  <div class="batch-timeline-component">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 rounded-t-xl">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <CalendarIcon class="w-5 h-5" />
          Batch Operation Timeline - {{ formattedDate }}
        </h2>
        <button
          @click="refreshTimeline"
          :disabled="loading"
          class="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <ArrowPathIcon :class="['w-4 h-4', loading ? 'animate-spin' : '']" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Timeline Content -->
    <div class="p-6 bg-white rounded-b-xl">
      <!-- Loading State -->
      <div v-if="loading && timeline.length === 0" class="flex items-center justify-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span class="ml-3 text-gray-600">Loading workflow timeline...</span>
      </div>

      <!-- Timeline Steps -->
      <div v-else class="space-y-4">
        <div
          v-for="(step, index) in timeline"
          :key="step.batch_code"
          class="relative"
        >
          <!-- Connecting Line (between steps) -->
          <div
            v-if="index < timeline.length - 1"
            class="absolute left-6 top-16 w-0.5 h-8 bg-gray-300"
            :class="getConnectorClass(step)"
          ></div>

          <!-- Step Card -->
          <div
            class="batch-step-card"
            :class="getStepBorderClass(step)"
          >
            <!-- Step Number & Status Icon -->
            <div class="flex items-start gap-4">
              <!-- Step Number Circle -->
              <div
                class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                :class="getStepCircleClass(step)"
              >
                {{ step.sequence_order }}
              </div>

              <!-- Step Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{{ step.batch_code }}</h3>
                    <p class="text-sm text-gray-600">{{ step.batch_name }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Status Badge -->
                    <span :class="getStatusBadgeClass(step)" class="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                      <component :is="getStatusIcon(step)" class="w-4 h-4" />
                      {{ getStatusText(step) }}
                    </span>
                  </div>
                </div>

                <!-- Progress Bar (for Running batches) -->
                <div v-if="isRunning(step)" class="mb-3">
                  <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full bg-blue-600 rounded-full animate-pulse"
                      :style="{ width: getProgressPercent(step) + '%' }"
                    ></div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Running for {{ getRunningDuration(step) }}</p>
                </div>

                <!-- Batch Metrics (Completed or Running) -->
                <div v-if="step.todayStatus" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div class="metric-item">
                    <div class="metric-label">Start Time</div>
                    <div class="metric-value">{{ formatTime(step.todayStatus.start_time) }}</div>
                  </div>
                  <div v-if="step.todayStatus.end_time" class="metric-item">
                    <div class="metric-label">End Time</div>
                    <div class="metric-value">{{ formatTime(step.todayStatus.end_time) }}</div>
                  </div>
                  <div v-if="step.todayStatus.duration_seconds" class="metric-item">
                    <div class="metric-label">Duration</div>
                    <div class="metric-value">{{ formatDuration(step.todayStatus.duration_seconds) }}</div>
                  </div>
                  <div v-if="step.todayStatus.records_processed" class="metric-item">
                    <div class="metric-label">Records</div>
                    <div class="metric-value">{{ formatNumber(step.todayStatus.records_processed) }}</div>
                  </div>
                  <div v-if="step.todayStatus.rps" class="metric-item">
                    <div class="metric-label">RPS</div>
                    <div class="metric-value" :class="getRpsClass(step.todayStatus.rps)">
                      {{ formatRps(step.todayStatus.rps) }}
                    </div>
                  </div>
                </div>

                <!-- Expected Time (for Pending batches) -->
                <div v-else-if="step.expected_start_time" class="text-sm text-gray-500 mt-2">
                  Expected start: {{ step.expected_start_time }} ({{ step.expected_duration_minutes }}min)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!loading && timeline.length === 0" class="text-center py-10">
        <CalendarIcon class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">No workflow timeline data available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PlayIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline';
import { getBatchTimeline } from '@/services/ami-operational.api';

// State
const loading = ref(false);
const timeline = ref([]);
const businessDate = ref(null);

// Computed
const formattedDate = computed(() => {
  if (!businessDate.value) return new Date().toLocaleDateString();
  return new Date(businessDate.value).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Methods
const refreshTimeline = async () => {
  loading.value = true;
  try {
    const response = await getBatchTimeline();
    timeline.value = response.data.data?.timeline || [];
    businessDate.value = response.data.data?.businessDate || null;
    console.log('[BatchTimeline] Timeline loaded:', timeline.value.length, 'steps');
  } catch (error) {
    console.error('[BatchTimeline] Error loading timeline:', error);
    timeline.value = [];
  } finally {
    loading.value = false;
  }
};

// Status helpers
const getStatus = (step) => {
  if (!step.todayStatus) return 'pending';
  const status = step.todayStatus.status?.toLowerCase();
  if (status === 'complete' || status === 'ended') return 'complete';
  if (status === 'running') return 'running';
  if (status === 'error') return 'error';
  return 'pending';
};

const isRunning = (step) => getStatus(step) === 'running';

const getStatusText = (step) => {
  const status = getStatus(step);
  const statusMap = {
    complete: 'Complete',
    running: 'Running',
    error: 'Failed',
    pending: 'Pending'
  };
  return statusMap[status] || 'Unknown';
};

const getStatusIcon = (step) => {
  const status = getStatus(step);
  const iconMap = {
    complete: CheckCircleIcon,
    running: PlayIcon,
    error: XCircleIcon,
    pending: ClockIcon
  };
  return iconMap[status] || ExclamationCircleIcon;
};

const getStatusBadgeClass = (step) => {
  const status = getStatus(step);
  const classMap = {
    complete: 'bg-green-100 text-green-800',
    running: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-600'
  };
  return classMap[status] || 'bg-gray-100 text-gray-600';
};

const getStepCircleClass = (step) => {
  const status = getStatus(step);
  const classMap = {
    complete: 'bg-green-500 text-white',
    running: 'bg-blue-500 text-white animate-pulse',
    error: 'bg-red-500 text-white',
    pending: 'bg-gray-300 text-gray-600'
  };
  return classMap[status] || 'bg-gray-300 text-gray-600';
};

const getStepBorderClass = (step) => {
  const status = getStatus(step);
  const classMap = {
    complete: 'border-green-200 bg-green-50/30',
    running: 'border-blue-300 bg-blue-50/50 shadow-lg',
    error: 'border-red-300 bg-red-50/30',
    pending: 'border-gray-200 bg-white'
  };
  return classMap[status] || 'border-gray-200 bg-white';
};

const getConnectorClass = (step) => {
  const status = getStatus(step);
  if (status === 'complete') return 'bg-green-400';
  if (status === 'running') return 'bg-blue-400';
  return 'bg-gray-300';
};

// Progress calculation (estimated)
const getProgressPercent = (step) => {
  if (!step.todayStatus?.start_time || !step.expected_duration_minutes) return 25;

  const startTime = new Date(step.todayStatus.start_time).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - startTime) / 1000 / 60;
  const percent = (elapsedMinutes / step.expected_duration_minutes) * 100;

  return Math.min(Math.max(percent, 10), 95); // Between 10% and 95%
};

const getRunningDuration = (step) => {
  if (!step.todayStatus?.start_time) return '0m';

  const startTime = new Date(step.todayStatus.start_time).getTime();
  const now = Date.now();
  const diffMs = now - startTime;
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours > 0) {
    return `${diffHours}h ${remainingMinutes}m`;
  }
  return `${diffMinutes}m`;
};

// Format helpers
const formatTime = (datetime) => {
  if (!datetime) return '-';
  return new Date(datetime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

const formatRps = (rps) => {
  if (!rps) return '0';
  return parseFloat(rps).toFixed(2);
};

const getRpsClass = (rps) => {
  if (!rps) return 'text-gray-600';
  if (rps >= 100) return 'text-green-600 font-bold';
  if (rps >= 50) return 'text-blue-600 font-semibold';
  if (rps >= 20) return 'text-yellow-600';
  return 'text-red-600';
};

// Lifecycle
onMounted(() => {
  refreshTimeline();
});

// Expose refresh method to parent
defineExpose({
  refreshTimeline
});
</script>

<style scoped>
.batch-step-card {
  @apply relative p-5 border-2 rounded-xl transition-all duration-200;
}

.batch-step-card:hover {
  @apply shadow-md;
}

.metric-item {
  @apply bg-gray-50 rounded-lg p-2;
}

.metric-label {
  @apply text-xs text-gray-500 uppercase tracking-wide mb-1;
}

.metric-value {
  @apply text-sm font-semibold text-gray-900;
}
</style>
