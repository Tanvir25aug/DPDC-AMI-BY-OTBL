<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-smooth duration-400"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-smooth duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="handleBackdropClick"
      >
        <!-- Backdrop with blur -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all"></div>

        <!-- Modal container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <transition
            enter-active-class="transition-bounce-in duration-400"
            enter-from-class="opacity-0 scale-90 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-smooth duration-300"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
          >
            <div
              v-if="show"
              :class="[
                'relative bg-white rounded-xl shadow-2xl w-full transform transition-all',
                sizeClasses
              ]"
              @click.stop
            >
              <!-- Header -->
              <div v-if="$slots.header || title" class="flex items-center justify-between p-6 border-b border-gray-200">
                <slot name="header">
                  <h3 class="text-xl font-semibold text-gray-900">{{ title }}</h3>
                </slot>

                <button
                  v-if="showClose"
                  @click="close"
                  class="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon class="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <!-- Body -->
              <div :class="['p-6', noPadding && '!p-0']">
                <slot></slot>
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <slot name="footer"></slot>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value),
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:show', 'close']);

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };
  return sizes[props.size];
});

const close = () => {
  emit('update:show', false);
  emit('close');
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};

// Prevent body scroll when modal is open
watch(() => props.show, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// Handle ESC key
const handleEscape = (event) => {
  if (event.key === 'Escape' && props.show) {
    close();
  }
};

// Add/remove event listener
watch(() => props.show, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleEscape);
  } else {
    document.removeEventListener('keydown', handleEscape);
  }
});
</script>
