<template>
  <div id="app">
    <!-- Auth pages (login) without layout -->
    <template v-if="isAuthPage">
      <router-view />
    </template>

    <!-- App pages with layout -->
    <template v-else>
      <AppLayout>
        <router-view />
      </AppLayout>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';

const route = useRoute();

// Check if current page should hide layout (like login page)
const isAuthPage = computed(() => {
  return route.meta.hideNavbar || route.path === '/login';
});
</script>

<style>
/* Global styles are now handled by Tailwind CSS in src/assets/main.css */
</style>
