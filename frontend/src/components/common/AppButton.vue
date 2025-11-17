<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <div v-if="loading" class="spinner spinner-sm"></div>

    <!-- Icon (left) -->
    <component
      v-if="icon && !loading"
      :is="icon"
      :class="iconClasses"
    />

    <!-- Label -->
    <span v-if="$slots.default || label">
      <slot>{{ label }}</slot>
    </span>

    <!-- Icon (right) -->
    <component
      v-if="iconRight && !loading"
      :is="iconRight"
      :class="iconClasses"
    />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: Object,
    default: null,
  },
  iconRight: {
    type: Object,
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => {
  const classes = ['btn'];

  // Variant
  classes.push(`btn-${props.variant}`);

  // Size
  if (props.size === 'sm') classes.push('btn-sm');
  if (props.size === 'lg') classes.push('btn-lg');

  // Icon only
  if (props.iconOnly) classes.push('btn-icon');

  // Block
  if (props.block) classes.push('w-full');

  return classes.join(' ');
});

const iconClasses = computed(() => {
  const size = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[props.size];

  return size;
});

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>
