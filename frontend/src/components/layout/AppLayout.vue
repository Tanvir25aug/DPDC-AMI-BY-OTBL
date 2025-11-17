<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar
      v-model="isSidebarOpen"
      @close="closeSidebar"
    />

    <!-- Main content area -->
    <div
      :class="[
        'transition-all duration-300',
        'lg:ml-72',  // Always account for sidebar on desktop
      ]"
    >
      <!-- Top bar -->
      <TopBar @toggle-sidebar="toggleSidebar" />

      <!-- Page content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Sidebar from './Sidebar.vue';
import TopBar from './TopBar.vue';

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};
</script>
