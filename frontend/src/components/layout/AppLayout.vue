<template>
  <div class="min-h-screen bg-surface-container-low">
    <!-- Sidebar -->
    <Sidebar
      v-model="isSidebarOpen"
      @close="closeSidebar"
      @collapse-change="handleCollapseChange"
    />

    <!-- Main content area -->
    <div
      :class="[
        'transition-all duration-300 ease-md-emphasized',
        // Desktop margin based on sidebar state
        'lg:ml-72',
        isSidebarCollapsed && 'lg:!ml-20'
      ]"
    >
      <!-- Top bar -->
      <TopBar @toggle-sidebar="toggleSidebar" />

      <!-- Page content -->
      <main class="p-4 lg:p-6 min-h-[calc(100vh-64px)]">
        <div class="max-w-[1600px] mx-auto">
          <slot />
        </div>
      </main>

      <!-- Footer (optional) -->
      <footer class="border-t border-outline-variant/30 bg-surface py-4 px-6">
        <div class="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-on-surface-variant">
          <p>DPDC AMI System</p>
          <p class="text-xs">Powered by OTBL</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Sidebar from './Sidebar.vue';
import TopBar from './TopBar.vue';

const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const handleCollapseChange = (collapsed) => {
  isSidebarCollapsed.value = collapsed;
};
</script>
