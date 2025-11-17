<template>
  <div
    :class="[
      'card',
      hoverable && 'card-hover cursor-pointer',
      loading && 'animate-pulse pointer-events-none',
      noPadding && '!p-0'
    ]"
  >
    <!-- Header -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <slot name="header-action"></slot>
        </div>
      </slot>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-shimmer"></div>
      <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer"></div>
      <div class="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6 animate-shimmer"></div>
    </div>

    <!-- Content -->
    <div v-else>
      <slot></slot>
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  hoverable: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
});
</script>
