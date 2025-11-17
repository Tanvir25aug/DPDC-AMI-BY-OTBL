<template>
  <div class="form-group">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      :class="['label', required && 'label-required']"
    >
      {{ label }}
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Prefix icon -->
      <component
        v-if="prefixIcon"
        :is="prefixIcon"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
      />

      <!-- Input field -->
      <input
        v-if="type !== 'textarea'"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :class="[
          'input',
          prefixIcon && 'pl-10',
          suffixIcon && 'pr-10',
          error && 'input-error'
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Textarea -->
      <textarea
        v-else
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :rows="rows"
        :class="['textarea', error && 'input-error']"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      ></textarea>

      <!-- Suffix icon -->
      <component
        v-if="suffixIcon"
        :is="suffixIcon"
        class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
      />
    </div>

    <!-- Hint text -->
    <p v-if="hint && !error" class="form-hint">
      {{ hint }}
    </p>

    <!-- Error message -->
    <p v-if="error" class="form-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  prefixIcon: {
    type: Object,
    default: null,
  },
  suffixIcon: {
    type: Object,
    default: null,
  },
  rows: {
    type: Number,
    default: 4,
  },
  min: {
    type: [String, Number],
    default: undefined,
  },
  max: {
    type: [String, Number],
    default: undefined,
  },
  step: {
    type: [String, Number],
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const inputId = computed(() => {
  return `input-${Math.random().toString(36).substr(2, 9)}`;
});

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};

const handleBlur = (event) => {
  emit('blur', event);
};

const handleFocus = (event) => {
  emit('focus', event);
};
</script>
