<template>
  <div class="responsive-table-container">
    <!-- Desktop Table View -->
    <div class="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <slot name="header"></slot>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <slot name="body"></slot>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden space-y-3">
      <slot name="mobile"></slot>
    </div>
  </div>
</template>

<script setup>
// Responsive table component that shows table on desktop and cards on mobile
</script>

<style scoped>
.responsive-table-container {
  @apply w-full;
}

/* Improved scrollbar for horizontal scroll */
.responsive-table-container ::-webkit-scrollbar {
  height: 8px;
}

.responsive-table-container ::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.responsive-table-container ::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.responsive-table-container ::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
