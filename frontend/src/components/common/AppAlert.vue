<template>
  <transition
    enter-active-class="transition-bounce-in duration-400"
    enter-from-class="opacity-0 translate-y-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-smooth duration-300"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-8"
  >
    <div
      v-if="visible"
      :class="['alert', alertClass]"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <component
          :is="alertIcon"
          class="w-5 h-5 flex-shrink-0 mt-0.5"
        />

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 v-if="title" class="font-semibold mb-1">
            {{ title }}
          </h4>
          <p class="text-sm">
            <slot>{{ message }}</slot>
          </p>
        </div>

        <!-- Close button -->
        <button
          v-if="dismissible"
          @click="handleDismiss"
          class="flex-shrink-0 p-1 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'warning', 'error', 'info'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
  autoDismiss: {
    type: Number,
    default: 0, // 0 means no auto dismiss, otherwise time in ms
  },
});

const emit = defineEmits(['dismiss']);

const visible = ref(true);

const alertClass = computed(() => {
  return `alert-${props.variant}`;
});

const alertIcon = computed(() => {
  const icons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
  };
  return icons[props.variant];
});

const handleDismiss = () => {
  visible.value = false;
  emit('dismiss');
};

// Auto dismiss
onMounted(() => {
  if (props.autoDismiss > 0) {
    setTimeout(() => {
      handleDismiss();
    }, props.autoDismiss);
  }
});
</script>
