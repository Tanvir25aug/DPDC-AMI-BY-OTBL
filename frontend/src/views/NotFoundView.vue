<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <router-link to="/dashboard" class="btn btn-primary">
        Go to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #667eea;
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 32px;
  color: #2c3e50;
  margin: 20px 0;
}

p {
  font-size: 18px;
  color: #7f8c8d;
  margin-bottom: 30px;
}
</style>
