<template>
  <div class="app-stepper">
    <!-- Steps indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between relative">
        <!-- Progress line -->
        <div class="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            class="h-full bg-primary-500 transition-all duration-500"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>

        <!-- Step items -->
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex flex-col items-center flex-1 relative"
        >
          <!-- Step circle -->
          <button
            @click="canNavigateTo(index + 1) && goToStep(index + 1)"
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 relative z-10',
              getStepClass(index + 1),
              canNavigateTo(index + 1) ? 'cursor-pointer' : 'cursor-not-allowed'
            ]"
            :disabled="!canNavigateTo(index + 1)"
          >
            <CheckIcon
              v-if="index + 1 < modelValue"
              class="w-5 h-5"
            />
            <span v-else>{{ index + 1 }}</span>
          </button>

          <!-- Step label -->
          <div class="mt-3 text-center">
            <p
              :class="[
                'text-sm font-medium transition-colors',
                index + 1 === modelValue ? 'text-primary-700' : 'text-gray-600'
              ]"
            >
              {{ step.title }}
            </p>
            <p
              v-if="step.description"
              class="text-xs text-gray-500 mt-1 hidden sm:block"
            >
              {{ step.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Step content -->
    <div class="min-h-[300px]">
      <transition
        :name="slideDirection"
        mode="out-in"
      >
        <div :key="modelValue" class="animate-fade-in">
          <slot :name="`step-${modelValue}`" :currentStep="modelValue">
            <div class="card p-8 text-center text-gray-500">
              No content for step {{ modelValue }}
            </div>
          </slot>
        </div>
      </transition>
    </div>

    <!-- Navigation buttons -->
    <div class="flex items-center justify-between mt-8 gap-4">
      <button
        v-if="modelValue > 1"
        @click="previous"
        class="btn btn-secondary"
      >
        <ChevronLeftIcon class="w-5 h-5" />
        Previous
      </button>
      <div v-else></div>

      <div class="flex items-center gap-3">
        <!-- Step counter (mobile) -->
        <span class="text-sm text-gray-600 md:hidden">
          Step {{ modelValue }} of {{ steps.length }}
        </span>

        <button
          v-if="modelValue < steps.length"
          @click="next"
          :disabled="!canProceed"
          class="btn btn-primary"
        >
          Next
          <ChevronRightIcon class="w-5 h-5" />
        </button>

        <button
          v-else
          @click="complete"
          :disabled="!canProceed"
          class="btn btn-success"
        >
          <CheckCircleIcon class="w-5 h-5" />
          Complete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  CheckIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
  },
  steps: {
    type: Array,
    required: true,
    validator: (steps) => {
      return steps.every(step => step.id && step.title);
    },
  },
  canProceed: {
    type: Boolean,
    default: true,
  },
  linear: {
    type: Boolean,
    default: true, // If true, users can't skip steps
  },
});

const emit = defineEmits(['update:modelValue', 'step-change', 'complete']);

const slideDirection = ref('slide-left');

// Calculate progress percentage
const progressPercentage = computed(() => {
  return ((props.modelValue - 1) / (props.steps.length - 1)) * 100;
});

// Get step class based on state
const getStepClass = (stepNumber) => {
  if (stepNumber < props.modelValue) {
    // Completed step
    return 'bg-success text-white shadow-md';
  } else if (stepNumber === props.modelValue) {
    // Active step
    return 'bg-primary-500 text-white shadow-lg scale-110';
  } else {
    // Upcoming step
    return 'bg-gray-200 text-gray-600';
  }
};

// Check if user can navigate to a step
const canNavigateTo = (stepNumber) => {
  if (!props.linear) return true;
  return stepNumber <= props.modelValue;
};

// Navigate to specific step
const goToStep = (stepNumber) => {
  if (canNavigateTo(stepNumber)) {
    slideDirection.value = stepNumber > props.modelValue ? 'slide-left' : 'slide-right';
    emit('update:modelValue', stepNumber);
    emit('step-change', stepNumber);
  }
};

// Go to previous step
const previous = () => {
  if (props.modelValue > 1) {
    slideDirection.value = 'slide-right';
    const newStep = props.modelValue - 1;
    emit('update:modelValue', newStep);
    emit('step-change', newStep);
  }
};

// Go to next step
const next = () => {
  if (props.modelValue < props.steps.length && props.canProceed) {
    slideDirection.value = 'slide-left';
    const newStep = props.modelValue + 1;
    emit('update:modelValue', newStep);
    emit('step-change', newStep);
  }
};

// Complete the wizard
const complete = () => {
  if (props.canProceed) {
    emit('complete');
  }
};
</script>

<style scoped>
/* Slide left transition */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* Slide right transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
