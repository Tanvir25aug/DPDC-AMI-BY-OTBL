<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <div class="welcome-card card">
      <h2>Welcome, {{ authStore.user?.username }}!</h2>
      <p>Role: <strong>{{ authStore.userRole }}</strong></p>
      <p>Last Login: <strong>{{ formatDate(authStore.user?.last_login) }}</strong></p>
    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Format date for last login
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.welcome-card {
  margin-bottom: 30px;
}

.welcome-card h2 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.welcome-card p {
  margin: 5px 0;
  color: #7f8c8d;
}
</style>
